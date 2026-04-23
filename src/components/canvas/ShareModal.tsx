"use client";

import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/cn";

interface Props {
  roomId: Id<"rooms">;
  joinCode: string | undefined;
  onClose: () => void;
}

export function ShareModal({ roomId, joinCode: initialCode, onClose }: Props) {
  const generateCode = useMutation(api.rooms.generateJoinCode);
  const [code, setCode] = useState(initialCode ?? "");
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Generate a code if the room doesn't have one yet
  useEffect(() => {
    if (!initialCode) {
      generateCode({ roomId }).then(setCode).catch(() => {});
    }
  }, [initialCode, roomId, generateCode]);

  const displayCode = code
    ? `${code.slice(0, 3)}-${code.slice(3)}`
    : "···-···";

  const roomUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/rooms/${roomId}`
      : "";

  const copyCode = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(roomUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const refreshCode = async () => {
    setRefreshing(true);
    try {
      const next = await generateCode({ roomId });
      setCode(next);
    } finally {
      setRefreshing(false);
    }
  };

  // Close on backdrop click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-sm"
    >
      <div
        className={cn(
          "relative w-full max-w-[22rem] mx-4 rounded-xl",
          "bg-slate border border-paper/[0.10]",
          "shadow-[0_24px_80px_-12px_rgba(0,0,0,0.9)]",
          "grain overflow-hidden",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-paper/[0.06]">
          <h2 className="display text-[1.1rem] text-paper leading-none">
            Share room
          </h2>
          <button
            onClick={onClose}
            className="size-6 flex items-center justify-center rounded-sm text-bone-2 hover:text-paper hover:bg-paper/[0.06] transition-colors"
          >
            <span className="text-sm leading-none">✕</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          {/* Join code */}
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone-2 block mb-2">
              Join code
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center justify-center py-3 rounded-lg border border-paper/[0.08] bg-ink/60">
                <span className="font-mono text-[1.6rem] tracking-[0.25em] text-acid font-semibold">
                  {displayCode}
                </span>
              </div>
              <button
                onClick={copyCode}
                className={cn(
                  "px-3 py-2 rounded-lg border font-mono text-[10px] uppercase tracking-[0.15em] transition-colors",
                  copiedCode
                    ? "border-acid/40 bg-acid/10 text-acid"
                    : "border-paper/[0.08] text-bone hover:border-paper/20 hover:text-paper",
                )}
              >
                {copiedCode ? "✓ copied" : "copy"}
              </button>
            </div>
            <button
              onClick={refreshCode}
              disabled={refreshing}
              className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-bone-2 hover:text-paper transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <span className={cn("inline-block", refreshing && "animate-spin")}>↺</span>
              {refreshing ? "refreshing…" : "refresh code"}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-paper/[0.06]" />
            <span className="font-mono text-[10px] text-bone-2">or</span>
            <div className="flex-1 h-px bg-paper/[0.06]" />
          </div>

          {/* Direct link */}
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone-2 block mb-2">
              Direct link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-paper/[0.08] bg-ink/60">
                <p className="font-mono text-[11px] text-bone truncate">{roomUrl}</p>
              </div>
              <button
                onClick={copyLink}
                className={cn(
                  "shrink-0 px-3 py-2 rounded-lg border font-mono text-[10px] uppercase tracking-[0.15em] transition-colors",
                  copiedLink
                    ? "border-acid/40 bg-acid/10 text-acid"
                    : "border-paper/[0.08] text-bone hover:border-paper/20 hover:text-paper",
                )}
              >
                {copiedLink ? "✓ copied" : "copy"}
              </button>
            </div>
          </div>

          {/* Note */}
          <p className="font-mono text-[10px] text-bone-2 leading-relaxed">
            Anyone with this code or link can join and collaborate in this room.
            Refresh the code to revoke access.
          </p>
        </div>
      </div>
    </div>
  );
}
