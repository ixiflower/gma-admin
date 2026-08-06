"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { teams, teamMembers, teamInvites, teamTasks, projects, teamNotes, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

export async function createTeam(name: string, description?: string, image?: string) {
  const user = await getSession();
  if (!user || !name.trim()) return null;
  const [team] = await db
    .insert(teams)
    .values({
      name: name.trim(),
      description: description?.trim() || null,
      image: image?.trim() || null,
      ownerId: user.id,
    })
    .returning();
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
  const file = formData.get("file") as File;
  if (!file || !file.size) return null;
  const url = await uploadImage(file);
  // teamId is optional: when creating a team there's no team yet — just return
  // the Cloudinary URL and let createTeam store it on insert.
  const teamId = Number(formData.get("teamId"));
  if (teamId) {
    await db.update(teams).set({ image: url }).where(eq(teams.id, teamId));
  }
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
  const user = await getSession();
  if (!user) return { error: "Not authenticated." };

  if (userId === user.id) return { error: "You cannot invite yourself." };

  // Make sure the current user owns the team before sending an invite.
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) return { error: "Team not found." };
  if (team.ownerId !== user.id) return { error: "Only the owner can invite members." };

  // Already a member? Nothing to do.
  const [existingMember] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  if (existingMember) return { error: "User is already a member." };

  // Don't create duplicate pending invites.
  const [existingInvite] = await db
    .select()
    .from(teamInvites)
    .where(
      and(
        eq(teamInvites.teamId, teamId),
        eq(teamInvites.inviteeId, userId),
        eq(teamInvites.status, "pending"),
      ),
    );
  if (existingInvite) return { error: "Invite already sent." };

  await db.insert(teamInvites).values({ teamId, inviterId: user.id, inviteeId: userId });
  revalidatePath("/team");
  return {};
}

export async function acceptInvite(inviteId: number) {
  const user = await getSession();
  if (!user) return { error: "Not authenticated." };

  const [invite] = await db.select().from(teamInvites).where(eq(teamInvites.id, inviteId));
  if (!invite) return { error: "Invite not found." };
  if (invite.inviteeId !== user.id) return { error: "This invite is not for you." };
  if (invite.status !== "pending") return { error: "Invite already handled." };

  await db
    .update(teamInvites)
    .set({ status: "accepted" })
    .where(eq(teamInvites.id, inviteId));
  await db
    .insert(teamMembers)
    .values({ teamId: invite.teamId, userId: user.id })
    .onConflictDoNothing();

  revalidatePath("/team");
  return {};
}

export async function declineInvite(inviteId: number) {
  const user = await getSession();
  if (!user) return { error: "Not authenticated." };

  const [invite] = await db.select().from(teamInvites).where(eq(teamInvites.id, inviteId));
  if (!invite) return { error: "Invite not found." };
  if (invite.inviteeId !== user.id) return { error: "This invite is not for you." };
  if (invite.status !== "pending") return { error: "Invite already handled." };

  await db
    .update(teamInvites)
    .set({ status: "declined" })
    .where(eq(teamInvites.id, inviteId));

  revalidatePath("/team");
  return {};
}

export type TeamInviteWithDetails = {
  id: number;
  teamId: number;
  teamName: string;
  teamImage: string | null;
  inviterId: number;
  inviterName: string;
  status: string;
  createdAt: Date;
};

export async function getPendingInvites(): Promise<TeamInviteWithDetails[]> {
  const user = await getSession();
  if (!user) return [];

  const rows = await db
    .select({
      id: teamInvites.id,
      teamId: teamInvites.teamId,
      teamName: teams.name,
      teamImage: teams.image,
      inviterId: teamInvites.inviterId,
      inviterName: users.name,
      status: teamInvites.status,
      createdAt: teamInvites.createdAt,
    })
    .from(teamInvites)
    .innerJoin(teams, eq(teamInvites.teamId, teams.id))
    .innerJoin(users, eq(teamInvites.inviterId, users.id))
    .where(and(eq(teamInvites.inviteeId, user.id), eq(teamInvites.status, "pending")))
    .orderBy(desc(teamInvites.createdAt));

  return rows;
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

export async function getGitHubRepos() {
  const user = await getSession();
  if (!user?.githubToken) return null;
  try {
    const res = await fetch("https://api.github.com/user/repos?per_page=50&sort=updated", {
      headers: {
        Authorization: `Bearer ${user.githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      id: number;
      name: string;
      full_name: string;
      description: string | null;
      html_url: string;
      private: boolean;
    }[];
  } catch {
    return null;
  }
}

export async function getTeamMembers(teamId: number) {
  return db
    .select({
      id: users.id, name: users.name, email: users.email,
      image: users.image, role: teamMembers.role, joinedAt: teamMembers.joinedAt,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId));
}

export async function changeMemberRole(teamId: number, userId: number, role: string) {
  const user = await getSession();
  if (!user) return { error: "Not authenticated." };
  if (!["viewer", "moderator", "developer", "admin"].includes(role)) return { error: "Invalid role." };

  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) return { error: "Team not found." };
  if (team.ownerId !== user.id) return { error: "Only the owner can change roles." };
  if (userId === team.ownerId) return { error: "Cannot change the owner's role." };

  await db
    .update(teamMembers)
    .set({ role })
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  revalidatePath("/team");
  return {};
}

export async function isTeamOwner(teamId: number) {
  const user = await getSession();
  if (!user) return false;
  const [team] = await db.select({ ownerId: teams.ownerId }).from(teams).where(eq(teams.id, teamId));
  return team?.ownerId === user.id;
}

// ---- Team tasks ----

export async function getTeamTasks(teamId: number) {
  return db
    .select({
      id: teamTasks.id,
      teamId: teamTasks.teamId,
      title: teamTasks.title,
      description: teamTasks.description,
      status: teamTasks.status,
      priority: teamTasks.priority,
      assigneeId: teamTasks.assigneeId,
      createdById: teamTasks.createdById,
      position: teamTasks.position,
      createdAt: teamTasks.createdAt,
      assigneeName: users.name,
      assigneeImage: users.image,
    })
    .from(teamTasks)
    .leftJoin(users, eq(teamTasks.assigneeId, users.id))
    .where(eq(teamTasks.teamId, teamId))
    .orderBy(teamTasks.position, teamTasks.id);
}

export async function createTeamTask(
  teamId: number,
  data: { title: string; description?: string; priority?: string; assigneeId?: number | null },
) {
  const user = await getSession();
  if (!user || !data.title?.trim()) return null;
  const [agg] = await db
    .select({ m: sql<number>`COALESCE(MAX(${teamTasks.position}), -1)` })
    .from(teamTasks)
    .where(eq(teamTasks.teamId, teamId));
  const [row] = await db
    .insert(teamTasks)
    .values({
      teamId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      priority: data.priority || "medium",
      assigneeId: data.assigneeId ?? null,
      createdById: user.id,
      position: agg.m + 1,
    })
    .returning();
  revalidatePath("/team");
  return row;
}

export async function updateTeamTask(
  id: number,
  data: { title?: string; description?: string; status?: string; priority?: string; assigneeId?: number | null },
) {
  await db.update(teamTasks).set(data).where(eq(teamTasks.id, id));
  revalidatePath("/team");
}

export async function deleteTeamTask(id: number) {
  await db.delete(teamTasks).where(eq(teamTasks.id, id));
  revalidatePath("/team");
}

// ---- Team projects ----

export async function getTeamProjects(teamId: number) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.teamId, teamId))
    .orderBy(projects.createdAt);
}

export async function createTeamProject(
  teamId: number,
  data: { name: string; description?: string; status?: string; color?: string },
) {
  const user = await getSession();
  if (!user || !data.name?.trim()) return null;
  const [row] = await db
    .insert(projects)
    .values({
      teamId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      status: data.status || "active",
      color: data.color || "#6366f1",
      createdById: user.id,
    })
    .returning();
  revalidatePath("/team");
  return row;
}

export async function updateTeamProject(
  id: number,
  data: { name?: string; description?: string; status?: string; color?: string },
) {
  await db.update(projects).set({ ...data, updatedAt: new Date() }).where(eq(projects.id, id));
  revalidatePath("/team");
}

export async function deleteTeamProject(id: number) {
  await db.delete(projects).where(eq(projects.id, id));
  revalidatePath("/team");
}

export async function importRepoToTeam(
  teamId: number,
  data: { name: string; description?: string | null; repoName?: string | null; repoUrl?: string | null; color?: string; status?: string },
) {
  const user = await getSession();
  if (!user) return { error: "Not authenticated." };

  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id)));
  if (!membership) return { error: "You are not a member of this team." };

  const [row] = await db
    .insert(projects)
    .values({
      teamId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      repoName: data.repoName || null,
      repoUrl: data.repoUrl || null,
      color: data.color || "#6366f1",
      status: data.status || "active",
      createdById: user.id,
    })
    .returning();
  revalidatePath("/team");
  revalidatePath("/projects");
  return { project: row };
}

// ---- Team notes ----

export async function getTeamNotes(teamId: number) {
  return db
    .select({
      id: teamNotes.id,
      teamId: teamNotes.teamId,
      title: teamNotes.title,
      content: teamNotes.content,
      createdById: teamNotes.createdById,
      createdAt: teamNotes.createdAt,
      updatedAt: teamNotes.updatedAt,
      authorName: users.name,
    })
    .from(teamNotes)
    .innerJoin(users, eq(teamNotes.createdById, users.id))
    .where(eq(teamNotes.teamId, teamId))
    .orderBy(desc(teamNotes.updatedAt));
}

export async function createTeamNote(teamId: number, title: string, content?: string) {
  const user = await getSession();
  if (!user) return null;
  const [row] = await db
    .insert(teamNotes)
    .values({
      teamId,
      title: title.trim() || "Untitled",
      content: content ?? "",
      createdById: user.id,
    })
    .returning();
  revalidatePath("/team");
  return row;
}

export async function updateTeamNote(id: number, title: string, content?: string) {
  await db
    .update(teamNotes)
    .set({ title: title.trim() || "Untitled", content: content ?? "", updatedAt: new Date() })
    .where(eq(teamNotes.id, id));
  revalidatePath("/team");
}

export async function deleteTeamNote(id: number) {
  await db.delete(teamNotes).where(eq(teamNotes.id, id));
  revalidatePath("/team");
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
