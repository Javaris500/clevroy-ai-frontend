"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

const STORAGE_KEY = "clevroy:letterbox-played";

/**
 * Letterbox intro — two black bars slide off the top + bottom edges
 * once per session, framing the first paint of the chat surface like
 * a film opening. Skips entirely under prefers-reduced-motion.
 */
export function Letterbox() {
  const reduceMotion = useReducedMotion();
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (reduceMotion) return;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(STORAGE_KEY) === "1") return;
    window.sessionStorage.setItem(STORAGE_KEY, "1");
    setShow(true);
    const id = window.setTimeout(() => setShow(false), 1500);
    return () => window.clearTimeout(id);
  }, [reduceMotion]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: "-100%" }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.7, 0, 0.3, 1] }}
        className="absolute inset-x-0 top-0 h-[18vh] bg-black"
      />
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: "100%" }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.7, 0, 0.3, 1] }}
        className="absolute inset-x-0 bottom-0 h-[18vh] bg-black"
      />
    </div>
  );
}
