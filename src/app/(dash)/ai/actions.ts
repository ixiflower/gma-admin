"use server";

import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { aiSessions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getProvider } from "@/lib/ai-providers";

export async function getUserAIProvider() {
  const user = await getSession();
  if (!user?.aiProvider) return null;
  const provider = getProvider(user.aiProvider);
  if (!provider) return null;
  return {
    provider: provider.key,
    models: provider.models,
    defaultModel: provider.defaultModel,
  };
}

export async function listSessions() {
  const user = await getSession();
  if (!user) return [];
  return db
    .select({
      id: aiSessions.id,
      title: aiSessions.title,
      provider: aiSessions.provider,
      model: aiSessions.model,
    })
    .from(aiSessions)
    .where(eq(aiSessions.userId, user.id))
    .orderBy(desc(aiSessions.updatedAt));
}

export async function getAiSession(id: number) {
  const user = await getSession();
  if (!user) return null;
  const rows = await db
    .select()
    .from(aiSessions)
    .where(eq(aiSessions.id, id));
  const row = rows[0];
  if (!row || row.userId !== user.id) return null;
  return row;
}

export async function createSession() {
  const user = await getSession();
  if (!user) return null;
  const [row] = await db
    .insert(aiSessions)
    .values({ userId: user.id })
    .returning({ id: aiSessions.id });
  revalidatePath("/ai");
  return row;
}

export async function deleteSession(id: number) {
  const user = await getSession();
  if (!user) return;
  const rows = await db.select({ userId: aiSessions.userId }).from(aiSessions).where(eq(aiSessions.id, id));
  if (!rows[0] || rows[0].userId !== user.id) return;
  await db
    .delete(aiSessions)
    .where(eq(aiSessions.id, id));
  revalidatePath("/ai");
}

export async function askAI(sessionId: number | null, formData: FormData): Promise<{ reply: string; sessionId: number }> {
  const user = await getSession();
  const message = formData.get("message") as string;
  if (!message?.trim()) return { reply: "", sessionId: sessionId ?? 0 };

  if (!user?.aiApiKey || !user?.aiProvider) {
    return { reply: "Please configure your AI provider in Settings → Connect.", sessionId: sessionId ?? 0 };
  }

  const provider = getProvider(user.aiProvider);
  if (!provider) return { reply: "Unsupported provider.", sessionId: sessionId ?? 0 };

  const model = (formData.get("model") as string) || provider.defaultModel;

  let sid = sessionId;
  let isNew = false;
  if (!sid) {
    const [row] = await db
      .insert(aiSessions)
      .values({ userId: user.id, provider: provider.key, model, title: message.slice(0, 60) + (message.length > 60 ? "..." : "") })
      .returning({ id: aiSessions.id });
    sid = row.id;
    isNew = true;
  }

  const userMsg = { role: "user" as const, content: message };

  let replyText = "";
  try {
    if (provider.key === "google") {
      const url = `${provider.url}/models/${model}:generateContent?key=${user.aiApiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] }),
      });
      const data = await res.json();
      replyText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";
    } else if (provider.key === "anthropic") {
      const res = await fetch(provider.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": user.aiApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          messages: [{ role: "user", content: message }],
        }),
      });
      const data = await res.json();
      replyText = data.content?.[0]?.text ?? "No response.";
    } else {
      const res = await fetch(provider.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.aiApiKey}`,
        },
        body: JSON.stringify({ model, messages: [{ role: "user", content: message }] }),
      });
      const data = await res.json();
      if (data.error) replyText = `Error: ${data.error.message}`;
      else replyText = data.choices?.[0]?.message?.content ?? "No response.";
    }
  } catch {
    replyText = "Failed to get a response. Check your API key.";
  }

  const existing = await db.select({ messages: aiSessions.messages }).from(aiSessions).where(eq(aiSessions.id, sid));
  const prev = (existing[0]?.messages as Array<{ role: string; content: string }>) ?? [];

  const updateData: Record<string, unknown> = {
    provider: provider.key,
    model,
    messages: [...prev, userMsg, { role: "assistant", content: replyText }],
    updatedAt: new Date(),
  };
  if (isNew || prev.length === 0) {
    updateData.title = message.slice(0, 60) + (message.length > 60 ? "..." : "");
  }

  await db
    .update(aiSessions)
    .set(updateData)
    .where(eq(aiSessions.id, sid));

  revalidatePath("/ai");
  return { reply: replyText, sessionId: sid };
}
