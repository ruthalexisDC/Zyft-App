// Load env vars FIRST. This module has no exports and no side-effect-free
// dependencies, so it must be the very first import — every subsequent
// import (including ./config/passport.js) sees a fully populated
// process.env thanks to ESM evaluation order.
import './config/loadEnv.js';

import crypto from 'crypto';


console.log('EMAIL_USER loaded:', process.env.EMAIL_USER ? 'yes' : 'MISSING');
console.log('EMAIL_PASS loaded:', process.env.EMAIL_PASS ? 'yes' : 'MISSING');

import errorHandler, { notFoundHandler } from './middleware/ErrorHandler.js';
import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import passport, { initPassport } from './config/passport.js';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import cookieParser from "cookie-parser";
import { startReportCleanupJob } from "./services/reportCleanupService.js";

// Routes
import authRoutes          from './routes/authRoutes.js';
import postRoutes          from './routes/postRoutes.js';
import users               from './routes/users.js';
import statsRoutes         from './routes/statsRoutes.js';
import workoutRoutes       from './routes/workoutRoutes.js';      // ← your updated file
import notificationsRoutes from './routes/notificationsRoutes.js';

// Models / socket handlers (for presence)
import User from './models/User.js';
import { resetPresenceOnBoot, registerPresenceHandlers, getOnlineUserIds } from './socket/presence.js';


let reportCleanupTask = null;
let isShuttingDown = false;

// Debug
console.log('JWT_SECRET:',         process.env.JWT_SECRET         ? '✓' : '✗ MISSING');
console.log('JWT_SECRET length:',  process.env.JWT_SECRET?.length || 0);
console.log('GOOGLE_CLIENT_ID:',   process.env.GOOGLE_CLIENT_ID   ? '✓' : '✗ MISSING');
console.log('GOOGLE_CLIENT_SECRET:',process.env.GOOGLE_CLIENT_SECRET ? '✓' : '✗ MISSING');
console.log('SESSION_SECRET:',     process.env.SESSION_SECRET     ? '✓' : '✗ MISSING');
console.log('MONGODB_URI:',        process.env.MONGODB_URI        ? '✓' : '✗ MISSING');

console.log(
  "REFRESH_TOKEN_SECRET:",
  process.env.REFRESH_TOKEN_SECRET ? "✓ LOADED" : "✗ MISSING"
);
console.log(
  "REFRESH_TOKEN_SECRET length:",
  process.env.REFRESH_TOKEN_SECRET?.length || 0
);

// OAuth strategies (Google/Facebook) are constructed inside initPassport()
// so they see fully-loaded env vars — construction order is explicit here
// rather than implicit in ESM import order.
initPassport();

const app = express();

// Sets standard security headers (X-Content-Type-Options, X-Frame-Options,
// HSTS in production, etc.). This is a JSON API with no server-rendered
// HTML pages, so the default Content-Security-Policy — which is meant to
// restrict what a served *page* can load — doesn't apply here and is
// disabled to avoid any confusing interaction with the OAuth redirect
// responses. crossOriginResourcePolicy is relaxed to 'cross-origin' since
// the frontend lives on a different origin and needs to read responses
// from this API (CORS above already governs which origins can do that).
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── Session secret ──────────────────────────────────────────────────────
// Previously this fell back to a hardcoded string
// ('zyft-secret-key-change-in-production') if SESSION_SECRET was missing —
// meaning a misconfigured deploy would silently sign sessions with a
// public, guessable value instead of failing loudly. Now: production
// refuses to boot without a real secret; local dev gets a random one
// generated fresh each boot (sessions just won't survive a restart, which
// is fine for OAuth's short-lived flow and far safer than a shared default).
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: SESSION_SECRET is not set. Refusing to start in production without it.');
    process.exit(1);
  }
  sessionSecret = crypto.randomBytes(32).toString('hex');
  console.warn('⚠ SESSION_SECRET not set — using a random dev-only secret (sessions will not persist across restarts).');
}


// Render (and most PaaS hosts) sit behind a reverse proxy that terminates
// TLS; without this, Express sees every request as plain HTTP and
// `cookie.secure: true` below would silently drop the session cookie.
app.set('trust proxy', 1);

const CLIENT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://localhost:5173',
  'https://localhost:5174',
  'https://zyft-app-mmd1.onrender.com',
  'https://zyft-app-five.vercel.app',   // ← add this
];

app.use(cors({
  origin: CLIENT_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());

const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Was hardcoded `false` — meant the session cookie could be sent over
    // plain HTTP even in production. Now tied to environment: HTTPS-only
    // in production, relaxed for local HTTP dev.
    secure: isProduction,
    httpOnly: true,
    // Frontend and backend live on different origins (see CLIENT_ORIGINS
    // below), so the cookie needs SameSite=None to survive the OAuth
    // redirect cross-site — which in turn requires `secure: true`, hence
    // only enabling it in production where we're actually on HTTPS.
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());


// Mount API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/users', users);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/workouts', workoutRoutes);
app.use('/api/v1/notifications', notificationsRoutes);

// These two must come LAST, in this order, after every route above —
// anything mounted after them is unreachable, since notFoundHandler
// matches whatever request made it this far without a route claiming it.
app.use(notFoundHandler); // catches unmatched routes → 404
app.use(errorHandler);    // catches everything passed to next(err) or thrown
                           // inside an asyncHandler-wrapped controller

// ── Socket.io: real-time presence ──
// Socket.io needs a raw http.Server to attach to (not just the Express app),
// so we create one explicitly and listen on THAT instead of app.listen().
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// Socket auth middleware — reuses the exact same JWT verification as the
// REST `auth` middleware (middleware/auth.js), so there's one source of
// truth for "is this token valid", not two diverging implementations.
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id || decoded.userId).select('_id');
    if (!user) return next(new Error('User not found'));

    socket.userId = user._id.toString();
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Only call this ONCE — this is the single source of presence wiring.
const presenceLifecycle = registerPresenceHandlers(io);

// Make io available to REST routes/controllers later if needed
// (e.g. emitting a notification when someone comments on your post).
app.set('io', io);

const PORT = process.env.PORT || 5000;

// ── Startup sequence ─────────────────────────────────────────────────────
// IMPORTANT: we do NOT call server.listen() until Mongo is connected AND
// resetPresenceOnBoot() has finished. Otherwise there's a race: the server
// could start accepting socket connections (which correctly write
// isOnline: true) before the boot-time reset runs — and the reset would
// then immediately stomp those fresh, legitimate writes back to false.
async function startServer() {
  try {
 await mongoose.connect(process.env.MONGODB_URI);
console.log('MongoDB connected');

await resetPresenceOnBoot();

// Start automatic expired report snapshot cleanup.
reportCleanupTask = startReportCleanupJob();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}
// async function shutdown(signal) {
//   if (isShuttingDown) return;

//   isShuttingDown = true;

//   console.log(`[Shutdown] ${signal} received. Shutting down gracefully...`);

//   // Stop future scheduled cleanup executions.
//   reportCleanupTask?.stop();

//   // Prevent the process from hanging indefinitely.
//   const forceExitTimer = setTimeout(() => {
//     console.error("[Shutdown] Forced exit after timeout.");
//     process.exit(1);
//   }, 10000);

//  // forceExitTimer.unref();

//   try {
//     // Close Socket.IO and the underlying HTTP server.
//     await new Promise((resolve) => {
//       io.close(() => resolve());
//     });

//     // Disconnect MongoDB.
//     await mongoose.disconnect();

//     clearTimeout(forceExitTimer);

//     console.log("[Shutdown] Server and MongoDB shut down successfully.");

//     process.exit(0);
//   } catch (error) {
//     clearTimeout(forceExitTimer);

//     console.error("[Shutdown] Error during shutdown:", error);

//     process.exit(1);
//   }
// }

// process.once("SIGINT", () => shutdown("SIGINT"));
// process.once("SIGTERM", () => shutdown("SIGTERM"));


async function shutdown(signal) {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log(`[Shutdown] ${signal} received. Shutting down gracefully...`);

  // 1. Stop the report cleanup scheduler.
  try {
    console.log("[Shutdown] Stopping report cleanup scheduler...");

    reportCleanupTask?.stop();

    console.log("[Shutdown] Report cleanup scheduler stopped.");

    // 2. Set a 10-second timeout.
    // Keep this timer referenced during the diagnostic test.
    const forceExitTimer = setTimeout(() => {
      console.error("[Shutdown] Forced exit after timeout.");
      process.exit(1);
    }, 10000);

   
// 3. Diagnose and close Socket.IO.

// Stop new presence activity and reconciliation.
presenceLifecycle.beginShutdown();

console.log("[Shutdown] Closing Socket.IO...");

console.log(
  "[Shutdown] Active Engine.IO clients:",
  io.engine.clientsCount
);

console.log(
  "[Shutdown] Active namespace sockets:",
  io.of("/").sockets.size
);

// Monitor connected clients during shutdown.
io.of("/").sockets.forEach((socket) => {
  socket.once("disconnect", (reason) => {
    console.log(
      `[Shutdown] Socket ${socket.id} disconnected: ${reason}`
    );
  });
});

console.log(
  "[Shutdown] HTTP server listening:",
  server.listening
);

server.getConnections((error, count) => {
  if (error) {
    console.error("[Shutdown] HTTP connection check failed:", error);
    return;
  }

  console.log(
    "[Shutdown] Active HTTP connections:",
    count
  );
});

console.log("[Shutdown] Calling io.close()...");

await new Promise((resolve) => {
  io.close(() => {
    console.log("[Shutdown] Socket.IO close callback executed.");
    resolve();
  });
});

console.log("[Shutdown] Socket.IO closed.");

console.log("[Shutdown] Waiting for pending presence operations...");

await presenceLifecycle.waitForPendingOperations();

console.log("[Shutdown] Pending presence operations completed.");

console.log("[Shutdown] Disconnecting MongoDB...");

await mongoose.disconnect();

    console.log("[Shutdown] MongoDB disconnected.");

    clearTimeout(forceExitTimer);

    // 5. Confirm successful shutdown.
    console.log("[Shutdown] Server and MongoDB shut down successfully.");

    process.exit(0);

  } catch (error) {
    console.error("[Shutdown] Error during shutdown:", error);
    process.exit(1);
  }
}
 process.once("SIGINT", () => shutdown("SIGINT"));
 process.once("SIGTERM", () => shutdown("SIGTERM"));

startServer();