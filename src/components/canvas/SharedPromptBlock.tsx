"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { debounce } from "@/lib/debounce";
import { usePresence } from "@/hooks/usePresence";
import { cn } from "@/lib/cn";

export function SharedPromptBlock({ roomId }: { roomId: Id<"rooms"> }) {
  const room = useQuery(api.rooms.get, { roomId });
  const update = useMutation(api.prompts.update);
  const sendMsg = useMutation(api.messages.sendUserMessage);
  const generate = useAction(api.agent.generate);
  const { setSelection } = usePresence(roomId);

  const [local, setLocal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const typingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync remote → local when we're not actively typing.
  useEffect(() => {
    if (room && !typingRef.current) {
      setLocal(room.sharedPrompt);
    }
  }, [room?.sharedPrompt, room]);

  const debouncedPush = useMemo(
    () =>
      debounce((value: string) => {
        update({ roomId, prompt: value, clientTs: Date.now() }).catch(
          () => {},
        );
      }, 180),
    [roomId, update],
  );

  const submit = async () => {
    if (!local.trim() || submitting) return;
    setSubmitting(true);
    const turnId = crypto.randomUUID();
    try {
      await sendMsg({ roomId, content: local, turnId });
      generate({ roomId, userPrompt: local }).catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = local.length;

  return (
    <section className="relative">
      <header className="flex items-baseline justify-between mb-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-2">
          Shared prompt
        </h2>
        <div className="flex items-center gap-3 font-mono text-[10px] text-bone-2">
          <span>{charCount} chars</span>
          <span
            className={cn(
              "inline-flex items-center gap-1",
              room?.promptUpdatedBy ? "text-bone" : "",
            )}
          >
            <span className="size-1 rounded-full bg-acid" />
            live
          </span>
        </div>
      </header>

      <div
        className={cn(
          "relative rounded-lg border border-paper/[0.08] bg-slate/60 backdrop-blur",
          "focus-within:border-acid/60 focus-within:shadow-[0_0_0_1px_color-mix(in_srgb,var(--acid)_40%,transparent)]",
          "transition-colors",
        )}
      >
        <textarea
          ref={textareaRef}
          value={local}
          onChange={(e) => {
            typingRef.current = true;
            const next = e.target.value;
            setLocal(next);
            debouncedPush(next);
          }}
          onBlur={() => {
            typingRef.current = false;
          }}
          onSelect={() => {
            const el = textareaRef.current;
            if (!el) return;
            setSelection({
              start: el.selectionStart,
              end: el.selectionEnd,
            });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Write a prompt together. Press ⌘⏎ to send it to the agent."
          rows={5}
          className={cn(
            "block w-full resize-y px-5 py-4 bg-transparent text-[16px] leading-relaxed",
            "text-paper placeholder:text-bone-2 focus:outline-none",
            "font-body",
          )}
        />

        <div className="flex items-center justify-between px-4 py-2 border-t border-paper/[0.06]">
          <div className="flex items-center gap-2 text-[11px] font-mono text-bone-2">
            <kbd className="rounded-sm border border-paper/10 px-1.5 py-0.5 text-paper">
              ⌘⏎
            </kbd>
            to dispatch
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !local.trim()}
            className={cn(
              "group flex items-center gap-2 px-3.5 py-1.5 rounded-md",
              "border border-acid/60 bg-acid/10 text-acid",
              "hover:bg-acid hover:text-ink transition-colors duration-200",
              "disabled:opacity-40 disabled:hover:bg-acid/10 disabled:hover:text-acid",
            )}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
              {submitting ? "dispatching" : "run agent"}
            </span>
            <span className="text-base leading-none">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
