"use client";

import { motion } from "framer-motion";
import type { TriviaDifficulty } from "@/lib/types";

interface DifficultySelectorProps {
  onSelect: (d: TriviaDifficulty) => void;
}

const levels: { id: TriviaDifficulty; label: string; hint: string; dotClass: string }[] = [
  { id: "noob", label: "Noob", hint: "Easy — great for younger players", dotClass: "bg-tt-success" },
  { id: "normal", label: "Normal", hint: "Medium — family friendly", dotClass: "bg-tt-gold" },
  { id: "grandmaster", label: "Grand Master", hint: "Hard — for superfans", dotClass: "bg-tt-error" },
];

export function DifficultySelector({ onSelect }: DifficultySelectorProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {levels.map((L, i) => (
        <motion.button
          key={L.id}
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          onClick={() => onSelect(L.id)}
          className="flex min-h-[64px] flex-col items-start justify-center rounded-xl border border-white/10 bg-tt-surface-mid px-4 py-2.5 text-left transition hover:border-tt-gold active:scale-[0.99]"
        >
          <span className="flex items-center gap-2 font-body text-sm font-medium text-white">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${L.dotClass}`} />
            {L.label}
          </span>
          <span className="mt-1 font-body text-xs text-tt-subtle">{L.hint}</span>
        </motion.button>
      ))}
    </div>
  );
}
