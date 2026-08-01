import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Configure your application</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This page is under construction.
        </CardContent>
      </Card>
    </div>
  );
}
