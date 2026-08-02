"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { todos } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function addTodo(formData: FormData) {
  const user = await getSession();
  if (!user) return;
  const title = formData.get("title") as string;
  const priority = formData.get("priority") as string;
  if (!title?.trim()) return;
  await db.insert(todos).values({ userId: user.id, title: title.trim(), priority: priority || "medium" });
  revalidatePath("/todos");
}

export async function moveTodo(id: number, status: string) {
  await db.update(todos).set({ status }).where(eq(todos.id, id));
  revalidatePath("/todos");
}

export async function toggleTodo(id: number) {
  const [todo] = await db.select().from(todos).where(eq(todos.id, id));
  if (!todo) return;
  const completed = todo.completed ? 0 : 1;
  await db.update(todos).set({ completed, status: completed ? "done" : "todo" }).where(eq(todos.id, id));
  revalidatePath("/todos");
}

export async function deleteTodo(id: number) {
  await db.delete(todos).where(eq(todos.id, id));
  revalidatePath("/todos");
}

export async function getTodos(userId: number) {
  return db.select().from(todos).where(eq(todos.userId, userId)).orderBy(todos.createdAt);
}
