"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { getSession } from "@/lib/auth";

const createPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  body: z.string().min(3, "Body must be at least 3 characters").max(1000),
  published: z.boolean().optional(),
});

export type PostState = {
  errors?: { title?: string[]; body?: string[]; form?: string[] };
};

export async function createPost(
  _state: PostState,
  formData: FormData,
): Promise<PostState> {
  const parsed = createPostSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    published: formData.get("published") === "on",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const user = await getSession();
  if (!user) {
    return { errors: { form: ["You must be signed in to create posts."] } };
  }

  try {
    await db.insert(posts).values({
      userId: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      published: parsed.data.published ? 1 : 0,
    });
  } catch {
    return { errors: { form: ["Failed to create the post."] } };
  }

  revalidatePath("/");
  redirect("/");
}

export async function togglePost(id: number): Promise<void> {
  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) return;

  await db
    .update(posts)
    .set({ published: post.published ? 0 : 1 })
    .where(eq(posts.id, id));

  revalidatePath("/");
}

export async function deletePost(id: number): Promise<void> {
  await db.delete(posts).where(eq(posts.id, id));
  revalidatePath("/");
}
