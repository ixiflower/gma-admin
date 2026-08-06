"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { todos } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function addTodo(formData: FormData) {
  const user = await getSession();
  if (!user) return null;
  const title = formData.get("title") as string;
  const priority = formData.get("priority") as string;
  if (!title?.trim()) return null;
  const [row] = await db.transaction(async (tx) => {
    // New tasks land at the top of the board: shift everything down by one.
    await tx
      .update(todos)
      .set({ position: sql`${todos.position} + 1` })
      .where(eq(todos.userId, user.id));
    return tx
      .insert(todos)
      .values({ userId: user.id, title: title.trim(), priority: priority || "medium", position: 0 })
      .returning();
  });
  revalidatePath("/todos");
  return row;
}

export async function moveTodo(id: number, status: string) {
  const [todo] = await db.select().from(todos).where(eq(todos.id, id));
  if (!todo) return;
  // Append to the end of the target column.
  const [agg] = await db
    .select({ m: sql<number>`COALESCE(MAX(${todos.position}), -1)` })
    .from(todos)
    .where(and(eq(todos.userId, todo.userId), eq(todos.status, status)));
  await db
    .update(todos)
    .set({ status, position: agg.m + 1 })
    .where(eq(todos.id, id));
  revalidatePath("/todos");
}

export async function reorderTodos(ids: number[]) {
  const user = await getSession();
  if (!user || ids.length === 0) return;
  const own = await db.select({ id: todos.id }).from(todos).where(eq(todos.userId, user.id));
  const ownSet = new Set(own.map((r) => r.id));
  const safe = ids.filter((id) => ownSet.has(id));
  await db.transaction(async (tx) => {
    for (let i = 0; i < safe.length; i++) {
      await tx.update(todos).set({ position: i }).where(eq(todos.id, safe[i]));
    }
  });
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
  return db
    .select()
    .from(todos)
    .where(eq(todos.userId, userId))
    .orderBy(todos.position, todos.id);
}
