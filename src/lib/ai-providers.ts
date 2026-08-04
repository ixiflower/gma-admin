export const AI_PROVIDERS = [
  {
    key: "openai",
    name: "OpenAI",
    icon: "🤖",
    url: "https://api.openai.com/v1/chat/completions",
    models: [
      { key: "gpt-4o-mini", name: "GPT-4o mini" },
      { key: "gpt-4o", name: "GPT-4o" },
      { key: "gpt-4-turbo", name: "GPT-4 Turbo" },
      { key: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    ],
    defaultModel: "gpt-4o-mini",
  },
  {
    key: "anthropic",
    name: "Anthropic",
    icon: "🧠",
    url: "https://api.anthropic.com/v1/messages",
    models: [
      { key: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
      { key: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
      { key: "claude-3-opus-20240229", name: "Claude 3 Opus" },
    ],
    defaultModel: "claude-3-haiku-20240307",
  },
  {
    key: "google",
    name: "Gemini",
    icon: "💎",
    url: "https://generativelanguage.googleapis.com/v1beta",
    models: [
      { key: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { key: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash-Lite" },
      { key: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    ],
    defaultModel: "gemini-2.0-flash",
  },
  {
    key: "groq",
    name: "Groq",
    icon: "⚡",
    url: "https://api.groq.com/openai/v1/chat/completions",
    models: [
      { key: "llama-3.1-8b-instant", name: "Llama 3.1 8B" },
      { key: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" },
      { key: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
    ],
    defaultModel: "llama-3.1-8b-instant",
  },
] as const;

export type AIProviderKey = (typeof AI_PROVIDERS)[number]["key"];

export function getProvider(key: string | null | undefined) {
  return AI_PROVIDERS.find((p) => p.key === key) ?? null;
}

export function getProviderModels(key: string | null | undefined) {
  return getProvider(key)?.models ?? [];
}

export function getDefaultModel(key: string | null | undefined) {
  return getProvider(key)?.defaultModel ?? null;
}