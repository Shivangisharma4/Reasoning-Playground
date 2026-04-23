import { v } from "convex/values";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { groqTools, anthropicTools, toolRegistry } from "./tools";
import { MAX_AGENT_STEPS, MODEL_ID, OUTPUT_MAX_TOKENS } from "./_constants";

type Provider = "groq" | "openai" | "anthropic";

// ─── OpenAI-compatible message types ─────────────────────────────────────────
type OAIMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: OAIToolCall[] }
  | { role: "tool"; content: string; tool_call_id: string };

type OAIToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

// ─── Anthropic message types ──────────────────────────────────────────────────
type AnthropicTextContent = { type: "text"; text: string };
type AnthropicToolUse = { type: "tool_use"; id: string; name: string; input: unknown };
type AnthropicToolResult = { type: "tool_result"; tool_use_id: string; content: string };

type AnthropicMessage =
  | { role: "user"; content: string | AnthropicToolResult[] }
  | { role: "assistant"; content: string | (AnthropicTextContent | AnthropicToolUse)[] };

// ─── Main action ──────────────────────────────────────────────────────────────
export const generate = action({
  args: { roomId: v.id("rooms"), userPrompt: v.string() },
  handler: async (ctx, { roomId, userPrompt }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(internal.users.byClerkId, {
      clerkId: identity.subject,
    });
    if (!user) throw new Error("User not found");

    // Room model config
    const room = await ctx.runQuery(internal.rooms.getForAgent, { roomId });
    const provider: Provider = (room?.provider as Provider) ?? "groq";
    const modelId: string = room?.modelId ?? MODEL_ID;

    // Resolve API key: user's stored key → env var fallback
    const userKey = (await ctx.runQuery(internal.userApiKeys.getForAgent, {
      userId: user._id,
      provider,
    })) as string | null;

    let apiKey: string;
    if (provider === "groq") {
      apiKey = userKey ?? process.env.GROQ_API_KEY ?? "";
      if (!apiKey) throw new Error("No Groq API key. Add one in Settings → API Keys.");
    } else if (provider === "openai") {
      apiKey = userKey ?? process.env.OPENAI_API_KEY ?? "";
      if (!apiKey) throw new Error("No OpenAI API key. Add one in Settings → API Keys.");
    } else {
      apiKey = userKey ?? process.env.ANTHROPIC_API_KEY ?? "";
      if (!apiKey) throw new Error("No Anthropic API key. Add one in Settings → API Keys.");
    }

    const turnId = crypto.randomUUID();

    // RAG preamble
    const rag: { chunk: string; score: number }[] = await ctx
      .runAction(internal.embeddings.search, { roomId, query: userPrompt, k: 5 })
      .catch(() => []);

    const ragPreamble = rag.length
      ? `Here are relevant snippets from the room's knowledge base:\n\n${rag.map((r, i) => `[${i + 1}] ${r.chunk}`).join("\n\n")}`
      : "No knowledge base attached to this room.";

    const systemPrompt = [
      "You are a collaborative reasoning partner embedded in a shared canvas.",
      "Multiple people can see your thoughts and tool calls in real time.",
      "When reasoning through a problem, wrap your internal thinking in <think>...</think> tags.",
      "After </think>, give your final answer directly.",
      "Be precise, concise, and cite tool results when relevant.",
      "",
      ragPreamble,
    ].join("\n");

    if (provider === "anthropic") {
      const client = new Anthropic({ apiKey });
      await runAnthropicAgent(ctx, { client, modelId, systemPrompt, userPrompt, roomId, turnId });
    } else {
      const baseURL =
        provider === "groq" ? "https://api.groq.com/openai/v1" : undefined;
      const client = new OpenAI({ apiKey, baseURL });
      await runOpenAICompatibleAgent(ctx, { client, modelId, systemPrompt, userPrompt, roomId, turnId });
    }
  },
});

// ─── OpenAI-compatible agent (Groq + OpenAI) ─────────────────────────────────

async function runOpenAICompatibleAgent(
  ctx: ActionCtx,
  opts: {
    client: OpenAI;
    modelId: string;
    systemPrompt: string;
    userPrompt: string;
    roomId: Id<"rooms">;
    turnId: string;
  },
) {
  const { client, modelId, systemPrompt, userPrompt, roomId, turnId } = opts;

  const messages: OAIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  for (let step = 0; step < MAX_AGENT_STEPS; step++) {
    let outputMsgId: Id<"messages"> | null = null;
    let thoughtMsgId: Id<"messages"> | null = null;
    let outputBuffer = "";
    let thoughtBuffer = "";
    let lastFlush = Date.now();
    let inThinkBlock = false;
    let pendingText = "";

    const flush = async () => {
      if (thoughtBuffer && thoughtMsgId) {
        await ctx.runMutation(internal.messages.appendDelta, { id: thoughtMsgId, delta: thoughtBuffer });
        thoughtBuffer = "";
      }
      if (outputBuffer && outputMsgId) {
        await ctx.runMutation(internal.messages.appendDelta, { id: outputMsgId, delta: outputBuffer });
        outputBuffer = "";
      }
      lastFlush = Date.now();
    };

    const processText = async (text: string) => {
      pendingText += text;

      while (pendingText.length > 0) {
        if (inThinkBlock) {
          const closeIdx = pendingText.indexOf("</think>");
          if (closeIdx === -1) {
            const partial = partialSuffix(pendingText, "</think>");
            if (partial > 0) {
              thoughtBuffer += pendingText.slice(0, pendingText.length - partial);
              pendingText = pendingText.slice(pendingText.length - partial);
              break;
            }
            thoughtBuffer += pendingText;
            pendingText = "";
          } else {
            thoughtBuffer += pendingText.slice(0, closeIdx);
            pendingText = pendingText.slice(closeIdx + "</think>".length);
            inThinkBlock = false;
            if (thoughtMsgId) {
              await flush();
              await ctx.runMutation(internal.messages.markDone, { id: thoughtMsgId });
              thoughtMsgId = null;
            }
          }
        } else {
          const openIdx = pendingText.indexOf("<think>");
          if (openIdx === -1) {
            const partial = partialSuffix(pendingText, "<think>");
            if (partial > 0) {
              if (!outputMsgId) {
                outputMsgId = await ctx.runMutation(internal.messages.append, {
                  roomId, role: "assistant", kind: "output", content: "", turnId, streaming: true,
                });
              }
              outputBuffer += pendingText.slice(0, pendingText.length - partial);
              pendingText = pendingText.slice(pendingText.length - partial);
              break;
            }
            if (pendingText.length > 0) {
              if (!outputMsgId) {
                outputMsgId = await ctx.runMutation(internal.messages.append, {
                  roomId, role: "assistant", kind: "output", content: "", turnId, streaming: true,
                });
              }
              outputBuffer += pendingText;
            }
            pendingText = "";
          } else {
            const before = pendingText.slice(0, openIdx);
            if (before) {
              if (!outputMsgId) {
                outputMsgId = await ctx.runMutation(internal.messages.append, {
                  roomId, role: "assistant", kind: "output", content: "", turnId, streaming: true,
                });
              }
              outputBuffer += before;
              await flush();
            }
            pendingText = pendingText.slice(openIdx + "<think>".length);
            inThinkBlock = true;
            if (!thoughtMsgId) {
              thoughtMsgId = await ctx.runMutation(internal.messages.append, {
                roomId, role: "assistant", kind: "thought", content: "", turnId, streaming: true,
              });
            }
          }
        }
      }
      if (Date.now() - lastFlush > 90) await flush();
    };

    const toolCallAccumulator = new Map<number, { id: string; name: string; argumentsRaw: string }>();

    const stream = await client.chat.completions.create({
      model: modelId,
      max_tokens: OUTPUT_MAX_TOKENS,
      stream: true,
      tools: groqTools(),
      tool_choice: "auto",
      messages: messages as Parameters<typeof client.chat.completions.create>[0]["messages"],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;
      if (delta.content) await processText(delta.content);
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index;
          if (!toolCallAccumulator.has(idx)) {
            toolCallAccumulator.set(idx, { id: tc.id ?? "", name: tc.function?.name ?? "", argumentsRaw: "" });
          }
          const acc = toolCallAccumulator.get(idx)!;
          if (tc.id) acc.id = tc.id;
          if (tc.function?.name) acc.name = tc.function.name;
          if (tc.function?.arguments) acc.argumentsRaw += tc.function.arguments;
        }
      }
    }

    await flush();

    if (thoughtMsgId) {
      await ctx.runMutation(internal.messages.markDone, { id: thoughtMsgId });
      thoughtMsgId = null;
    }
    if (outputMsgId) {
      await ctx.runMutation(internal.messages.markDone, { id: outputMsgId });
    }

    const toolCalls = Array.from(toolCallAccumulator.values());
    if (toolCalls.length === 0) return;

    messages.push({
      role: "assistant",
      content: null,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id, type: "function" as const,
        function: { name: tc.name, arguments: tc.argumentsRaw },
      })),
    });

    for (const tc of toolCalls) {
      let parsedInput: unknown;
      try { parsedInput = JSON.parse(tc.argumentsRaw || "{}"); } catch { parsedInput = {}; }

      await ctx.runMutation(internal.messages.append, {
        roomId, role: "assistant", kind: "tool_call", content: "",
        toolName: tc.name, toolInput: parsedInput, toolUseId: tc.id, turnId, streaming: false,
      });

      const tool = toolRegistry[tc.name];
      let result: unknown;
      try {
        const validated = tool ? tool.schema.parse(parsedInput) : parsedInput;
        result = tool ? await tool.execute(ctx, validated, { roomId }) : { error: `Unknown tool: ${tc.name}` };
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err) };
      }

      const resultStr = JSON.stringify(result);
      await ctx.runMutation(internal.messages.append, {
        roomId, role: "tool", kind: "tool_result", content: resultStr,
        toolName: tc.name, toolResult: result, toolUseId: tc.id, turnId, streaming: false,
      });
      messages.push({ role: "tool", content: resultStr, tool_call_id: tc.id });
    }
  }
}

// ─── Anthropic agent ──────────────────────────────────────────────────────────

async function runAnthropicAgent(
  ctx: ActionCtx,
  opts: {
    client: Anthropic;
    modelId: string;
    systemPrompt: string;
    userPrompt: string;
    roomId: Id<"rooms">;
    turnId: string;
  },
) {
  const { client, modelId, systemPrompt, userPrompt, roomId, turnId } = opts;

  const messages: AnthropicMessage[] = [{ role: "user", content: userPrompt }];
  const tools = anthropicTools() as Anthropic.Tool[];

  for (let step = 0; step < MAX_AGENT_STEPS; step++) {
    let outputMsgId: Id<"messages"> | null = null;
    let thoughtMsgId: Id<"messages"> | null = null;
    let outputBuffer = "";
    let thoughtBuffer = "";
    let lastFlush = Date.now();
    let inThinkBlock = false;
    let pendingText = "";

    const flush = async () => {
      if (thoughtBuffer && thoughtMsgId) {
        await ctx.runMutation(internal.messages.appendDelta, { id: thoughtMsgId, delta: thoughtBuffer });
        thoughtBuffer = "";
      }
      if (outputBuffer && outputMsgId) {
        await ctx.runMutation(internal.messages.appendDelta, { id: outputMsgId, delta: outputBuffer });
        outputBuffer = "";
      }
      lastFlush = Date.now();
    };

    const processText = async (text: string) => {
      pendingText += text;
      while (pendingText.length > 0) {
        if (inThinkBlock) {
          const closeIdx = pendingText.indexOf("</think>");
          if (closeIdx === -1) {
            const partial = partialSuffix(pendingText, "</think>");
            if (partial > 0) {
              thoughtBuffer += pendingText.slice(0, pendingText.length - partial);
              pendingText = pendingText.slice(pendingText.length - partial);
              break;
            }
            thoughtBuffer += pendingText;
            pendingText = "";
          } else {
            thoughtBuffer += pendingText.slice(0, closeIdx);
            pendingText = pendingText.slice(closeIdx + "</think>".length);
            inThinkBlock = false;
            if (thoughtMsgId) {
              await flush();
              await ctx.runMutation(internal.messages.markDone, { id: thoughtMsgId });
              thoughtMsgId = null;
            }
          }
        } else {
          const openIdx = pendingText.indexOf("<think>");
          if (openIdx === -1) {
            const partial = partialSuffix(pendingText, "<think>");
            if (partial > 0) {
              if (!outputMsgId) {
                outputMsgId = await ctx.runMutation(internal.messages.append, {
                  roomId, role: "assistant", kind: "output", content: "", turnId, streaming: true,
                });
              }
              outputBuffer += pendingText.slice(0, pendingText.length - partial);
              pendingText = pendingText.slice(pendingText.length - partial);
              break;
            }
            if (pendingText.length > 0) {
              if (!outputMsgId) {
                outputMsgId = await ctx.runMutation(internal.messages.append, {
                  roomId, role: "assistant", kind: "output", content: "", turnId, streaming: true,
                });
              }
              outputBuffer += pendingText;
            }
            pendingText = "";
          } else {
            const before = pendingText.slice(0, openIdx);
            if (before) {
              if (!outputMsgId) {
                outputMsgId = await ctx.runMutation(internal.messages.append, {
                  roomId, role: "assistant", kind: "output", content: "", turnId, streaming: true,
                });
              }
              outputBuffer += before;
              await flush();
            }
            pendingText = pendingText.slice(openIdx + "<think>".length);
            inThinkBlock = true;
            if (!thoughtMsgId) {
              thoughtMsgId = await ctx.runMutation(internal.messages.append, {
                roomId, role: "assistant", kind: "thought", content: "", turnId, streaming: true,
              });
            }
          }
        }
      }
      if (Date.now() - lastFlush > 90) await flush();
    };

    // Tool input accumulation per block index
    const toolUseBlocks = new Map<number, { id: string; name: string; inputRaw: string }>();

    const stream = client.messages.stream({
      model: modelId,
      max_tokens: OUTPUT_MAX_TOKENS,
      system: systemPrompt,
      tools,
      messages: messages as Anthropic.MessageParam[],
    });

    for await (const event of stream) {
      if (event.type === "content_block_start") {
        const block = event.content_block as { type: string; id?: string; name?: string };
        if (block.type === "tool_use" && block.id && block.name) {
          toolUseBlocks.set(event.index, { id: block.id, name: block.name, inputRaw: "" });
        }
      } else if (event.type === "content_block_delta") {
        const delta = event.delta as { type: string; text?: string; partial_json?: string };
        if (delta.type === "text_delta" && delta.text) {
          await processText(delta.text);
        } else if (delta.type === "input_json_delta" && delta.partial_json) {
          const acc = toolUseBlocks.get(event.index);
          if (acc) acc.inputRaw += delta.partial_json;
        }
      }
    }

    await flush();

    if (thoughtMsgId) {
      await ctx.runMutation(internal.messages.markDone, { id: thoughtMsgId });
      thoughtMsgId = null;
    }
    if (outputMsgId) {
      await ctx.runMutation(internal.messages.markDone, { id: outputMsgId });
    }

    const final = await stream.finalMessage();
    const toolUseContent = final.content.filter(
      (c): c is Anthropic.ToolUseBlock => c.type === "tool_use",
    );

    if (toolUseContent.length === 0 || final.stop_reason === "end_turn") return;

    const toolResults: AnthropicToolResult[] = [];

    for (const tu of toolUseContent) {
      await ctx.runMutation(internal.messages.append, {
        roomId, role: "assistant", kind: "tool_call", content: "",
        toolName: tu.name, toolInput: tu.input, toolUseId: tu.id, turnId, streaming: false,
      });

      const tool = toolRegistry[tu.name];
      let result: unknown;
      try {
        const validated = tool ? tool.schema.parse(tu.input) : tu.input;
        result = tool ? await tool.execute(ctx, validated, { roomId }) : { error: `Unknown tool: ${tu.name}` };
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err) };
      }

      const resultStr = JSON.stringify(result);
      await ctx.runMutation(internal.messages.append, {
        roomId, role: "tool", kind: "tool_result", content: resultStr,
        toolName: tu.name, toolResult: result, toolUseId: tu.id, turnId, streaming: false,
      });
      toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: resultStr });
    }

    messages.push({ role: "assistant", content: final.content as (AnthropicTextContent | AnthropicToolUse)[] });
    messages.push({ role: "user", content: toolResults });
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function partialSuffix(haystack: string, needle: string): number {
  for (let len = Math.min(needle.length - 1, haystack.length); len > 0; len--) {
    if (haystack.endsWith(needle.slice(0, len))) return len;
  }
  return 0;
}
