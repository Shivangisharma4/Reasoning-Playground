import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
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
      .query("documents")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .order("desc")
      .collect();
  },
});

/** Internal: insert vector chunk rows + update chunkCount. */
export const insertChunks = internalMutation({
  args: {
    documentId: v.id("documents"),
    roomId: v.id("rooms"),
    chunks: v.array(v.string()),
    embeddings: v.array(v.array(v.float64())),
  },
  handler: async (ctx, { documentId, roomId, chunks, embeddings }) => {
    for (let i = 0; i < chunks.length; i++) {
      await ctx.db.insert("vector_embeddings", {
        documentId,
        roomId,
        chunk: chunks[i],
        chunkIndex: i,
        embedding: embeddings[i],
      });
    }
    await ctx.db.patch(documentId, { chunkCount: chunks.length });
  },
});

/** Internal: fetch a single vector_embeddings row. */
export const getChunk = internalQuery({
  args: { id: v.id("vector_embeddings") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/** Internal: insert a document row (called from embeddings ingest action). */
export const create = internalMutation({
  args: {
    roomId: v.id("rooms"),
    title: v.string(),
    source: v.string(),
    uploaderId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", {
      ...args,
      chunkCount: 0,
      createdAt: Date.now(),
    });
  },
});
