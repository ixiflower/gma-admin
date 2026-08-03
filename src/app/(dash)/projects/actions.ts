"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { notes, todos } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function addRepoTodo(formData: FormData): Promise<{ error?: string }> {
  const user = await getSession();
  if (!user) return { error: "Not authenticated." };

  const repo = formData.get("repo") as string;
  const title = formData.get("title") as string;

  if (!title?.trim()) return { error: "Title is required." };
  if (!repo) return { error: "Missing repo." };

  await db.insert(todos).values({
    userId: user.id,
    title: title.trim(),
    status: "todo",
    priority: (formData.get("priority") as string) || "medium",
    repo,
  });

  revalidatePath(`/projects/${repo}`);
  return {};
}

export async function toggleRepoTodo(formData: FormData) {
  const user = await getSession();
  if (!user) return { error: "Not authenticated." };

  const id = Number(formData.get("id"));
  const repo = formData.get("repo") as string;
  const completed = Number(formData.get("completed"));

  await db
    .update(todos)
    .set({ completed, status: completed ? "done" : "todo" })
    .where(and(eq(todos.id, id), eq(todos.userId, user.id)));

  revalidatePath(`/projects/${repo}`);
  return {};
}

export async function deleteRepoTodo(formData: FormData) {
  const user = await getSession();
  if (!user) return { error: "Not authenticated." };

  const id = Number(formData.get("id"));
  const repo = formData.get("repo") as string;

  await db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, user.id)));

  revalidatePath(`/projects/${repo}`);
  return {};
}

export async function addRepoNote(formData: FormData) {
  const user = await getSession();
  if (!user) return { error: "Not authenticated." };

  const repo = formData.get("repo") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title?.trim()) return { error: "A title is required." };
  if (!repo) return { error: "Missing repo." };

  await db.insert(notes).values({
    userId: user.id,
    title: title.trim(),
    content: content?.trim() || "",
    repo,
  });

  revalidatePath(`/projects/${repo}`);
  return {};
}

export async function deleteRepoNote(formData: FormData) {
  const user = await getSession();
  if (!user) return { error: "Not authenticated." };

  const id = Number(formData.get("id"));
  const repo = formData.get("repo") as string;

  await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)));

  revalidatePath(`/projects/${repo}`);
  return {};
}

export async function getRepoItems(repo: string, userId: number) {
  const [repoTodos, repoNotes] = await Promise.all([
    db
      .select()
      .from(todos)
      .where(and(eq(todos.repo, repo), eq(todos.userId, userId)))
      .orderBy(desc(todos.createdAt)),
    db
      .select()
      .from(notes)
      .where(and(eq(notes.repo, repo), eq(notes.userId, userId)))
      .orderBy(desc(notes.updatedAt)),
  ]);

  return { repoTodos, repoNotes };
}