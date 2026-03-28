"use client";

import { motion } from "framer-motion";

type TopicCardVariant = "topic" | "general" | "create" | "empty";

interface TopicCardProps {
  title: string;
  subtitle?: string;
  onClick: () => void;
  variant?: TopicCardVariant;
  disabled?: boolean;
}

export function TopicCard({ title, subtitle, onClick, variant = "topic", disabled }: TopicCardProps) {
  const isEmpty = variant === "empty";
  return (
    <motion.button
      type="button"
      disabled={disabled || isEmpty}
      onClick={onClick}
      whileTap={isEmpty || disabled ? undefined : { scale: 0.97 }}
      className={[
        "flex min-h-[96px] flex-col items-center justify-center rounded-2xl border-2 px-3 py-4 text-center shadow-lg transition",
        isEmpty
          ? "cursor-default border-tt-border/40 bg-tt-surface/40 text-zinc-500"
          : "border-tt-cyan/50 bg-gradient-to-br from-tt-surface to-tt-bg text-parchment active:border-tt-lime/80",
        !isEmpty && !disabled && "hover:border-tt-lime/70 hover:shadow-[0_0_24px_rgba(34,211,238,0.15)]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {variant === "general" && (
        <span className="mb-1 text-2xl" aria-hidden>
          ⭐
        </span>
      )}
      {variant === "create" && (
        <span className="mb-1 text-2xl" aria-hidden>
          ✏️
        </span>
      )}
      <span className={`font-stat text-lg font-bold leading-tight sm:text-xl ${isEmpty ? "text-zinc-500" : "text-white"}`}>
        {title}
      </span>
      {subtitle ? (
        <span className="mt-1 font-body text-sm text-zinc-400">{subtitle}</span>
      ) : null}
    </motion.button>
  );
}
