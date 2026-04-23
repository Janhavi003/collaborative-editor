import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  listDocuments,
  createDocument,
  deleteDocument,
} from "../api/documents";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Extracts plain text preview from HTML content
const getPreview = (html) => {
  if (!html) return "Empty document";
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = div.textContent || div.innerText || "";
  return text.slice(0, 120) || "Empty document";
};

const DocumentCard = ({ doc, onOpen, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await onDelete(doc.documentId);
  };

  return (
    <div
      onClick={() => onOpen(doc.documentId)}
      className="
        group relative bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-xl p-5 cursor-pointer
        hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600
        transition-all duration-200
      "
    >
      {/* Doc icon */}
      <div className="
        w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30
        flex items-center justify-center mb-3
        text-blue-500 text-lg
      ">
        📄
      </div>

      {/* Title */}
      <h3 className="
        font-semibold text-gray-800 dark:text-gray-100
        text-sm mb-1 truncate
      ">
        {doc.title || "Untitled Document"}
      </h3>

      {/* Preview */}
      <p className="
        text-xs text-gray-400 dark:text-gray-500
        line-clamp-2 mb-3 leading-relaxed
      ">
        {getPreview(doc.content)}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {formatDate(doc.updatedAt)}
        </span>

        {/* 3-dot menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="
              opacity-0 group-hover:opacity-100
              p-1 rounded-md
              text-gray-400 hover:text-gray-600
              dark:text-gray-500 dark:hover:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-all
            "
          >
            ···
          </button>

          {showMenu && (
            <div
              className="
                absolute right-0 bottom-8 w-40
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                rounded-lg shadow-lg py-1 z-10
              "
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(doc.documentId);
                }}
                className="
                  w-full text-left px-3 py-2 text-sm
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-700
                "
              >
                Open
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="
                  w-full text-left px-3 py-2 text-sm
                  text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                  disabled:opacity-50
                "
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const loadDocs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      setError("Failed to load documents. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, []);

  const handleCreate = async () => {
    try {
      setCreating(true);
      const data = await createDocument();
      navigate(`/doc/${data.document.documentId}`);
    } catch (err) {
      setError("Failed to create document.");
      setCreating(false);
    }
  };

  const handleOpen = (documentId) => {
    navigate(`/doc/${documentId}`);
  };

  const handleDelete = async (documentId) => {
    try {
      await deleteDocument(documentId);
      setDocuments((prev) => prev.filter((d) => d.documentId !== documentId));
    } catch (err) {
      setError("Failed to delete document.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top nav */}
      <nav className="
        bg-white dark:bg-gray-900
        border-b border-gray-200 dark:border-gray-700
        px-6 py-4 sticky top-0 z-10
      ">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-gray-800 dark:text-white text-lg">
              CollabDocs
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => document.documentElement.classList.toggle("dark")}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Toggle dark mode"
            >
              🌓
            </button>

            {/* User avatar + name */}
            <div className="flex items-center gap-2">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                {user?.name}
              </span>
            </div>

            <button
              onClick={logout}
              className="
                text-sm px-3 py-1.5 rounded-lg
                text-gray-500 dark:text-gray-400
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors
              "
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Documents
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {documents.length} document{documents.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="
              flex items-center gap-2
              px-4 py-2.5 rounded-xl
              bg-blue-500 hover:bg-blue-600
              text-white font-medium text-sm
              transition-all duration-150
              shadow-sm hover:shadow-md
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <span className="text-lg leading-none">+</span>
                New Document
              </>
            )}
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="
            mb-6 px-4 py-3 rounded-xl
            bg-red-50 dark:bg-red-900/20
            border border-red-200 dark:border-red-800
            text-red-700 dark:text-red-400 text-sm
            flex items-center justify-between
          ">
            {error}
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="
                  bg-white dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  rounded-xl p-5 animate-pulse
                "
              >
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded mb-1 w-full" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && documents.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No documents yet
            </h2>
            <p className="text-gray-400 dark:text-gray-500 mb-6 text-sm">
              Create your first document to get started
            </p>
            <button
              onClick={handleCreate}
              className="
                px-5 py-2.5 rounded-xl
                bg-blue-500 hover:bg-blue-600
                text-white font-medium text-sm
                transition-colors
              "
            >
              Create Document
            </button>
          </div>
        )}

        {/* Document grid */}
        {!loading && documents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.documentId}
                doc={doc}
                onOpen={handleOpen}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;