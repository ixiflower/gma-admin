"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import type { Message } from "@/db/schema";

const sendSchema = z.object({
  body: z.string().min(1, "Message cannot be empty").max(2000),
});

export type SendState = {
  errors?: { body?: string[]; form?: string[] };
};

export async function sendMessage(
  _state: SendState,
  formData: FormData,
): Promise<SendState> {
  const parsed = sendSchema.safeParse({
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const user = await getSession();
  if (!user) {
    return {
      errors: { form: ["You must be signed in to send messages."] },
    };
  }

  try {
    await db.insert(messages).values({
      userId: user.id,
      body: parsed.data.body,
    });
  } catch {
    return { errors: { form: ["Failed to send the message."] } };
  }

  revalidatePath("/chat");
  redirect("/chat");
}

export async function toggleReaction(messageId: number, emoji: string) {
  const [msg] = await db
    .select({ reactions: messages.reactions })
    .from(messages)
    .where(eq(messages.id, messageId));

  if (!msg) return;

  const current: Record<string, number> = JSON.parse(msg.reactions ?? "{}");
  current[emoji] = (current[emoji] ?? 0) > 0 ? 0 : 1;

  if (current[emoji] === 0) {
    delete current[emoji];
  }

  await db
    .update(messages)
    .set({ reactions: JSON.stringify(current) })
    .where(eq(messages.id, messageId));

  revalidatePath("/chat");
}

export type MessageWithAuthor = Message & {
  author: Pick<(typeof users.$inferSelect), "id" | "name">;
};

export async function getMessages(): Promise<MessageWithAuthor[]> {
  return db
    .select({
      id: messages.id,
      userId: messages.userId,
      body: messages.body,
      reactions: messages.reactions,
      createdAt: messages.createdAt,
      author: {
        id: users.id,
        name: users.name,
      },
    })
    .from(messages)
    .innerJoin(users, eq(messages.userId, users.id))
    .orderBy(asc(messages.createdAt));
}
