import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { deletePost, togglePost } from "@/app/actions";
import { NewPostForm } from "@/components/new-post-form";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">GMA</h1>
        <p className="text-muted-foreground">
          Next.js 16 + Tailwind + Drizzle ORM + shadcn/ui, powered by server
          actions.
        </p>
      </header>

      <NewPostForm />

      <PostsList />
    </main>
  );
}

async function PostsList() {
  const items = await db
    .select({ post: posts, author: users })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .orderBy(desc(posts.createdAt));

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No posts yet. Create the first one above.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Posts ({items.length})</h2>
      {items.map(({ post, author }) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                {post.published ? (
                  <CheckCircle2 className="size-4 text-green-600" />
                ) : (
                  <Circle className="size-4 text-muted-foreground" />
                )}
                {post.title}
              </CardTitle>
              <Badge variant={post.published ? "default" : "secondary"}>
                {post.published ? "published" : "draft"}
              </Badge>
            </div>
            <CardDescription>
              by {author.name} ·{" "}
              {new Date(post.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{post.body}</p>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <form action={togglePost.bind(null, post.id)}>
              <Button type="submit" variant="outline" size="sm">
                {post.published ? "Unpublish" : "Publish"}
              </Button>
            </form>
            <form action={deletePost.bind(null, post.id)}>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                aria-label={`Delete ${post.title}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      ))}
    </section>
  );
}
