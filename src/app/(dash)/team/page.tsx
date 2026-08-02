"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Trash2, LogIn, LogOut, UserPlus, Crown, ChevronRight } from "lucide-react";

import {
  getTeams, getTeamMembers, getAllUsers, createTeam, deleteTeam,
  joinTeam, leaveTeam, addMember, removeMember,
} from "@/app/(dash)/team/actions";
import {
  Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator,
} from "@/components/ui";
import { getSession } from "@/lib/auth";

type Team = { id: number; name: string; ownerId: number; createdAt: Date };
type Member = { id: number; name: string; email: string; image: string | null; role: string; joinedAt: Date };
type AllUser = { id: number; name: string; email: string; image: string | null };

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [newTeamName, setNewTeamName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [t, u, s] = await Promise.all([getTeams(), getAllUsers(), getSession()]);
      setTeams(t);
      setAllUsers(u);
      if (s) setCurrentUserId(s.id);
    })();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      getTeamMembers(selectedTeam.id).then(setMembers);
    }
  }, [selectedTeam]);

  const isJoined = (t: Team) => members.some((m) => m.id === currentUserId);
  const isOwner = (t: Team) => t.ownerId === currentUserId;

  const handleCreate = async () => {
    if (!newTeamName.trim()) return;
    const t = await createTeam(newTeamName);
    if (t) {
      setTeams((prev) => [...prev, t]);
      setSelectedTeam(t);
    }
    setNewTeamName("");
    setCreateOpen(false);
    getTeams().then(setTeams);
  };

  const handleJoin = async (id: number) => {
    await joinTeam(id);
    getTeams().then(setTeams);
    if (selectedTeam?.id === id) getTeamMembers(id).then(setMembers);
  };

  const handleLeave = async (id: number) => {
    await leaveTeam(id);
    getTeams().then(setTeams);
    if (selectedTeam?.id === id) getTeamMembers(id).then(setMembers);
  };

  const handleDelete = async (id: number) => {
    await deleteTeam(id);
    setTeams((prev) => prev.filter((t) => t.id !== id));
    if (selectedTeam?.id === id) setSelectedTeam(null);
  };

  const handleAddMember = async (userId: number) => {
    if (!selectedTeam) return;
    await addMember(selectedTeam.id, userId);
    getTeamMembers(selectedTeam.id).then(setMembers);
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedTeam) return;
    await removeMember(selectedTeam.id, userId);
    getTeamMembers(selectedTeam.id).then(setMembers);
  };

  return (
    <div className="flex flex-1 flex-col gap-0 overflow-hidden">
      <div className="flex items-center justify-between px-1 pb-3">
        <div>
          <h2 className="text-lg font-semibold">Team</h2>
          <p className="text-sm text-muted-foreground">{teams.length} team{teams.length !== 1 && "s"}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={<Button size="sm" className="gap-1"><Plus className="size-3.5" /> Create</Button>}
          />
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Create team</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="team-name">Team name</Label>
                <Input
                  id="team-name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Frontend team"
                />
              </div>
              <Button onClick={handleCreate} disabled={!newTeamName.trim()}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Separator />
      <div className="flex min-h-0 flex-1 gap-0 overflow-hidden">
        <div className="w-56 shrink-0 overflow-y-auto border-r p-2">
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTeam(t)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                selectedTeam?.id === t.id ? "bg-muted font-medium" : "hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <Users className="size-3.5 shrink-0" />
              <span className="flex-1 truncate">{t.name}</span>
              {isOwner(t) && <Crown className="size-3 text-amber-500" />}
            </button>
          ))}
          {teams.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">No teams yet</p>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-4">
          {selectedTeam ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold">{selectedTeam.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {members.length} member{members.length !== 1 && "s"} · Created {new Date(selectedTeam.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!isJoined(selectedTeam) ? (
                    <Button size="sm" variant="outline" onClick={() => handleJoin(selectedTeam.id)} className="gap-1">
                      <LogIn className="size-3.5" /> Join
                    </Button>
                  ) : !isOwner(selectedTeam) ? (
                    <Button size="sm" variant="outline" onClick={() => handleLeave(selectedTeam.id)} className="gap-1">
                      <LogOut className="size-3.5" /> Leave
                    </Button>
                  ) : null}
                  {isOwner(selectedTeam) && (
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(selectedTeam.id)} className="gap-1">
                      <Trash2 className="size-3.5" /> Delete
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Members</p>
                  {isOwner(selectedTeam) && (
                    <Dialog>
                      <DialogTrigger
                        render={<Button size="xs" variant="outline" className="h-7 gap-1 text-xs"><UserPlus className="size-3" /> Add</Button>}
                      />
                      <DialogContent className="sm:max-w-sm">
                        <DialogHeader><DialogTitle>Add member</DialogTitle></DialogHeader>
                        <Select onValueChange={(v) => handleAddMember(Number(v))}>
                          <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                          <SelectContent>
                            {allUsers
                              .filter((u) => !members.some((m) => m.id === u.id))
                              .map((u) => (
                                <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 rounded-md p-2 hover:bg-muted/50 group/item">
                      <Avatar className="size-7">
                        <AvatarImage src={m.image ?? undefined} />
                        <AvatarFallback className="text-[0.6rem]">{m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{m.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                      </div>
                      {m.id === selectedTeam.ownerId && <Crown className="size-3.5 text-amber-500 shrink-0" />}
                      <Badge variant="outline" className="shrink-0 text-[0.6rem] capitalize">{m.role}</Badge>
                      {isOwner(selectedTeam) && m.id !== selectedTeam.ownerId && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="shrink-0 rounded p-1 text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover/item:opacity-100"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a team or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
