"use client";

import { Bell, BellDot } from "lucide-react";

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

export function NotificationBell({ unread }: { unread: number }) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "relative",
        )}
        aria-label="Notifications"
      >
        {unread > 0 ? (
          <>
            <BellDot className="size-[1.15rem]" />
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[0.6rem] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          </>
        ) : (
          <Bell className="size-[1.15rem]" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {unread > 0
              ? `${unread} new message${unread > 1 ? "s" : ""}`
              : "Notifications"}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {unread > 0 ? (
          <DropdownMenuItem onClick={() => router.push("/chat")}>
            <BellDot className="size-4" />
            {unread} unread message{unread > 1 ? "s" : ""} — View now
          </DropdownMenuItem>
        ) : (
          <p className="px-1.5 py-3 text-center text-sm text-muted-foreground">
            No new notifications
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
