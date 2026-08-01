import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getTodos } from "@/app/(dash)/todos/actions";
import { TodoClient } from "@/components/todo-client";

export const dynamic = "force-dynamic";

export default async function TodosPage() {
  const user = await getSession();
  const items = user ? await getTodos(user.id) : [];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Todos</h2>
        <p className="text-sm text-muted-foreground">{items.length} task{items.length !== 1 && "s"} — {items.filter((t) => t.completed).length} done</p>
      </div>
      <TodoClient todos={items} />
    </div>
  );
}
