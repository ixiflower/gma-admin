import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export default function NotesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Your personal notes</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This page is under construction.
        </CardContent>
      </Card>
    </div>
  );
}
