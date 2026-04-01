import type { Variants, Transition } from "framer-motion";

// --- Entrance animations ---

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] },
  },
};

// --- Stagger containers ---

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

// --- Hover / Tap ---

export const hoverScale = {
  rest: { scale: 1 },
  hover: {
    scale: 1.04,
    transition: { type: "spring" as const, stiffness: 200, damping: 15 },
  },
};

export const tapScale = { scale: 0.97 };

export const buttonHover = {
  scale: 1.05,
  transition: { type: "spring" as const, stiffness: 300, damping: 20 },
};

export const buttonTap = { scale: 0.97 };

// --- Scroll viewport trigger ---

export const scrollViewport = { once: true, amount: 0.3 as const };

// --- Spring transition ---

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

// --- Modal ---

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

// --- Table row ---

export const tableRow: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

// --- Pulse for live indicators ---

export const pulse = {
  scale: [1, 1.2, 1],
  opacity: [1, 0.7, 1],
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
};
