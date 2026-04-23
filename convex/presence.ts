import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { requireCurrentUser } from "./users";
import { PRESENCE_STALE_MS } from "./_constants";

export const listForRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const user = await requireCurrentUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) return [];
    if (room.ownerId !== user._id && !room.memberIds.includes(user._id)) {
      return [];
    }
    const cutoff = Date.now() - PRESENCE_STALE_MS;
    const rows = await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    const fresh = rows.filter((r) => r.lastSeen >= cutoff);
    return await Promise.all(
      fresh.map(async (row) => {
        const u = await ctx.db.get(row.userId);
        return {
          _id: row._id,
          userId: row.userId,
          name: u?.name ?? "Unknown",
          avatarUrl: u?.avatarUrl,
          color: row.color,
          cursor: row.cursor,
          selection: row.selection,
          lastSeen: row.lastSeen,
        };
      }),
    );
  },
});

export const heartbeat = mutation({
  args: {
    roomId: v.id("rooms"),
    cursor: v.optional(v.object({ x: v.number(), y: v.number() })),
    selection: v.optional(
      v.object({ start: v.number(), end: v.number() }),
    ),
  },
  handler: async (ctx, { roomId, cursor, selection }) => {
    const user = await requireCurrentUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (room.ownerId !== user._id && !room.memberIds.includes(user._id)) {
      throw new Error("Forbidden");
    }
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", roomId).eq("userId", user._id),
      )
      .unique();

    const patch = {
      lastSeen: Date.now(),
      cursor,
      selection,
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("presence", {
      roomId,
      userId: user._id,
      color: user.color,
      ...patch,
    });
  },
});

export const goodbye = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const user = await requireCurrentUser(ctx);
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", roomId).eq("userId", user._id),
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const sweepStale = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - PRESENCE_STALE_MS;
    const stale = await ctx.db.query("presence").collect();
    await Promise.all(
      stale
        .filter((row) => row.lastSeen < cutoff)
        .map((row) => ctx.db.delete(row._id)),
    );
  },
});
