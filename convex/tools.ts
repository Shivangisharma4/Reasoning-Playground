import { z } from "zod";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

type ToolContext = { roomId: Id<"rooms"> };

export type ToolDefinition<TSchema extends z.ZodTypeAny = z.ZodTypeAny> = {
  name: string;
  description: string;
  schema: TSchema;
  execute: (
    ctx: ActionCtx,
    args: z.infer<TSchema>,
    toolCtx: ToolContext,
  ) => Promise<unknown>;
};

const searchDocsSchema = z.object({
  query: z.string().min(1).describe("Natural-language query."),
  k: z.number().int().min(1).max(10).default(5),
});

const searchDocs: ToolDefinition<typeof searchDocsSchema> = {
  name: "search_docs",
  description:
    "Search the room's uploaded documents via vector similarity. Returns the most relevant chunks.",
  schema: searchDocsSchema,
  execute: async (ctx, args, { roomId }) => {
    return await ctx.runAction(internal.embeddings.search, {
      roomId,
      query: args.query,
      k: args.k ?? 5,
    });
  },
};

const fetchUrlSchema = z.object({ url: z.string().url() });

const fetchUrl: ToolDefinition<typeof fetchUrlSchema> = {
  name: "fetch_url",
  description:
    "Fetch a public URL and return a plain-text rendering (HTML tags stripped, truncated).",
  schema: fetchUrlSchema,
  execute: async (_ctx, args) => {
    const res = await fetch(args.url, {
      headers: { "user-agent": "reasoning-playground/1.0" },
    });
    if (!res.ok) {
      return { ok: false, status: res.status, body: "" };
    }
    const raw = await res.text();
    const stripped = raw
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return { ok: true, status: res.status, body: stripped.slice(0, 8_000) };
  },
};

const runCodeSchema = z.object({
  code: z.string(),
  language: z.enum(["js", "ts"]).default("js"),
});

const runCode: ToolDefinition<typeof runCodeSchema> = {
  name: "run_code",
  description:
    "Execute a short snippet of JavaScript and return stdout. Disabled in this deployment: returns a stub.",
  schema: runCodeSchema,
  execute: async (_ctx, _args) => {
    return {
      ok: false,
      sandbox: "unavailable",
      message:
        "Code execution is sandboxed out in this deployment. Wire an E2B or Deno sandbox to enable.",
    };
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toolRegistry: Record<string, ToolDefinition<any>> = {
  [searchDocs.name]: searchDocs,
  [fetchUrl.name]: fetchUrl,
  [runCode.name]: runCode,
};

/** Convert a Zod schema to a JSON Schema object that Anthropic accepts. */
export function zodToInputSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const def = (schema as unknown as { _def: { typeName?: string } })._def;
  const t = def?.typeName;

  if (t === "ZodObject") {
    const shape = (schema as unknown as z.ZodObject<z.ZodRawShape>).shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [key, sub] of Object.entries(shape)) {
      const subDef = (sub as unknown as { _def: { typeName?: string } })._def;
      properties[key] = zodToInputSchema(sub as z.ZodTypeAny);
      if (subDef.typeName !== "ZodOptional" && subDef.typeName !== "ZodDefault") {
        required.push(key);
      }
    }
    return { type: "object", properties, required };
  }
  if (t === "ZodString") {
    const checks = (def as { checks?: Array<{ kind: string }> }).checks ?? [];
    if (checks.some((c) => c.kind === "url"))
      return { type: "string", format: "uri" };
    return { type: "string" };
  }
  if (t === "ZodNumber") return { type: "number" };
  if (t === "ZodEnum") {
    const values = (def as { values: string[] }).values;
    return { type: "string", enum: values };
  }
  if (t === "ZodDefault") {
    const inner = (def as { innerType: z.ZodTypeAny }).innerType;
    const base = zodToInputSchema(inner);
    return {
      ...base,
      default: (def as { defaultValue: () => unknown }).defaultValue(),
    };
  }
  if (t === "ZodOptional") {
    const inner = (def as { innerType: z.ZodTypeAny }).innerType;
    return zodToInputSchema(inner);
  }
  return {};
}

export function anthropicTools() {
  return Object.values(toolRegistry).map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: zodToInputSchema(t.schema),
  }));
}

/** OpenAI / Groq-compatible tool definitions. */
export function groqTools() {
  return Object.values(toolRegistry).map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: zodToInputSchema(t.schema),
    },
  }));
}
