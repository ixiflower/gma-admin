import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { ExternalLink, GitFork, Star } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
  updated_at: string;
}

export default async function ProjectsPage() {
  const user = await getSession();
  let repos: Repo[] = [];
  let error: string | null = null;

  if (user?.githubToken) {
    try {
      const res = await fetch("https://api.github.com/user/repos?per_page=50&sort=updated", {
        headers: {
          Authorization: `Bearer ${user.githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 300 },
      });
      if (res.ok) {
        repos = await res.json();
      } else {
        error = `GitHub API error: ${res.status}`;
      }
    } catch {
      error = "Failed to fetch repositories. Check your token.";
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Projects</h2>
        <p className="text-sm text-muted-foreground">
          {user?.githubToken
            ? "Your GitHub repositories"
            : "Connect your GitHub account in Settings to see your projects."}
        </p>
      </div>

      {!user?.githubToken && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <svg className="size-12 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <p className="text-center text-sm text-muted-foreground">
              Go to Settings → Connect and add your GitHub personal access token to see your repositories here.
            </p>
            <Link href="/settings" className="text-sm font-medium text-primary hover:underline">
              Open Settings
            </Link>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {repos.map((repo) => (
          <Card key={repo.id} className="group transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Link
                      href={`/projects/${repo.full_name}`}
                      className="truncate hover:underline"
                    >
                      {repo.name}
                    </Link>
                    <Badge variant={repo.private ? "secondary" : "outline"} className="text-[0.6rem]">
                      {repo.private ? "Private" : "Public"}
                    </Badge>
                  </CardTitle>
                  {repo.description && (
                    <CardDescription className="mt-1 line-clamp-2">
                      {repo.description}
                    </CardDescription>
                  )}
                </div>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </CardHeader>
            <Link href={`/projects/${repo.full_name}`}>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {repo.language && (
                    <span className="flex items-center gap-1">
                      <span className="size-2 rounded-full bg-primary" />
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="size-3" />
                    {repo.stargazers_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="size-3" />
                    {repo.forks_count}
                  </span>
                  <span className="ml-auto">
                    {new Date(repo.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
