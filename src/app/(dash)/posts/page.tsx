import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export default function PostsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
          <CardDescription>Manage all posts</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This page is under construction.
        </CardContent>
      </Card>
    </div>
  );
}
