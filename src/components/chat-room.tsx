"use client";

import * as React from "react";
import { useActionState } from "react";
import { Search, SendHorizonal, X, MessageCircle, PanelRightClose, PanelRightOpen, EllipsisVertical, Trash2 } from "lucide-react";

import { sendMessage, toggleReaction, type SendState, type MessageWithAuthor } from "@/app/(admin)/chat/actions";
import { Avatar, AvatarFallback, Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input, Label, Separator } from "@/components/ui";
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble";
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup } from "@/components/ui/message";
import type { User } from "@/db/schema";

export function ChatRoom({
  messages: initialMessages,
  users,
}: {
  messages: MessageWithAuthor[];
  users: User[];
}) {
  const [query, setQuery] = React.useState("");
  const [showSearch, setShowSearch] = React.useState(false);
  const [selectedChat, setSelectedChat] = React.useState(users[0]?.name ?? "");
  const [showUsers, setShowUsers] = React.useState(true);
  const [sidebarW, setSidebarW] = React.useState(240);
  const scrollRef = React.useRef<HTMLDivElement>(null);

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
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {users.map((u) => (
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
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="h-7 w-40 pl-7 pr-7 text-xs"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => setShowUsers((v) => !v)}
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
                <DropdownMenuItem onClick={() => setShowSearch((v) => !v)}>
                  <Search className="size-4" />
                  {showSearch ? "Hide search" : "Search"}
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

      <div className="hidden w-44 shrink-0 flex-col border-l xl:flex">
        <div className="flex items-center gap-2 px-3 py-3">
          <span className="text-sm font-medium">Users</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {users.length}
          </span>
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-0.5 p-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5"
              >
                <div className="relative">
                  <Avatar className="size-6">
                    <AvatarFallback className="text-[0.55rem]">
                      {u.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-background bg-green-500" />
                </div>
                <span className="truncate text-xs">{u.name}</span>
                <Badge
                  variant="outline"
                  className="ml-auto px-1 py-0 text-[0.55rem] capitalize"
                >
                  {u.role}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
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
