"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { expandClip } from "@/components/motion/variants";
import { cn } from "@/lib/cn";

export function ToolCallBlock({
  toolName,
  input,
  result,
  status,
}: {
  toolName: string;
  input: unknown;
  result?: unknown;
  status: "calling" | "done" | "error";
}) {
  const [open, setOpen] = useState(false);
  return (
    <article className="pl-5 pr-3 py-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full text-left flex items-center gap-3 px-3 py-2 rounded-sm",
          "border border-paper/[0.08] bg-ink/60",
          "hover:border-paper/20 transition-colors",
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            status === "calling" && "bg-acid animate-pulse",
            status === "done" && "bg-acid",
            status === "error" && "bg-blood",
          )}
        />
        <span className="font-mono text-[12px] text-paper">{toolName}</span>
        <span className="font-mono text-[10px] text-bone-2 ml-auto">
          {status === "calling" ? "calling…" : status}
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
            <div className="mt-2 space-y-2 px-3">
              <Pre label="input" value={input} />
              {result !== undefined && <Pre label="result" value={result} />}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function Pre({ label, value }: { label: string; value: unknown }) {
  let text = "";
  try {
    text =
      typeof value === "string" ? value : JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone-2 mb-1">
        {label}
      </div>
      <pre className="font-mono text-[11px] leading-relaxed text-bone whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
        {text}
      </pre>
    </div>
  );
}
