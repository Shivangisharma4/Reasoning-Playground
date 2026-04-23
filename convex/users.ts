import { v } from "convex/values";
import { internalQuery, mutation, query, type QueryCtx, type MutationCtx } from "./_generated/server";
import { PRESENCE_COLORS } from "./_constants";
import type { Doc } from "./_generated/dataModel";

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

export async function requireCurrentUser(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Not authenticated");
  return user;
}

export const me = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

/** Internal helper: look up a user by Clerk subject ID. Used by agent + embeddings actions. */
export const byClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});

export const ensureUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { email, name, avatarUrl }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      if (
        existing.email !== email ||
        existing.name !== name ||
        existing.avatarUrl !== avatarUrl
      ) {
        await ctx.db.patch(existing._id, { email, name, avatarUrl });
      }
      return existing._id;
    }

    const color =
      PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)];
    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email,
      name,
      avatarUrl,
      color,
    });
  },
});
