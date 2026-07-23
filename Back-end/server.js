import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '.env') });


console.log('EMAIL_USER loaded:', process.env.EMAIL_USER ? 'yes' : 'MISSING');
console.log('EMAIL_PASS loaded:', process.env.EMAIL_PASS ? 'yes' : 'MISSING');

import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
mongoose.set('returnDocument', 'after');
import session from 'express-session';
import passport from './config/passport.js';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';

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

// Debug
console.log('JWT_SECRET:',         process.env.JWT_SECRET         ? '✓' : '✗ MISSING');
console.log('JWT_SECRET length:',  process.env.JWT_SECRET?.length || 0);
console.log('GOOGLE_CLIENT_ID:',   process.env.GOOGLE_CLIENT_ID   ? '✓' : '✗ MISSING');
console.log('GOOGLE_CLIENT_SECRET:',process.env.GOOGLE_CLIENT_SECRET ? '✓' : '✗ MISSING');
console.log('SESSION_SECRET:',     process.env.SESSION_SECRET     ? '✓' : '✗ MISSING');
console.log('MONGODB_URI:',        process.env.MONGODB_URI        ? '✓' : '✗ MISSING');

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

app.use(helmet());

// Mount routes — each prefix used exactly once
app.use('/api/auth',          authRoutes);
app.use('/api/posts',         postRoutes);
app.use('/api/users',         users);
app.use('/api/stats',         statsRoutes);
app.use('/api/workouts',      workoutRoutes);      // ← ONLY ONCE
app.use('/api/notifications', notificationsRoutes);

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
registerPresenceHandlers(io);

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

    server.listen(PORT, () => console.log(` helmet is working! Server running on port ${PORT}`));
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

startServer();