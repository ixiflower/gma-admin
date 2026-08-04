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
  Settings,
  CheckCircle2,
  ChevronDown,
  Paperclip,
  X,
} from "lucide-react";

import {
  listSessions,
  getAiSession,
  createSession,
  deleteSession,
  askAI,
  getUserAIProvider,
} from "@/app/(dash)/ai/actions";
import { saveAIConfig } from "@/lib/profile-actions";
import { AI_PROVIDERS, getProvider } from "@/lib/ai-providers";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [apiKey, setApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);

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
    }
  };

  const handleDeleteSession = async (id: number) => {
    try {
      await deleteSession(id);
    } catch {
      // ignore
    }
    if (sessionId === id) {
      setMessages([]);
      setSessionId(null);
    }
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
    }
    setLoading(false);
  };

  const handleSaveProvider = async () => {
    if (!selectedProvider || !apiKey.trim()) return;
    setSavingKey(true);
    try {
      const fd = new FormData();
      fd.set("aiProvider", selectedProvider);
      fd.set("aiApiKey", apiKey.trim());
      const result = await saveAIConfig({}, fd);
      if (result.success) {
        setProviderDialogOpen(false);
        setApiKey("");
        setSelectedProvider("");
        loadProvider();
      }
    } catch {
      // ignore
    }
    setSavingKey(false);
  };

  const providerName = getProvider(provider)?.name ?? "No provider";
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
            <div key={s.id} className="group flex items-center gap-1">
              <button
                onClick={() => openSession(s.id)}
                className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent ${
                  sessionId === s.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <MessageSquare className="size-3 shrink-0" />
                <span className="truncate">{s.title}</span>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-5 shrink-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0 overflow-hidden">
        <div className="flex items-center justify-between px-2 pb-3 pt-1">
          <div>
            <h2 className="text-lg font-semibold">AI Chat</h2>
            <p className="text-sm text-muted-foreground">
              {sessionId ? sessions.find((s) => s.id === sessionId)?.title ?? "Chat" : "Chat with AI models"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-1 hover:bg-accent">
              <Ellipsis className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="w-48">
              <DropdownMenuItem onClick={() => setProviderDialogOpen(true)}>
                <Sparkles className="size-3.5" />
                Change Provider
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = "/settings"}>
                <Settings className="size-3.5" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  <Select value={model} onValueChange={(v) => setModel(v ?? "")} disabled={loading}>
                    <SelectTrigger size="sm" className="h-6 gap-1 border-border bg-muted/50 px-1.5 text-xs shadow-none hover:bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end" sideOffset={6}>
                      {models.map((m) => (
                        <SelectItem key={m.key} value={m.key}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading || (!input.trim() && !attachedFile)} size="icon-sm">
              <SendHorizonal className="size-4" />
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select AI Provider</DialogTitle>
            <DialogDescription>
              Choose a provider and enter your API key to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {AI_PROVIDERS.map(({ key, name, icon }) => {
              const isActive = provider === key;
              const isSelected = selectedProvider === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setSelectedProvider(key); setApiKey(""); }}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    isActive || isSelected
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="text-xs font-medium">{name}</span>
                  {isActive ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" /> Active
                    </span>
                  ) : isSelected ? (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  ) : null}
                </button>
              );
            })}
          </div>
          {selectedProvider && (
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="popup-api-key" className="text-xs font-medium">
                  {AI_PROVIDERS.find((p) => p.key === selectedProvider)?.name} API Key
                </label>
                <Input
                  id="popup-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <Button
                size="sm"
                onClick={handleSaveProvider}
                disabled={savingKey || !apiKey.trim()}
              >
                {savingKey ? "Saving..." : "Save & switch"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
