"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/cn";
import { PROVIDERS, PROVIDER_LIST, type Provider } from "@/lib/models";

export function ToolPanel() {
  const params = useParams<{ roomId?: string }>();
  const router = useRouter();
  const roomId = params?.roomId as Id<"rooms"> | undefined;

  const room = useQuery(api.rooms.get, roomId ? { roomId } : "skip");
  const docs = (
    useQuery(api.documents.listForRoom, roomId ? { roomId } : "skip") ?? []
  ) as Array<{ _id: string; title: string; chunkCount: number }>;

  // Per-user configured keys (to show which providers are available)
  const configuredKeys = (useQuery(api.userApiKeys.list) ?? []) as Array<{
    provider: Provider;
    maskedKey: string;
  }>;
  const configuredProviders = new Set(configuredKeys.map((k) => k.provider));

  const setModel = useMutation(api.rooms.setModel);

  // Local picker state — initialise from room once loaded
  const [selectedProvider, setSelectedProvider] = useState<Provider>("groq");
  const [selectedModel, setSelectedModel] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (room) {
      const p = (room.provider as Provider) ?? "groq";
      const m = room.modelId ?? PROVIDERS[p].models[0].id;
      setSelectedProvider(p);
      setSelectedModel(m);
    }
  }, [room?.provider, room?.modelId, room]);

  const currentProviderInfo = PROVIDERS[selectedProvider];
  const hasKeyForProvider = configuredProviders.has(selectedProvider);

  // Check if selection differs from room's current config
  const isDirty =
    room &&
    (selectedProvider !== (room.provider ?? "groq") ||
      selectedModel !== (room.modelId ?? PROVIDERS[(room.provider as Provider) ?? "groq"].models[0].id));

  const handleApply = async () => {
    if (!roomId) return;
    setApplying(true);
    try {
      await setModel({ roomId, provider: selectedProvider, modelId: selectedModel });
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    } finally {
      setApplying(false);
    }
  };

  // When provider changes, auto-select its first model
  const handleProviderChange = (p: Provider) => {
    setSelectedProvider(p);
    setSelectedModel(PROVIDERS[p].models[0].id);
    setApplied(false);
  };

  return (
    <aside
      className={cn(
        "sticky top-12 h-[calc(100dvh-4rem)]",
        "rounded-l-xl border-l border-t border-b border-paper/[0.08]",
        "bg-slate/80 backdrop-blur-md",
        "shadow-[0_0_0_1px_rgba(242,237,228,0.04),0_20px_60px_-20px_rgba(0,0,0,0.8)]",
        "overflow-hidden grain",
      )}
    >
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-paper/[0.06]">
          <h2 className="display text-paper text-xl leading-none">Backpack</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bone-2 mt-1.5">
            model · tools · knowledge
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 text-paper">

          {/* ── Model selector ─────────────────────────────────────── */}
          <Section label="Model">
            {!roomId ? (
              <p className="font-mono text-[11px] text-bone-2">
                Open a room to configure its model.
              </p>
            ) : (
              <div className="space-y-3">
                {/* Provider picker */}
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-[0.25em] text-bone-2 block mb-1.5">
                    Provider
                  </label>
                  <div className="flex flex-col gap-1">
                    {PROVIDER_LIST.map((p) => {
                      const hasKey = configuredProviders.has(p.id);
                      const isSelected = selectedProvider === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleProviderChange(p.id)}
                          className={cn(
                            "flex items-center justify-between gap-2 px-3 py-2 rounded-md border text-left",
                            "transition-colors duration-150",
                            isSelected
                              ? "border-acid/50 bg-acid/8 text-paper"
                              : "border-paper/[0.06] bg-ink/30 text-bone hover:border-paper/20 hover:text-paper",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <span className="font-mono text-acid text-[10px]">▶</span>
                            )}
                            <span className="font-mono text-[12px]">{p.label}</span>
                          </div>
                          <span
                            className={cn(
                              "size-1.5 rounded-full flex-shrink-0",
                              hasKey
                                ? "bg-acid shadow-[0_0_6px_var(--acid)]"
                                : "bg-bone-2/50",
                            )}
                            title={hasKey ? "API key configured" : "No API key"}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Model picker */}
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-[0.25em] text-bone-2 block mb-1.5">
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      setApplied(false);
                    }}
                    className={cn(
                      "w-full font-mono text-[12px] px-3 py-2 rounded-md",
                      "bg-ink/60 border border-paper/[0.10] text-paper",
                      "focus:outline-none focus:border-acid/50",
                      "appearance-none cursor-pointer",
                    )}
                  >
                    {currentProviderInfo.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  {selectedModel && (
                    <p className="font-mono text-[10px] text-bone-2 mt-1 leading-relaxed">
                      {currentProviderInfo.models.find((m) => m.id === selectedModel)?.description}
                    </p>
                  )}
                </div>

                {/* Key status */}
                {!hasKeyForProvider && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-md border border-paper/[0.06] bg-ink/20">
                    <span className="font-mono text-[10px] text-bone-2 leading-relaxed">
                      No {currentProviderInfo.label} key.{" "}
                      <Link href="/settings" className="text-acid hover:underline">
                        Add one in Settings →
                      </Link>
                    </span>
                  </div>
                )}

                {/* Apply button */}
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying || !isDirty || !hasKeyForProvider}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2 rounded-md border",
                    "font-mono text-[11px] uppercase tracking-[0.15em]",
                    "transition-colors duration-200",
                    applied
                      ? "border-acid/50 bg-acid/10 text-acid"
                      : isDirty && hasKeyForProvider
                        ? "border-acid/60 bg-acid/10 text-acid hover:bg-acid hover:text-ink"
                        : "border-paper/[0.06] text-bone-2 opacity-50",
                    "disabled:cursor-not-allowed",
                  )}
                >
                  {applying
                    ? "applying…"
                    : applied
                      ? "✓ applied"
                      : "Apply to room →"}
                </button>
              </div>
            )}
          </Section>

          {/* ── Tools ─────────────────────────────────────────────── */}
          <Section label="Tools available">
            <ToolChip name="search_docs" desc="vector search over room docs" />
            <ToolChip name="fetch_url" desc="retrieve public webpages" />
            <ToolChip name="run_code" desc="sandbox disabled" disabled />
          </Section>

          {/* ── Knowledge ─────────────────────────────────────────── */}
          <Section label="Knowledge">
            {roomId ? (
              docs.length === 0 ? (
                <p className="font-mono text-[11px] text-bone-2">
                  No documents yet. Drop a .md file into the canvas to index it.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {docs.map((d) => (
                    <li
                      key={d._id}
                      className="flex items-baseline justify-between gap-3 text-[13px]"
                    >
                      <span className="truncate">{d.title}</span>
                      <span className="font-mono text-[10px] text-bone-2 shrink-0">
                        {d.chunkCount} chunks
                      </span>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <p className="font-mono text-[11px] text-bone-2">
                Open a room to see its attached knowledge.
              </p>
            )}
          </Section>

          {/* ── Settings link ─────────────────────────────────────── */}
          <div className="pt-2 border-t border-paper/[0.06]">
            <Link
              href="/settings"
              className={cn(
                "flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border",
                "border-paper/[0.06] bg-ink/20",
                "hover:border-acid/30 hover:bg-acid/5 transition-colors duration-200 group",
              )}
            >
              <div>
                <div className="font-mono text-[11px] text-paper group-hover:text-acid transition-colors">
                  API Keys &amp; Models
                </div>
                <div className="font-mono text-[10px] text-bone-2 mt-0.5">
                  {configuredKeys.length === 0
                    ? "No providers configured"
                    : `${configuredKeys.length} provider${configuredKeys.length > 1 ? "s" : ""} configured`}
                </div>
              </div>
              <span className="text-bone-2 group-hover:text-acid transition-colors">→</span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-2 mb-2.5">
        {label}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function ToolChip({ name, desc, disabled = false }: { name: string; desc: string; disabled?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-sm px-3 py-2",
        "border border-paper/[0.06] bg-ink/40",
        disabled && "opacity-50",
      )}
    >
      <div>
        <div className="font-mono text-[12px] text-paper">{name}</div>
        <div className="font-mono text-[10px] text-bone-2">{desc}</div>
      </div>
      <span
        className={cn(
          "size-1.5 rounded-full",
          disabled ? "bg-bone-2" : "bg-acid shadow-[0_0_8px_var(--acid)]",
        )}
      />
    </div>
  );
}
