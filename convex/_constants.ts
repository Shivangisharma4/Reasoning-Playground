// ── Model ─────────────────────────────────────────────────────────────────────
// llama-3.3-70b-versatile: best tool-calling on Groq, fast, free tier generous.
export const MODEL_ID = "llama-3.3-70b-versatile";

// ── Embedding ──────────────────────────────────────────────────────────────────
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMS = 1536;

// ── Agent ──────────────────────────────────────────────────────────────────────
export const MAX_AGENT_STEPS = 8;
export const OUTPUT_MAX_TOKENS = 4_096;

// ── Presence ───────────────────────────────────────────────────────────────────
export const PRESENCE_STALE_MS = 15_000;

export const PRESENCE_COLORS = [
  "#c6ff3d",
  "#ff4d3a",
  "#3dd6ff",
  "#ffb03d",
  "#d43dff",
  "#3dffb9",
] as const;
