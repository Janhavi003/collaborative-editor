import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Shared event names — must match backend/src/config/constants.js
export const EVENTS = {
  JOIN_DOCUMENT: "join-document",
  LEAVE_DOCUMENT: "leave-document",
  DOCUMENT_CHANGE: "document-change",
  DOCUMENT_STATE: "document-state",
  CURSOR_MOVE: "cursor-move",
  CURSORS_UPDATE: "cursors-update",
  USERS_UPDATE: "users-update",
};

const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = (event, data) => {
    socketRef.current?.emit(event, data);
  };

  const on = (event, callback) => {
    socketRef.current?.on(event, callback);
  };

  const off = (event, callback) => {
    socketRef.current?.off(event, callback);
  };

  return { emit, on, off, isConnected, socket: socketRef.current };
};

export default useSocket;