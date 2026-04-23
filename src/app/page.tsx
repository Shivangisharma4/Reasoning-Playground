import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-dvh bg-ink text-paper overflow-hidden">
      {/* Full-page grain */}
      <div className="grain-fixed" />

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-shell h-14 border-b border-paper/[0.06] bg-ink/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="display text-[1.35rem] leading-none tracking-tight text-paper">
            reasoning
          </span>
          <span className="size-1.5 rounded-full bg-acid shadow-[0_0_8px_var(--acid)]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-bone-2 ml-1">
            // playground
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/sign-in"
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone hover:text-paper transition-colors"
          >
            sign in
          </Link>
          <Link
            href="/sign-up"
            className="font-mono text-[11px] uppercase tracking-[0.22em] px-4 py-1.5 border border-paper/[0.12] rounded-sm text-bone hover:border-acid/40 hover:text-acid transition-colors duration-200"
          >
            get started →
          </Link>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative flex flex-col justify-center pt-28 pb-16">
        {/* Very faint dot grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: "radial-gradient(circle, var(--color-paper) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Acid glow — very subtle, bottom-left */}
        <div
          aria-hidden
          className="absolute bottom-0 left-[-5%] w-[600px] h-[400px] opacity-[0.05]"
          style={{
            background: "radial-gradient(ellipse, var(--color-acid) 0%, transparent 65%)",
          }}
        />

        <div className="relative px-shell max-w-[88rem] mx-auto w-full">
          <div className="max-w-[40rem]">
            {/* Eyebrow */}
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone-2 mb-7 flex items-center gap-2.5">
              <span className="inline-block size-1 rounded-full bg-acid" />
              Collaborative AI reasoning canvas
            </p>

            {/* Headline — measured, not massive */}
            <h1 className="display text-[clamp(2.4rem,3.8vw,3.75rem)] leading-[1.0] text-paper mb-7">
              Watch the{" "}
              <em
                className="not-italic text-acid"
                style={{ fontVariationSettings: '"opsz" 72, "SOFT" 100, "WONK" 0' }}
              >
                thought
              </em>{" "}
              arrive
              <br />
              before the answer.
            </h1>

            {/* Sub */}
            <p className="text-[15px] leading-[1.8] text-bone max-w-[34rem] mb-10">
              A shared canvas where your team co-writes prompts and watches the
              agent reason — tool calls, retrievals, thinking — live, as it happens.
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-7">
              <Link
                href="/sign-in"
                className="group flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-acid hover:text-paper transition-colors duration-200"
              >
                <span className="inline-flex size-6 rounded-full border border-acid/50 items-center justify-center group-hover:bg-acid group-hover:border-acid transition-all duration-200">
                  <span className="text-[9px] group-hover:text-ink transition-colors">→</span>
                </span>
                Open a room
              </Link>
              <Link
                href="/sign-up"
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone-2 hover:text-paper transition-colors pb-px border-b border-transparent hover:border-paper/20"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product preview ─────────────────────────────────── */}
      <section className="px-shell pt-10 pb-20 max-w-[88rem] mx-auto">
        <div className="flex items-baseline justify-between mb-7 border-t border-paper/[0.06] pt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-bone-2">
            What a session looks like
          </p>
          <p className="font-mono text-[10px] text-bone-2">
            streaming · collaborative · real-time
          </p>
        </div>

        {/* Mock canvas window */}
        <div
          className="relative rounded-xl border border-paper/[0.08] overflow-hidden grain"
          style={{ boxShadow: "0 40px 80px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(242,237,228,0.04)" }}
        >
          {/* Window chrome */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-paper/[0.06] bg-slate/60">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-paper/10" />
              <span className="size-2.5 rounded-full bg-paper/10" />
              <span className="size-2.5 rounded-full bg-paper/10" />
              <span className="font-mono text-[11px] text-bone-2 ml-3">
                deep-work-session
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] px-2 py-0.5 rounded-full border border-acid/20 bg-acid/5 text-acid">
                <span className="size-1 rounded-full bg-acid shadow-[0_0_4px_var(--acid)]" />
                Groq · Llama 3.3 70B
              </span>
              <span className="font-mono text-[10px] text-bone-2">3 active</span>
            </div>
          </div>

          {/* Canvas body */}
          <div className="bg-slate/30 p-8 space-y-5">
            {/* Shared prompt */}
            <div className="rounded-lg border border-paper/[0.06] bg-ink/40 px-5 py-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone-2 mb-2">
                Shared prompt
              </p>
              <p className="text-[15px] text-paper leading-relaxed">
                Explain the tradeoffs between embedding-based retrieval and
                keyword search for a knowledge base with 50k documents.
              </p>
            </div>

            {/* Thought block — collapsed */}
            <div className="acid-rail pl-4" data-hot="false">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone-2">
                    Thinking
                  </span>
                  <span className="font-mono text-[10px] text-bone-2/60">· 1.2s</span>
                </div>
                <span className="font-mono text-[10px] text-bone-2/50 truncate max-w-[28rem]">
                  Let me think through the dimensional tradeoffs. Embedding search
                  captures semantic similarity but…
                </span>
                <span className="font-mono text-[10px] text-bone-2 ml-4">
                  ↓ expand
                </span>
              </div>
            </div>

            {/* Tool call */}
            <div className="flex items-center gap-3">
              <div
                className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md border border-paper/[0.08] bg-ink/60"
              >
                <span className="size-1.5 rounded-full bg-acid shadow-[0_0_6px_var(--acid)]" />
                <span className="font-mono text-[11px] text-paper">search_docs</span>
                <span className="font-mono text-[10px] text-bone-2">
                  "hybrid retrieval tradeoffs"
                </span>
                <span className="font-mono text-[10px] text-acid">3 chunks · 89ms</span>
              </div>
            </div>

            {/* Output block — streaming */}
            <div className="rounded-lg border border-paper/[0.06] bg-ink/20 px-5 py-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone-2 mb-3">
                Output
              </p>
              <p className="text-[15px] text-paper leading-relaxed">
                Embedding-based retrieval excels at semantic similarity — it
                finds relevant content even when the query uses different
                terminology than the documents. Keyword search has lower
                latency and perfect recall for exact matches, but misses
                paraphrased or conceptually similar content.
                <span className="streaming-caret" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features — horizontal list ───────────────────────── */}
      <section className="px-shell pb-28 max-w-[88rem] mx-auto">
        <div className="border-t border-paper/[0.06] pt-10 mb-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-bone-2 mb-0">
            Built for how teams actually think
          </p>
        </div>

        <div className="divide-y divide-paper/[0.05]">
          <FeatureRow
            index="01"
            title="Collaborative canvas"
            body="Multiple people co-edit the same prompt in real time. Cursors sync, presence pulses, the agent hears all of you when it runs."
            tag="Real-time sync"
          />
          <FeatureRow
            index="02"
            title="Thought vs output"
            body="The agent's internal reasoning streams into a collapsible channel, separated from its final answer. Watch it change its mind."
            tag="Transparent reasoning"
          />
          <FeatureRow
            index="03"
            title="Your keys, your models"
            body="Connect Groq, OpenAI, or Anthropic. Each room can run a different model. Your keys, stored per-account, never logged."
            tag="Multi-provider"
          />
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-paper/[0.05] px-shell py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="display text-[1rem] leading-none text-bone">reasoning</span>
          <span className="size-1 rounded-full bg-acid" />
        </div>
        <p className="font-mono text-[10px] text-bone-2 uppercase tracking-[0.25em]">
          Built on Convex · Powered by your keys
        </p>
        <Link
          href="/sign-up"
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-bone-2 hover:text-acid transition-colors"
        >
          get started →
        </Link>
      </footer>
    </div>
  );
}

function FeatureRow({
  index,
  title,
  body,
  tag,
}: {
  index: string;
  title: string;
  body: string;
  tag: string;
}) {
  return (
    <div className="grid grid-cols-12 gap-6 py-9 group">
      {/* Number */}
      <div className="col-span-1 flex items-start pt-0.5">
        <span className="font-mono text-[11px] tracking-[0.25em] text-acid-dim">
          {index}
        </span>
      </div>
      {/* Title */}
      <div className="col-span-3">
        <h3 className="display text-[1.2rem] leading-snug text-paper">{title}</h3>
      </div>
      {/* Body */}
      <div className="col-span-5">
        <p className="text-[15px] leading-[1.75] text-bone">{body}</p>
      </div>
      {/* Tag */}
      <div className="col-span-3 flex justify-end items-start">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-bone-2 border border-paper/[0.07] rounded-full px-3 py-1 whitespace-nowrap">
          {tag}
        </span>
      </div>
    </div>
  );
}
