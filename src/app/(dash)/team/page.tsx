"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Users, Trash2, LogIn, LogOut, UserPlus, Crown,
  AtSign, Calendar, Pencil, FileText, Image, Upload,
} from "lucide-react";

import {
  getTeams, getTeamMembers, getAllUsers, createTeam, deleteTeam,
  joinTeam, leaveTeam, addMember, removeMember, updateTeam, uploadTeamImage,
} from "@/app/(dash)/team/actions";
import {
  Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
  Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator,
  Textarea,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { toast } from "sonner";

type Team = { id: number; name: string; description: string | null; image: string | null; ownerId: number; createdAt: Date };
type Member = { id: number; name: string; email: string; image: string | null; role: string; joinedAt: Date };
type AllUser = { id: number; name: string; email: string; image: string | null };

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

  const refresh = useCallback(async () => {
    const [t, u, s] = await Promise.all([getTeams(), getAllUsers(), getSession()]);
    setTeams(t);
    setAllUsers(u);
    if (s) setCurrentUserId(s.id);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    setAddMemberSearch("");
    setSelectedAddUser("");
  }, [addMemberOpen]);

  const loadMembers = useCallback(async (teamId: number) => {
    const m = await getTeamMembers(teamId);
    setMembers(m);
  }, []);

  const ownedTeams = teams.filter((t) => t.ownerId === currentUserId);
  const joinedTeams = teams.filter((t) =>
    t.ownerId !== currentUserId && members.some((m) => m.id === currentUserId)
  );
  const isOwner = (t: Team) => t.ownerId === currentUserId;
  const isMember = (t: Team) => members.some((m) => m.id === currentUserId);

  const handleSelect = (t: Team) => {
    setSelectedTeam(t);
    setContextMenu(null);
    loadMembers(t.id);
  };

  const handleContextMenu = (e: React.MouseEvent, t: Team) => {
    if (!isOwner(t)) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, team: t });
  };

  const handleMemberContextMenu = (e: React.MouseEvent, m: Member) => {
    if (!isOwner(selectedTeam)) return;
    if (m.id === selectedTeam?.ownerId) return;
    e.preventDefault();
    e.stopPropagation();
    setMemberContextMenu({ x: e.clientX, y: e.clientY, member: m });
  };

  const handleCreate = async () => {
    if (!newTeamName.trim()) return;
    const t = await createTeam(newTeamName, newTeamDesc || undefined);
    if (t) {
      setNewTeamName("");
      setNewTeamDesc("");
      setCreateOpen(false);
      setSelectedTeam(t);
      await refresh();
      await loadMembers(t.id);
    }
  };

  const handleDelete = async (t: Team) => {
    await deleteTeam(t.id);
    setContextMenu(null);
    if (selectedTeam?.id === t.id) setSelectedTeam(null);
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
    if (selectedTeam?.id === t.id) loadMembers(t.id);
    refresh();
  };

  const handleLeave = async (t: Team) => {
    await leaveTeam(t.id);
    if (selectedTeam?.id === t.id) setSelectedTeam(null);
    refresh();
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedAddUser) return;
    await addMember(selectedTeam.id, Number(selectedAddUser));
    setSelectedAddUser("");
    setAddMemberSearch("");
    setAddMemberOpen(false);
    loadMembers(selectedTeam.id);
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedTeam) return;
    await removeMember(selectedTeam.id, userId);
    loadMembers(selectedTeam.id);
  };

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
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
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
                    <div key={m.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50">
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
                        {m.id === selectedTeam.ownerId && (
                          <Badge variant="outline" className="gap-1 text-[0.6rem]">
                            <Crown className="size-3 text-amber-500" /> Owner
                          </Badge>
                        )}
                        {m.role && (
                          <Badge variant="secondary" className="text-[0.6rem]">{m.role}</Badge>
                        )}
                        {isOwner(selectedTeam) && m.id !== selectedTeam.ownerId && (
                          <Button variant="ghost" size="icon-sm" className="size-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveMember(m.id)}>
                            <Trash2 className="size-3" />
                          </Button>
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
    </div>
  );
}

function CreateTeamDialog({
  open, onOpenChange, name, onNameChange, desc, onDescChange, onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  name: string;
  onNameChange: (v: string) => void;
  desc: string;
  onDescChange: (v: string) => void;
  onCreate: () => void;
}) {
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
