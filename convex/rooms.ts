import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./users";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** 6-char alphanumeric join code, no ambiguous chars (0/O, 1/I/l). */
function makeJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const owned = await ctx.db
      .query("rooms")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
    const all = await ctx.db.query("rooms").collect();
    const member = all.filter(
      (r) => r.memberIds.includes(user._id) && r.ownerId !== user._id,
    );
    return [...owned, ...member].sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const user = await requireCurrentUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) return null;
    if (room.ownerId !== user._id && !room.memberIds.includes(user._id))
      return null;
    return room;
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const user = await requireCurrentUser(ctx);
    return await ctx.db.insert("rooms", {
      name: name.trim() || "Untitled room",
      ownerId: user._id,
      memberIds: [user._id],
      sharedPrompt: "",
      promptUpdatedAt: Date.now(),
      promptUpdatedBy: user._id,
      createdAt: Date.now(),
      joinCode: makeJoinCode(),
    });
  },
});

/** Any member can rename (collaborative by default). */
export const rename = mutation({
  args: { roomId: v.id("rooms"), name: v.string() },
  handler: async (ctx, { roomId, name }) => {
    const user = await requireCurrentUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (room.ownerId !== user._id && !room.memberIds.includes(user._id))
      throw new Error("Forbidden");
    await ctx.db.patch(roomId, { name: name.trim() || "Untitled room" });
  },
});

/** Generate (or refresh) the join code for a room. Owner or any member. */
export const generateJoinCode = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const user = await requireCurrentUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (room.ownerId !== user._id && !room.memberIds.includes(user._id))
      throw new Error("Forbidden");
    const code = makeJoinCode();
    await ctx.db.patch(roomId, { joinCode: code });
    return code;
  },
});

/** Join a room by its 6-char join code. Adds the current user as a member. */
export const joinByCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const user = await requireCurrentUser(ctx);
    const normalised = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_joinCode", (q) => q.eq("joinCode", normalised))
      .unique();
    if (!room) throw new Error("Invalid join code — double-check and try again.");
    if (!room.memberIds.includes(user._id)) {
      await ctx.db.patch(room._id, {
        memberIds: [...room.memberIds, user._id],
      });
    }
    return room._id;
  },
});

/** Set the AI model config for a room (any member can change it). */
export const setModel = mutation({
  args: {
    roomId: v.id("rooms"),
    provider: v.union(
      v.literal("groq"),
      v.literal("openai"),
      v.literal("anthropic"),
    ),
    modelId: v.string(),
  },
  handler: async (ctx, { roomId, provider, modelId }) => {
    const user = await requireCurrentUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (room.ownerId !== user._id && !room.memberIds.includes(user._id))
      throw new Error("Forbidden");
    await ctx.db.patch(roomId, { provider, modelId });
  },
});

/** Internal: fetch room row without auth (for agent actions). */
export const getForAgent = internalQuery({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => ctx.db.get(roomId),
});

export const invite = mutation({
  args: { roomId: v.id("rooms"), clerkId: v.string() },
  handler: async (ctx, { roomId, clerkId }) => {
    const owner = await requireCurrentUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room || room.ownerId !== owner._id) throw new Error("Forbidden");
    const invitee = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
    if (!invitee) throw new Error("User not found");
    if (room.memberIds.includes(invitee._id)) return;
    await ctx.db.patch(roomId, {
      memberIds: [...room.memberIds, invitee._id],
    });
  },
});
