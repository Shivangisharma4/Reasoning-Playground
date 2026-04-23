"use client";

import { cn } from "@/lib/cn";

export function OutputBlock({
  content,
  streaming,
}: {
  content: string;
  streaming: boolean;
}) {
  return (
    <article className="relative pl-6 pr-3 py-4">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-paper">
          output
        </span>
        {streaming && (
          <span className="font-mono text-[10px] text-acid">
            · streaming
          </span>
        )}
      </div>
      <div
        className={cn(
          "prose-invert max-w-none text-[15.5px] leading-[1.7] text-paper",
          "font-body",
          streaming && "streaming-caret",
        )}
      >
        {content.split(/\n\n+/).map((para, i) => (
          <p key={i} className="mb-3 last:mb-0 whitespace-pre-wrap">
            {para}
          </p>
        ))}
      </div>
    </article>
  );
}
