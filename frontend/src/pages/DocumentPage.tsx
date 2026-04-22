import { useState, useCallback } from "react";
import Editor from "../components/editor/Editor";

const DocumentPage = () => {
  const [content, setContent] = useState("");
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Simulate auto-save (we'll wire this to the real DB in Phase 6)
  const handleChange = useCallback((html) => {
    setContent(html);
    setIsSaving(true);

    // Debounced fake save — 1 second after last keystroke
    const timer = setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const formatSaveTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Top navigation bar */}
      <nav className="
        flex items-center justify-between
        px-6 py-3
        border-b border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-900
        z-20
      ">
        {/* Left: Logo + Doc name */}
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
              px-2 py-1 rounded-md transition-colors
              w-48
            "
          />
        </div>

        {/* Right: Save status */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {isSaving
              ? "Saving..."
              : lastSaved
              ? `Saved at ${formatSaveTime(lastSaved)}`
              : ""}
          </span>

          {/* Dark mode toggle placeholder */}
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

      {/* Editor fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <Editor content={content} onChange={handleChange} />
      </div>
    </div>
  );
};

export default DocumentPage;