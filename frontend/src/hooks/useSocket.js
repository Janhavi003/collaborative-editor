import {
  useEffect,
  useState,
  useCallback,
} from "react";

import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5000";

/**
 * --------------------------------------------------
 * Shared Socket Instance
 * --------------------------------------------------
 * IMPORTANT:
 * Only ONE socket for the entire app
 */
const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: true,
});

/**
 * --------------------------------------------------
 * Shared Event Constants
 * Must match backend constants
 * --------------------------------------------------
 */
export const EVENTS = {
  JOIN_DOCUMENT: "join-document",
  LEAVE_DOCUMENT: "leave-document",
  OPERATION: "operation",
  OPERATIONS_ACK: "operation-ack",
  DOCUMENT_STATE: "document-state",
  CURSOR_MOVE: "cursor-move",
  CURSORS_UPDATE: "cursors-update",
  USERS_UPDATE: "users-update",
};

const useSocket = () => {
  /**
   * Connection state
   */
  const [isConnected, setIsConnected] =
    useState(socket.connected);

  /**
   * --------------------------------------------------
   * Socket Lifecycle
   * --------------------------------------------------
   */
  useEffect(() => {
    /**
     * Connected
     */
    const handleConnect = () => {
      console.log(
        "[Socket] Connected:",
        socket.id
      );

      setIsConnected(true);
    };

    /**
     * Disconnected
     */
    const handleDisconnect = () => {
      console.log(
        "[Socket] Disconnected"
      );

      setIsConnected(false);
    };

    /**
     * Connection error
     */
    const handleError = (err) => {
      console.error(
        "[Socket] Connection error:",
        err.message
      );

      setIsConnected(false);
    };

    /**
     * Register listeners
     */
    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "connect_error",
      handleError
    );

    /**
     * Sync immediately
     */
    setIsConnected(
      socket.connected
    );

    /**
     * Cleanup listeners ONLY
     * DO NOT disconnect global socket
     */
    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "connect_error",
        handleError
      );
    };
  }, []);

  /**
   * --------------------------------------------------
   * Stable Socket Helpers
   * --------------------------------------------------
   * IMPORTANT:
   * useCallback prevents infinite rerenders
   */

  const emit = useCallback(
    (event, data) => {
      socket.emit(event, data);
    },
    []
  );

  const on = useCallback(
    (event, callback) => {
      socket.on(event, callback);
    },
    []
  );

  const off = useCallback(
    (event, callback) => {
      socket.off(event, callback);
    },
    []
  );

  return {
    emit,
    on,
    off,
    isConnected,
    socket,
  };
};

export default useSocket;