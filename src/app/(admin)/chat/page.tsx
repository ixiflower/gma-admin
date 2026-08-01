import { db } from "@/db";
import { users } from "@/db/schema";
import { getMessages } from "@/app/(admin)/chat/actions";
import { getSession } from "@/lib/auth";
import { ChatRoom } from "@/components/chat-room";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const messages = await getMessages();
  const allUsers = await db.select().from(users);
  const session = await getSession();

  return (
    <div className="flex flex-1 flex-col gap-0 overflow-hidden">
      <div className="flex items-center justify-between px-1 pb-3">
        <div>
          <h2 className="text-lg font-semibold">Chat</h2>
          <p className="text-sm text-muted-foreground">Team conversation</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {messages.length} message{messages.length !== 1 && "s"}
        </span>
      </div>
      <Separator />
      <ChatRoom messages={messages} users={allUsers} currentUserId={session?.id ?? 0} />
    </div>
  );
}
