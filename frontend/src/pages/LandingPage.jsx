import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import MockEditor from "../components/landing/MockEditor";

import {
  stagger,
  fadeIn,
} from "../styles/tokens";

const BACKEND_URL =
  import.meta.env
    .VITE_BACKEND_URL ||
  "http://localhost:5000";

/* --------------------------------------------------
   Feature cards
-------------------------------------------------- */
const FEATURES = [
  {
    icon: "⚡",
    title: "Real-time sync",
    desc: "Every keystroke is broadcast instantly. No refresh needed, no merge conflicts.",
  },
  {
    icon: "🧠",
    title:
      "Conflict resolution",
    desc: "Operational Transformation ensures concurrent edits are always reconciled correctly.",
  },
  {
    icon: "🎨",
    title:
      "Rich text editor",
    desc: "Headings, bold, lists, blockquotes — everything you need, nothing you don't.",
  },
  {
    icon: "🔒",
    title:
      "Secure by default",
    desc: "Google OAuth + JWT. Your documents are private and tied to your identity.",
  },
  {
    icon: "💾",
    title: "Auto-save",
    desc: "Debounced saves to MongoDB every 2 seconds. Your work is never lost.",
  },
  {
    icon: "👥",
    title:
      "Live presence",
    desc: "See who's editing with colored avatars and cursor positions in real time.",
  },
];

/* --------------------------------------------------
   Steps
-------------------------------------------------- */
const STEPS = [
  {
    n: "01",
    title: "Sign in",
    desc: "One click with your Google account. No passwords.",
  },
  {
    n: "02",
    title:
      "Create a doc",
    desc: "Hit New Document from your dashboard. It's instant.",
  },
  {
    n: "03",
    title:
      "Share the link",
    desc: "Send the URL to collaborators. They join in seconds.",
  },
  {
    n: "04",
    title:
      "Edit together",
    desc: "Type simultaneously. Changes appear in real time.",
  },
];

/* --------------------------------------------------
   Section heading
-------------------------------------------------- */
const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
}) => (
  <motion.div
    variants={
      stagger.container
    }
    initial="hidden"
    whileInView="show"
    viewport={{
      once: true,
      margin: "-80px",
    }}
    className="text-center mb-16"
  >
    <motion.span
      variants={stagger.item}
      className="
        inline-block text-xs
        font-semibold tracking-widest uppercase
        text-blue-500 mb-3
      "
    >
      {eyebrow}
    </motion.span>

    <motion.h2
      variants={stagger.item}
      className="
        text-3xl sm:text-4xl
        font-bold
        text-gray-900 dark:text-white
        mb-4
      "
    >
      {title}
    </motion.h2>

    {subtitle && (
      <motion.p
        variants={
          stagger.item
        }
        className="
          text-gray-500 dark:text-gray-400
          max-w-xl mx-auto text-lg
        "
      >
        {subtitle}
      </motion.p>
    )}
  </motion.div>
);

/* --------------------------------------------------
   Landing page
-------------------------------------------------- */
const LandingPage = () => {
  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const handleCTA = () => {
    if (user) {
      navigate("/");
    } else {
      window.location.href = `${BACKEND_URL}/api/auth/google`;
    }
  };

  return (
    <div
      className="
        bg-white dark:bg-gray-950
        text-gray-900 dark:text-white
        overflow-x-hidden
      "
    >
      {/* NAV */}
      <motion.nav
        initial={{
          opacity: 0,
          y: -16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="
          sticky top-0 z-50
          flex items-center justify-between
          px-6 md:px-12 py-4
          bg-white/80 dark:bg-gray-950/80
          backdrop-blur-md
          border-b border-gray-100 dark:border-gray-800
        "
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="
              w-7 h-7 rounded-lg
              bg-blue-500
              flex items-center justify-center
            "
          >
            <span className="text-white text-xs font-bold">
              C
            </span>
          </div>

          <span
            className="
              font-bold
              text-gray-900 dark:text-white
            "
          >
            CollabDocs
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              document.documentElement.classList.toggle(
                "dark"
              )
            }
            className="
              p-2 rounded-lg
              text-gray-400
              hover:bg-gray-100
              dark:hover:bg-gray-800
              transition-colors
            "
          >
            🌓
          </button>

          {user ? (
            <button
              onClick={() =>
                navigate("/")
              }
              className="
                px-4 py-2 rounded-xl
                text-sm font-medium
                bg-blue-500 hover:bg-blue-600
                text-white
                transition-colors shadow-sm
              "
            >
              Go to Dashboard →
            </button>
          ) : (
            <button
              onClick={
                handleCTA
              }
              className="
                px-4 py-2 rounded-xl
                text-sm font-medium
                bg-blue-500 hover:bg-blue-600
                text-white
                transition-colors shadow-sm
              "
            >
              Get started free
            </button>
          )}
        </div>
      </motion.nav>

      {/* HERO */}
      <section
        className="
          min-h-[calc(100vh-64px)]
          flex items-center
          px-6 md:px-12 lg:px-20
          py-20
          max-w-7xl mx-auto
          gap-12 lg:gap-20
        "
      >
        {/* LEFT */}
        <motion.div
          className="flex-1 max-w-xl"
          variants={
            stagger.container
          }
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={
              stagger.item
            }
          >
            <span
              className="
                inline-flex items-center gap-2
                text-xs font-semibold tracking-wider uppercase
                text-blue-500
                bg-blue-50 dark:bg-blue-900/30
                px-3 py-1.5 rounded-full
                mb-6
              "
            >
              <span
                className="
                  w-1.5 h-1.5 rounded-full
                  bg-blue-500 animate-pulse
                "
              />

              Real-time collaboration
            </span>
          </motion.div>

          <motion.h1
            variants={
              stagger.item
            }
            className="
              text-4xl sm:text-5xl lg:text-6xl
              font-bold leading-tight
              text-gray-900 dark:text-white
              mb-6
            "
          >
            Write together,{" "}
            <span
              className="
                bg-gradient-to-r
                from-blue-500 to-indigo-500
                bg-clip-text text-transparent
              "
            >
              in real time.
            </span>
          </motion.h1>

          <motion.p
            variants={
              stagger.item
            }
            className="
              text-lg
              text-gray-500 dark:text-gray-400
              leading-relaxed
              mb-8 max-w-md
            "
          >
            CollabDocs is a
            collaborative document
            editor built on
            WebSockets and
            Operational
            Transformation.
            Multiple people, one
            document, zero
            conflicts.
          </motion.p>

          {/* CTA Row */}
          <motion.div
            variants={
              stagger.item
            }
            className="
              flex items-center gap-4
              flex-wrap
            "
          >
            <motion.button
              onClick={
                handleCTA
              }
              whileHover={{
                scale: 1.03,
              }}
              whileTap={{
                scale: 0.97,
              }}
              className="
                px-6 py-3 rounded-xl
                bg-blue-500 hover:bg-blue-600
                text-white
                font-semibold text-sm
                shadow-lg shadow-blue-200
                dark:shadow-blue-900/30
                transition-colors
              "
            >
              {user
                ? "Open Dashboard →"
                : "Start writing for free →"}
            </motion.button>

            {/* GitHub */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center gap-2
                px-5 py-3 rounded-xl
                border border-gray-200 dark:border-gray-700
                text-gray-600 dark:text-gray-400
                hover:bg-gray-50 dark:hover:bg-gray-800
                text-sm font-medium
                transition-colors
              "
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>

              View source
            </a>
          </motion.div>

          <motion.p
            variants={
              stagger.item
            }
            className="
              text-xs
              text-gray-400 dark:text-gray-600
              mt-4
            "
          >
            Free forever. No
            credit card. Open
            source.
          </motion.p>
        </motion.div>

        {/* RIGHT */}
        <div className="flex-1 hidden lg:flex justify-center">
          <MockEditor />
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="
          border-t border-gray-100 dark:border-gray-800
          px-6 md:px-12 py-10
          bg-white dark:bg-gray-950
        "
      >
        <div
          className="
            max-w-7xl mx-auto
            flex flex-col sm:flex-row
            items-center justify-between
            gap-4
          "
        >
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div
              className="
                w-6 h-6 rounded-md
                bg-blue-500
                flex items-center justify-center
              "
            >
              <span className="text-white text-xs font-bold">
                C
              </span>
            </div>

            <span
              className="
                text-sm font-semibold
                text-gray-700 dark:text-gray-300
              "
            >
              CollabDocs
            </span>
          </div>

          {/* Text */}
          <p
            className="
              text-xs
              text-gray-400 dark:text-gray-600
            "
          >
            Built as a portfolio
            project demonstrating
            real-time systems
            design.
          </p>

          {/* Links */}
          <div
            className="
              flex items-center gap-4
              text-xs
              text-gray-400 dark:text-gray-600
            "
          >
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="
                hover:text-gray-600
                dark:hover:text-gray-400
                transition-colors
              "
            >
              GitHub
            </a>

            <span>·</span>

            <span>
              Made with React +
              Node.js
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;