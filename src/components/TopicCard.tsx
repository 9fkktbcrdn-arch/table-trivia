"use client";

import { useState } from "react";

type TopicCardVariant = "topic" | "general" | "create" | "empty" | "extra";

interface TopicCardProps {
  title: string;
  subtitle?: string;
  onClick: () => void;
  variant?: TopicCardVariant;
  disabled?: boolean;
  /** Saved topics only: HTTPS URL for a full-bleed background (JPG/PNG/WebP). */
  imageUrl?: string | null;
  completed?: boolean;
}

const ICON_ROW = "relative z-10 flex h-8 shrink-0 items-center justify-center text-xl leading-none drop-shadow-md";

export function TopicCard({ title, subtitle, onClick, variant = "topic", disabled, imageUrl, completed }: TopicCardProps) {
  const isEmpty = variant === "empty";
  const trimmedUrl = imageUrl?.trim() ?? "";
  /** URL that failed to load — hide image until the URL changes. */
  const [failedUrl, setFailedUrl] = useState("");
  const showImage =
    Boolean(trimmedUrl) && variant === "topic" && !isEmpty && failedUrl !== trimmedUrl;

  return (
    <button
      type="button"
      disabled={disabled || isEmpty}
      onClick={onClick}
      className={[
        "relative flex h-[132px] w-full flex-col overflow-hidden rounded-2xl border px-3 py-3 text-center shadow-md transition duration-150 sm:h-[144px] sm:px-4 md:h-[156px]",
        isEmpty
          ? "cursor-default border-tt-border/50 bg-tt-surface/30 text-zinc-500"
          : showImage
            ? "border-white/20 shadow-[0_10px_22px_rgba(0,0,0,0.25)] active:scale-[0.98] active:border-white/30"
            : "border-tt-border/80 bg-gradient-to-b from-tt-surface to-tt-bg/95 text-parchment hover:-translate-y-0.5 hover:border-tt-cyan/50 hover:shadow-[0_12px_24px_rgba(34,211,238,0.14)] active:scale-[0.98] active:border-tt-cyan/40",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={trimmedUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setFailedUrl(trimmedUrl)}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25"
            aria-hidden
          />
        </>
      )}
      {completed ? (
        <>
          <div className="pointer-events-none absolute inset-0 z-20 bg-emerald-950/35" />
          <div className="pointer-events-none absolute right-2 top-2 z-30 inline-flex items-center gap-1 rounded-full border border-emerald-300/50 bg-emerald-500/20 px-2 py-1 backdrop-blur-sm">
            <span className="font-stat text-sm leading-none text-emerald-200">✓</span>
            <span className="font-stat text-[10px] uppercase tracking-wide text-emerald-100/95">Done</span>
          </div>
        </>
      ) : null}

      <div className={ICON_ROW} aria-hidden>
        {variant === "general"
          ? "⭐"
          : variant === "extra"
            ? "🎓"
            : variant === "create"
              ? "✏️"
              : showImage
                ? null
                : <span className="opacity-0">·</span>}
      </div>
      <span
        className={`relative z-10 line-clamp-2 min-h-[2.75rem] font-stat text-[1.05rem] font-bold leading-snug tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-lg ${
          isEmpty ? "text-zinc-500" : "text-white"
        }`}
      >
        {title}
      </span>
      {subtitle ? (
        <span className="relative z-10 mt-auto line-clamp-1 pt-1 font-body text-xs text-zinc-300/95 drop-shadow-md sm:text-sm">
          {subtitle}
        </span>
      ) : (
        <span className="relative z-10 mt-auto h-5 shrink-0 sm:h-5" aria-hidden />
      )}
    </button>
  );
}
