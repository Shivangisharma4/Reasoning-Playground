export type Provider = "groq" | "openai" | "anthropic";

export interface ModelInfo {
  id: string;
  label: string;
  description: string;
  contextK: number; // context window in K tokens
  toolCalling: boolean;
}

export interface ProviderInfo {
  id: Provider;
  label: string;
  tagline: string;
  keyPrefix: string; // for hint text in the key input
  keyPlaceholder: string;
  docsUrl: string;
  models: ModelInfo[];
}

export const PROVIDERS: Record<Provider, ProviderInfo> = {
  groq: {
    id: "groq",
    label: "Groq",
    tagline: "Fastest inference on open models",
    keyPrefix: "gsk_",
    keyPlaceholder: "gsk_••••••••••••••••••••••••••••••••••",
    docsUrl: "https://console.groq.com/keys",
    models: [
      {
        id: "llama-3.3-70b-versatile",
        label: "Llama 3.3 70B",
        description: "Best tool-calling on Groq · fast · free tier generous",
        contextK: 128,
        toolCalling: true,
      },
      {
        id: "llama-3.1-8b-instant",
        label: "Llama 3.1 8B Instant",
        description: "Fastest, lowest latency · simple tasks",
        contextK: 128,
        toolCalling: true,
      },
      {
        id: "deepseek-r1-distill-llama-70b",
        label: "DeepSeek R1 70B",
        description: "Strong reasoning · built-in chain-of-thought",
        contextK: 128,
        toolCalling: true,
      },
      {
        id: "mixtral-8x7b-32768",
        label: "Mixtral 8x7B",
        description: "MoE architecture · good multilingual",
        contextK: 32,
        toolCalling: true,
      },
    ],
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    tagline: "GPT-4o and the latest OpenAI models",
    keyPrefix: "sk-",
    keyPlaceholder: "sk-proj-••••••••••••••••••••••••••••",
    docsUrl: "https://platform.openai.com/api-keys",
    models: [
      {
        id: "gpt-4o",
        label: "GPT-4o",
        description: "Best intelligence · multimodal · 128k context",
        contextK: 128,
        toolCalling: true,
      },
      {
        id: "gpt-4o-mini",
        label: "GPT-4o Mini",
        description: "Fast & cheap · good for structured tasks",
        contextK: 128,
        toolCalling: true,
      },
      {
        id: "gpt-4-turbo",
        label: "GPT-4 Turbo",
        description: "High quality · 128k · JSON mode",
        contextK: 128,
        toolCalling: true,
      },
    ],
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    tagline: "Claude — the most capable reasoning models",
    keyPrefix: "sk-ant-",
    keyPlaceholder: "sk-ant-api03-••••••••••••••••••••••••••",
    docsUrl: "https://console.anthropic.com/settings/keys",
    models: [
      {
        id: "claude-opus-4-5",
        label: "Claude Opus 4.5",
        description: "Most capable · deep reasoning · complex agentic tasks",
        contextK: 200,
        toolCalling: true,
      },
      {
        id: "claude-sonnet-4-5",
        label: "Claude Sonnet 4.5",
        description: "Balanced speed + intelligence · best value",
        contextK: 200,
        toolCalling: true,
      },
      {
        id: "claude-3-5-haiku-20241022",
        label: "Claude 3.5 Haiku",
        description: "Fastest Claude · low latency · lightweight tasks",
        contextK: 200,
        toolCalling: true,
      },
    ],
  },
};

export const PROVIDER_LIST = Object.values(PROVIDERS);

export function getModel(provider: Provider, modelId: string): ModelInfo | undefined {
  return PROVIDERS[provider]?.models.find((m) => m.id === modelId);
}

export function defaultModel(provider: Provider): ModelInfo {
  return PROVIDERS[provider].models[0];
}

/** Short display string, e.g. "Groq · Llama 3.3 70B" */
export function modelLabel(provider: Provider, modelId: string): string {
  const m = getModel(provider, modelId);
  return `${PROVIDERS[provider].label} · ${m?.label ?? modelId}`;
}
