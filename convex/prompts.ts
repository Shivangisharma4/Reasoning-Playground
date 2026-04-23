import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireCurrentUser } from "./users";

export const update = mutation({
  args: {
    roomId: v.id("rooms"),
    prompt: v.string(),
    clientTs: v.number(),
  },
  handler: async (ctx, { roomId, prompt, clientTs }) => {
    const user = await requireCurrentUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (room.ownerId !== user._id && !room.memberIds.includes(user._id)) {
      throw new Error("Forbidden");
    }
    // Drop writes that are meaningfully older than the current state.
    if (clientTs < room.promptUpdatedAt - 2_000) return;
    await ctx.db.patch(roomId, {
      sharedPrompt: prompt,
      promptUpdatedAt: Date.now(),
      promptUpdatedBy: user._id,
    });
  },
});
