/**
 * On-mount reveal (sohub's route feel): navigating to a page doesn't wipe.
 * Each piece fades + slides up as it mounts. Shared by the public pages
 * (auth, legal). Framer's initial/animate fire on mount by definition, so this
 * is just a thin wrapper that centralises the easing + reduced-motion escape.
 */
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export const MountReveal = ({
  children,
  className,
  delay = 0,
  y = 24,
  duration = 0.7,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};
