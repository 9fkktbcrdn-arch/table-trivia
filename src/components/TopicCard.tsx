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

const ICON_ROW = "relative z-10 flex h-4 shrink-0 items-center justify-center text-xl leading-none sm:h-8";

export function TopicCard({ title, subtitle, onClick, variant = "topic", disabled, imageUrl, completed }: TopicCardProps) {
  const isEmpty = variant === "empty";
  const trimmedUrl = imageUrl?.trim() ?? "";
  const compactTitle = title.length > 16;
  const veryLongTitle = title.length > 24;
  const ultraLongTitle = title.length > 34;
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
        "relative flex h-[124px] w-full flex-col overflow-hidden rounded-2xl border px-3.5 py-3.5 text-center transition duration-150 sm:h-[144px] sm:px-4 sm:py-4 md:h-[156px]",
        isEmpty
          ? "cursor-default border-white/10 bg-tt-surface text-tt-faint"
          : showImage
            ? "border-[rgba(212,160,23,0.2)] active:scale-[0.98]"
            : "border-[rgba(212,160,23,0.2)] bg-tt-surface text-parchment hover:border-tt-gold active:scale-[0.98]",
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
          <div className="absolute inset-0 bg-black/35" aria-hidden />
        </>
      )}
      {completed ? (
        <>
          <div className="pointer-events-none absolute inset-0 z-20 bg-[rgba(45,184,122,0.14)]" />
          <div className="pointer-events-none absolute right-2 top-2 z-30 inline-flex items-center gap-1 rounded-full border border-[rgba(45,184,122,0.35)] bg-[rgba(45,184,122,0.18)] px-2 py-1">
            <span className="font-body text-sm leading-none text-tt-success">✓</span>
            <span className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-[#C9F2DE]">Done</span>
          </div>
        </>
      ) : null}

      <div className={ICON_ROW} aria-hidden>
        {variant === "general"
          ? "⭐"
          : variant === "extra"
            ? null
            : variant === "create"
              ? "✏️"
              : showImage
                ? null
                : <span className="opacity-0">·</span>}
      </div>
      <span
        className={`relative z-10 min-h-[2.7rem] font-stat font-bold leading-tight tracking-[-0.01em] [text-wrap:balance] sm:min-h-[3rem] ${
          ultraLongTitle
            ? "text-[0.8rem] sm:text-[0.9rem]"
            : veryLongTitle
              ? "text-[0.86rem] sm:text-[1rem]"
              : compactTitle
                ? "text-[0.92rem] sm:text-[1.06rem]"
                : "text-[1rem] sm:text-[1.14rem]"
        } ${
          isEmpty ? "text-tt-faint" : "text-white"
        }`}
        style={{ overflowWrap: "anywhere" }}
      >
        {title}
      </span>
      {subtitle ? (
        <span className="relative z-10 mt-auto line-clamp-2 min-h-[1.8rem] pt-1 font-body text-[10px] leading-snug text-tt-subtle sm:min-h-[2rem] sm:text-xs">
          {subtitle}
        </span>
      ) : (
        <span className="relative z-10 mt-auto h-4 shrink-0 sm:h-4" aria-hidden />
      )}
    </button>
  );
}
