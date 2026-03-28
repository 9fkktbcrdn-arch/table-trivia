"use client";

import { motion } from "framer-motion";
import type { TriviaDifficulty } from "@/lib/types";

interface DifficultySelectorProps {
  onSelect: (d: TriviaDifficulty) => void;
}

const levels: { id: TriviaDifficulty; label: string; emoji: string; hint: string }[] = [
  { id: "noob", label: "Noob", emoji: "🟢", hint: "Easy — great for younger players" },
  { id: "normal", label: "Normal", emoji: "🟡", hint: "Medium — family friendly" },
  { id: "grandmaster", label: "Grand Master", emoji: "🔴", hint: "Hard — for superfans" },
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
          className="flex min-h-[72px] flex-col items-start justify-center rounded-2xl border-2 border-tt-border bg-tt-surface/95 px-5 py-4 text-left shadow-md transition hover:border-tt-magenta/60 hover:shadow-[0_0_24px_rgba(232,121,249,0.12)] active:scale-[0.99]"
        >
          <span className="font-stat text-xl font-bold text-white">
            {L.emoji} {L.label}
          </span>
          <span className="mt-0.5 font-body text-sm text-zinc-400">{L.hint}</span>
        </motion.button>
      ))}
    </div>
  );
}
