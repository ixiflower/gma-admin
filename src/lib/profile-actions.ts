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
});

export type ProfileState = {
  errors?: { name?: string[]; bio?: string[]; form?: string[] };
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
    updatedAt: new Date(),
  };

  if (imageUrl) data.image = imageUrl;

  await db.update(users).set(data).where(eq(users.id, user.id));

  revalidatePath("/settings");
  return { success: "Profile updated." };
}
