"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { teams, teamMembers, users } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function createTeam(name: string) {
  const user = await getSession();
  if (!user || !name.trim()) return null;
  const [team] = await db.insert(teams).values({ name: name.trim(), ownerId: user.id }).returning();
  await db.insert(teamMembers).values({ teamId: team.id, userId: user.id });
  revalidatePath("/team");
  return team;
}

export async function deleteTeam(teamId: number) {
  await db.delete(teams).where(eq(teams.id, teamId));
  revalidatePath("/team");
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
  const rows = await db.execute(
    sql`SELECT t.id, t.name FROM teams t JOIN team_members tm1 ON t.id = tm1.team_id AND tm1.user_id = ${userIdA} JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.user_id = ${userIdB}`
  );
  return rows.rows as { id: number; name: string }[];
}
