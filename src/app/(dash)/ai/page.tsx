"use client";

import { useState, useRef, useEffect } from "react";
import { SendHorizonal, Sparkles, User, Bot } from "lucide-react";

import { askAI } from "@/app/(dash)/ai/actions";
import { Avatar, AvatarFallback, AvatarImage, Button, Input, Separator } from "@/components/ui";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageAvatar, MessageContent, MessageGroup } from "@/components/ui/message";
import { Marker, MarkerContent } from "@/components/ui/marker";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    const fd = new FormData();
    fd.set("message", msg);
    const reply = await askAI(fd);
    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-0 overflow-hidden">
      <div className="px-1 pb-3">
        <h2 className="text-lg font-semibold">AI Chat</h2>
        <p className="text-sm text-muted-foreground">Chat with AI models</p>
      </div>
      <Separator />
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Start a conversation</p>
              <p className="text-xs text-muted-foreground/60">Configure your AI provider in Settings → Connect</p>
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
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} size="icon-sm">
            <SendHorizonal className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
