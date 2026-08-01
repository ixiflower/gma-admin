"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { uploadImage, uploadVideo } from "@/lib/cloudinary";
import type { Message } from "@/db/schema";

const sendSchema = z.object({
  body: z.string().max(2000).optional(),
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
    const file = formData.get("file") as File | null;
    let attachment: string | null = null;

    if (file && file.size > 0) {
      const isVideo = file.type.startsWith("video/");
      const url = isVideo ? await uploadVideo(file) : await uploadImage(file);
      attachment = JSON.stringify({
        type: isVideo ? "video" : "image",
        url,
        name: file.name,
      });
    }

    await db.insert(messages).values({
      userId: user.id,
      body: parsed.data.body ?? "",
      attachment,
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

export async function getUnreadCount(currentUserId: number) {
  const rows = await db
    .select()
    .from(messages)
    .where(and(eq(messages.isRead, 0), ne(messages.userId, currentUserId)));

  return rows.length;
}

export async function markAllRead(currentUserId: number) {
  await db
    .update(messages)
    .set({ isRead: 1 })
    .where(and(eq(messages.isRead, 0), ne(messages.userId, currentUserId)));
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
      attachment: messages.attachment,
      isRead: messages.isRead,
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
