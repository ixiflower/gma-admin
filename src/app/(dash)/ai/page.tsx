"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  SendHorizonal,
  Sparkles,
  User,
  Bot,
  Ellipsis,
  Plus,
  Trash2,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  Paperclip,
  X,
  Pencil,
} from "lucide-react";

import {
  listSessions,
  getAiSession,
  createSession,
  deleteSession,
  renameSession,
  askAI,
  getUserAIProvider,
  getProviderModelsLive,
} from "@/app/(dash)/ai/actions";
import { AI_PROVIDERS, getProvider } from "@/lib/ai-providers";
import { AIConfigForm } from "@/components/settings-panel";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
  Button,
  Input,
  Separator,
} from "@/components/ui";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageAvatar, MessageContent, MessageGroup } from "@/components/ui/message";
import { Marker, MarkerContent } from "@/components/ui/marker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  fileName?: string;
}

interface ModelInfo {
  key: string;
  name: string;
}

interface SessionInfo {
  id: number;
  title: string;
  provider: string | null;
  model: string | null;
}

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [model, setModel] = useState("");
  const [provider, setProvider] = useState("");
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; session: SessionInfo } | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [providerSearch, setProviderSearch] = useState("");
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const providerSearchRef = useRef<HTMLInputElement>(null);

  const loadSessions = useCallback(async () => {
    const data = await listSessions();
    setSessions(data);
  }, []);

  const loadProvider = useCallback(async () => {
    try {
      const data = await getUserAIProvider();
      if (data) {
        const m = [...data.models] as ModelInfo[];
        setModels(m);
        setModel(data.defaultModel);
        setProvider(data.provider);
      }
    } catch {
      // ignore
    }
    // Sync ALL models the connected provider actually serves (file-tree
    // dropdown). Falls back to the static list if the live fetch fails.
    try {
      const live = await getProviderModelsLive();
      if (live && live.models.length > 0) {
        setModels(live.models);
        setModel((prev) =>
          prev && live.models.some((m) => m.key === prev)
            ? prev
            : (live.models[0]?.key ?? prev),
        );
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadProvider();
  }, [loadSessions, loadProvider]);

  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.scrollTop = promptRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    if (providerMenuOpen) {
      const t = setTimeout(() => providerSearchRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [providerMenuOpen]);

  const openSession = async (id: number) => {
    setSessionId(id);
    setMessages([]);
    try {
      const session = await getAiSession(id);
      if (session) {
        const msgs = session.messages as ChatMessage[];
        setMessages(msgs.length ? msgs : []);
        if (session.model && models.some((m) => m.key === session.model)) {
          setModel(session.model);
        }
      }
    } catch {
      setSessionId(null);
    }
  };

  const startNewSession = async () => {
    const row = await createSession();
    if (row) {
      setSessionId(row.id);
      setMessages([]);
      loadSessions();
      toast.success("New chat started");
    } else {
      toast.error("Failed to create session");
    }
  };

  const handleDeleteSession = async (id: number) => {
    try {
      await deleteSession(id);
      toast.success("Session deleted");
    } catch {
      toast.error("Failed to delete session");
    }
    if (sessionId === id) {
      setMessages([]);
      setSessionId(null);
    }
    loadSessions();
  };

  const handleContextMenu = (e: React.MouseEvent, s: SessionInfo) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, session: s });
  };

  const handleRename = async () => {
    if (!renamingId || !renameTitle.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      await renameSession(renamingId, renameTitle.trim());
      toast.success("Session renamed");
    } catch {
      toast.error("Failed to rename session");
    }
    setRenamingId(null);
    loadSessions();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({ name: file.name, content: reader.result as string });
    };
    reader.onerror = () => {
      setAttachedFile(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const removeFile = () => {
    setAttachedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || loading) return;
    const msg = input.trim();
    const fileContent = attachedFile
      ? `[File: ${attachedFile.name}]\n\`\`\`\n${attachedFile.content}\n\`\`\`\n\n`
      : "";
    const fullMessage = fileContent + (msg || "Describe this file.");
    setInput("");
    setAttachedFile(null);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: msg || "Describe this file.", fileName: attachedFile?.name },
    ]);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("message", fullMessage);
      if (model) fd.set("model", model);
      const result = await askAI(sessionId, fd);
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
      if (result.sessionId && (!sessionId || sessionId !== result.sessionId)) {
        setSessionId(result.sessionId);
      }
      loadSessions();
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
      toast.error("Failed to get AI response");
    }
    setLoading(false);
  };

  const handleProviderChange = (key: string) => {
    if (!key || key === provider) return;
    // Switching provider requires that provider's API key — open the dialog
    // preselected so the user can enter it.
    setSelectedProvider(key);
    setProviderDialogOpen(true);
  };

  const providerName = getProvider(provider)?.name ?? "No provider";
  const filteredProviders = AI_PROVIDERS.filter((p) =>
    p.name.toLowerCase().includes(providerSearch.trim().toLowerCase()),
  );
  const modelName = models.find((m) => m.key === model)?.name ?? "Model";
  const showModelSelect = models.length > 0;

  return (
    <div className="flex flex-1 flex-row gap-0 overflow-hidden">
      <div className="flex w-56 shrink-0 flex-col border-r">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-xs font-semibold text-muted-foreground">Sessions</span>
          <Button variant="ghost" size="icon-sm" onClick={startNewSession}>
            <Plus className="size-3.5" />
          </Button>
        </div>
        <Separator />
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {sessions.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">No sessions yet</p>
          )}
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-1">
              {renamingId === s.id ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleRename(); }}
                  className="flex flex-1 items-center gap-1"
                >
                  <input
                    autoFocus
                    value={renameTitle}
                    onChange={(e) => setRenameTitle(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => { if (e.key === "Escape") setRenamingId(null); }}
                    className="flex-1 rounded-md border bg-background px-2 py-1 text-xs outline-none ring-1 ring-ring"
                  />
                </form>
              ) : (
                <button
                  onClick={() => openSession(s.id)}
                  onContextMenu={(e) => handleContextMenu(e, s)}
                  className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent ${
                    sessionId === s.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  <MessageSquare className="size-3 shrink-0" />
                  <span className="truncate">{s.title}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 min-w-36 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              setRenamingId(contextMenu.session.id);
              setRenameTitle(contextMenu.session.title);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
          >
            <Pencil className="size-3.5" />
            Rename
          </button>
          <button
            onClick={() => {
              handleDeleteSession(contextMenu.session.id);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0 overflow-hidden">
        <div className="flex items-center justify-between px-2 pb-3 pt-1">
          <div>
            <h2 className="text-lg font-semibold">AI Chat</h2>
            <p className="text-sm text-muted-foreground">
              {sessionId ? sessions.find((s) => s.id === sessionId)?.title ?? "Chat" : "Chat with AI models"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setSelectedProvider("");
              setProviderDialogOpen(true);
            }}
            title="AI provider settings"
          >
            <Ellipsis className="size-4" />
          </Button>
        </div>
        <Separator />
        <div ref={promptRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="size-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Start a conversation</p>
                <p className="text-xs text-muted-foreground/60">
                  {provider
                    ? `Using ${providerName} • Type a message to begin`
                    : "Configure your AI provider in Settings → Connect"}
                </p>
              </div>
            </div>
          )}
          <MessageGroup>
            {messages.map((m, i) => (
              <Message key={i} align={m.role === "user" ? "end" : "start"}>
                <MessageAvatar>
                  <Avatar className="size-7">
                    <AvatarFallback className="text-[0.55rem]">
                      {m.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                    </AvatarFallback>
                  </Avatar>
                </MessageAvatar>
              <MessageContent>
                <Bubble variant={m.role === "user" ? "default" : "muted"}>
                  <BubbleContent className="whitespace-pre-wrap">{m.content}</BubbleContent>
                  {m.fileName && (
                    <div className="mt-1.5 flex items-center gap-1 rounded-md bg-black/10 px-2 py-0.5 text-xs dark:bg-white/10">
                      <Paperclip className="size-3" /> {m.fileName}
                    </div>
                  )}
                </Bubble>
              </MessageContent>
              </Message>
            ))}
          </MessageGroup>
          {loading && (
            <Marker role="status">
              <MarkerContent className="shimmer flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="size-3" /> Thinking...
              </MarkerContent>
            </Marker>
          )}
          <div className="h-0" />
        </div>
        <form onSubmit={handleSubmit} className="shrink-0 border-t px-4 py-3">
          {attachedFile && (
            <div className="mb-2 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5 text-xs">
              <Paperclip className="size-3 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate font-medium">{attachedFile.name}</span>
              <Button variant="ghost" size="icon-sm" className="size-4 shrink-0" onClick={removeFile}>
                <X className="size-3" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".txt,.md,.json,.js,.ts,.tsx,.jsx,.css,.html,.py,.rs,.go,.java,.c,.cpp,.h,.rb,.php,.sql,.yaml,.yml,.xml,.csv,.log,.sh,.bash,.zsh,.toml,.ini,.cfg,.conf,.env,.gitignore"
              onChange={handleFileSelect}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Paperclip className="size-4" />
            </Button>
            <div className="relative flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className={showModelSelect ? "pr-28" : ""}
                disabled={loading}
              />
              {showModelSelect && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={loading}
                      className="inline-flex h-6 max-w-24 items-center gap-1 rounded-md border border-border bg-muted/50 px-1.5 text-xs shadow-none hover:bg-muted disabled:opacity-50"
                      title="Select model"
                    >
                      <span className="truncate">{modelName}</span>
                      <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={6}
                      className="max-h-72 w-64 overflow-y-auto"
                    >
                      <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <span className="text-sm leading-none">{getProvider(provider)?.icon}</span>
                        <span className="flex-1 truncate">{providerName}</span>
                        <span className="text-[10px] font-normal">{models.length}</span>
                      </div>
                      <DropdownMenuSeparator />
                      {models.map((m) => (
                        <DropdownMenuItem
                          key={m.key}
                          onClick={() => setModel(m.key)}
                          className="cursor-pointer pl-6"
                        >
                          <span className="mr-1.5 text-muted-foreground/60">└</span>
                          <span className="flex-1 truncate">{m.name}</span>
                          {model === m.key && (
                            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            <DropdownMenu
              open={providerMenuOpen}
              onOpenChange={(o) => {
                setProviderMenuOpen(o);
                if (!o) setProviderSearch("");
              }}
            >
              <DropdownMenuTrigger
                disabled={loading}
                className="inline-flex h-8 w-auto min-w-[7.5rem] items-center justify-between gap-1.5 rounded-md border bg-muted/50 px-2.5 text-xs shadow-none transition-colors hover:bg-muted disabled:opacity-50"
                title="Change AI provider"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="shrink-0 text-sm leading-none">
                    {getProvider(provider)?.icon ?? "⚙️"}
                  </span>
                  <span className="truncate">{getProvider(provider)?.name ?? "Provider"}</span>
                </span>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6} className="w-56">
                <div className="p-1.5">
                  <Input
                    ref={providerSearchRef}
                    value={providerSearch}
                    onChange={(e) => setProviderSearch(e.target.value)}
                    placeholder="Search providers..."
                    className="h-8 text-xs"
                  />
                </div>
                <DropdownMenuSeparator />
                {filteredProviders.map((p) => (
                  <DropdownMenuItem
                    key={p.key}
                    onClick={() => handleProviderChange(p.key)}
                    className="cursor-pointer"
                  >
                    <span className="text-sm leading-none">{p.icon}</span>
                    <span className="flex-1">{p.name}</span>
                    {provider === p.key && (
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                    )}
                  </DropdownMenuItem>
                ))}
                {filteredProviders.length === 0 && (
                  <p className="px-2 py-2 text-xs text-muted-foreground">No providers found</p>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="submit" disabled={loading || (!input.trim() && !attachedFile)} size="icon-sm">
              <SendHorizonal className="size-4" />
            </Button>
          </div>
        </form>
      </div>

      <Dialog
        open={providerDialogOpen}
        onOpenChange={(o) => {
          setProviderDialogOpen(o);
          if (!o) {
            setSelectedProvider("");
            loadProvider();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI Provider</DialogTitle>
            <DialogDescription>
              Configure the AI provider used by this chat.
            </DialogDescription>
          </DialogHeader>
          <AIConfigForm
            user={{ aiProvider: provider || null, aiApiKey: provider ? "configured" : null }}
            initialProvider={selectedProvider || undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
