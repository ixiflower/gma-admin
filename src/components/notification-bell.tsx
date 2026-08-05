"use client";

import { useState, useTransition } from "react";
import { Bell, BellDot, Check, X } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { acceptInvite, declineInvite, type TeamInviteWithDetails } from "@/app/(dash)/team/actions";

interface NotificationBellProps {
  unread: number;
  invites: TeamInviteWithDetails[];
}

export function NotificationBell({ unread, invites }: NotificationBellProps) {
  const router = useRouter();
  const [pendingInvites, setPendingInvites] = useState(invites);
  const [isPending, startTransition] = useTransition();

  const totalNotifications = unread + pendingInvites.length;

  const handleAccept = (invite: TeamInviteWithDetails) => {
    startTransition(async () => {
      const res = await acceptInvite(invite.id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setPendingInvites((prev) => prev.filter((i) => i.id !== invite.id));
      toast.success(`Joined ${invite.teamName}`);
      router.refresh();
    });
  };

  const handleDecline = (invite: TeamInviteWithDetails) => {
    startTransition(async () => {
      const res = await declineInvite(invite.id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setPendingInvites((prev) => prev.filter((i) => i.id !== invite.id));
      toast.success("Invite declined");
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "relative",
        )}
        aria-label="Notifications"
      >
        {totalNotifications > 0 ? (
          <>
            <BellDot className="size-[1.15rem]" />
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[0.6rem] font-bold text-destructive-foreground">
              {totalNotifications > 9 ? "9+" : totalNotifications}
            </span>
          </>
        ) : (
          <Bell className="size-[1.15rem]" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {pendingInvites.length > 0 && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                Team invites ({pendingInvites.length})
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col gap-2 px-2 py-2"
              >
                <div className="flex items-center gap-2">
                  {invite.teamImage ? (
                    <img
                      src={invite.teamImage}
                      className="size-7 shrink-0 rounded object-cover"
                      alt=""
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-tight">
                      <span className="font-medium">{invite.inviterName}</span>{" "}
                      invited you to{" "}
                      <span className="font-medium">{invite.teamName}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleAccept(invite)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Check className="size-3" /> Accept
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDecline(invite)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
                  >
                    <X className="size-3" /> Decline
                  </button>
                </div>
              </div>
            ))}
            {unread > 0 && <DropdownMenuSeparator />}
          </>
        )}
        {unread > 0 ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {unread} unread message{unread > 1 ? "s" : ""}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/chat")}>
              <BellDot className="size-4" />
              View {unread} message{unread > 1 ? "s" : ""}
            </DropdownMenuItem>
          </>
        ) : pendingInvites.length === 0 ? (
          <p className="px-1.5 py-3 text-center text-sm text-muted-foreground">
            No new notifications
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
