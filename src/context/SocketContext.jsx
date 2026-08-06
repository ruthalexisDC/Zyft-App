// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";
import { API_ORIGIN } from "../config";

const SocketContext = createContext({
  onlineUserIds: new Set(),
  isUserOnline: () => false,
  lastActiveAt: new Map(),
  getActiveStatus: () => ({ online: false, lastActiveAt: null }),
});

const SOCKET_URL = API_ORIGIN;
const HEARTBEAT_INTERVAL_MS = 30_000; // 30s — matches backend expectation
const ACTIVE_WINDOW_MS = 2 * 60 * 1000; // 2 min — "Active now" if within this

export function SocketProvider({ children }) {
  const { user, authReady } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [lastActiveAt, setLastActiveAt] = useState(new Map()); // userId -> ISO timestamp
  const socketRef = useRef(null);
  const heartbeatRef = useRef(null);
  const isForegroundRef = useRef(true);

  // Debug: log online users
  useEffect(() => {
    console.log("🟢 Currently online:", Array.from(onlineUserIds));
  }, [onlineUserIds]);

  // ── Track document visibility (foreground/background) ──
  useEffect(() => {
    const handleVisibility = () => {
      const isVisible = document.visibilityState === "visible";
      isForegroundRef.current = isVisible;

      // When app comes back to foreground, send an immediate heartbeat
      // so last_active_at stays fresh even after being backgrounded.
      if (isVisible && socketRef.current?.connected) {
        socketRef.current.emit("presence:heartbeat");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (!authReady || !user?._id) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      setOnlineUserIds(new Set());
      setLastActiveAt(new Map());
      return;
    }

    const token = localStorage.getItem("token");
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("presence:snapshot", ({ onlineUserIds: ids }) => {
      setOnlineUserIds(new Set(ids));
    });

    socket.on("presence:online", ({ userId }) => {
      setOnlineUserIds((prev) => new Set(prev).add(userId));
      // Mark as active now when they come online
      setLastActiveAt((prev) => {
        const next = new Map(prev);
        next.set(userId, new Date().toISOString());
        return next;
      });
    });

    socket.on("presence:offline", ({ userId, lastSeen }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      // Record their last known active time
      if (lastSeen) {
        setLastActiveAt((prev) => {
          const next = new Map(prev);
          next.set(userId, new Date(lastSeen).toISOString());
          return next;
        });
      }
    });

    // ── Live active timestamp updates from heartbeats ──
    socket.on("presence:active", ({ userId, lastActiveAt: ts }) => {
      if (ts) {
        setLastActiveAt((prev) => {
          const next = new Map(prev);
          next.set(userId, ts);
          return next;
        });
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    // ── Heartbeat while foreground ──
    // Send an initial heartbeat on connect, then every 30s if the app
    // is in the foreground. Backgrounded tabs stop sending so the server
    // marks them offline after ~2 min of inactivity.
    const sendHeartbeat = () => {
      if (isForegroundRef.current && socket.connected) {
        socket.emit("presence:heartbeat");
      }
    };
    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [authReady, user?._id]);

  const isUserOnline = (userId) => onlineUserIds.has(userId?.toString());

  // ── Get active status for a user ──
  // Returns { online, lastActiveAt } where online means they're in the
  // online set AND their last_active_at is within the 2-min window.
  const getActiveStatus = (userId) => {
    const id = userId?.toString();
    const online = onlineUserIds.has(id);
    const ts = lastActiveAt.get(id) || null;
    return { online, lastActiveAt: ts };
  };

  return (
    <SocketContext.Provider
      value={{ onlineUserIds, isUserOnline, lastActiveAt, getActiveStatus }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
