"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Trash2, LogIn, LogOut, UserPlus, Crown } from "lucide-react";

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

  const refresh = async () => {
    const [t, u, s] = await Promise.all([getTeams(), getAllUsers(), getSession()]);
    setTeams(t);
    setAllUsers(u);
    if (s) setCurrentUserId(s.id);
  };

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (selectedTeam) getTeamMembers(selectedTeam.id).then(setMembers);
  }, [selectedTeam]);

  const myTeams = teams.filter((t) => currentUserId && members.some((m) => m.id === currentUserId));
  const isOwner = (t: Team) => t.ownerId === currentUserId;

  const handleCreate = async () => {
    if (!newTeamName.trim()) return;
    const t = await createTeam(newTeamName);
    if (t) { setSelectedTeam(t); setNewTeamName(""); setCreateOpen(false); refresh(); }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Team</h2>
          <p className="text-sm text-muted-foreground">{teams.length} team{teams.length !== 1 && "s"} · {myTeams.length} joined</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="sm" className="gap-1"><Plus className="size-3.5" /> Create</Button>} />
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Create team</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="team-name">Team name</Label>
                <Input id="team-name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="e.g. Frontend team" />
              </div>
              <Button onClick={handleCreate} disabled={!newTeamName.trim()}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => (
          <Card
            key={t.id}
            className={`cursor-pointer transition-shadow hover:shadow-md ${selectedTeam?.id === t.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => setSelectedTeam(t)}
          >
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {isOwner(t) && <Crown className="size-4 text-amber-500 shrink-0" />}
              </div>
              {selectedTeam?.id === t.id && (
                <div className="flex flex-col gap-2 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">Members ({members.length})</p>
                    {isOwner(t) && (
                      <Dialog>
                        <DialogTrigger render={<Button size="xs" variant="outline" className="h-6 gap-1 text-xs"><UserPlus className="size-3" /> Add</Button>} />
                        <DialogContent className="sm:max-w-sm">
                          <DialogHeader><DialogTitle>Add member</DialogTitle></DialogHeader>
                          <Select onValueChange={(v) => { addMember(t.id, Number(v)); getTeamMembers(t.id).then(setMembers); }}>
                            <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                            <SelectContent>
                              {allUsers.filter((u) => !members.some((m) => m.id === u.id)).map((u) => (
                                <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {members.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-center gap-2 text-xs">
                        <Avatar className="size-5">
                          <AvatarImage src={m.image ?? undefined} />
                          <AvatarFallback className="text-[0.5rem]">{m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1 truncate">{m.name}</span>
                        {m.id === t.ownerId && <Crown className="size-3 text-amber-500 shrink-0" />}
                        {isOwner(t) && m.id !== t.ownerId && (
                          <button onClick={(e) => { e.stopPropagation(); removeMember(t.id, m.id); getTeamMembers(t.id).then(setMembers); }} className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {members.length > 5 && <p className="text-xs text-muted-foreground">+{members.length - 5} more</p>}
                  </div>
                  <div className="flex gap-1.5">
                    {!isOwner(t) && (
                      !members.some((m) => m.id === currentUserId) ? (
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={(e) => { e.stopPropagation(); joinTeam(t.id); refresh(); }}>
                          <LogIn className="size-3" /> Join
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={(e) => { e.stopPropagation(); leaveTeam(t.id); refresh(); }}>
                          <LogOut className="size-3" /> Leave
                        </Button>
                      )
                    )}
                    {isOwner(t) && (
                      <Button size="sm" variant="destructive" className="h-7 gap-1 text-xs" onClick={(e) => { e.stopPropagation(); deleteTeam(t.id); setSelectedTeam(null); refresh(); }}>
                        <Trash2 className="size-3" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {selectedTeam?.id !== t.id && (
                <div className="flex items-center gap-2">
                  {isOwner(t) ? (
                    <Badge variant="outline" className="text-[0.6rem]">Owner</Badge>
                  ) : members.some((m) => m.id === currentUserId) ? (
                    <Badge variant="secondary" className="text-[0.6rem]">Member</Badge>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {teams.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10">
            <Users className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No teams yet. Create one to collaborate.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
