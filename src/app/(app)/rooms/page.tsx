"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { cn } from "@/lib/cn";

export default function RoomsIndex() {
  const rooms = (useQuery(api.rooms.list) ?? []) as Array<{
    _id: string;
    name: string;
    createdAt: number;
  }>;
  const create = useMutation(api.rooms.create);
  const join = useMutation(api.rooms.joinByCode);
  const router = useRouter();

  const [createPending, setCreatePending] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinPending, setJoinPending] = useState(false);
  const [joinError, setJoinError] = useState("");

  const onCreate = async () => {
    setCreatePending(true);
    try {
      const id = await create({ name: "Untitled room" });
      router.push(`/rooms/${id}`);
    } finally {
      setCreatePending(false);
    }
  };

  const onJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoinError("");
    setJoinPending(true);
    try {
      const id = await join({ code: joinCode.trim() });
      router.push(`/rooms/${id}`);
    } catch (err: unknown) {
      setJoinError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setJoinPending(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Page title */}
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone-2 mb-3">
          your rooms
        </p>
        <h1 className="display text-[clamp(2rem,3.8vw,3rem)] leading-[0.95] text-paper">
          Pick a canvas, start fresh, or join one.
        </h1>
      </div>

      {/* Create / Join row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
        {/* Create */}
        <div className="rounded-xl border border-paper/[0.08] bg-slate p-5 flex flex-col gap-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone-2 mb-1">
              new canvas
            </p>
            <p className="text-[13px] text-bone leading-relaxed">
              Start a blank reasoning room for yourself or your team.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreate}
            disabled={createPending}
            className={cn(
              "mt-auto flex items-center justify-center gap-2",
              "bg-acid text-ink font-mono text-[10px] uppercase tracking-[0.2em]",
              "px-4 py-2.5 rounded-lg transition-colors",
              "hover:bg-acid-dim disabled:opacity-60"
            )}
          >
            <span className="text-base leading-none">+</span>
            {createPending ? "creating…" : "create room"}
          </button>
        </div>

        {/* Join */}
        <div className="rounded-xl border border-paper/[0.08] bg-slate p-5 flex flex-col gap-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone-2 mb-1">
              join a room
            </p>
            <p className="text-[13px] text-bone leading-relaxed">
              Enter a 6-character code shared by your collaborator.
            </p>
          </div>
          <form onSubmit={onJoin} className="mt-auto flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError("");
                }}
                placeholder="ABC-123"
                maxLength={7}
                className={cn(
                  "flex-1 min-w-0 bg-ink/60 border rounded-lg px-3 py-2",
                  "font-mono text-[1rem] tracking-[0.22em] text-acid placeholder:text-bone-2/50",
                  "outline-none transition-colors",
                  joinError
                    ? "border-red-500/60 focus:border-red-500"
                    : "border-paper/[0.08] focus:border-acid/50"
                )}
              />
              <button
                type="submit"
                disabled={joinPending || !joinCode.trim()}
                className={cn(
                  "shrink-0 font-mono text-[10px] uppercase tracking-[0.18em]",
                  "px-3 py-2 rounded-lg border transition-colors",
                  "border-paper/[0.12] text-bone hover:border-paper/25 hover:text-paper",
                  "disabled:opacity-50"
                )}
              >
                {joinPending ? "…" : "join →"}
              </button>
            </div>
            {joinError && (
              <p className="font-mono text-[10px] text-red-400">{joinError}</p>
            )}
          </form>
        </div>
      </div>

      {/* Existing rooms list */}
      <div className="border-t border-paper/[0.06] pt-8">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-2 mb-4">
          Recent
        </h2>
        {rooms.length === 0 ? (
          <p className="text-bone text-[14px]">
            No rooms yet — create one above.
          </p>
        ) : (
          <ul className="divide-y divide-paper/[0.06]">
            {rooms.slice(0, 12).map(
              (room: { _id: string; name: string; createdAt: number }) => (
                <li
                  key={room._id}
                  className="py-3.5 flex items-center justify-between hover:bg-paper/[0.02] px-3 -mx-3 rounded-sm cursor-pointer group"
                  onClick={() => router.push(`/rooms/${room._id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="size-1.5 rounded-full bg-bone-2/40 group-hover:bg-acid/70 transition-colors shrink-0" />
                    <span className="text-paper text-[15px] truncate">{room.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-bone-2 shrink-0 ml-4">
                    {new Date(room.createdAt).toLocaleDateString()}
                  </span>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
