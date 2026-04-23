"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/cn";
import { UserMenu } from "@/components/auth/UserMenu";

export function RoomsSidebar() {
  const rooms = (useQuery(api.rooms.list) ?? []) as Array<{
    _id: string;
    name: string;
    createdAt: number;
  }>;
  const create = useMutation(api.rooms.create);
  const params = useParams<{ roomId?: string }>();
  const activeId = params?.roomId;
  const [pending, setPending] = useState(false);

  return (
    <aside className="sticky top-0 flex h-dvh flex-col border-r border-paper/[0.06] bg-ink/70 backdrop-blur-md">
      <div className="px-5 pt-6 pb-4 border-b border-paper/[0.06]">
        <div className="flex items-baseline gap-2">
          <span className="display text-paper text-[1.55rem] leading-none">
            reasoning
          </span>
          <span className="size-1.5 rounded-full bg-acid shadow-[0_0_10px_var(--acid)]" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-2 mt-2">
          // playground
        </p>
      </div>

      <div className="px-3 pt-4 pb-2">
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            try {
              await create({ name: "Untitled room" });
            } finally {
              setPending(false);
            }
          }}
          className={cn(
            "group w-full flex items-center justify-between gap-2 px-3 py-2.5",
            "border border-paper/[0.08] rounded-md text-left",
            "hover:border-acid/60 hover:bg-acid/5 transition-colors duration-200",
            "disabled:opacity-50",
          )}
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper group-hover:text-acid">
            New room
          </span>
          <span className="text-acid font-mono text-base leading-none">+</span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {rooms.length === 0 ? (
          <p className="px-3 py-6 font-mono text-[11px] leading-relaxed text-bone-2">
            No rooms yet. Spin one up ↑
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {rooms.map((room: { _id: string; name: string; createdAt: number }) => {
              const isActive = activeId === room._id;
              return (
                <li key={room._id}>
                  <Link
                    href={`/rooms/${room._id}`}
                    className={cn(
                      "block px-3 py-2 rounded-sm transition-colors duration-150",
                      "border-l-2",
                      isActive
                        ? "border-acid bg-paper/[0.04] text-paper"
                        : "border-transparent text-bone hover:text-paper hover:bg-paper/[0.02]",
                    )}
                  >
                    <div className="text-[14px] leading-tight truncate">
                      {room.name}
                    </div>
                    <div className="font-mono text-[10px] text-bone-2 mt-0.5">
                      {formatRelative(room.createdAt)}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* Settings link */}
      <div className="px-3 pb-2">
        <Link
          href="/settings"
          className={cn(
            "flex items-center justify-between gap-2 px-3 py-2.5 rounded-md",
            "border border-paper/[0.06] hover:border-acid/30 hover:bg-acid/5",
            "transition-colors duration-200 group",
          )}
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-bone group-hover:text-acid transition-colors">
            API Keys
          </span>
          <span className="text-bone-2 group-hover:text-acid transition-colors font-mono text-xs">⚙</span>
        </Link>
      </div>

      <div className="border-t border-paper/[0.06] p-3">
        <UserMenu />
      </div>
    </aside>
  );
}

function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
