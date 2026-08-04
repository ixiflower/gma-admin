import { getSession } from "@/lib/auth";
import { getTodos } from "@/app/(dash)/todos/actions";
import { TodoClient } from "@/components/todo-client";

export const dynamic = "force-dynamic";

export default async function TodosPage() {
  const user = await getSession();
  const items = user ? await getTodos(user.id) : [];

  return <TodoClient todos={items} />;
}
