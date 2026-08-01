"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  FileText,
  Settings,
  BarChart3,
  MessageCircle,
  type LucideIcon,
  ChevronRight,
  CreditCard,
  Key,
  LogOut,
  UserCircle,
  NotebookPen,
  CheckSquare,
  FolderGit2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui";
import { SettingsPanel } from "@/components/settings-panel";
import { logout } from "@/lib/auth";

const items: { title: string; href: string; icon: LucideIcon }[] = [
  { title: "Dashboard", href: "/", icon: Home },
  { title: "Chat", href: "/chat", icon: MessageCircle },
  { title: "Projects", href: "/projects", icon: FolderGit2 },
  { title: "Posts", href: "/posts", icon: FileText },
  { title: "Users", href: "/users", icon: Users },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Notes", href: "/notes", icon: NotebookPen },
  { title: "Todos", href: "/todos", icon: CheckSquare },
];

export function AppSidebar({
  user,
}: {
  user: { id: number; name: string; email: string; role: string; image: string | null; bio: string | null } | null;
}) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/" />} size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Home className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">GMA Admin</span>
                <span className="text-xs text-sidebar-foreground/70">
                  v0.1.0
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {items.map(({ title, href, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={pathname === href}
                  tooltip={title}
                >
                  <Icon className="size-4" />
                  <span>{title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex w-full flex-col items-center gap-2 group-data-[state=expanded]:flex-row group-data-[state=expanded]:justify-between">
          <SidebarMenuButton onClick={() => setSettingsOpen(true)}>
            <Settings className="size-4" />
            <span>Settings</span>
          </SidebarMenuButton>
          <ProfileAvatar user={user} onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </SidebarFooter>

      <SidebarRail />

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your account settings and preferences.
            </DialogDescription>
          </DialogHeader>
          <SettingsPanel />
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}

function ProfileAvatar({
  user,
  onOpenSettings,
}: {
  user: { id: number; name: string; email: string; role: string; image: string | null; bio: string | null } | null;
  onOpenSettings: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger>
        <Avatar
          className="size-7 shrink-0 cursor-pointer transition-opacity hover:opacity-80"
          onContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium leading-none">{user?.name ?? "User"}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email ?? ""}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserCircle />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Key />
            API Tokens
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            Billing
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
          >
            <Settings />
            Settings
            <ChevronRight className="ml-auto size-3 text-muted-foreground" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logout()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
