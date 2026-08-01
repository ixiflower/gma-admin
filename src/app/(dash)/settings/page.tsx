import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSession();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your profile and account settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information and profile picture.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
