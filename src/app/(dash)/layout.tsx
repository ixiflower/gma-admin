import "../globals.css";

import { AppSidebar } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getUnreadCount } from "@/app/(dash)/chat/actions";
import { getPendingInvites } from "@/app/(dash)/team/actions";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSession();
  const unread = user ? await getUnreadCount(user.id) : 0;
  const invites = user ? await getPendingInvites() : [];

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <span className="flex-1 text-sm font-medium text-muted-foreground">
            GMA Admin Panel
          </span>
          <NotificationBell unread={unread} invites={invites} />
          <ThemeToggle />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
