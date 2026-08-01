"use client";

import { useActionState } from "react";
import { SendHorizonal } from "lucide-react";

import { sendMessage, type SendState } from "@/app/(dash)/chat/actions";
import { Button, Input, Label } from "@/components/ui";

export function ChatForm() {
  const [state, formAction, pending] = useActionState<SendState, FormData>(
    sendMessage,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-2 border-t pt-3">
      {state.errors?.form?.map((error: string) => (
        <p key={error} className="text-sm text-destructive">
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
          placeholder="Type a message…"
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
        <p key={error} className="text-sm text-destructive">
          {error}
        </p>
      ))}
    </form>
  );
}
