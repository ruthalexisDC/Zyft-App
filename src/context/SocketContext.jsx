// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext({
  onlineUserIds: new Set(),
  isUserOnline: () => false,
});

const SOCKET_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/api\/?$/, "");

export function SocketProvider({ children }) {
  const { user, authReady } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const socketRef = useRef(null);

  // Debug: log online users
  useEffect(() => {
    console.log("🟢 Currently online:", Array.from(onlineUserIds));
  }, [onlineUserIds]);

  useEffect(() => {
    if (!authReady || !user?._id) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setOnlineUserIds(new Set());
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
    });

    socket.on("presence:offline", ({ userId }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [authReady, user?._id]);

  const isUserOnline = (userId) => onlineUserIds.has(userId?.toString());

  return (
    <SocketContext.Provider value={{ onlineUserIds, isUserOnline }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
