# Reasoning Playground

A collaborative canvas where people share prompts and watch an agent think out
loud. Multiple people edit one prompt, presence syncs, and the agent streams
its *extended thinking* and *final output* side by side as it moves through
tools and a vector-RAG knowledge base.

## Stack

- **Next.js 16** (App Router, React 19, Tailwind v4 with the `@theme`
  directive — no `tailwind.config.ts`)
- **Convex** for real-time sync, server actions, and the vector index
- **Clerk** for auth (Google + GitHub)
- **Framer Motion** for stagger reveals, `LazyMotion` + `m.*` for bundle size
- **Anthropic `claude-opus-4-7`** with extended thinking + tool use
- **OpenAI `text-embedding-3-small`** (1536 dims) for RAG

## First-time setup

Run these once, in order. They're a bit more than the usual `npm install && npm run dev`
because Clerk and Convex each need a deployment created before code can compile.

### 1. Install

```bash
npm install
```

### 2. Create the Convex deployment (interactive)

```bash
npx convex dev
```

This will:

- prompt you to log in to Convex
- create a new deployment
- write `CONVEX_DEPLOYMENT` + `NEXT_PUBLIC_CONVEX_URL` into `.env.local`
- **generate `convex/_generated/` type files** — required before `next build`
  will succeed
- watch `convex/` and hot-reload functions as you edit them

Leave it running in a terminal.

### 3. Set up Clerk

1. Create a Clerk application at <https://dashboard.clerk.com>.
2. Enable **Google** and **GitHub** as social connections.
3. Go to **JWT Templates → New template → Convex**. Copy the **Issuer URL**.
4. In `.env.local`, fill in:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/rooms
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/rooms
   ```
5. Hand the Clerk issuer URL to Convex:
   ```bash
   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
   ```

### 4. Add model provider keys to Convex

The agent runs inside Convex Actions, so the keys live on the Convex side (not
in `.env.local`).

```bash
npx convex env set ANTHROPIC_API_KEY sk-ant-...
npx convex env set OPENAI_API_KEY    sk-...
```

### 5. Run

```bash
npm run dev         # Next.js on :3000
npx convex dev      # second terminal, leave running
```

Visit <http://localhost:3000>.

## Notable Next.js 16 details

- The Clerk integration lives in `src/proxy.ts` — **not** `middleware.ts`.
  Next.js 16 renamed the middleware file convention to `proxy.ts`.
- Dynamic route `params` are `Promise<...>` and must be awaited or unwrapped
  with `React.use()`.
- All Framer Motion usage is inside `"use client"` boundaries. The shell uses
  `LazyMotion features={domAnimation}` and the `m.*` primitives to keep the
  client bundle small.

## Design tokens

Defined in [`src/styles/theme.css`](src/styles/theme.css) using Tailwind v4's
`@theme` directive — no config file. Palette is obsidian + warm paper + a
single acid-green accent (no gradients). Typography is **Fraunces** (display
serif, variable axes) + **Instrument Sans** (body) + **JetBrains Mono**,
loaded via `next/font/google`. A fractal SVG noise texture is applied via the
`.grain` utility.

## Structure

```
convex/          Convex schema, queries, mutations, actions, cron
  agent.ts       Streaming Claude loop with extended thinking + tool_use
  tools.ts       MCP-style registry: search_docs, fetch_url, run_code
  embeddings.ts  RAG: OpenAI embeddings + Convex vectorSearch
  presence.ts    Heartbeat + cron sweep
src/
  app/           Landing, sign-in/up, authed (app) group, rooms/[roomId]
  components/
    shell/       LayoutShell, RoomsSidebar, ToolPanel
    canvas/      SharedPromptBlock, AgentReasoningFeed, PresenceAvatars
    feed/        ThoughtBlock, OutputBlock, ToolCallBlock
    auth/        AuthGate, UserMenu, EnsureUser
    motion/      variants.ts
  hooks/         usePresence, useEnsureUser
  lib/           cn, debounce, models
  providers/     ConvexClerkProvider (wraps Clerk + Convex + LazyMotion)
  styles/        theme.css
  proxy.ts       Clerk auth (Next 16 rename of middleware.ts)
```

## Verification

- Sign-in completes, lands on `/rooms`.
- Convex dashboard shows `rooms.*`, `messages.*`, `presence.*`, `prompts.*`,
  `agent.generate`, `embeddings.search`, `documents.listForRoom`.
- Create a room. Open it in a second browser (different account or incognito +
  invite). Typing in `SharedPromptBlock` in one mirrors in the other within a
  few hundred ms. Both avatars show in the room header.
- Submit a prompt with ⌘⏎. Feed renders in order: prompt → collapsible
  thought (dim acid rail) → tool_call pill (if any) → tool_result → streaming
  output. Collapsing thought animates with a clip-path reveal.
- `npm run build` succeeds end-to-end.
