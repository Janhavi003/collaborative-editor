// Design tokens — single source of truth for the visual system
// Import these anywhere instead of hardcoding Tailwind classes

export const transitions = {
  page: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  card: { duration: 0.2, ease: "easeOut" },
  micro: { duration: 0.15, ease: "easeOut" },
};

export const stagger = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  },
  item: {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  },
};

export const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export const scaleOnHover = {
  whileHover: { scale: 1.02, transition: { duration: 0.15 } },
  whileTap: { scale: 0.98 },
};