"use client";

import { useActionState, useRef } from "react";
import { Camera } from "lucide-react";

import { updateProfile, type ProfileState } from "@/lib/profile-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProfileForm({
  user,
}: {
  user: { id: number; name: string; email: string; role: string; image: string | null; bio: string | null; username: string | null } | null;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    {},
  );
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.success && (
        <div className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          {state.success}
        </div>
      )}
      {state?.errors?.form?.map((error) => (
        <p key={error} className="text-sm text-destructive">
          {error}
        </p>
      ))}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative shrink-0"
        >
          <Avatar className="size-20">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
            <AvatarFallback className="text-lg">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() ?? "??"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="size-5 text-white" />
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          name="image"
          accept="image/*"
          className="hidden"
        />
        <div>
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Display name</Label>
        <Input id="name" name="name" defaultValue={user?.name ?? ""} required />
        {state?.errors?.name?.map((error) => (
          <p key={error} className="text-sm text-destructive">{error}</p>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" defaultValue={user?.username ?? ""} placeholder="@username" />
        {state?.errors?.username?.map((error) => (
          <p key={error} className="text-sm text-destructive">{error}</p>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={user?.bio ?? ""}
          placeholder="Tell us about yourself..."
          rows={4}
        />
        {state?.errors?.bio?.map((error) => (
          <p key={error} className="text-sm text-destructive">{error}</p>
        ))}
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
