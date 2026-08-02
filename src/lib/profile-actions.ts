"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  bio: z.string().max(500).optional(),
  username: z.string().max(30).optional(),
});

export type ProfileState = {
  errors?: { name?: string[]; bio?: string[]; username?: string[]; form?: string[] };
  success?: string;
};

export async function updateProfile(
  _state: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getSession();
  if (!user) return { errors: { form: ["Not authenticated."] } };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio"),
    username: formData.get("username"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const imageFile = formData.get("image") as File | null;
  let imageUrl: string | undefined;

  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadImage(imageFile);
    } catch {
      return { errors: { form: ["Failed to upload image."] } };
    }
  }

  const data: Record<string, unknown> = {
    name: parsed.data.name,
    bio: parsed.data.bio ?? "",
    username: parsed.data.username?.trim() || null,
    updatedAt: new Date(),
  };

  if (imageUrl) data.image = imageUrl;

  await db.update(users).set(data).where(eq(users.id, user.id));

  revalidatePath("/settings");
  return { success: "Profile updated." };
}

export async function saveGithubToken(
  _state: { errors?: { form?: string[] }; success?: string },
  formData: FormData,
): Promise<{ errors?: { form?: string[] }; success?: string }> {
  const user = await getSession();
  if (!user) return { errors: { form: ["Not authenticated."] } };

  const token = formData.get("githubToken") as string;

  await db
    .update(users)
    .set({ githubToken: token || null })
    .where(eq(users.id, user.id));

  revalidatePath("/settings");
  return { success: "GitHub token saved." };
}

export async function saveAIConfig(
  _state: { errors?: { form?: string[] }; success?: string },
  formData: FormData,
): Promise<{ errors?: { form?: string[] }; success?: string }> {
  const user = await getSession();
  if (!user) return { errors: { form: ["Not authenticated."] } };

  const provider = formData.get("aiProvider") as string;
  const apiKey = formData.get("aiApiKey") as string;

  await db
    .update(users)
    .set({ aiProvider: provider || null, aiApiKey: apiKey || null })
    .where(eq(users.id, user.id));

  revalidatePath("/settings");
  return { success: "AI provider saved." };
}
