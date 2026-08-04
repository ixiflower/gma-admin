"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { teams, teamMembers, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

export async function createTeam(name: string, description?: string) {
  const user = await getSession();
  if (!user || !name.trim()) return null;
  const [team] = await db.insert(teams).values({ name: name.trim(), description: description?.trim() || null, ownerId: user.id }).returning();
  await db.insert(teamMembers).values({ teamId: team.id, userId: user.id });
  revalidatePath("/team");
  return team;
}

export async function deleteTeam(teamId: number) {
  await db.delete(teams).where(eq(teams.id, teamId));
  revalidatePath("/team");
}

export async function updateTeam(teamId: number, data: { name?: string; description?: string; image?: string }) {
  const user = await getSession();
  if (!user) return;
  await db.update(teams).set(data).where(eq(teams.id, teamId));
  revalidatePath("/team");
}

export async function uploadTeamImage(formData: FormData) {
  const user = await getSession();
  if (!user) return null;
  const teamId = Number(formData.get("teamId"));
  const file = formData.get("file") as File;
  if (!teamId || !file || !file.size) return null;
  const url = await uploadImage(file);
  await db.update(teams).set({ image: url }).where(eq(teams.id, teamId));
  revalidatePath("/team");
  return url;
}

export async function joinTeam(teamId: number) {
  const user = await getSession();
  if (!user) return;
  await db.insert(teamMembers).values({ teamId, userId: user.id }).onConflictDoNothing();
  revalidatePath("/team");
}

export async function leaveTeam(teamId: number) {
  const user = await getSession();
  if (!user) return;
  await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id)));
  revalidatePath("/team");
}

export async function addMember(teamId: number, userId: number) {
  await db.insert(teamMembers).values({ teamId, userId }).onConflictDoNothing();
  revalidatePath("/team");
}

export async function removeMember(teamId: number, userId: number) {
  await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  revalidatePath("/team");
}

export async function getTeams() {
  return db.select().from(teams).orderBy(teams.createdAt);
}

export async function getMyTeams(userId: number) {
  return db
    .select({ id: teams.id, name: teams.name, ownerId: teams.ownerId, createdAt: teams.createdAt })
    .from(teams)
    .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, userId));
}

export async function getTeamMembers(teamId: number) {
  return db
    .select({
      id: users.id, name: users.name, email: users.email,
      image: users.image, role: users.role, joinedAt: teamMembers.joinedAt,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId));
}

export async function getAllUsers() {
  return db.select({ id: users.id, name: users.name, email: users.email, image: users.image }).from(users);
}

export async function getSharedTeams(userIdA: number, userIdB: number) {
  const myTeams = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userIdA));

  const theirTeams = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userIdB));

  const myIds = new Set(myTeams.map((t) => t.teamId));
  const sharedIds = theirTeams.filter((t) => myIds.has(t.teamId)).map((t) => t.teamId);

  if (sharedIds.length === 0) return [];

  return db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(inArray(teams.id, sharedIds));
}
