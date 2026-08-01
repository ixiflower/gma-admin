import { db } from "@/db";
import { users } from "@/db/schema";
import { getMessages } from "@/app/(admin)/chat/actions";
import { getSession } from "@/lib/auth";
import { ChatRoom } from "@/components/chat-room";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const messages = await getMessages();
  const allUsers = await db.select().from(users);
  const session = await getSession();

  return (
    <div className="flex flex-1 flex-col gap-0 overflow-hidden">
      <ChatRoom messages={messages} users={allUsers} currentUserId={session?.id ?? 0} />
    </div>
  );
}
