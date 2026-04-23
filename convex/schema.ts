import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const providerUnion = v.union(
  v.literal("groq"),
  v.literal("openai"),
  v.literal("anthropic"),
);

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    color: v.string(),
  }).index("by_clerkId", ["clerkId"]),

  rooms: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    memberIds: v.array(v.id("users")),
    sharedPrompt: v.string(),
    promptUpdatedAt: v.number(),
    promptUpdatedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    // Model config — optional so existing rooms are unaffected
    provider: v.optional(providerUnion),
    modelId: v.optional(v.string()),
    // Short shareable join code, e.g. "ABC123"
    joinCode: v.optional(v.string()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_member", ["memberIds"])
    .index("by_joinCode", ["joinCode"]),

  messages: defineTable({
    roomId: v.id("rooms"),
    authorId: v.optional(v.id("users")),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("tool"),
    ),
    kind: v.union(
      v.literal("user_message"),
      v.literal("thought"),
      v.literal("output"),
      v.literal("tool_call"),
      v.literal("tool_result"),
    ),
    content: v.string(),
    toolName: v.optional(v.string()),
    toolInput: v.optional(v.any()),
    toolResult: v.optional(v.any()),
    toolUseId: v.optional(v.string()),
    turnId: v.string(),
    createdAt: v.number(),
    streaming: v.boolean(),
  })
    .index("by_room_created", ["roomId", "createdAt"])
    .index("by_turn", ["turnId"]),

  presence: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    lastSeen: v.number(),
    cursor: v.optional(v.object({ x: v.number(), y: v.number() })),
    selection: v.optional(
      v.object({ start: v.number(), end: v.number() }),
    ),
    color: v.string(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_user", ["roomId", "userId"]),

  documents: defineTable({
    roomId: v.id("rooms"),
    uploaderId: v.id("users"),
    title: v.string(),
    source: v.string(),
    chunkCount: v.number(),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),

  vector_embeddings: defineTable({
    documentId: v.id("documents"),
    roomId: v.id("rooms"),
    chunk: v.string(),
    chunkIndex: v.number(),
    embedding: v.array(v.float64()),
  })
    .index("by_document", ["documentId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["roomId"],
    }),

  // Per-user API keys for each provider
  userApiKeys: defineTable({
    userId: v.id("users"),
    provider: providerUnion,
    apiKey: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_provider", ["userId", "provider"]),
});
