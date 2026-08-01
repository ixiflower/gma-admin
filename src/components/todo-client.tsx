"use client";

import { PlayfulTodolist } from "animate-ui";
import { Plus, Trash2 } from "lucide-react";

import { addTodo, deleteTodo, toggleTodo } from "@/app/(dash)/todos/actions";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import type { Todo } from "@/db/schema";
import { useRef } from "react";

export function TodoClient({ todos }: { todos: Todo[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-4">
      <form
        ref={formRef}
        action={async (fd) => { await addTodo(fd); formRef.current?.reset(); }}
        className="flex items-center gap-2"
      >
        <Input name="title" placeholder="Add a new task..." className="flex-1" required />
        <Select name="priority" defaultValue="medium">
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">🟢 Low</SelectItem>
            <SelectItem value="medium">🟡 Medium</SelectItem>
            <SelectItem value="high">🔴 High</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="icon-sm">
          <Plus className="size-4" />
        </Button>
      </form>

      <PlayfulTodolist
        tasks={todos.map((t) => ({
          id: t.id,
          title: `${t.priority === "high" ? "🔴 " : t.priority === "low" ? "🟢 " : ""}${t.title}`,
          completed: t.completed === 1,
        }))}
        onToggle={(id) => toggleTodo(id as number)}
        onDelete={(id) => deleteTodo(id as number)}
      />
    </div>
  );
}
