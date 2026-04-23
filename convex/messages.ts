import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { requireCurrentUser } from "./users";

export const listForRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const user = await requireCurrentUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) return [];
    if (room.ownerId !== user._id && !room.memberIds.includes(user._id)) {
      return [];
    }
    return await ctx.db
      .query("messages")
      .withIndex("by_room_created", (q) => q.eq("roomId", roomId))
      .order("asc")
      .take(500);
  },
});

const kindValidator = v.union(
  v.literal("user_message"),
  v.literal("thought"),
  v.literal("output"),
  v.literal("tool_call"),
  v.literal("tool_result"),
);

const roleValidator = v.union(
  v.literal("user"),
  v.literal("assistant"),
  v.literal("tool"),
);

export const append = internalMutation({
  args: {
    roomId: v.id("rooms"),
    authorId: v.optional(v.id("users")),
    role: roleValidator,
    kind: kindValidator,
    content: v.string(),
    toolName: v.optional(v.string()),
    toolInput: v.optional(v.any()),
    toolResult: v.optional(v.any()),
    toolUseId: v.optional(v.string()),
    turnId: v.string(),
    streaming: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const appendDelta = internalMutation({
  args: { id: v.id("messages"), delta: v.string() },
  handler: async (ctx, { id, delta }) => {
    const msg = await ctx.db.get(id);
    if (!msg) return;
    await ctx.db.patch(id, { content: msg.content + delta });
  },
});

export const markDone = internalMutation({
  args: { id: v.id("messages") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { streaming: false });
  },
});

export const sendUserMessage = mutation({
  args: { roomId: v.id("rooms"), content: v.string(), turnId: v.string() },
  handler: async (ctx, { roomId, content, turnId }) => {
    const user = await requireCurrentUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (room.ownerId !== user._id && !room.memberIds.includes(user._id)) {
      throw new Error("Forbidden");
    }
    return await ctx.db.insert("messages", {
      roomId,
      authorId: user._id,
      role: "user",
      kind: "user_message",
      content,
      turnId,
      createdAt: Date.now(),
      streaming: false,
    });
  },
});
