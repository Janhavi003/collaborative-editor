import { useState, useCallback, useRef } from "react";
import Editor from "../components/editor/Editor";
import ActiveUsers from "../components/editor/ActiveUsers";
import useCollaboration from "../hooks/useCollaboration";

// For now, hard-coded. Phase 6 + 7 will make these dynamic.
const DOCUMENT_ID = "doc-001";
const USER_NAME = "User " + Math.floor(Math.random() * 100);

const DocumentPage = () => {
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [editorInstance, setEditorInstance] = useState(null);
  const saveTimerRef = useRef(null);

  const { isConnected, sendChange, conflictResolved } = useCollaboration({
  documentId: DOCUMENT_ID,
  userName: USER_NAME,
  editor: editorInstance,
  onUsersUpdate: setActiveUsers,
});

  const handleChange = useCallback(
    (html) => {
      // Send to collaborators
      sendChange(html);

      // Auto-save UI feedback
      setIsSaving(true);
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 1000);
    },
    [sendChange]
  );

  const formatSaveTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Nav bar */}
      <nav className="
        flex items-center justify-between
        px-6 py-3
        border-b border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-900 z-20
      ">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
              CollabDocs
            </span>
          </div>
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-600" />
          <input
            type="text"
            defaultValue="Untitled Document"
            className="
              text-sm font-medium text-gray-700 dark:text-gray-200
              bg-transparent border-none outline-none
              hover:bg-gray-100 dark:hover:bg-gray-800
              focus:bg-gray-100 dark:focus:bg-gray-800
              px-2 py-1 rounded-md transition-colors w-48
            "
          />
        </div>

<div className="flex items-center gap-4">
  {/* Live users */}
  <ActiveUsers users={activeUsers} />

  {/* Conflict resolved badge */}
  {conflictResolved && (
    <div className="
      flex items-center gap-1.5 px-2.5 py-1 rounded-full
      bg-amber-100 dark:bg-amber-900/40
      text-amber-700 dark:text-amber-400
      text-xs font-medium
      animate-pulse
    ">
      ⚡ Conflict resolved
    </div>
  )}

  {/* Connection status */}
  <div className="flex items-center gap-1.5">
    <div className={`
      w-2 h-2 rounded-full transition-colors
      ${isConnected ? "bg-green-400" : "bg-red-400"}
    `} />
    <span className="text-xs text-gray-400 dark:text-gray-500">
      {isConnected ? "Live" : "Offline"}
    </span>
  </div>

  {/* Save status */}
  <span className="text-xs text-gray-400 dark:text-gray-500">
    {isSaving
      ? "Saving..."
      : lastSaved
      ? `Saved at ${formatSaveTime(lastSaved)}`
      : ""}
  </span>

  {/* Dark mode toggle */}
  <button
    onClick={() => document.documentElement.classList.toggle("dark")}
    className="
      p-2 rounded-md text-gray-500 dark:text-gray-400
      hover:bg-gray-100 dark:hover:bg-gray-800
      transition-colors text-sm
    "
    title="Toggle dark mode"
  >
    🌓
  </button>
</div>
      </nav>

      <div className="flex-1 overflow-hidden">
        <Editor
          onChange={handleChange}
          onEditorReady={setEditorInstance}
        />
      </div>
    </div>
  );
};

export default DocumentPage;