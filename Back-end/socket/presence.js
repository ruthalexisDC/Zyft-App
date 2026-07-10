// // socket/presence.js
// //
// // In-memory presence tracker. Maps userId (string) -> Set of socket ids
// // currently open for that user, so a user with multiple tabs/devices open
// // is only ever broadcast as "online" once, and only goes "offline" once
// // every one of their connections has closed.
// //
// // LIMITATION: this Map lives in a single Node.js process's memory. If you
// // ever run more than one server instance behind a load balancer, each
// // instance will have its own partial view of who's online. At that point
// // you'd want a shared store (e.g. Redis + the socket.io-redis adapter) so
// // all instances agree on presence. Not needed for a single-instance setup.

// import User from '../models/User.js';

// const onlineUsers = new Map(); // userId -> Set<socketId>

// export function getOnlineUserIds() {
//   return Array.from(onlineUsers.keys());
// }

// export function isUserOnline(userId) {
//   return onlineUsers.has(userId?.toString());
// }

// export function registerPresenceHandlers(io) {
//   io.on('connection', async (socket) => {
//     const userId = socket.userId; // set by the io.use() auth middleware in server.js
//     if (!userId) {
//       socket.disconnect();
//       return;
//     }

//     const isFirstConnectionForUser = !onlineUsers.has(userId);
//     if (isFirstConnectionForUser) {
//       onlineUsers.set(userId, new Set());
//     }
//     onlineUsers.get(userId).add(socket.id);

//     // Only flip DB state + broadcast on this user's FIRST active connection.
//     // A second tab/device for the same user shouldn't re-announce "online".
//     if (isFirstConnectionForUser) {
//       try {
//         await User.findByIdAndUpdate(userId, { isOnline: true });
//       } catch (err) {
//         console.error('Presence: failed to mark user online:', err.message);
//       }
//       io.emit('presence:online', { userId });
//     }

//     // Tell the newly-connected client who's already online, so it doesn't
//     // have to wait for individual presence:online events to build the list.
//     socket.emit('presence:snapshot', { onlineUserIds: getOnlineUserIds() });

//     socket.on('disconnect', async () => {
//       const sockets = onlineUsers.get(userId);
//       if (!sockets) return;

//       sockets.delete(socket.id);

//       // Still has other open tabs/devices — stay online, no broadcast.
//       if (sockets.size > 0) return;

//       onlineUsers.delete(userId);
//       const lastSeen = new Date();
//       try {
//         await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
//       } catch (err) {
//         console.error('Presence: failed to mark user offline:', err.message);
//       }
//       io.emit('presence:offline', { userId, lastSeen });
//     });
//   });
// }

// socket/presence.js
//
// In-memory presence tracker. Maps userId (string) -> Set of socket ids
// currently open for that user, so a user with multiple tabs/devices open
// is only ever broadcast as "online" once, and only goes "offline" once
// every one of their connections has closed.
//
// LIMITATION: this Map lives in a single Node.js process's memory. If you
// ever run more than one server instance behind a load balancer, each
// instance will have its own partial view of who's online. At that point
// you'd want a shared store (e.g. Redis + the socket.io-redis adapter) so
// all instances agree on presence. Not needed for a single-instance setup.

import User from '../models/User.js';

const onlineUsers = new Map(); // userId -> Set<socketId>

export function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

export function isUserOnline(userId) {
  return onlineUsers.has(userId?.toString());

}

// ── Boot-time cleanup ───────────────────────────────────────────────────
// A fresh process starts with zero real socket connections, so any user
// still marked isOnline:true in the DB is stale leftover from before a
// restart/crash/redeploy. Clear it before accepting new connections.
export async function resetPresenceOnBoot() {
  const result = await User.updateMany(
    { isOnline: true },
    { $set: { isOnline: false, lastSeen: new Date() } }
  );
  if (result.modifiedCount > 0) {
    console.log(`Presence: reset ${result.modifiedCount} stale online users on boot`);
  }
}

export function registerPresenceHandlers(io) {
  io.on('connection', async (socket) => {
    const userId = socket.userId; // set by the io.use() auth middleware in server.js
    if (!userId) {
      socket.disconnect();
      return;
    }

    const isFirstConnectionForUser = !onlineUsers.has(userId);
    if (isFirstConnectionForUser) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Only flip DB state + broadcast on this user's FIRST active connection.
    // A second tab/device for the same user shouldn't re-announce "online".
    if (isFirstConnectionForUser) {
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
      } catch (err) {
        console.error('Presence: failed to mark user online:', err.message);
      }
      io.emit('presence:online', { userId });
    }

    // Tell the newly-connected client who's already online, so it doesn't
    // have to wait for individual presence:online events to build the list.
    socket.emit('presence:snapshot', { onlineUserIds: getOnlineUserIds() });

    socket.on('disconnect', async () => {
      const sockets = onlineUsers.get(userId);
      if (!sockets) return;

      sockets.delete(socket.id);

      // Still has other open tabs/devices — stay online, no broadcast.
      if (sockets.size > 0) return;

      onlineUsers.delete(userId);
      const lastSeen = new Date();
      try {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
      } catch (err) {
        console.error('Presence: failed to mark user offline:', err.message);
      }
      io.emit('presence:offline', { userId, lastSeen });
    });
  });

  // ── Reconciliation safety net ──────────────────────────────────────────
  // Belt-and-braces against any path where a socket stops being truly
  // connected without its 'disconnect' handler ever firing (e.g. an
  // uncaught error mid-handler, a missed edge case in the transport layer).
  // Every 30s, verify every tracked socket id is still actually known to
  // socket.io; drop anything that isn't, and flip the user offline if that
  // was their last tracked connection. This makes presence self-correcting
  // instead of permanently trusting a single event to always fire.
  const RECONCILE_INTERVAL_MS = 30_000;

  const reconcileTimer = setInterval(async () => {
    for (const [userId, socketIds] of onlineUsers.entries()) {
      let changed = false;

      for (const socketId of socketIds) {
        const stillConnected = io.sockets.sockets.has(socketId);
        if (!stillConnected) {
          socketIds.delete(socketId);
          changed = true;
        }
      }

      if (!changed) continue;

      if (socketIds.size === 0) {
        onlineUsers.delete(userId);
        const lastSeen = new Date();
        try {
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
        } catch (err) {
          console.error('Presence reconcile: failed to mark user offline:', err.message);
        }
        io.emit('presence:offline', { userId, lastSeen });
        console.log(`Presence reconcile: cleared stale online status for user ${userId}`);
      }
    }
  }, RECONCILE_INTERVAL_MS);

  // Let Node exit cleanly in tests/scripts that don't run forever.
  reconcileTimer.unref?.();
}