import {
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import Editor from "../components/editor/Editor";
import ActiveUsers from "../components/editor/ActiveUsers";

import useCollaboration from "../hooks/useCollaboration";

import {
  updateDocumentTitle,
  fetchDocument,
} from "../api/documents";

const DocumentPage = () => {
  const { documentId } = useParams();

  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [lastSaved, setLastSaved] =
    useState(null);

  const [isSaving, setIsSaving] =
    useState(false);

  const [activeUsers, setActiveUsers] =
    useState([]);

  /**
   * Editor instance ref
   */
  const editorInstanceRef =
    useRef(null);

  /**
   * Document state
   */
  const [title, setTitle] = useState(
    "Untitled Document"
  );

  const [content, setContent] =
    useState("");

  /**
   * Save debounce timer
   */
  const saveTimerRef = useRef(null);

  const USER_NAME =
    user?.name || "Anonymous";

  /**
   * Load document metadata/content
   */
  useEffect(() => {
    if (!documentId) return;

    let mounted = true;

    fetchDocument(documentId)
      .then((data) => {
        if (!mounted) return;

        setTitle(
          data.document.title ||
            "Untitled Document"
        );

        setContent(
          data.document.content || ""
        );
      })
      .catch(() => {
        navigate("/");
      });

    return () => {
      mounted = false;
    };
  }, [documentId, navigate]);

  /**
   * Collaboration
   */
  const {
    isConnected,
    sendChange,
    conflictResolved,
  } = useCollaboration({
    documentId,
    userName: USER_NAME,
    editor:
      editorInstanceRef.current,
    onUsersUpdate:
      setActiveUsers,
  });

  /**
   * Handle editor changes
   */
  const handleChange = useCallback(
    (html) => {
      setContent(html);

      sendChange(html);

      setIsSaving(true);

      clearTimeout(
        saveTimerRef.current
      );

      saveTimerRef.current =
        setTimeout(() => {
          setIsSaving(false);

          setLastSaved(new Date());
        }, 1000);
    },
    [sendChange]
  );

  /**
   * Cleanup save timer
   */
  useEffect(() => {
    return () => {
      clearTimeout(
        saveTimerRef.current
      );
    };
  }, []);

  /**
   * Save title
   */
  const handleTitleBlur =
    useCallback(
      async (e) => {
        const newTitle =
          e.target.value.trim() ||
          "Untitled Document";

        setTitle(newTitle);

        try {
          await updateDocumentTitle(
            documentId,
            newTitle
          );
        } catch (err) {
          console.error(
            "Failed to save title:",
            err
          );
        }
      },
      [documentId]
    );

  /**
   * Format save timestamp
   */
  const formatSaveTime = (
    date
  ) => {
    if (!date) return "";

    return date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Top nav */}
      <nav
        className="
          flex items-center justify-between
          px-6 py-3
          border-b border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-900 z-20
        "
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          {/* Back */}
          <button
            onClick={() =>
              navigate("/")
            }
            className="
              flex items-center gap-1.5
              p-1.5 rounded-lg
              text-gray-400 hover:text-gray-700
              dark:hover:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors
            "
            title="Back to documents"
          >
            <span className="text-lg">
              ←
            </span>
          </button>

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-600" />

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="
                w-6 h-6 rounded-md bg-blue-500
                flex items-center justify-center
              "
            >
              <span className="text-white text-xs font-bold">
                C
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-600" />

          {/* Editable title */}
          <input
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(
                e.target.value
              )
            }
            onBlur={
              handleTitleBlur
            }
            className="
              text-sm font-medium
              text-gray-700 dark:text-gray-200
              bg-transparent border-none outline-none
              hover:bg-gray-100 dark:hover:bg-gray-800
              focus:bg-gray-100 dark:focus:bg-gray-800
              px-2 py-1 rounded-md transition-colors
              w-48
            "
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <ActiveUsers
            users={activeUsers}
          />

          {conflictResolved && (
            <div
              className="
                flex items-center gap-1.5
                px-2.5 py-1 rounded-full
                bg-amber-100 dark:bg-amber-900/40
                text-amber-700 dark:text-amber-400
                text-xs font-medium animate-pulse
              "
            >
              ⚡ Conflict resolved
            </div>
          )}

          {/* Connection */}
          <div className="flex items-center gap-1.5">
            <div
              className={`
                w-2 h-2 rounded-full transition-colors
                ${
                  isConnected
                    ? "bg-green-400"
                    : "bg-red-400"
                }
              `}
            />

            <span
              className="
                text-xs text-gray-400
                dark:text-gray-500
              "
            >
              {isConnected
                ? "Live"
                : "Offline"}
            </span>
          </div>

          {/* Save state */}
          <span
            className="
              text-xs text-gray-400
              dark:text-gray-500
            "
          >
            {isSaving
              ? "Saving..."
              : lastSaved
              ? `Saved at ${formatSaveTime(
                  lastSaved
                )}`
              : ""}
          </span>

          {/* Dark mode */}
          <button
            onClick={() =>
              document.documentElement.classList.toggle(
                "dark"
              )
            }
            className="
              p-2 rounded-md
              text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors text-sm
            "
            title="Toggle dark mode"
          >
            🌓
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="
              text-xs px-3 py-1.5 rounded-md
              text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors
            "
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          content={content}
          onChange={handleChange}
          onEditorReady={(
            editor
          ) => {
            editorInstanceRef.current =
              editor;
          }}
        />
      </div>
    </div>
  );
};

export default DocumentPage;