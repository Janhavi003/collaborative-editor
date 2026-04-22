import { useEffect, useCallback, useRef, useState } from "react";
import useSocket, { EVENTS } from "./useSocket";

// Simple unique ID for each operation
const generateOpId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const useCollaboration = ({ documentId, userName, editor, onUsersUpdate }) => {
  const { emit, on, off, isConnected } = useSocket();
  const isRemoteUpdate = useRef(false);
  const versionRef = useRef(0);           // our view of the server version
  const pendingOps = useRef([]);          // ops sent but not yet ACK'd
  const [conflictResolved, setConflictResolved] = useState(false);

  useEffect(() => {
    if (!editor || !documentId) return;

    emit(EVENTS.JOIN_DOCUMENT, { documentId, userName });

    // Receive initial document state
    const handleDocumentState = ({ content, version }) => {
      versionRef.current = version;
      if (content) {
        isRemoteUpdate.current = true;
        editor.commands.setContent(content, false);
        isRemoteUpdate.current = false;
      }
    };

    // Receive an operation from another user (already transformed by server)
    const handleOperation = ({ operation, serverVersion }) => {
      if (!editor) return;

      versionRef.current = serverVersion;

      isRemoteUpdate.current = true;

      if (operation.type === "replace") {
        editor.commands.setContent(operation.content, false);
      } else if (operation.type === "insert") {
        // For our current TipTap integration, we use the richContent
        // In a full OT system this would be a precise character insert
        if (operation.richContent) {
          editor.commands.setContent(operation.richContent, false);
        }
      } else if (operation.type === "delete") {
        if (operation.richContent) {
          editor.commands.setContent(operation.richContent, false);
        }
      }

      isRemoteUpdate.current = false;

      // Show "conflict resolved" badge if this op was transformed
      if (operation.wasTransformed) {
        setConflictResolved(true);
        setTimeout(() => setConflictResolved(false), 3000);
      }
    };

    // Server ACK: our op was applied, update our version
    const handleAck = ({ serverVersion, wasTransformed }) => {
      versionRef.current = serverVersion;
      pendingOps.current = pendingOps.current.slice(1);

      if (wasTransformed) {
        setConflictResolved(true);
        setTimeout(() => setConflictResolved(false), 3000);
      }
    };

    const handleUsersUpdate = ({ users }) => {
      onUsersUpdate?.(users);
    };

    on(EVENTS.DOCUMENT_STATE, handleDocumentState);
    on(EVENTS.OPERATION, handleOperation);
    on(EVENTS.OPERATIONS_ACK, handleAck);
    on(EVENTS.USERS_UPDATE, handleUsersUpdate);

    return () => {
      off(EVENTS.DOCUMENT_STATE, handleDocumentState);
      off(EVENTS.OPERATION, handleOperation);
      off(EVENTS.OPERATIONS_ACK, handleAck);
      off(EVENTS.USERS_UPDATE, handleUsersUpdate);
    };
  }, [editor, documentId]);

  // Called by editor on every content change
  const sendChange = useCallback(
    (content) => {
      if (isRemoteUpdate.current) return;

      const op = {
        id: generateOpId(),
        type: "replace",          // Phase 4: using replace for rich HTML
        content,                  // full HTML (we'll refine to insert/delete in Phase 5)
        richContent: content,
        version: versionRef.current,
        clientId: null,           // server fills this in
      };

      pendingOps.current.push(op);

      emit(EVENTS.OPERATION, { documentId, operation: op });
    },
    [documentId, emit]
  );

  return { isConnected, sendChange, conflictResolved };
};

export default useCollaboration;