
import User from "../models/User.js";

// In-memory presence tracker.
// Maps userId (string) -> Set of socket IDs.
const onlineUsers = new Map();

// Tracks asynchronous database operations so MongoDB is not
// disconnected while a presence update is still running.
const pendingPresenceOperations = new Set();

let isShuttingDown = false;

/**
 * Track an asynchronous presence operation.
 *
 * The operation is registered immediately, before it starts,
 * and removed when it resolves or rejects.
 */
function trackPresenceOperation(operation) {
  const promise = Promise.resolve().then(operation);

  pendingPresenceOperations.add(promise);

  promise.then(
    () => pendingPresenceOperations.delete(promise),
    () => pendingPresenceOperations.delete(promise)
  );

  return promise;
}

export function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

export function isUserOnline(userId) {
  return onlineUsers.has(userId?.toString());
}

// Boot-time cleanup
export async function resetPresenceOnBoot() {
  const result = await User.updateMany(
    { isOnline: true },
    {
      $set: {
        isOnline: false,
        lastSeen: new Date(),
      },
    }
  );

  if (result.modifiedCount > 0) {
    console.log(
      `Presence: reset ${result.modifiedCount} stale online users on boot`
    );
  }
}

export function registerPresenceHandlers(io) {
  // Connection handler
  io.on("connection", async (socket) => {
    // Reject connections once shutdown has started.
    if (isShuttingDown) {
      socket.disconnect(true);
      return;
    }

    const userId = socket.userId;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    const isFirstConnectionForUser = !onlineUsers.has(userId);

    if (isFirstConnectionForUser) {
      onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId).add(socket.id);

    if (isFirstConnectionForUser) {
      try {
        await trackPresenceOperation(() =>
          User.findByIdAndUpdate(userId, {
            isOnline: true,
            last_active_at: new Date(),
          })
        );
      } catch (err) {
        console.error(
          "Presence: failed to mark user online:",
          err.message
        );
      }

      io.emit("presence:online", { userId });
    }

    socket.emit("presence:snapshot", {
      onlineUserIds: getOnlineUserIds(),
    });

    // Heartbeat: client sends approximately every 30 seconds.
    socket.on("presence:heartbeat", async () => {
      if (isShuttingDown) return;

      const now = new Date();

      try {
        await trackPresenceOperation(() =>
          User.findByIdAndUpdate(userId, {
            last_active_at: now,
          })
        );

        io.emit("presence:active", {
          userId,
          lastActiveAt: now.toISOString(),
        });
      } catch (err) {
        console.error(
          "Presence: failed to update last_active_at:",
          err.message
        );
      }
    });

    // Disconnect handler
    socket.on("disconnect", async () => {
      const sockets = onlineUsers.get(userId);

      if (!sockets) return;

      sockets.delete(socket.id);

      // Keep the user online if another tab/device is connected.
      if (sockets.size > 0) return;

      onlineUsers.delete(userId);

      const lastSeen = new Date();

      try {
        // This operation must be allowed to finish during shutdown.
        await trackPresenceOperation(() =>
          User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen,
            last_active_at: lastSeen,
          })
        );
      } catch (err) {
        console.error(
          "Presence: failed to mark user offline:",
          err.message
        );
      }

      io.emit("presence:offline", {
        userId,
        lastSeen,
      });
    });
  });

  // Reconciliation safety net: every 30 seconds.
  const RECONCILE_INTERVAL_MS = 30_000;

  const reconcileTimer = setInterval(async () => {
    if (isShuttingDown) return;

    for (const [userId, socketIds] of onlineUsers.entries()) {
      if (isShuttingDown) return;

      let changed = false;

      for (const socketId of socketIds) {
        const stillConnected = io.sockets.sockets.has(socketId);

        if (!stillConnected) {
          socketIds.delete(socketId);
          changed = true;
        }
      }

      if (!changed || socketIds.size > 0) continue;

      onlineUsers.delete(userId);

      const lastSeen = new Date();

      try {
        await trackPresenceOperation(() =>
          User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen,
            last_active_at: lastSeen,
          })
        );
      } catch (err) {
        console.error(
          "Presence reconcile: failed to mark user offline:",
          err.message
        );
      }

      io.emit("presence:offline", {
        userId,
        lastSeen,
      });

      console.log(
        `Presence reconcile: cleared stale online status for user ${userId}`
      );
    }
  }, RECONCILE_INTERVAL_MS);

  reconcileTimer.unref?.();

  /**
   * Shutdown lifecycle controller.
   */
  return {
    /**
     * Stop new presence activity and reconciliation.
     * Existing disconnect handlers are still allowed to update MongoDB.
     */
    beginShutdown() {
      if (isShuttingDown) return;

      isShuttingDown = true;
      clearInterval(reconcileTimer);

      console.log("Presence: shutdown started; reconciliation stopped.");
    },

    /**
     * Wait until all tracked presence database operations finish.
     */
    async waitForPendingOperations() {
      while (pendingPresenceOperations.size > 0) {
        const operations = Array.from(pendingPresenceOperations);

        await Promise.allSettled(operations);
      }
    },
  };
}
