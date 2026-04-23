"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { m, AnimatePresence } from "framer-motion";

export function PresenceAvatars({ roomId }: { roomId: Id<"rooms"> }) {
  const present = (useQuery(api.presence.listForRoom, { roomId }) ?? []) as Array<{
    userId: string;
    name: string;
    avatarUrl?: string;
    color: string;
  }>;

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-bone-2">
        in the room
      </span>
      <div className="flex -space-x-1.5">
        <AnimatePresence mode="popLayout">
          {present.slice(0, 6).map((p) => (
            <m.div
              key={p.userId}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatarUrl}
                  alt={p.name}
                  title={p.name}
                  className="size-7 rounded-full ring-2 ring-ink object-cover"
                  style={{ boxShadow: `0 0 0 2px ${p.color}` }}
                />
              ) : (
                <div
                  title={p.name}
                  className="size-7 rounded-full ring-2 ring-ink flex items-center justify-center text-[11px] font-mono text-ink"
                  style={{ background: p.color }}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </m.div>
          ))}
        </AnimatePresence>
        {present.length > 6 && (
          <span className="text-[10px] font-mono text-bone pl-2">
            +{present.length - 6}
          </span>
        )}
      </div>
    </div>
  );
}
