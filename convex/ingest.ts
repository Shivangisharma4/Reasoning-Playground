import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";
import { EMBEDDING_MODEL } from "./_constants";

function chunkText(text: string, chunkSize = 1200, overlap = 150): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

async function embedBatch(inputs: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const client = new OpenAI({ apiKey });
  const resp = await client.embeddings.create({ model: EMBEDDING_MODEL, input: inputs });
  return resp.data.map((d) => d.embedding as number[]);
}

/** Public action: chunk + embed a text document and store in vector index. */
export const ingest = action({
  args: {
    roomId: v.id("rooms"),
    title: v.string(),
    source: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { roomId, title, source, text }): Promise<{ documentId: string; chunkCount: number }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(internal.users.byClerkId, {
      clerkId: identity.subject,
    });
    if (!user) throw new Error("User not found");

    const documentId = await ctx.runMutation(internal.documents.create, {
      roomId,
      title,
      source,
      uploaderId: user._id,
    });

    const chunks = chunkText(text);
    const embeddings = await embedBatch(chunks);

    await ctx.runMutation(internal.documents.insertChunks, {
      documentId,
      roomId,
      chunks,
      embeddings,
    });

    return { documentId, chunkCount: chunks.length };
  },
});
