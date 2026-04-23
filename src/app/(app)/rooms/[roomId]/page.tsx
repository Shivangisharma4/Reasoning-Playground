"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { SharedPromptBlock } from "@/components/canvas/SharedPromptBlock";
import { AgentReasoningFeed } from "@/components/canvas/AgentReasoningFeed";
import { PresenceAvatars } from "@/components/canvas/PresenceAvatars";
import { ShareModal } from "@/components/canvas/ShareModal";
import { PROVIDERS, type Provider } from "@/lib/models";
import { cn } from "@/lib/cn";

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId: raw } = use(params);
  const roomId = raw as Id<"rooms">;
  const room = useQuery(api.rooms.get, { roomId });
  const rename = useMutation(api.rooms.rename);

  // Inline name editing
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Share modal
  const [shareOpen, setShareOpen] = useState(false);

  // Focus input when edit mode activates
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const startEdit = () => {
    setDraftName(room?.name ?? "");
    setEditing(true);
  };

  const commitEdit = async () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === room?.name) {
      setEditing(false);
      return;
    }
    setSavingName(true);
    try {
      await rename({ roomId, name: trimmed });
    } finally {
      setSavingName(false);
      setEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditing(false);
  };

  if (room === undefined) {
    return (
      <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-bone-2 py-8">
        loading room…
      </div>
    );
  }
  if (room === null) {
    return (
      <div className="py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-bone-2 hover:text-acid transition-colors mb-6"
        >
          ← home
        </Link>
        <p className="display text-2xl mb-3">Room not found.</p>
        <p className="text-bone">
          It may have been deleted or you don&apos;t have access.
        </p>
      </div>
    );
  }

  const provider = (room.provider as Provider) ?? "groq";
  const modelId = room.modelId ?? PROVIDERS[provider]?.models[0]?.id ?? "";
  const providerInfo = PROVIDERS[provider];
  const modelInfo = providerInfo?.models.find((m) => m.id === modelId);

  return (
    <>
      <div className="flex flex-col gap-8 max-w-[68rem]">
        <header className="flex items-start justify-between gap-4 border-b border-paper/[0.06] pb-4">
          <div className="flex flex-col gap-1.5 min-w-0">
            {/* Back to landing */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-bone-2 hover:text-acid transition-colors w-fit"
            >
              ← home
            </Link>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone-2">
              room
            </p>

            {/* Editable room name */}
            {editing ? (
              <input
                ref={inputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                disabled={savingName}
                className={cn(
                  "display text-[clamp(2rem,3.5vw,3rem)] leading-[0.95] text-paper bg-transparent",
                  "border-b border-acid/60 outline-none w-full max-w-[24rem]",
                  "placeholder:text-bone-2 disabled:opacity-50"
                )}
              />
            ) : (
              <button
                type="button"
                onClick={startEdit}
                title="Click to rename"
                className="group flex items-center gap-2 text-left"
              >
                <h1 className="display text-[clamp(2rem,3.5vw,3rem)] leading-[0.95] text-paper group-hover:text-paper/80 transition-colors truncate max-w-[24rem]">
                  {room.name}
                </h1>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[9px] uppercase tracking-[0.2em] text-bone-2 mt-1">
                  edit
                </span>
              </button>
            )}

            {/* Model badge */}
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] px-2 py-0.5 rounded-full border border-acid/20 bg-acid/5 text-acid">
                <span className="size-1 rounded-full bg-acid shadow-[0_0_5px_var(--acid)]" />
                {providerInfo?.label} · {modelInfo?.label ?? modelId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-5">
            {/* Share button */}
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className={cn(
                "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em]",
                "px-3 py-1.5 rounded-md border border-paper/[0.12] text-bone",
                "hover:border-paper/25 hover:text-paper transition-colors"
              )}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                <circle cx="9.5" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
                <circle cx="2.5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.1" />
                <circle cx="9.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
                <line x1="3.8" y1="5.3" x2="8.2" y2="3.2" stroke="currentColor" strokeWidth="1.1" />
                <line x1="3.8" y1="6.7" x2="8.2" y2="8.8" stroke="currentColor" strokeWidth="1.1" />
              </svg>
              share
            </button>
            <PresenceAvatars roomId={roomId} />
          </div>
        </header>

        <SharedPromptBlock roomId={roomId} />
        <AgentReasoningFeed roomId={roomId} />
      </div>

      {shareOpen && (
        <ShareModal
          roomId={roomId}
          joinCode={room.joinCode}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
