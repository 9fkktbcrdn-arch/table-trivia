"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LOADING_MESSAGES } from "@/lib/trivia-constants";

export function QuizLoading() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % LOADING_MESSAGES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <motion.div
        className="relative h-20 w-20"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-tt-border" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-tt-cyan border-r-tt-magenta" />
        <div className="absolute inset-2 rounded-full bg-tt-surface/80" />
        <motion.span
          className="absolute inset-0 flex items-center justify-center text-2xl"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          aria-hidden
        >
          ?
        </motion.span>
      </motion.div>
      <p className="max-w-[280px] text-center font-stat text-lg text-tt-cyan/95">{LOADING_MESSAGES[i]}</p>
    </div>
  );
}
