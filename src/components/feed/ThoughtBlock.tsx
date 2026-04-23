"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { expandClip } from "@/components/motion/variants";
import { cn } from "@/lib/cn";

export function ThoughtBlock({
  content,
  streaming,
}: {
  content: string;
  streaming: boolean;
}) {
  const [open, setOpen] = useState(false);
  const teaser =
    content.split(/\n/).find((l) => l.trim().length > 0)?.slice(0, 140) ??
    "Thinking…";

  return (
    <article
      className="acid-rail pl-5 pr-3 py-3"
      data-hot={streaming ? "true" : "false"}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-baseline gap-3 w-full text-left group"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-acid-dim shrink-0">
          thought
        </span>
        <span
          className={cn(
            "text-[13px] leading-snug text-bone italic truncate",
            streaming && "streaming-caret",
          )}
        >
          {teaser || "…"}
        </span>
        <span className="ml-auto font-mono text-[10px] text-bone-2 group-hover:text-paper shrink-0">
          {open ? "hide" : "expand"}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            key="body"
            variants={expandClip}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <pre
              className={cn(
                "whitespace-pre-wrap break-words mt-3",
                "font-mono text-[12px] leading-relaxed text-bone",
                streaming && "streaming-caret",
              )}
            >
              {content}
            </pre>
          </m.div>
        )}
      </AnimatePresence>
    </article>
  );
}
