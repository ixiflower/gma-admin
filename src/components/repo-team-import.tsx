"use client";

import { useState } from "react";
import { FolderPlus, ExternalLink, FolderKanban } from "lucide-react";

import { importRepoToTeam } from "@/app/(dash)/team/actions";
import {
  Avatar, AvatarFallback, AvatarImage, Badge, Button, Dialog, DialogContent,
  DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Input, Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui";
import { toast } from "sonner";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
}

export function RepoTeamImport({
  repo,
  teams,
}: {
  repo: Repo;
  teams: { id: number; name: string; ownerId: number; createdAt: Date }[];
}) {
  const [open, setOpen] = useState(false);
  const [teamId, setTeamId] = useState("");
  const [title, setTitle] = useState(repo.full_name);
  const [desc, setDesc] = useState(repo.description ?? "");
  const [submitting, setSubmitting] = useState(false);

  if (teams.length === 0) return null;

  const selectedTeam = teams.find((t) => t.id === Number(teamId));

  const handleImport = async () => {
    if (!teamId || !title.trim() || submitting) return;
    setSubmitting(true);
    const res = await importRepoToTeam(Number(teamId), {
      name: title.trim(),
      description: desc.trim() || null,
      repoName: repo.full_name,
      repoUrl: repo.html_url,
    });
    setSubmitting(false);
    if (res?.project) {
      toast.success("Imported to team", {
        description: `Added "${res.project.name}" to ${selectedTeam?.name}.`,
      });
      setOpen(false);
    } else {
      toast.error(res?.error ?? "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="ml-2 shrink-0 rounded-md border p-1 text-muted-foreground opacity-0 transition-opacity hover:border-primary hover:text-primary group-hover:opacity-100"
            aria-label="Add to team"
            title="Add to team"
          >
            <FolderPlus className="size-4" />
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FolderKanban className="size-4 text-primary" />
            Import project to team
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <span className="truncate">{repo.full_name}</span>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-3" />
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="repo-team">Team</Label>
            <Select value={teamId} onValueChange={(v) => setTeamId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select a team..." /></SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="repo-title">Project name</Label>
            <Input id="repo-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="repo-desc">Description</Label>
            <Input id="repo-desc" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[0.6rem]">Status: Active</Badge>
            <span className="text-[0.6rem] text-muted-foreground">
              Will be added to {selectedTeam?.name ?? "..."}
            </span>
          </div>

          <Button onClick={handleImport} disabled={!teamId || !title.trim() || submitting} className="gap-2">
            <FolderPlus className="size-4" />
            {submitting ? "Importing..." : "Import to team"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}