import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINES = [
  { user: "Alice", color: "#60A5FA", text: "The future of collaboration" },
  { user: "Bob",   color: "#34D399", text: " is real-time and seamless." },
  { user: "Alice", color: "#60A5FA", text: "\n\nAnyone, anywhere," },
  { user: "Bob",   color: "#34D399", text: " editing together." },
];

const TYPING_SPEED = 45; // ms per character

const UserCursor = ({ name, color }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="inline-flex items-center gap-1 mx-0.5 align-middle"
  >
    <span
      className="inline-block w-0.5 h-4 rounded-full animate-pulse"
      style={{ backgroundColor: color }}
    />
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white leading-none"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  </motion.span>
);

const MockEditor = () => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [activeCursor, setActiveCursor] = useState(null);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (done) {
      // Restart animation after a pause
      timerRef.current = setTimeout(() => {
        setDisplayedText("");
        setCurrentLine(0);
        setCurrentChar(0);
        setActiveCursor(null);
        setDone(false);
      }, 3500);
      return;
    }

    if (currentLine >= LINES.length) {
      setActiveCursor(null);
      setDone(true);
      return;
    }

    const line = LINES[currentLine];

    if (currentChar === 0) {
      setActiveCursor({ name: line.user, color: line.color });
    }

    if (currentChar < line.text.length) {
      timerRef.current = setTimeout(() => {
        setDisplayedText((prev) => prev + line.text[currentChar]);
        setCurrentChar((c) => c + 1);
      }, TYPING_SPEED + Math.random() * 30);
    } else {
      timerRef.current = setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, 420);
    }

    return () => clearTimeout(timerRef.current);
  }, [currentLine, currentChar, done]);

  // Split text into paragraphs for display
  const paragraphs = displayedText.split("\n\n");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
      className="
        w-full max-w-lg rounded-2xl overflow-hidden
        shadow-2xl shadow-blue-100/40 dark:shadow-black/40
        border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-900
      "
    >
      {/* Mock window chrome */}
      <div className="
        flex items-center justify-between
        px-4 py-3
        bg-gray-50 dark:bg-gray-800
        border-b border-gray-200 dark:border-gray-700
      ">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>

        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
          project-proposal.doc
        </span>

        {/* Live users */}
        <div className="flex items-center gap-1">
          {[
            { name: "Alice", color: "#60A5FA" },
            { name: "Bob", color: "#34D399" },
          ].map((u) => (
            <div
              key={u.name}
              title={u.name}
              style={{ backgroundColor: u.color }}
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold border-2 border-white dark:border-gray-800"
            >
              {u.name[0]}
            </div>
          ))}
          <span className="text-[10px] text-gray-400 ml-1">2 live</span>
        </div>
      </div>

      {/* Mock toolbar */}
      <div className="
        flex items-center gap-1 px-4 py-2
        border-b border-gray-100 dark:border-gray-800
        bg-white dark:bg-gray-900
      ">
        {["B", "I", "H1", "H2", "• List"].map((btn) => (
          <span
            key={btn}
            className="
              text-[11px] px-2 py-1 rounded
              text-gray-400 dark:text-gray-600
              bg-gray-50 dark:bg-gray-800
              font-medium
            "
          >
            {btn}
          </span>
        ))}
      </div>

      {/* Document body */}
      <div className="px-8 py-7 min-h-[180px] bg-white dark:bg-gray-900">
        <div className="text-base text-gray-800 dark:text-gray-200 leading-relaxed font-serif">
          {paragraphs.map((para, i) => (
            <p key={i} className={i > 0 ? "mt-4" : ""}>
              {para}
              {i === paragraphs.length - 1 && activeCursor && (
                <UserCursor
                  name={activeCursor.name}
                  color={activeCursor.color}
                />
              )}
            </p>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="
        px-4 py-2
        bg-gray-50 dark:bg-gray-800
        border-t border-gray-100 dark:border-gray-800
        flex items-center justify-between
      ">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-gray-400">Live • Auto-saved</span>
        </div>
        <span className="text-[10px] text-gray-300 dark:text-gray-600">
          v{Math.floor(displayedText.length / 8) + 1}
        </span>
      </div>
    </motion.div>
  );
};

export default MockEditor;