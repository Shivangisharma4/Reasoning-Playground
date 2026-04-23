import type { Variants } from "framer-motion";

export const feedContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.045, delayChildren: 0.08 },
  },
};

export const feedItem: Variants = {
  hidden: { opacity: 0, y: 10, clipPath: "inset(0 0 100% 0)" },
  show: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0 0 0% 0)",
    transition: { duration: 0.48, ease: [0.16, 1, 0.3, 1] },
  },
};

export const shellEnter: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const shellPanel: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export const expandClip: Variants = {
  collapsed: {
    height: 0,
    opacity: 0.2,
    clipPath: "inset(0 0 100% 0)",
    transition: { duration: 0.32, ease: [0.76, 0, 0.24, 1] },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    clipPath: "inset(0 0 0% 0)",
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};
