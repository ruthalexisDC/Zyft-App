// import dotenv from 'dotenv';
// import { fileURLToPath } from 'url';
// import { dirname, join } from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// dotenv.config({ path: join(__dirname, '..', '.env') });
// dotenv.config({ path: join(__dirname, '.env') });

// import http from 'http';
// import express from 'express';
// import cors from 'cors';
// import mongoose from 'mongoose';
// mongoose.set('returnDocument', 'after');
// import session from 'express-session';
// import passport from './config/passport.js';
// import jwt from 'jsonwebtoken';
// import { Server as SocketIOServer } from 'socket.io';

// // Routes
// import authRoutes          from './routes/authRoutes.js';
// import postRoutes          from './routes/postRoutes.js';
// import users               from './routes/users.js';
// import statsRoutes         from './routes/statsRoutes.js';
// import workoutRoutes       from './routes/workoutRoutes.js';      // ← your updated file
// import notificationsRoutes from './routes/notificationsRoutes.js';

// // Models / socket handlers (for presence)
// import User from './models/User.js';
// import { resetPresenceOnBoot, registerPresenceHandlers, getOnlineUserIds } from './socket/presence.js';

// // Debug
// console.log('JWT_SECRET:',         process.env.JWT_SECRET         ? '✓' : '✗ MISSING');
// console.log('JWT_SECRET length:',  process.env.JWT_SECRET?.length || 0);
// console.log('GOOGLE_CLIENT_ID:',   process.env.GOOGLE_CLIENT_ID   ? '✓' : '✗ MISSING');
// console.log('GOOGLE_CLIENT_SECRET:',process.env.GOOGLE_CLIENT_SECRET ? '✓' : '✗ MISSING');
// console.log('SESSION_SECRET:',     process.env.SESSION_SECRET     ? '✓' : '✗ MISSING');
// console.log('MONGODB_URI:',        process.env.MONGODB_URI        ? '✓' : '✗ MISSING');

// const app = express();

// const CLIENT_ORIGINS = [
//   'http://localhost:5173',
//   'http://localhost:5174',
//   'https://localhost:5173',
//   'https://localhost:5174',
// ];

// // Connect to MongoDB, then run presence cleanup once we're actually connected
// mongoose.connect(process.env.MONGODB_URI)
//   .then(async () => {
//     console.log('MongoDB connected');
//     await resetPresenceOnBoot();
//   })
//   .catch((err) => {
//     console.error('MongoDB connection error:', err);
//     process.exit(1);
//   });

// app.use(cors({
//   origin: CLIENT_ORIGINS,
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));

// app.use(express.json());

// app.use(session({
//   secret: process.env.SESSION_SECRET || 'zyft-secret-key-change-in-production',
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     secure: false,
//     httpOnly: true,
//     maxAge: 24 * 60 * 60 * 1000,
//   },
// }));

// app.use(passport.initialize());
// app.use(passport.session());

// // Mount routes — each prefix used exactly once
// app.use('/api/auth',          authRoutes);
// app.use('/api/posts',         postRoutes);
// app.use('/api/users',         users);
// app.use('/api/stats',         statsRoutes);
// app.use('/api/workouts',      workoutRoutes);      // ← ONLY ONCE
// app.use('/api/notifications', notificationsRoutes);

// // ── Socket.io: real-time presence ──
// // Socket.io needs a raw http.Server to attach to (not just the Express app),
// // so we create one explicitly and listen on THAT instead of app.listen().
// const server = http.createServer(app);

// const io = new SocketIOServer(server, {
//   cors: {
//     origin: CLIENT_ORIGINS,
//     credentials: true,
//     methods: ['GET', 'POST'],
//   },
// });

// // Socket auth middleware — reuses the exact same JWT verification as the
// // REST `auth` middleware (middleware/auth.js), so there's one source of
// // truth for "is this token valid", not two diverging implementations.
// io.use(async (socket, next) => {
//   try {
//     const token = socket.handshake.auth?.token;
//     if (!token) return next(new Error('No token provided'));

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id || decoded.userId).select('_id');
//     if (!user) return next(new Error('User not found'));

//     socket.userId = user._id.toString();
//     next();
//   } catch (err) {
//     next(new Error('Invalid token'));
//   }
// });

// // Only call this ONCE — this is the single source of presence wiring.
// registerPresenceHandlers(io);

// // Make io available to REST routes/controllers later if needed
// // (e.g. emitting a notification when someone comments on your post).
// app.set('io', io);

// // TEMPORARY DEBUG ROUTE — remove after fixing presence bug
// app.get('/api/debug/presence', async (req, res) => {
//   try {
//     const dbOnlineUsers = await User.find(
//       { isOnline: true },
//       'name email isOnline lastSeen'
//     );

//     res.json({
//       dbSaysOnline: dbOnlineUsers,
//       memorySaysOnline: getOnlineUserIds(),
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '.env') });

import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
mongoose.set('returnDocument', 'after');
import session from 'express-session';
import passport from './config/passport.js';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';

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

const CLIENT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://localhost:5173',
  'https://localhost:5174',
];

app.use(cors({
  origin: CLIENT_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'zyft-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

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

    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

startServer();