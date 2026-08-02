import { Card, CardContent } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSession();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">Manage your personal information and profile picture.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
