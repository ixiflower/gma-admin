"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Users, Trash2, LogIn, LogOut, UserPlus, Crown,
  AtSign, Calendar, Pencil, FileText, Image, Upload, MessageCircle,
  ClipboardList, FolderKanban, NotebookPen, CheckCircle2, Circle,
  Shield, Eye, Code2, ShieldCheck, X,
} from "lucide-react";

import {
  getTeams, getTeamMembers, getAllUsers, createTeam, deleteTeam,
  joinTeam, leaveTeam, addMember, removeMember, updateTeam, uploadTeamImage,
  getTeamTasks, createTeamTask, updateTeamTask, deleteTeamTask,
  getTeamProjects, createTeamProject, updateTeamProject, deleteTeamProject,
  getTeamNotes, createTeamNote, updateTeamNote, deleteTeamNote,
  changeMemberRole, getGitHubRepos, importRepoToTeam,
} from "@/app/(dash)/team/actions";
import {
  Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
  Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator,
  Tabs, TabsList, TabsTrigger, Textarea,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { toast } from "sonner";

type Team = { id: number; name: string; description: string | null; image: string | null; ownerId: number; createdAt: Date };
type Member = { id: number; name: string; email: string; image: string | null; role: string; joinedAt: Date };
type AllUser = { id: number; name: string; email: string; image: string | null };
type TeamTab = "overview" | "tasks" | "projects" | "notes";

type TeamTask = {
  id: number; teamId: number; title: string; description: string | null;
  status: string; priority: string; assigneeId: number | null; createdById: number;
  position: number; createdAt: Date; assigneeName: string | null; assigneeImage: string | null;
};

type TeamProject = {
  id: number; teamId: number; name: string; description: string | null;
  status: string; color: string; createdById: number; createdAt: Date; updatedAt: Date;
};

type TeamNote = {
  id: number; teamId: number; title: string; content: string | null;
  createdById: number; createdAt: Date; updatedAt: Date; authorName: string;
};

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
};

interface ContextMenu {
  x: number;
  y: number;
  team: Team;
}

interface MemberContextMenu {
  x: number;
  y: number;
  member: Member;
}

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number>(0);

  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [newTeamImage, setNewTeamImage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedAddUser, setSelectedAddUser] = useState("");
  const [addMemberSearch, setAddMemberSearch] = useState("");

  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [memberContextMenu, setMemberContextMenu] = useState<MemberContextMenu | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [teamTab, setTeamTab] = useState<TeamTab>("overview");
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [projects, setProjects] = useState<TeamProject[]>([]);
  const [notes, setNotes] = useState<TeamNote[]>([]);

  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskAssignee, setTaskAssignee] = useState("");

  const [projectOpen, setProjectOpen] = useState(false);
  const [projectEditId, setProjectEditId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectStatus, setProjectStatus] = useState("active");
  const [projectColor, setProjectColor] = useState("#6366f1");
  const [ghRepos, setGhRepos] = useState<GitHubRepo[] | null>(null);
  const [ghRepo, setGhRepo] = useState<GitHubRepo | null>(null);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteEditId, setNoteEditId] = useState<number | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const [roleDialogUser, setRoleDialogUser] = useState<Member | null>(null);
  const [roleDialogRole, setRoleDialogRole] = useState("viewer");

  const loadTeamData = useCallback(async (teamId: number) => {
    const [m, t, p, n] = await Promise.all([
      getTeamMembers(teamId),
      getTeamTasks(teamId),
      getTeamProjects(teamId),
      getTeamNotes(teamId),
    ]);
    setMembers(m);
    setTasks(t);
    setProjects(p);
    setNotes(n);
  }, []);

  const refresh = useCallback(async () => {
    const [t, u, s] = await Promise.all([getTeams(), getAllUsers(), getSession()]);
    setTeams(t);
    setAllUsers(u);
    if (s) setCurrentUserId(s.id);
    // Auto-open the last selected team from the cookie, if it still exists.
    const cookie = document.cookie.split("; ").find((r) => r.startsWith("team_selected="));
    const savedId = cookie ? Number(cookie.split("=")[1]) : NaN;
    const target = t.find((team) => team.id === savedId);
    if (target) {
      setSelectedTeam(target);
      loadTeamData(target.id);
    }
  }, [loadTeamData]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSelect = (t: Team) => {
    setSelectedTeam(t);
    setContextMenu(null);
    loadTeamData(t.id);
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `team_selected=${t.id}; path=/; max-age=31536000`;
  };

  useEffect(() => {
    const handler = () => {
      setContextMenu(null);
      setMemberContextMenu(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    setAddMemberSearch("");
    setSelectedAddUser("");
  }, [addMemberOpen]);

  const ownedTeams = teams.filter((t) => t.ownerId === currentUserId);
  const joinedTeams = teams.filter((t) =>
    t.ownerId !== currentUserId && members.some((m) => m.id === currentUserId)
  );
  const isOwner = (t: Team) => t.ownerId === currentUserId;
  const isMember = (t: Team) => members.some((m) => m.id === currentUserId);

  const handleContextMenu = (e: React.MouseEvent, t: Team) => {
    if (!isOwner(t)) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, team: t });
  };

  const handleMemberContextMenu = (e: React.MouseEvent, m: Member) => {
    if (!selectedTeam) return;
    if (m.id === currentUserId) return; // no menu on yourself
    e.preventDefault();
    e.stopPropagation();
    setMemberContextMenu({ x: e.clientX, y: e.clientY, member: m });
  };

  const handleCreate = async () => {
    if (!newTeamName.trim()) return;
    const t = await createTeam(newTeamName, newTeamDesc || undefined, newTeamImage || undefined);
    if (t) {
      setNewTeamName("");
      setNewTeamDesc("");
      setNewTeamImage("");
      setCreateOpen(false);
      setSelectedTeam(t);
      // eslint-disable-next-line react-hooks/immutability
      document.cookie = `team_selected=${t.id}; path=/; max-age=31536000`;
      await refresh();
      await loadTeamData(t.id);
    }
  };

  const handleDelete = async (t: Team) => {
    await deleteTeam(t.id);
    setContextMenu(null);
    if (selectedTeam?.id === t.id) {
      setSelectedTeam(null);
      setMembers([]);
      setTasks([]);
      setProjects([]);
      setNotes([]);
    }
    refresh();
  };

  const handleEdit = async () => {
    if (!editTeam || !editName.trim()) return;
    await updateTeam(editTeam.id, {
      name: editName.trim(),
      description: editDesc.trim() || undefined,
      image: editImage.trim() || undefined,
    });
    setEditOpen(false);
    setEditTeam(null);
    setContextMenu(null);
    refresh();
    if (selectedTeam?.id === editTeam.id) {
      const updated = teams.find((t) => t.id === editTeam.id);
      if (updated) setSelectedTeam(updated);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editTeam) return;
    const fd = new FormData();
    fd.set("teamId", String(editTeam.id));
    fd.set("file", file);
    const url = await uploadTeamImage(fd);
    if (url) {
      setEditImage(url);
      refresh();
      if (selectedTeam?.id === editTeam.id) {
        setSelectedTeam((prev) => prev ? { ...prev, image: url } : null);
      }
    }
    e.target.value = "";
  };

  const handleCreateImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    const url = await uploadTeamImage(fd);
    if (url) setNewTeamImage(url);
    e.target.value = "";
  };

  const openEdit = (t: Team) => {
    setEditTeam(t);
    setEditName(t.name);
    setEditDesc(t.description ?? "");
    setEditImage(t.image ?? "");
    setEditOpen(true);
    setContextMenu(null);
  };

  const handleJoin = async (t: Team) => {
    await joinTeam(t.id);
    if (selectedTeam?.id === t.id) loadTeamData(t.id);
    refresh();
  };

  const handleLeave = async (t: Team) => {
    await leaveTeam(t.id);
    if (selectedTeam?.id === t.id) {
      setSelectedTeam(null);
      setMembers([]);
      setTasks([]);
      setProjects([]);
      setNotes([]);
    }
    refresh();
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedAddUser) return;
    await addMember(selectedTeam.id, Number(selectedAddUser));
    setSelectedAddUser("");
    setAddMemberSearch("");
    setAddMemberOpen(false);
    loadTeamData(selectedTeam.id);
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedTeam) return;
    await removeMember(selectedTeam.id, userId);
    loadTeamData(selectedTeam.id);
  };

  const handleChangeRole = async (userId: number, role: string) => {
    if (!selectedTeam) return;
    await changeMemberRole(selectedTeam.id, userId, role);
    setMemberContextMenu(null);
    loadTeamData(selectedTeam.id);
  };

  const openRoleDialog = (m: Member) => {
    setRoleDialogUser(m);
    setRoleDialogRole(m.role === "admin" || m.role === "viewer" || m.role === "moderator" || m.role === "developer" ? m.role : "viewer");
    setMemberContextMenu(null);
  };

  const handleSaveRole = async () => {
    if (!roleDialogUser) return;
    await handleChangeRole(roleDialogUser.id, roleDialogRole);
    setRoleDialogUser(null);
  };

  const openTaskDialog = () => {
    setTaskTitle("");
    setTaskDesc("");
    setTaskPriority("medium");
    setTaskAssignee("");
    setTaskOpen(true);
  };

  const handleCreateTask = async () => {
    if (!selectedTeam || !taskTitle.trim()) return;
    await createTeamTask(selectedTeam.id, {
      title: taskTitle,
      description: taskDesc,
      priority: taskPriority,
      assigneeId: taskAssignee ? Number(taskAssignee) : null,
    });
    setTaskOpen(false);
    loadTeamData(selectedTeam.id);
  };

  const handleUpdateTask = async (id: number, data: { status?: string; priority?: string; assigneeId?: number | null }) => {
    if (!selectedTeam) return;
    await updateTeamTask(id, data);
    loadTeamData(selectedTeam.id);
  };

  const handleDeleteTask = async (id: number) => {
    if (!selectedTeam) return;
    await deleteTeamTask(id);
    loadTeamData(selectedTeam.id);
  };

  const openProjectDialog = (p?: TeamProject) => {
    setProjectEditId(p?.id ?? null);
    setProjectName(p?.name ?? "");
    setProjectDesc(p?.description ?? "");
    setProjectStatus(p?.status ?? "active");
    setProjectColor(p?.color ?? "#6366f1");
    setGhRepo(null);
    setProjectOpen(true);
    if (!p && ghRepos === null) {
      getGitHubRepos().then((repos) => setGhRepos(repos ?? []));
    }
  };

  const handleSaveProject = async () => {
    if (!selectedTeam || !projectName.trim()) return;
    if (projectEditId) {
      await updateTeamProject(projectEditId, {
        name: projectName,
        description: projectDesc,
        status: projectStatus,
        color: projectColor,
      });
    } else if (ghRepo) {
      await importRepoToTeam(selectedTeam.id, {
        name: projectName,
        description: projectDesc,
        repoName: ghRepo.full_name,
        repoUrl: ghRepo.html_url,
        color: projectColor,
        status: projectStatus,
      });
    } else {
      await createTeamProject(selectedTeam.id, {
        name: projectName,
        description: projectDesc,
        status: projectStatus,
        color: projectColor,
      });
    }
    setProjectOpen(false);
    setProjectEditId(null);
    setGhRepo(null);
    loadTeamData(selectedTeam.id);
  };

  const handleDeleteProject = async (id: number) => {
    if (!selectedTeam) return;
    await deleteTeamProject(id);
    loadTeamData(selectedTeam.id);
  };

  const openNoteDialog = (n?: TeamNote) => {
    setNoteEditId(n?.id ?? null);
    setNoteTitle(n?.title ?? "");
    setNoteContent(n?.content ?? "");
    setNoteOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedTeam) return;
    if (noteEditId) {
      await updateTeamNote(noteEditId, noteTitle, noteContent);
    } else {
      await createTeamNote(selectedTeam.id, noteTitle, noteContent);
    }
    setNoteOpen(false);
    setNoteEditId(null);
    loadTeamData(selectedTeam.id);
  };

  const handleDeleteNote = async (id: number) => {
    if (!selectedTeam) return;
    await deleteTeamNote(id);
    loadTeamData(selectedTeam.id);
  };

  const canManage = (t: Team) => isOwner(t) || members.some((m) => m.id === currentUserId);

  return (
    <div className="flex flex-1 flex-row gap-0 overflow-hidden">
      <div className="flex w-60 shrink-0 flex-col border-r">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-xs font-semibold text-muted-foreground">Teams</span>
          <CreateTeamDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            name={newTeamName}
            onNameChange={setNewTeamName}
            desc={newTeamDesc}
            onDescChange={setNewTeamDesc}
            image={newTeamImage}
            onImageChange={setNewTeamImage}
            onImageUpload={handleCreateImageUpload}
            onCreate={handleCreate}
          />
        </div>
        <Separator />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2">
          {teams.length === 0 && (
            <p className="px-2 py-8 text-center text-xs text-muted-foreground">No teams yet</p>
          )}

          {ownedTeams.length > 0 && (
            <>
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground/60">Your teams</p>
              {ownedTeams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  onContextMenu={(e) => handleContextMenu(e, t)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent ${
                    selectedTeam?.id === t.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  {t.image ? (
                    <img src={t.image} className="size-5 shrink-0 rounded object-cover" alt="" />
                  ) : (
                    <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10">
                      <Crown className="size-3 text-amber-500" />
                    </div>
                  )}
                  <span className="flex-1 truncate">{t.name}</span>
                </button>
              ))}
            </>
          )}

          {joinedTeams.length > 0 && (
            <>
              <p className="px-2 pb-1.5 pt-2 text-[10px] font-semibold uppercase text-muted-foreground/60">Joined</p>
              {joinedTeams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent ${
                    selectedTeam?.id === t.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10">
                    <Users className="size-3 text-primary" />
                  </div>
                  <span className="flex-1 truncate">{t.name}</span>
                </button>
              ))}
            </>
          )}

          {teams.filter((t) => t.ownerId !== currentUserId && !members.some((m) => m.id === currentUserId)).length > 0 && (
            <>
              <p className="px-2 pb-1.5 pt-2 text-[10px] font-semibold uppercase text-muted-foreground/60">Discover</p>
              {teams.filter((t) => t.ownerId !== currentUserId && !members.some((m) => m.id === currentUserId)).map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent ${
                    selectedTeam?.id === t.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  <div className="flex size-5 shrink-0 items-center justify-center rounded bg-muted">
                    <Users className="size-3" />
                  </div>
                  <span className="flex-1 truncate">{t.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0 overflow-hidden">
        {selectedTeam ? (
          <>
            <div className="flex items-center justify-between px-2 pb-3 pt-1">
              <div className="flex items-center gap-3">
                {selectedTeam.image ? (
                  <img src={selectedTeam.image} className="size-10 shrink-0 rounded-lg object-cover" alt="" />
                ) : (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="size-5 text-primary" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold">{selectedTeam.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {isOwner(selectedTeam) ? "You own this team" : isMember(selectedTeam) ? "You are a member" : "You can join this team"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isOwner(selectedTeam) && (
                  <>
                    <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                      <DialogTrigger render={<Button size="xs" variant="outline" className="h-7 gap-1 text-xs"><UserPlus className="size-3" /> Add member</Button>} />
                      <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                          <DialogTitle>Add member</DialogTitle>
                          <DialogDescription>Search for a user to add to {selectedTeam.name}.</DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor="add-member-search">Search users</Label>
                            <Input
                              id="add-member-search"
                              value={addMemberSearch}
                              onChange={(e) => setAddMemberSearch(e.target.value)}
                              placeholder="Search by name or email..."
                              autoFocus
                            />
                          </div>
                          <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                            {addMemberSearch ? (
                              <>
                                {allUsers
                                  .filter((u) => !members.some((m) => m.id === u.id) && u.id !== currentUserId)
                                  .filter((u) =>
                                    u.name.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
                                    u.email.toLowerCase().includes(addMemberSearch.toLowerCase())
                                  )
                                  .map((u) => (
                                    <button
                                      key={u.id}
                                      type="button"
                                      onClick={() => setSelectedAddUser(String(u.id))}
                                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                                        selectedAddUser === String(u.id) ? "bg-accent text-accent-foreground" : ""
                                      }`}
                                    >
                                      <Avatar className="size-6">
                                        <AvatarImage src={u.image ?? undefined} />
                                        <AvatarFallback className="text-xs">{u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0 text-left">
                                        <p className="font-medium truncate">{u.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                      </div>
                                    </button>
                                  ))
                                }
                                {allUsers.filter((u) => !members.some((m) => m.id === u.id) && u.id !== currentUserId).filter((u) =>
                                  u.name.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
                                  u.email.toLowerCase().includes(addMemberSearch.toLowerCase())
                                ).length === 0 && (
                                  <p className="text-center text-sm text-muted-foreground py-4">No users found</p>
                                )}
                              </>
                            ) : (
                              <p className="text-center text-sm text-muted-foreground py-4">Start typing to search for users...</p>
                            )}
                            {allUsers.filter((u) => !members.some((m) => m.id === u.id) && u.id !== currentUserId).length === 0 && (
                              <p className="text-center text-sm text-muted-foreground py-4">All users are already members</p>
                            )}
                          </div>
                          <Button onClick={handleAddMember} disabled={!selectedAddUser}>Add</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="xs" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => openEdit(selectedTeam)}>
                      <Pencil className="size-3" /> Edit
                    </Button>
                    <Button size="xs" variant="destructive" className="h-7 gap-1 text-xs" onClick={() => handleDelete(selectedTeam)}>
                      <Trash2 className="size-3" /> Delete
                    </Button>
                  </>
                )}
                {!isOwner(selectedTeam) && (
                  isMember(selectedTeam) ? (
                    <Button size="xs" variant="outline" className="h-7 gap-1 text-xs" onClick={() => handleLeave(selectedTeam)}>
                      <LogOut className="size-3" /> Leave
                    </Button>
                  ) : (
                    <Button size="xs" className="h-7 gap-1 text-xs" onClick={() => handleJoin(selectedTeam)}>
                      <LogIn className="size-3" /> Join
                    </Button>
                  )
                )}
              </div>
            </div>
            <Separator />
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
                <Tabs value={teamTab} onValueChange={(v) => setTeamTab((v ?? "overview") as TeamTab)}>
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="tasks" className="gap-1"><ClipboardList className="size-3.5" /> Tasks</TabsTrigger>
                    <TabsTrigger value="projects" className="gap-1"><FolderKanban className="size-3.5" /> Projects</TabsTrigger>
                    <TabsTrigger value="notes" className="gap-1"><NotebookPen className="size-3.5" /> Notes</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-2">
                  {canManage(selectedTeam) && teamTab === "tasks" && (
                    <Button size="xs" className="h-7 gap-1 text-xs" onClick={openTaskDialog}><Plus className="size-3" /> New task</Button>
                  )}
                  {canManage(selectedTeam) && teamTab === "projects" && (
                    <Button size="xs" className="h-7 gap-1 text-xs" onClick={() => openProjectDialog()}><Plus className="size-3" /> New project</Button>
                  )}
                  {canManage(selectedTeam) && teamTab === "notes" && (
                    <Button size="xs" className="h-7 gap-1 text-xs" onClick={() => openNoteDialog()}><Plus className="size-3" /> New note</Button>
                  )}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {teamTab === "overview" && (
                  <div className="flex flex-col gap-6">
                    {selectedTeam.description && (
                      <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
                        <FileText className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                        <p className="text-sm text-muted-foreground">{selectedTeam.description}</p>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                          <Crown className="size-6 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Owner</p>
                          <p className="text-base font-semibold truncate">
                            {allUsers.find((u) => u.id === selectedTeam.ownerId)?.name ?? "Unknown"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                          <Users className="size-6 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Members</p>
                          <p className="text-base font-semibold">{members.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                          <Calendar className="size-6 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Created</p>
                          <p className="text-base font-semibold">
                            {new Date(selectedTeam.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-semibold">Members ({members.length})</h3>
                      <div className="flex flex-col gap-1">
                        {members.map((m) => (
                          <div
                            key={m.id}
                            onContextMenu={(e) => handleMemberContextMenu(e, m)}
                            className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50"
                          >
                            <Avatar className="size-8">
                              <AvatarImage src={m.image ?? undefined} />
                              <AvatarFallback className="text-xs">{m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{m.name}</p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <AtSign className="size-3" /> {m.email}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {m.id === selectedTeam.ownerId ? (
                                <Badge variant="outline" className="gap-1 text-[0.6rem]">
                                  <Crown className="size-3 text-amber-500" /> Owner
                                </Badge>
                              ) : (
                                m.role && (
                                  <Badge variant={m.role === "admin" ? "secondary" : "outline"} className="text-[0.6rem] capitalize">{m.role}</Badge>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                        {members.length === 0 && (
                          <p className="py-6 text-center text-sm text-muted-foreground">No members yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {teamTab === "tasks" && (
                  <div className="flex flex-col gap-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                        <button
                          onClick={() => handleUpdateTask(task.id, { status: task.status === "done" ? "todo" : "done" })}
                          className="shrink-0 text-muted-foreground transition-colors hover:text-emerald-500"
                          aria-label="Toggle done"
                        >
                          {task.status === "done" ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Circle className="size-4" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-medium ${task.status === "done" ? "text-muted-foreground line-through" : ""}`}>{task.title}</p>
                          {task.description && <p className="truncate text-xs text-muted-foreground">{task.description}</p>}
                        </div>
                        <Select value={task.priority} onValueChange={(v) => handleUpdateTask(task.id, { priority: v ?? "medium" })}>
                          <SelectTrigger className="h-7 w-[4.5rem] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">🟢 Low</SelectItem>
                            <SelectItem value="medium">🟡 Medium</SelectItem>
                            <SelectItem value="high">🔴 High</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={task.status} onValueChange={(v) => handleUpdateTask(task.id, { status: v ?? "todo" })}>
                          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To do</SelectItem>
                            <SelectItem value="in_progress">In progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={task.assigneeId ? String(task.assigneeId) : "none"}
                          onValueChange={(v) => handleUpdateTask(task.id, { assigneeId: v && v !== "none" ? Number(v) : null })}
                        >
                          <SelectTrigger className="h-7 w-32 text-xs"><SelectValue placeholder="Assign to..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {members.map((m) => (
                              <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {canManage(selectedTeam) && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Delete task"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
                        <ClipboardList className="size-6 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No tasks yet</p>
                      </div>
                    )}
                  </div>
                )}

                {teamTab === "projects" && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((p) => (
                      <div key={p.id} className="group flex flex-col gap-2 rounded-xl border bg-card p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="size-3 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                            <p className="truncate text-sm font-semibold">{p.name}</p>
                          </div>
                          {canManage(selectedTeam) && (
                            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                              <button onClick={() => openProjectDialog(p)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Edit project">
                                <Pencil className="size-3.5" />
                              </button>
                              <button onClick={() => handleDeleteProject(p.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete project">
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        {p.description && <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                        <div className="mt-auto flex items-center justify-between pt-1">
                          <Badge variant={p.status === "completed" ? "secondary" : "outline"} className="text-[0.6rem] capitalize">{p.status.replace("_", " ")}</Badge>
                          <span className="text-[0.6rem] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <div className="col-span-full flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
                        <FolderKanban className="size-6 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No projects yet</p>
                      </div>
                    )}
                  </div>
                )}

                {teamTab === "notes" && (
                  <div className="flex flex-col gap-2">
                    {notes.map((n) => (
                      <div key={n.id} className="group rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{n.title}</p>
                          {canManage(selectedTeam) && (
                            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                              <button onClick={() => openNoteDialog(n)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Edit note">
                                <Pencil className="size-3.5" />
                              </button>
                              <button onClick={() => handleDeleteNote(n.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete note">
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        {n.content && <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{n.content}</p>}
                        <p className="mt-2 text-[0.6rem] text-muted-foreground">
                          {n.authorName} · {new Date(n.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {notes.length === 0 && (
                      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
                        <NotebookPen className="size-6 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No notes yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="size-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Select a team</p>
              <p className="text-xs text-muted-foreground/60">Choose a team from the sidebar or create a new one</p>
              <CreateTeamDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                name={newTeamName}
                onNameChange={setNewTeamName}
                desc={newTeamDesc}
                onDescChange={setNewTeamDesc}
                image={newTeamImage}
                onImageChange={setNewTeamImage}
                onImageUpload={handleCreateImageUpload}
                onCreate={handleCreate}
              />
            </div>
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          ref={ctxRef}
          className="fixed z-50 min-w-36 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => openEdit(contextMenu.team)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
          <button
            onClick={() => handleDelete(contextMenu.team)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </div>
      )}

      {memberContextMenu && selectedTeam && (
        <div
          className="fixed z-50 min-w-36 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
          style={{ left: memberContextMenu.x, top: memberContextMenu.y }}
        >
          <button
            onClick={() => {
              router.push(`/chat?user=${memberContextMenu.member.id}`);
              setMemberContextMenu(null);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
          >
            <MessageCircle className="size-3.5" />
            Open chat
          </button>
          {isOwner(selectedTeam) && (
            <button
              onClick={() => {
                handleRemoveMember(memberContextMenu.member.id);
                setMemberContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
              Remove member
            </button>
          )}
          {isOwner(selectedTeam) && memberContextMenu.member.id !== selectedTeam.ownerId && (
            <button
              onClick={() => openRoleDialog(memberContextMenu.member)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
            >
              <Shield className="size-3.5" />
              Change role
            </button>
          )}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit team</DialogTitle>
            <DialogDescription>Update your team details.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-image">Profile image</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group/avatar flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted transition-colors hover:border-primary"
                >
                  {editImage.trim() ? (
                    <img src={editImage.trim()} className="size-full object-cover" alt="" />
                  ) : (
                    <Upload className="size-5 text-muted-foreground transition-colors group-hover/avatar:text-primary" />
                  )}
                </button>
                <Input
                  id="edit-image"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea id="edit-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} placeholder="What's this team about?" />
            </div>
            <Button onClick={handleEdit} disabled={!editName.trim()}>Save changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialogUser !== null} onOpenChange={(v) => { if (!v) setRoleDialogUser(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Change role</DialogTitle>
            <DialogDescription>
              Choose the permission level for this member.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
              <Avatar className="size-10">
                <AvatarImage src={roleDialogUser?.image ?? undefined} />
                <AvatarFallback className="text-sm">
                  {roleDialogUser?.name.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{roleDialogUser?.name ?? "Member"}</p>
                <p className="truncate text-xs text-muted-foreground">{roleDialogUser?.email}</p>
              </div>
              <Badge variant="secondary" className="ml-auto shrink-0 text-[0.6rem] capitalize">
                {roleDialogRole}
              </Badge>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { value: "viewer", label: "Viewer", desc: "Can view tasks, projects and notes", icon: Eye, tint: "bg-sky-500/10 text-sky-500" },
                { value: "moderator", label: "Moderator", desc: "Manages members and team content", icon: ShieldCheck, tint: "bg-violet-500/10 text-violet-500" },
                { value: "developer", label: "Developer", desc: "Creates and edits tasks, projects and notes", icon: Code2, tint: "bg-emerald-500/10 text-emerald-500" },
                { value: "admin", label: "Admin (Owner)", desc: "Full access to everything", icon: Crown, tint: "bg-amber-500/10 text-amber-500" },
              ].map((r) => {
                const Icon = r.icon;
                const selected = roleDialogRole === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRoleDialogRole(r.value)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                        : "border-border hover:border-primary/40 hover:bg-muted/40"
                    }`}
                  >
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${r.tint}`}>
                      <Icon className="size-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                      }`}
                    >
                      {selected && <CheckCircle2 className="size-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setRoleDialogUser(null)}>
                <X className="size-3.5" /> Cancel
              </Button>
              <Button size="sm" className="h-8" onClick={handleSaveRole} disabled={!roleDialogUser}>
                <Shield className="size-3.5" /> Save role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>Add a task to {selectedTeam?.name}.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="What needs to be done?" autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea id="task-desc" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={2} placeholder="Optional details..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Priority</Label>
                <Select value={taskPriority} onValueChange={(v) => setTaskPriority(v ?? "medium")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🔴 High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Assignee</Label>
                <Select value={taskAssignee} onValueChange={(v) => setTaskAssignee(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateTask} disabled={!taskTitle.trim()}>Create task</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={projectOpen} onOpenChange={setProjectOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{projectEditId ? "Edit project" : "New project"}</DialogTitle>
            <DialogDescription>Add a project to {selectedTeam?.name}.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {!projectEditId && ghRepos && ghRepos.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>Import from GitHub</Label>
                <Select
                  onValueChange={(v) => {
                    const repo = ghRepos.find((r) => r.full_name === v);
                    if (repo) {
                      setGhRepo(repo);
                      setProjectName(repo.name);
                      setProjectDesc(repo.description ?? "");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={ghRepo ? ghRepo.full_name : "Choose a repository..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {ghRepos.map((r) => (
                      <SelectItem key={r.id} value={r.full_name}>
                        {r.full_name}
                        {r.private && <span className="ml-1 text-[0.6rem] text-muted-foreground">(Private)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {ghRepo && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-6 w-fit px-2 text-xs text-muted-foreground"
                    onClick={() => {
                      setGhRepo(null);
                      setProjectName("");
                      setProjectDesc("");
                    }}
                  >
                    <X className="size-3" /> Clear selection
                  </Button>
                )}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-name">Name</Label>
              <Input id="project-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Website redesign" autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-desc">Description</Label>
              <Textarea id="project-desc" value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} rows={2} placeholder="Optional details..." />
            </div>
            <div className="grid grid-cols-2 items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select value={projectStatus} onValueChange={(v) => setProjectStatus(v ?? "active")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-color">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="project-color"
                    type="color"
                    value={projectColor}
                    onChange={(e) => setProjectColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border bg-transparent"
                  />
                  <Input value={projectColor} onChange={(e) => setProjectColor(e.target.value)} className="flex-1 font-mono text-xs" />
                </div>
              </div>
            </div>
            <Button onClick={handleSaveProject} disabled={!projectName.trim()}>
              {projectEditId ? "Save changes" : "Create project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{noteEditId ? "Edit note" : "New note"}</DialogTitle>
            <DialogDescription>Add a note to {selectedTeam?.name}.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note-title">Title</Label>
              <Input id="note-title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title" autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note-content">Content</Label>
              <Textarea id="note-content" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={8} placeholder="Write your note..." />
            </div>
            <Button onClick={handleSaveNote}>
              {noteEditId ? "Save changes" : "Create note"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateTeamDialog({
  open, onOpenChange, name, onNameChange, desc, onDescChange, image, onImageChange, onImageUpload, onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  name: string;
  onNameChange: (v: string) => void;
  desc: string;
  onDescChange: (v: string) => void;
  image: string;
  onImageChange: (v: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreate: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm"><Plus className="size-3.5" /></Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
          <DialogDescription>Set up a new team to collaborate with others.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-image">Profile image</Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group/avatar flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted transition-colors hover:border-primary"
              >
                {image.trim() ? (
                  <img src={image.trim()} className="size-full object-cover" alt="" />
                ) : (
                  <Upload className="size-5 text-muted-foreground transition-colors group-hover/avatar:text-primary" />
                )}
              </button>
              <Input
                id="create-image"
                value={image}
                onChange={(e) => onImageChange(e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="flex-1"
              />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImageUpload}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-name">Team name</Label>
            <Input id="team-name" value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="e.g. Frontend team" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-desc">Description</Label>
            <Textarea id="team-desc" value={desc} onChange={(e) => onDescChange(e.target.value)} rows={3} placeholder="What's this team about?" />
          </div>
          <Button onClick={onCreate} disabled={!name.trim()}>Create team</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
