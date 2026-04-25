import {
  useEffect,
  useCallback,
  useRef,
  useState,
} from "react";

import useSocket, {
  EVENTS,
} from "./useSocket";

const generateOpId = () =>
  `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

const useCollaboration = ({
  documentId,
  userName,
  onUsersUpdate,
  onRemoteChange,
}) => {
  const {
    emit,
    on,
    off,
    isConnected,
  } = useSocket();

  const versionRef =
    useRef(0);

  const pendingOps =
    useRef([]);

  const [
    conflictResolved,
    setConflictResolved,
  ] = useState(false);

  const mountedRef =
    useRef(true);

  /**
   * Mounted guard
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current =
        false;
    };
  }, []);

  /**
   * Conflict badge
   */
  const showConflictBadge =
    useCallback(() => {
      if (!mountedRef.current)
        return;

      setConflictResolved(true);

      setTimeout(() => {
        if (
          mountedRef.current
        ) {
          setConflictResolved(
            false
          );
        }
      }, 3000);
    }, []);

  /**
   * Main collaboration lifecycle
   */
  useEffect(() => {
    if (!documentId)
      return;

    /**
     * Join room
     */
    emit(
      EVENTS.JOIN_DOCUMENT,
      {
        documentId,
        userName,
      }
    );

    /**
     * Initial document
     */
    const handleDocumentState =
      ({
        content,
        version,
      }) => {
        versionRef.current =
          version || 0;

        /**
         * IMPORTANT:
         * update React state
         */
        onRemoteChange?.(
          content || ""
        );
      };

    /**
     * Remote operation
     */
    const handleOperation =
      ({
        operation,
        serverVersion,
      }) => {
        versionRef.current =
          serverVersion;

        /**
         * IMPORTANT:
         * update React state
         */
        if (
          operation.type ===
          "replace"
        ) {
          onRemoteChange?.(
            operation.content
          );
        } else if (
          operation.richContent
        ) {
          onRemoteChange?.(
            operation.richContent
          );
        }

        if (
          operation.wasTransformed
        ) {
          showConflictBadge();
        }
      };

    /**
     * ACK
     */
    const handleAck = ({
      serverVersion,
      wasTransformed,
    }) => {
      versionRef.current =
        serverVersion;

      pendingOps.current =
        pendingOps.current.slice(
          1
        );

      if (
        wasTransformed
      ) {
        showConflictBadge();
      }
    };

    /**
     * Users
     */
    const handleUsersUpdate =
      ({ users }) => {
        onUsersUpdate?.(
          users
        );
      };

    /**
     * Register listeners
     */
    on(
      EVENTS.DOCUMENT_STATE,
      handleDocumentState
    );

    on(
      EVENTS.OPERATION,
      handleOperation
    );

    on(
      EVENTS.OPERATIONS_ACK,
      handleAck
    );

    on(
      EVENTS.USERS_UPDATE,
      handleUsersUpdate
    );

    return () => {
      off(
        EVENTS.DOCUMENT_STATE,
        handleDocumentState
      );

      off(
        EVENTS.OPERATION,
        handleOperation
      );

      off(
        EVENTS.OPERATIONS_ACK,
        handleAck
      );

      off(
        EVENTS.USERS_UPDATE,
        handleUsersUpdate
      );
    };
  }, [
    documentId,
    userName,
    emit,
    on,
    off,
    onUsersUpdate,
    onRemoteChange,
    showConflictBadge,
  ]);

  /**
   * Send local changes
   */
  const sendChange =
    useCallback(
      (content) => {
        const op = {
          id: generateOpId(),

          type: "replace",

          content,

          richContent:
            content,

          version:
            versionRef.current,

          clientId: null,
        };

        pendingOps.current.push(
          op
        );

        emit(
          EVENTS.OPERATION,
          {
            documentId,
            operation: op,
          }
        );
      },
      [
        documentId,
        emit,
      ]
    );

  return {
    isConnected,
    sendChange,
    conflictResolved,
  };
};

export default useCollaboration;