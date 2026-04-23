import {
  useEffect,
  useCallback,
  useRef,
  useState,
} from "react";

import useSocket, {
  EVENTS,
} from "./useSocket";

/**
 * Generate unique operation ID
 */
const generateOpId = () =>
  `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

const useCollaboration = ({
  documentId,
  userName,
  editor,
  onUsersUpdate,
}) => {
  const {
    emit,
    on,
    off,
    isConnected,
  } = useSocket();

  /**
   * Prevent collaboration echo loops
   */
  const isRemoteUpdate = useRef(false);

  /**
   * Server version tracking
   */
  const versionRef = useRef(0);

  /**
   * Pending operation queue
   */
  const pendingOps = useRef([]);

  /**
   * Conflict UI
   */
  const [conflictResolved, setConflictResolved] =
    useState(false);

  /**
   * Timer cleanup
   */
  const conflictTimerRef = useRef(null);

  /**
   * Mounted guard
   */
  const mountedRef = useRef(true);

  /**
   * Stable editor ref
   */
  const editorRef = useRef(null);

  /**
   * Keep latest editor instance
   */
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  /**
   * Mounted lifecycle
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Conflict badge helper
   */
  const showConflictBadge =
    useCallback(() => {
      if (!mountedRef.current)
        return;

      setConflictResolved(true);

      clearTimeout(
        conflictTimerRef.current
      );

      conflictTimerRef.current =
        setTimeout(() => {
          if (!mountedRef.current)
            return;

          setConflictResolved(false);
        }, 3000);
    }, []);

  /**
   * --------------------------------------------------
   * Main collaboration lifecycle
   * --------------------------------------------------
   */
  useEffect(() => {
    /**
     * Wait for valid setup
     */
    if (!documentId) return;

    /**
     * Join collaboration room
     */
    emit(EVENTS.JOIN_DOCUMENT, {
      documentId,
      userName,
    });

    /**
     * Initial document sync
     */
    const handleDocumentState = ({
      content,
      version,
    }) => {
      const editor =
        editorRef.current;

      if (!editor) return;

      versionRef.current = version;

      if (content) {
        isRemoteUpdate.current = true;

        editor.commands.setContent(
          content,
          false
        );

        queueMicrotask(() => {
          isRemoteUpdate.current = false;
        });
      }
    };

    /**
     * Remote operation received
     */
    const handleOperation = ({
      operation,
      serverVersion,
    }) => {
      const editor =
        editorRef.current;

      if (!editor) return;

      versionRef.current =
        serverVersion;

      isRemoteUpdate.current = true;

      /**
       * Replace
       */
      if (
        operation.type === "replace"
      ) {
        editor.commands.setContent(
          operation.content,
          false
        );
      }

      /**
       * Insert
       */
      if (
        operation.type === "insert" &&
        operation.richContent
      ) {
        editor.commands.setContent(
          operation.richContent,
          false
        );
      }

      /**
       * Delete
       */
      if (
        operation.type === "delete" &&
        operation.richContent
      ) {
        editor.commands.setContent(
          operation.richContent,
          false
        );
      }

      queueMicrotask(() => {
        isRemoteUpdate.current = false;
      });

      /**
       * Conflict resolved UI
       */
      if (
        operation.wasTransformed
      ) {
        showConflictBadge();
      }
    };

    /**
     * Server ACK
     */
    const handleAck = ({
      serverVersion,
      wasTransformed,
    }) => {
      versionRef.current =
        serverVersion;

      pendingOps.current =
        pendingOps.current.slice(1);

      if (wasTransformed) {
        showConflictBadge();
      }
    };

    /**
     * Active users update
     */
    const handleUsersUpdate = ({
      users,
    }) => {
      onUsersUpdate?.(users);
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

    /**
     * Cleanup
     */
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

      clearTimeout(
        conflictTimerRef.current
      );
    };
  }, [
    documentId,
    userName,
    showConflictBadge,
  ]);

  /**
   * Send editor changes
   */
  const sendChange = useCallback(
    (content) => {
      /**
       * Ignore remote sync updates
       */
      if (
        isRemoteUpdate.current
      ) {
        return;
      }

      const op = {
        id: generateOpId(),

        type: "replace",

        content,

        richContent: content,

        version:
          versionRef.current,

        clientId: null,
      };

      pendingOps.current.push(op);

      emit(EVENTS.OPERATION, {
        documentId,
        operation: op,
      });
    },
    [documentId, emit]
  );

  return {
    isConnected,
    sendChange,
    conflictResolved,
  };
};

export default useCollaboration;