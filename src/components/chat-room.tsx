"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  Search,
  SendHorizonal,
  X,
  MessageCircle,
  PanelRightClose,
  PanelRightOpen,
  EllipsisVertical,
  Trash2,
  ArrowLeft,
  ImageIcon,
  Film,
  FileText,
} from "lucide-react";

import { sendMessage, toggleReaction, markAllRead, type SendState, type MessageWithAuthor } from "@/app/(dash)/chat/actions";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input, Label, Separator, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble";
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup } from "@/components/ui/message";
import { getSharedTeams } from "@/app/(dash)/team/actions";
import type { User } from "@/db/schema";

export function ChatRoom({
  messages: initialMessages,
  users,
  currentUserId,
}: {
  messages: MessageWithAuthor[];
  users: User[];
  currentUserId: number;
}) {
  const [query, setQuery] = React.useState("");
  const [userQuery, setUserQuery] = React.useState("");
  const [rightPanel, setRightPanel] = React.useState<"users" | "search">("users");
  const [selectedChat, setSelectedChat] = React.useState(users[0]?.name ?? "");
  const [showUsers, setShowUsers] = React.useState<boolean>(true);

  React.useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("chat_sidebar="));
    if (cookie) {
      setShowUsers(cookie.split("=")[1] === "1");
    }
  }, []);
  const [sidebarW, setSidebarW] = React.useState(240);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [sharedTeams, setSharedTeams] = React.useState<{ id: number; name: string }[]>([]);

  const toggleUsersPanel = React.useCallback(() => {
    setShowUsers((prev) => {
      const next = !prev;
      if (typeof document !== "undefined") {
        document.cookie = `chat_sidebar=${next ? "1" : "0"}; path=/`;
      }
      return next;
    });
  }, []);

  const handleResizeStart = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = sidebarW;
      const onMove = (ev: MouseEvent) => {
        const w = Math.max(160, Math.min(400, startW + ev.clientX - startX));
        setSidebarW(w);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [sidebarW],
  );

  const filtered =
    query.length > 0
      ? initialMessages.filter(
          (m) =>
            m.body.toLowerCase().includes(query.toLowerCase()) ||
            m.author.name.toLowerCase().includes(query.toLowerCase()),
        )
      : initialMessages;

  const selectedUser = users.find((u) => u.name === selectedChat);

  React.useEffect(() => {
    if (selectedUser && currentUserId) {
      getSharedTeams(currentUserId, selectedUser.id).then(setSharedTeams);
    } else {
      setSharedTeams([]);
    }
  }, [selectedChat, selectedUser?.id, currentUserId]);

  const filteredUsers = users.filter(
    (u) => u.id !== currentUserId && u.name.toLowerCase().includes(userQuery.toLowerCase()),
  );

  React.useEffect(() => {
    markAllRead(currentUserId);
  }, [currentUserId]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [initialMessages.length]);

  return (
    <div className="flex flex-1 gap-0 overflow-hidden">
      <div className="hidden shrink-0 flex-col border-r md:flex relative" style={{ width: sidebarW }}>
        <div className="flex items-center gap-2 px-3 py-3">
          <MessageCircle className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Chats</span>
        </div>
        <Separator />
        <div className="px-2 pt-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search users..."
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pt-1">
          {(userQuery.length >= 2 ? filteredUsers : []).map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedChat(u.name)}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                selectedChat === u.name
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {u.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{u.name}</span>
            </button>
          ))}
          {userQuery.length >= 2 && filteredUsers.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">No users found</p>
          )}
          {userQuery.length < 2 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">Search for a user to start chatting</p>
          )}
        </div>
        <div
          className="absolute -right-1 top-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-primary/30"
          onMouseDown={handleResizeStart}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
          <Avatar className="size-5">
            <AvatarFallback className="text-[0.55rem]">
              {selectedChat
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{selectedChat}</span>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => toggleUsersPanel()}
              className="hidden rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:inline-flex"
              aria-label={showUsers ? "Hide users panel" : "Show users panel"}
            >
              {showUsers ? (
                <PanelRightClose className="size-4" />
              ) : (
                <PanelRightOpen className="size-4" />
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <EllipsisVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => {
                    setRightPanel("search");
                    setShowUsers(true);
                  }}
                >
                  <Search className="size-4" />
                  Search
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    // clear chat - reset messages locally
                    window.location.reload();
                  }}
                >
                  <Trash2 className="size-4" />
                  Delete chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {query ? "No messages match your search." : "No messages yet. Start the conversation!"}
              </p>
            </div>
          ) : (
            <MessageGroup>
              {filtered.map((msg) => (
                <Message key={msg.id} align="start">
                  <MessageAvatar>
                    <Avatar className="size-9">
                      <AvatarFallback className="text-[0.65rem]">
                        {msg.author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </MessageAvatar>
                  <MessageContent>
                    <div className="group/message-row relative">
                      <Bubble variant="muted">
                        <BubbleContent>{msg.body}</BubbleContent>
                        <Reactions msg={msg} />
                      </Bubble>
                    </div>
                    <MessageFooter>
                      <span className="text-[0.65rem] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </MessageFooter>
                  </MessageContent>
                </Message>
              ))}
            </MessageGroup>
          )}
          <div className="h-0" />
        </div>

        <ChatInput />
      </div>

      {showUsers && (
      <div className="hidden w-60 shrink-0 flex-col border-l xl:flex">
        {rightPanel === "search" ? (
          <>
            <div className="flex items-center gap-2 px-3 py-3">
              <button
                onClick={() => setRightPanel("users")}
                className="rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
              </button>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search in chat..."
                className="h-7 flex-1 text-xs"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Separator />
            <div className="flex-1 overflow-y-auto">
              {query.length > 0 ? (
                <div className="flex flex-col gap-0.5 p-2">
                  {initialMessages
                    .filter((m) =>
                      m.body.toLowerCase().includes(query.toLowerCase()),
                    )
                    .map((m) => (
                      <button
                        key={m.id}
                        className="rounded-md p-2 text-left text-xs transition-colors hover:bg-muted"
                      >
                        <p className="line-clamp-2 text-muted-foreground">
                          {m.body}
                        </p>
                        <p className="mt-0.5 text-[0.6rem] text-muted-foreground">
                          {m.author.name} ·{" "}
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </button>
                    ))}
                  {initialMessages.filter((m) =>
                    m.body.toLowerCase().includes(query.toLowerCase()),
                  ).length === 0 && (
                    <p className="p-2 text-center text-xs text-muted-foreground">
                      No results found.
                    </p>
                  )}
                </div>
              ) : (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  Type to search messages...
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-3">
              <span className="text-sm font-medium">Profile</span>
            </div>
            <Separator />
            <div className="flex-1 overflow-y-auto">
              {selectedUser ? (
                <div className="flex flex-col items-center gap-4 p-4">
                  <Avatar className="size-20">
                    <AvatarImage
                      src={selectedUser.image ?? undefined}
                      alt={selectedUser.name}
                    />
                    <AvatarFallback className="text-xl">
                      {selectedUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="text-sm font-medium">{selectedUser.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedUser.email}
                    </p>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {selectedUser.role}
                    </Badge>
                    {sharedTeams.length > 0 && (
                      <div className="mt-2 flex flex-wrap justify-center gap-1">
                        {sharedTeams.map((t) => (
                          <Badge key={t.id} variant="secondary" className="text-[0.6rem]">
                            👥 {t.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedUser.bio && (
                    <p className="text-center text-xs text-muted-foreground">
                      {selectedUser.bio}
                    </p>
                  )}
                  <Separator />
                  <Tabs defaultValue="media" className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="media" className="flex-1 gap-1 text-xs">
                        <ImageIcon className="size-3" />
                        Media
                      </TabsTrigger>
                      <TabsTrigger value="files" className="flex-1 gap-1 text-xs">
                        <FileText className="size-3" />
                        Files
                      </TabsTrigger>
                      <TabsTrigger value="links" className="flex-1 gap-1 text-xs">
                        <Film className="size-3" />
                        Links
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="media" className="mt-2">
                      <p className="text-center text-xs text-muted-foreground">
                        No shared images yet.
                      </p>
                    </TabsContent>
                    <TabsContent value="files" className="mt-2">
                      <p className="text-center text-xs text-muted-foreground">
                        No shared files yet.
                      </p>
                    </TabsContent>
                    <TabsContent value="links" className="mt-2">
                      <p className="text-center text-xs text-muted-foreground">
                        No shared links yet.
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  Select a user to view their profile.
                </p>
              )}
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
}

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

function Reactions({ msg }: { msg: MessageWithAuthor }) {
  const reactions: Record<string, number> = JSON.parse(msg.reactions ?? "{}");
  const entries = Object.entries(reactions).filter(([, c]) => c > 0);

  return (
    <>
      {entries.length > 0 && (
        <BubbleReactions side="bottom" align="end">
          {entries.map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => toggleReaction(msg.id, emoji)}
              className="inline-flex items-center gap-0.5 rounded-full px-1 py-0 text-xs transition-colors hover:bg-muted-foreground/20"
            >
              <span>{emoji}</span>
              {count > 1 && (
                <span className="text-[0.6rem] text-muted-foreground">
                  {count}
                </span>
              )}
            </button>
          ))}
        </BubbleReactions>
      )}
      <div className="absolute -top-8 left-0 z-20 hidden gap-0.5 rounded-full border bg-popover px-1 py-0.5 shadow-md group-hover/message-row:flex">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => toggleReaction(msg.id, emoji)}
            className="inline-flex size-6 items-center justify-center rounded-full text-sm transition-transform hover:scale-125 active:scale-90"
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}

function ChatInput() {
  const [state, formAction, pending] = useActionState<SendState, FormData>(
    sendMessage,
    {},
  );

  return (
    <form action={formAction} className="shrink-0 border-t px-4 py-3">
      {state.errors?.form?.map((error: string) => (
        <p key={error} className="mb-1 text-xs text-destructive">
          {error}
        </p>
      ))}
      <div className="flex items-center gap-2">
        <Label htmlFor="chat-body" className="sr-only">
          Message
        </Label>
        <Input
          id="chat-body"
          name="body"
          placeholder="Type a message..."
          className="flex-1"
          required
          aria-invalid={!!state.errors?.body}
        />
        <Button type="submit" disabled={pending} size="icon-sm">
          <SendHorizonal className="size-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
      {state.errors?.body?.map((error: string) => (
        <p key={error} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      ))}
    </form>
  );
}
