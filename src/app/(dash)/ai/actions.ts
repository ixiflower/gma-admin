"use server";

import { getSession } from "@/lib/auth";

export async function askAI(formData: FormData): Promise<string> {
  const user = await getSession();
  if (!user?.aiApiKey || !user?.aiProvider) {
    return "Please configure your AI provider in Settings → Connect.";
  }

  const message = formData.get("message") as string;
  if (!message?.trim()) return "";

  const providerUrls: Record<string, string> = {
    openai: "https://api.openai.com/v1/chat/completions",
    groq: "https://api.groq.com/openai/v1/chat/completions",
    google: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${user.aiApiKey}`,
    anthropic: "https://api.anthropic.com/v1/messages",
  };

  const url = providerUrls[user.aiProvider];
  if (!url) return "Unsupported provider.";

  try {
    if (user.aiProvider === "google") {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
        }),
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";
    }

    if (user.aiProvider === "anthropic") {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": user.aiApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1024,
          messages: [{ role: "user", content: message }],
        }),
      });
      const data = await res.json();
      return data.content?.[0]?.text ?? "No response.";
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.aiApiKey}`,
      },
      body: JSON.stringify({
        model: user.aiProvider === "groq" ? "llama-3.1-8b-instant" : "gpt-4o-mini",
        messages: [{ role: "user", content: message }],
      }),
    });
    const data = await res.json();
    if (data.error) return `Error: ${data.error.message}`;
    return data.choices?.[0]?.message?.content ?? "No response.";
  } catch (e) {
    return `Failed to get a response. Check your API key.`;
  }
}
