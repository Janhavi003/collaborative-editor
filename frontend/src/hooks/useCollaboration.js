import { useEffect, useCallback, useRef } from "react";
import useSocket, { EVENTS } from "./useSocket";

// This hook combines socket + editor into one clean API
// DocumentPage will call this and get everything it needs
const useCollaboration = ({ documentId, userName, editor, onUsersUpdate }) => {
  const { emit, on, off, isConnected } = useSocket();
  const isRemoteUpdate = useRef(false);

  // Join the document room when editor is ready
  useEffect(() => {
    if (!editor || !documentId) return;

    emit(EVENTS.JOIN_DOCUMENT, { documentId, userName });

    // When joining, receive the current document state
    const handleDocumentState = ({ content }) => {
      if (content && editor) {
        isRemoteUpdate.current = true;
        editor.commands.setContent(content, false);
        isRemoteUpdate.current = false;
      }
    };

    // When another user makes a change, apply it to our editor
    const handleDocumentChange = ({ content }) => {
      if (!editor) return;
      isRemoteUpdate.current = true;
      editor.commands.setContent(content, false);
      isRemoteUpdate.current = false;
    };

    // When user list changes, notify the parent component
    const handleUsersUpdate = ({ users }) => {
      onUsersUpdate?.(users);
    };

    on(EVENTS.DOCUMENT_STATE, handleDocumentState);
    on(EVENTS.DOCUMENT_CHANGE, handleDocumentChange);
    on(EVENTS.USERS_UPDATE, handleUsersUpdate);

    return () => {
      off(EVENTS.DOCUMENT_STATE, handleDocumentState);
      off(EVENTS.DOCUMENT_CHANGE, handleDocumentChange);
      off(EVENTS.USERS_UPDATE, handleUsersUpdate);
    };
  }, [editor, documentId]);

  // Called by the editor whenever local content changes
  const sendChange = useCallback(
    (content) => {
      // Don't echo back changes that came FROM the server
      if (isRemoteUpdate.current) return;
      emit(EVENTS.DOCUMENT_CHANGE, { documentId, content });
    },
    [documentId, emit]
  );

  return { isConnected, sendChange };
};

export default useCollaboration;