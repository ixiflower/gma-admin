import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { getMessages } from "@/app/(dash)/chat/actions";
import { getSession } from "@/lib/auth";
import { ChatRoom } from "@/components/chat-room";
import { desc, eq, or, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const allMessages = await getMessages();
  const allUsers = await db.select().from(users);
  const session = await getSession();
  const uid = session?.id ?? 0;

  const lastMessages: Record<number, { body: string; createdAt: Date }> = {};
  for (const u of allUsers) {
    if (u.id === uid) continue;
    const msgs = allMessages.filter(
      (m) =>
        (m.userId === uid && m.recipientId === u.id) ||
        (m.userId === u.id && m.recipientId === uid),
    );
    if (msgs.length > 0) {
      lastMessages[u.id] = {
        body: msgs[msgs.length - 1].body,
        createdAt: msgs[msgs.length - 1].createdAt,
      };
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-0 overflow-hidden">
      <ChatRoom
        messages={allMessages}
        users={allUsers}
        currentUserId={uid}
        lastMessages={lastMessages}
      />
    </div>
  );
}
