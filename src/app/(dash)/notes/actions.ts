"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { notes } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function createNote(title?: string) {
  const user = await getSession();
  if (!user) return null;

  const [note] = await db
    .insert(notes)
    .values({ userId: user.id, title: title ?? "Untitled" })
    .returning();

  revalidatePath("/notes");
  return note;
}

export async function updateNote(id: number, data: { title?: string; content?: string }) {
  await db
    .update(notes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(notes.id, id));

  revalidatePath("/notes");
}

export async function deleteNote(id: number) {
  await db.delete(notes).where(eq(notes.id, id));
  revalidatePath("/notes");
}

export async function getNotes(userId: number) {
  return db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt));
}

export async function getNote(id: number) {
  const [note] = await db.select().from(notes).where(eq(notes.id, id));
  return note ?? null;
}
