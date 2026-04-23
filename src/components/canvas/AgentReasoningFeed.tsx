"use client";

import { useQuery } from "convex/react";
import { m, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { feedContainer, feedItem } from "@/components/motion/variants";
import { ThoughtBlock } from "@/components/feed/ThoughtBlock";
import { OutputBlock } from "@/components/feed/OutputBlock";
import { ToolCallBlock } from "@/components/feed/ToolCallBlock";

/** Concrete message shape matching convex/schema.ts */
type MessageKind =
  | "user_message"
  | "thought"
  | "output"
  | "tool_call"
  | "tool_result";

interface Message {
  _id: string;
  kind: MessageKind;
  content: string;
  toolName?: string;
  toolInput?: unknown;
  toolResult?: unknown;
  toolUseId?: string;
  turnId: string;
  streaming: boolean;
  createdAt: number;
}

export function AgentReasoningFeed({ roomId }: { roomId: Id<"rooms"> }) {
  const rawMessages = useQuery(api.messages.listForRoom, { roomId }) ?? [];
  const messages = rawMessages as unknown as Message[];

  const rendered = collapseToolPairs(messages);

  return (
    <m.section
      variants={feedContainer}
      initial="hidden"
      animate="show"
      className="relative flex flex-col gap-2"
    >
      <header className="flex items-baseline gap-3 mb-2">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-2">
          Reasoning feed
        </h2>
        <span className="font-mono text-[10px] text-bone-2">
          · {rendered.length} events
        </span>
      </header>

      <AnimatePresence initial={false}>
        {rendered.map((item) => (
          <m.div
            key={item.key}
            variants={feedItem}
            initial="hidden"
            animate="show"
            layout
            className="relative"
          >
            <FeedItem item={item} />
          </m.div>
        ))}
      </AnimatePresence>

      {rendered.length === 0 && (
        <div className="text-bone-2 font-mono text-[11px] py-6">
          No reasoning yet. Write a prompt above, press ⌘⏎.
        </div>
      )}
    </m.section>
  );
}

function FeedItem({ item }: { item: RenderedItem }) {
  if (item.type === "user") {
    return (
      <article className="pl-5 pr-3 py-2">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-bone">
            prompt
          </span>
        </div>
        <p className="text-[14px] leading-snug text-paper whitespace-pre-wrap">
          {item.content}
        </p>
      </article>
    );
  }
  if (item.type === "thought") {
    return <ThoughtBlock content={item.content} streaming={item.streaming} />;
  }
  if (item.type === "output") {
    return <OutputBlock content={item.content} streaming={item.streaming} />;
  }
  return (
    <ToolCallBlock
      toolName={item.toolName}
      input={item.input}
      result={item.result}
      status={item.status}
    />
  );
}

type RenderedItem =
  | { key: string; type: "user"; content: string }
  | { key: string; type: "thought"; content: string; streaming: boolean }
  | { key: string; type: "output"; content: string; streaming: boolean }
  | {
      key: string;
      type: "tool";
      toolName: string;
      input: unknown;
      result: unknown | undefined;
      status: "calling" | "done" | "error";
    };

function collapseToolPairs(messages: Message[]): RenderedItem[] {
  const out: RenderedItem[] = [];
  const resultByToolUseId = new Map<string, Message>();

  for (const msg of messages) {
    if (msg.kind === "tool_result" && msg.toolUseId) {
      resultByToolUseId.set(msg.toolUseId, msg);
    }
  }

  for (const msg of messages) {
    if (msg.kind === "tool_result") continue;

    if (msg.kind === "user_message") {
      out.push({ key: msg._id, type: "user", content: msg.content });
    } else if (msg.kind === "thought") {
      out.push({
        key: msg._id,
        type: "thought",
        content: msg.content,
        streaming: msg.streaming,
      });
    } else if (msg.kind === "output") {
      out.push({
        key: msg._id,
        type: "output",
        content: msg.content,
        streaming: msg.streaming,
      });
    } else if (msg.kind === "tool_call") {
      const paired = msg.toolUseId
        ? resultByToolUseId.get(msg.toolUseId)
        : undefined;
      out.push({
        key: msg._id,
        type: "tool",
        toolName: msg.toolName ?? "tool",
        input: msg.toolInput,
        result: paired?.toolResult,
        status: paired
          ? isErrorResult(paired.toolResult)
            ? "error"
            : "done"
          : "calling",
      });
    }
  }

  return out;
}

function isErrorResult(result: unknown): boolean {
  if (result && typeof result === "object" && "error" in result) return true;
  if (
    result &&
    typeof result === "object" &&
    "ok" in result &&
    (result as { ok: boolean }).ok === false
  )
    return true;
  return false;
}
