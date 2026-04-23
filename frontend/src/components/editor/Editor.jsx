import {
  useRef,
  useEffect,
} from "react";

import {
  useEditor,
  EditorContent,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";

import Toolbar from "./Toolbar";

const DEFAULT_CONTENT =
  "<h1>Untitled Document</h1><p>Start writing here...</p>";

const Editor = ({
  content,
  onChange,
  onEditorReady,
}) => {
  /**
   * Prevent update loops
   */
  const isSettingContent =
    useRef(false);

  /**
   * Initialize editor
   */
  const editor = useEditor({
    extensions: [StarterKit],

    content:
      content || DEFAULT_CONTENT,

    editorProps: {
      attributes: {
        class:
          "outline-none min-h-full",
      },
    },

    /**
     * Local editor updates
     */
    onUpdate: ({ editor }) => {
      /**
       * Ignore remote sync updates
       */
      if (
        isSettingContent.current
      ) {
        return;
      }

      onChange?.(
        editor.getHTML()
      );
    },

    /**
     * Editor created
     */
    onCreate: ({ editor }) => {
      onEditorReady?.(editor);
    },
  });

  /**
   * Sync incoming content safely
   */
  useEffect(() => {
    if (!editor) return;

    if (!content) return;

    const currentHTML =
      editor.getHTML();

    /**
     * Prevent unnecessary resets
     */
    if (
      currentHTML === content
    ) {
      return;
    }

    isSettingContent.current =
      true;

    /**
     * false = don't emit update event
     */
    editor.commands.setContent(
      content,
      false
    );

    queueMicrotask(() => {
      isSettingContent.current =
        false;
    });
  }, [editor, content]);

  /**
   * Cleanup
   */
  useEffect(() => {
    return () => {
      isSettingContent.current =
        false;
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 shadow-sm">
        <Toolbar editor={editor} />
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto py-12 px-4 bg-gray-50 dark:bg-gray-800">
        <div
          className="
            max-w-3xl mx-auto
            bg-white dark:bg-gray-900
            rounded-lg shadow-sm
            min-h-[calc(100vh-160px)]
            px-12 py-10
            border border-gray-200 dark:border-gray-700
            relative
          "
        >
          <EditorContent
            editor={editor}
            className="
              prose prose-lg dark:prose-invert max-w-none
              prose-headings:font-bold
              prose-h1:text-3xl prose-h1:mb-4
              prose-h2:text-2xl prose-h2:mb-3
              prose-h3:text-xl prose-h3:mb-2
              prose-p:text-gray-700 dark:prose-p:text-gray-300
              prose-p:leading-relaxed
              prose-li:text-gray-700 dark:prose-li:text-gray-300
              prose-code:bg-gray-100 dark:prose-code:bg-gray-800
              prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-blockquote:border-l-4
              prose-blockquote:border-blue-400
              prose-blockquote:pl-4
              prose-blockquote:italic
              prose-blockquote:text-gray-500
            "
          />
        </div>
      </div>
    </div>
  );
};

export default Editor;