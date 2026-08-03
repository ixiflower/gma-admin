import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepoItems } from "@/app/(dash)/projects/actions";
import { RepoAdminPanel } from "@/components/repo-admin-panel";

export const dynamic = "force-dynamic";

interface RepoMeta {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
  default_branch: string;
  updated_at: string;
}

async function fetchRepo(owner: string, repo: string, token: string) {
  const [metaRes, readmeRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 300 },
    }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3.raw",
      },
      next: { revalidate: 300 },
    }),
  ]);

  if (!metaRes.ok) return { meta: null, readme: null };

  const meta: RepoMeta = await metaRes.json();
  const readme = readmeRes.ok ? await readmeRes.text() : null;
  return { meta, readme };
}

export default async function RepoDetailPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await params;
  const user = await getSession();

  if (!user?.githubToken) notFound();

  const { meta, readme } = await fetchRepo(owner, repo, user.githubToken);
  if (!meta) notFound();

  const fullName = `${owner}/${repo}`;
  const { repoTodos, repoNotes } = await getRepoItems(fullName, user.id);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{meta.name}</h2>
        <Badge variant={meta.private ? "secondary" : "outline"} className="text-[0.6rem]">
          {meta.private ? "Private" : "Public"}
        </Badge>
        {meta.language && (
          <Badge variant="outline" className="text-[0.6rem]">
            {meta.language}
          </Badge>
        )}
        <a
          href={meta.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-sm text-primary hover:underline"
        >
          Open on GitHub ↗
        </a>
      </div>
      {meta.description && (
        <p className="-mt-2 text-sm text-muted-foreground">{meta.description}</p>
      )}

      <div className="grid flex-1 gap-4 lg:grid-cols-[300px_1fr]">
        <RepoAdminPanel
          repo={fullName}
          initialTodos={repoTodos}
          initialNotes={repoNotes}
        />

        <div className="min-w-0 rounded-lg border bg-card">
          <div className="border-b px-4 py-3 text-sm font-medium">README.md</div>
          <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto p-4">
            {readme ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{readme}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">No README found for this repository.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}