"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  addTopic,
  deleteTopic,
  getTopics,
  reorderTopics,
  updateTopic,
} from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { TopicRow } from "@/lib/types";

export default function SettingsPage() {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setTopics(await getTopics());
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await getTopics();
      if (!cancelled) {
        setTopics(rows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const supabaseOk = isSupabaseConfigured();

  const persistOrder = async (rows: TopicRow[]) => {
    setTopics(rows);
    await reorderTopics(rows.map((r) => r.id));
    await load();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= topics.length) return;
    const next = [...topics];
    [next[index], next[j]] = [next[j], next[index]];
    await persistOrder(next);
  };

  const onRename = async (id: string, name: string) => {
    setSaving(true);
    await updateTopic(id, name);
    await load();
    setSaving(false);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this topic?")) return;
    setSaving(true);
    await deleteTopic(id);
    await load();
    setSaving(false);
  };

  const onAdd = async () => {
    const n = newName.trim();
    if (!n) return;
    setSaving(true);
    await addTopic(n);
    setNewName("");
    await load();
    setSaving(false);
  };

  if (!supabaseOk) {
    return (
      <div className="tt-screen flex min-h-dvh flex-col bg-tt-bg px-4 py-8 sm:px-6">
        <Link href="/" className="tt-btn-ghost mb-6 inline-flex min-h-[48px] w-fit items-center px-2">
          ← Back
        </Link>
        <p className="font-body text-lg text-amber-200/90">
          Configure <code className="text-tt-cyan">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-tt-cyan">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to manage saved topics.
        </p>
      </div>
    );
  }

  return (
    <div className="tt-screen flex min-h-dvh flex-col bg-tt-bg px-4 pb-10 pt-6 sm:px-6">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/" className="tt-btn-ghost min-h-[48px] min-w-[48px] px-2">
          ←
        </Link>
        <div>
          <h1 className="font-stat text-2xl font-bold text-white">Topic Manager</h1>
          <p className="font-body text-sm text-zinc-500">Saved on Supabase for every device.</p>
        </div>
      </header>

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {topics.map((t, i) => (
            <motion.li
              key={t.id}
              layout
              className="flex flex-col gap-2 rounded-2xl border border-tt-border bg-tt-surface/90 p-3 sm:flex-row sm:items-center"
            >
              <input
                defaultValue={t.name}
                disabled={saving}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== t.name) void onRename(t.id, v);
                }}
                className="min-h-[48px] flex-1 rounded-xl border border-tt-border bg-tt-bg px-3 font-body text-lg text-white outline-none focus:border-tt-cyan/60"
              />
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="tt-btn-ghost min-h-[48px] min-w-[48px] px-0"
                  aria-label="Move up"
                  disabled={i === 0 || saving}
                  onClick={() => void move(i, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="tt-btn-ghost min-h-[48px] min-w-[48px] px-0"
                  aria-label="Move down"
                  disabled={i === topics.length - 1 || saving}
                  onClick={() => void move(i, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="min-h-[48px] rounded-xl border border-tt-rose/50 px-3 font-stat text-sm text-tt-rose disabled:opacity-50"
                  disabled={saving}
                  onClick={() => void onDelete(t.id)}
                >
                  Delete
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      <div className="mt-6 rounded-2xl border border-dashed border-tt-border/80 bg-tt-bg/80 p-4">
        <p className="font-stat text-sm font-semibold text-tt-cyan/90">Add topic</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            className="min-h-[48px] flex-1 rounded-xl border border-tt-border bg-tt-surface px-3 font-body text-lg text-white outline-none focus:border-tt-cyan/60"
            placeholder="e.g. How to Train Your Dragon"
            value={newName}
            disabled={saving}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void onAdd()}
          />
          <button type="button" className="tt-btn-primary min-h-[48px] px-6" disabled={saving} onClick={() => void onAdd()}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
