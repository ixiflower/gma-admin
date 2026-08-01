"use client";

import { useActionState } from "react";

import { createPost } from "@/app/actions";
import type { PostState } from "@/app/actions";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import { PlusCircle } from "lucide-react";

export function NewPostForm() {
  const [state, formAction, pending] = useActionState<PostState, FormData>(
    createPost,
    {},
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>New post</CardTitle>
        <CardDescription>
          Creates a row in the <code>posts</code> table via a server action.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          {state.errors?.form?.map((error) => (
            <p key={error} className="text-sm font-medium text-destructive">
              {error}
            </p>
          ))}
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Post title"
              aria-invalid={!!state.errors?.title}
            />
            {state.errors?.title?.map((error) => (
              <p key={error} className="text-sm text-destructive">
                {error}
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              name="body"
              placeholder="Write something…"
              rows={4}
              aria-invalid={!!state.errors?.body}
            />
            {state.errors?.body?.map((error) => (
              <p key={error} className="text-sm text-destructive">
                {error}
              </p>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="published" name="published" />
            <Label htmlFor="published">Publish immediately</Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            <PlusCircle className="size-4" />
            {pending ? "Creating…" : "Create post"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
