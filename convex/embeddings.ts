import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { EMBEDDING_MODEL } from "./_constants";
import OpenAI from "openai";

async function embedBatch(inputs: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const client = new OpenAI({ apiKey });
  const resp = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: inputs,
  });
  return resp.data.map((d) => d.embedding as number[]);
}

export const embedStrings = internalAction({
  args: { inputs: v.array(v.string()) },
  handler: async (_ctx, { inputs }) => {
    if (inputs.length === 0) return [];
    return await embedBatch(inputs);
  },
});

export const search = internalAction({
  args: { roomId: v.id("rooms"), query: v.string(), k: v.number() },
  handler: async (ctx, { roomId, query, k }): Promise<{ chunk: string; score: number }[]> => {
    const [embedding] = await embedBatch([query]);
    const results = await ctx.vectorSearch("vector_embeddings", "by_embedding", {
      vector: embedding,
      limit: k,
      filter: (q) => q.eq("roomId", roomId),
    });
    const chunks = await Promise.all(
      results.map((r) =>
        ctx.runQuery(internal.documents.getChunk, { id: r._id }) as Promise<{ chunk: string; chunkIndex: number } | null>,
      ),
    );
    return chunks
      .map((c: { chunk: string } | null, i: number) =>
        c ? { chunk: c.chunk, score: results[i]._score } : null,
      )
      .filter((x): x is { chunk: string; score: number } => x !== null);
  },
});

