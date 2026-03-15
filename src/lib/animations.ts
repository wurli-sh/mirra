import type { Variants, Transition } from 'framer-motion'

// --- Entrance animations ---

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
}

// --- Stagger containers ---

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

export const staggerFast: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

// --- Hover / Tap ---

export const hoverScale = { scale: 1.03, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } }
export const tapScale = { scale: 0.97 }

export const buttonHover = { scale: 1.02 }
export const buttonTap = { scale: 0.98 }

// --- Scroll viewport trigger ---

export const scrollViewport = { once: true, amount: 0.2 as const }

// --- Spring transition ---

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

// --- Modal ---

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.95, y: 10 },
}

// --- Table row ---

export const tableRow: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
}

// --- Pulse for live indicators ---

export const pulse = {
  scale: [1, 1.2, 1],
  opacity: [1, 0.7, 1],
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
}
