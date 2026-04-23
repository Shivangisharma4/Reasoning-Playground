"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { PROVIDER_LIST, type Provider } from "@/lib/models";
import { cn } from "@/lib/cn";
import Link from "next/link";

type ProviderKey = {
  provider: Provider;
  maskedKey: string;
  updatedAt: number;
};

export default function SettingsPage() {
  const keys = (useQuery(api.userApiKeys.list) ?? []) as ProviderKey[];
  const keyMap = Object.fromEntries(keys.map((k) => [k.provider, k]));

  return (
    <div className="max-w-[52rem] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/rooms"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-bone-2 hover:text-acid transition-colors mb-6"
        >
          ← back to rooms
        </Link>
        <h1 className="display text-[clamp(2.4rem,4vw,3.5rem)] leading-[0.92] text-paper mb-3">
          API Configuration.
        </h1>
        <p className="text-[15px] text-bone leading-relaxed max-w-[38rem]">
          Connect your own API keys to unlock any model in your rooms.
          Keys are stored per-account, never logged, and only used server-side
          when your agent runs.
        </p>
      </div>

      {/* Provider cards */}
      <div className="space-y-4">
        {PROVIDER_LIST.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            existingKey={keyMap[provider.id] ?? null}
          />
        ))}
      </div>

      {/* Info footer */}
      <div className="mt-12 pt-6 border-t border-paper/[0.06]">
        <p className="font-mono text-[11px] text-bone-2 leading-relaxed">
          Keys are used only during agent invocations inside your rooms.
          They are never exposed to other users. Remove any key at any time
          to stop using that provider.
        </p>
      </div>
    </div>
  );
}

function ProviderCard({
  provider,
  existingKey,
}: {
  provider: (typeof PROVIDER_LIST)[number];
  existingKey: ProviderKey | null;
}) {
  const upsert = useMutation(api.userApiKeys.upsert);
  const remove = useMutation(api.userApiKeys.remove);

  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const isConfigured = !!existingKey;

  const handleSave = async () => {
    if (!inputVal.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await upsert({ provider: provider.id, apiKey: inputVal.trim() });
      setEditing(false);
      setInputVal("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save key");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await remove({ provider: provider.id });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors duration-200",
        "bg-slate/60 backdrop-blur",
        isConfigured
          ? "border-acid/30 shadow-[0_0_0_1px_color-mix(in_srgb,var(--acid)_12%,transparent)]"
          : "border-paper/[0.08]",
      )}
    >
      {/* Card header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-[13px] uppercase tracking-[0.2em] text-paper font-semibold">
              {provider.label}
            </span>
            <StatusBadge configured={isConfigured} />
          </div>
          <p className="text-[13px] text-bone">{provider.tagline}</p>
          {/* Model chips */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {provider.models.map((m) => (
              <span
                key={m.id}
                className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-paper/[0.08] text-bone-2"
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <span
            className={cn(
              "font-mono text-[10px] uppercase tracking-[0.2em] transition-colors",
              expanded ? "text-acid" : "text-bone-2",
            )}
          >
            {expanded ? "collapse" : "manage"}
          </span>
          <span
            className={cn(
              "font-mono text-sm transition-transform duration-200",
              expanded ? "rotate-180 text-acid" : "text-bone-2",
            )}
          >
            ↓
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-6 pb-5 border-t border-paper/[0.06]">
          <div className="pt-4">
            {isConfigured && !editing ? (
              /* Show masked key + actions */
              <div className="space-y-3">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone-2 block mb-2">
                    API Key
                  </label>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 font-mono text-[13px] text-paper bg-ink/60 px-3 py-2 rounded-md border border-paper/[0.08]">
                      {existingKey.maskedKey}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(true);
                        setInputVal("");
                      }}
                      className={cn(
                        "px-3 py-2 rounded-md border border-paper/[0.08]",
                        "font-mono text-[11px] uppercase tracking-[0.15em] text-bone",
                        "hover:border-acid/40 hover:text-acid transition-colors",
                      )}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={removing}
                      className={cn(
                        "px-3 py-2 rounded-md border border-paper/[0.08]",
                        "font-mono text-[11px] uppercase tracking-[0.15em] text-bone",
                        "hover:border-red-500/40 hover:text-red-400 transition-colors",
                        "disabled:opacity-40",
                      )}
                    >
                      {removing ? "removing…" : "Remove"}
                    </button>
                  </div>
                  <p className="font-mono text-[10px] text-bone-2 mt-1.5">
                    Last updated {formatDate(existingKey.updatedAt)}
                  </p>
                </div>
              </div>
            ) : (
              /* Add / edit form */
              <div className="space-y-3">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone-2 block mb-2">
                    {isConfigured ? "Replace API Key" : "Add API Key"}
                  </label>
                  <input
                    type="password"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") {
                        setEditing(false);
                        setInputVal("");
                      }
                    }}
                    placeholder={provider.keyPlaceholder}
                    autoFocus
                    className={cn(
                      "w-full font-mono text-[13px] px-3 py-2.5 rounded-md",
                      "bg-ink/60 border border-paper/[0.12] text-paper",
                      "placeholder:text-bone-2/50",
                      "focus:outline-none focus:border-acid/60 focus:shadow-[0_0_0_1px_color-mix(in_srgb,var(--acid)_30%,transparent)]",
                      "transition-colors",
                    )}
                  />
                  <p className="font-mono text-[10px] text-bone-2 mt-1.5">
                    Get your key at{" "}
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-acid hover:underline"
                    >
                      {provider.docsUrl.replace("https://", "")}
                    </a>
                  </p>
                </div>
                {error && (
                  <p className="font-mono text-[11px] text-red-400">{error}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !inputVal.trim()}
                    className={cn(
                      "px-4 py-2 rounded-md border border-acid/60 bg-acid/10 text-acid",
                      "font-mono text-[11px] uppercase tracking-[0.15em]",
                      "hover:bg-acid hover:text-ink transition-colors duration-200",
                      "disabled:opacity-40 disabled:hover:bg-acid/10 disabled:hover:text-acid",
                    )}
                  >
                    {saving ? "saving…" : "Save key"}
                  </button>
                  {(isConfigured || editing) && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setInputVal("");
                        setError(null);
                      }}
                      className={cn(
                        "px-4 py-2 rounded-md border border-paper/[0.08]",
                        "font-mono text-[11px] uppercase tracking-[0.15em] text-bone",
                        "hover:border-paper/30 transition-colors",
                      )}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em]",
        "px-2 py-0.5 rounded-full border",
        configured
          ? "border-acid/30 bg-acid/10 text-acid"
          : "border-paper/[0.08] bg-paper/[0.03] text-bone-2",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          configured ? "bg-acid shadow-[0_0_6px_var(--acid)]" : "bg-bone-2",
        )}
      />
      {configured ? "Configured" : "Not configured"}
    </span>
  );
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
