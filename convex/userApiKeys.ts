import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { requireCurrentUser } from "./users";

const providerArg = v.union(
  v.literal("groq"),
  v.literal("openai"),
  v.literal("anthropic"),
);

/** Public: list current user's configured providers (keys masked). */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const keys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return keys.map((k) => ({
      _id: k._id,
      provider: k.provider,
      maskedKey: maskKey(k.apiKey),
      updatedAt: k.updatedAt,
    }));
  },
});

/** Public: upsert a key for a provider. */
export const upsert = mutation({
  args: { provider: providerArg, apiKey: v.string() },
  handler: async (ctx, { provider, apiKey }) => {
    if (!apiKey.trim()) throw new Error("API key cannot be empty");
    const user = await requireCurrentUser(ctx);
    const existing = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", user._id).eq("provider", provider),
      )
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { apiKey: apiKey.trim(), updatedAt: now });
    } else {
      await ctx.db.insert("userApiKeys", {
        userId: user._id,
        provider,
        apiKey: apiKey.trim(),
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/** Public: remove a key for a provider. */
export const remove = mutation({
  args: { provider: providerArg },
  handler: async (ctx, { provider }) => {
    const user = await requireCurrentUser(ctx);
    const existing = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", user._id).eq("provider", provider),
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

/** Internal: return the full API key for an agent action. */
export const getForAgent = internalQuery({
  args: { userId: v.id("users"), provider: providerArg },
  handler: async (ctx, { userId, provider }) => {
    const key = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", userId).eq("provider", provider),
      )
      .unique();
    return key?.apiKey ?? null;
  },
});

function maskKey(key: string): string {
  if (key.length < 12) return "•".repeat(8);
  return key.slice(0, 6) + "••••••••••••" + key.slice(-4);
}
