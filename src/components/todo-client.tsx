"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

import { addTodo, deleteTodo, toggleTodo } from "@/app/(dash)/todos/actions";
import { Button, Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import type { Todo } from "@/db/schema";

export function TodoClient({ todos }: { todos: Todo[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  const active = todos.filter((t) => !t.completed);
  const done = todos.filter((t) => t.completed);

  return (
    <div className="flex flex-col gap-6">
      <form
        ref={formRef}
        action={async (fd) => {
          await addTodo(fd);
          formRef.current?.reset();
        }}
        className="flex items-center gap-2"
      >
        <Input name="title" placeholder="What needs to be done?" className="flex-1" required />
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

      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {active.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </AnimatePresence>
      </div>

      {done.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground">Completed ({done.length})</p>
          <AnimatePresence>
            {done.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {todos.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No tasks yet. Add one above.
        </p>
      )}
    </div>
  );
}

function TodoItem({ todo }: { todo: Todo }) {
  const priorityColor =
    todo.priority === "high" ? "border-destructive/50"
    : todo.priority === "low" ? "border-green-400/50"
    : "border-amber-400/50";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25 }}
      className={`group/item flex items-center gap-3 rounded-lg border ${priorityColor} bg-background px-3 py-2.5 transition-colors ${todo.completed ? "opacity-60" : ""}`}
    >
      <Checkbox
        checked={todo.completed === 1}
        onCheckedChange={() => toggleTodo(todo.id)}
      />
      <span className={`flex-1 text-sm ${todo.completed ? "line-through decoration-wavy decoration-1 text-muted-foreground" : ""}`}>
        {todo.priority === "high" && <span className="mr-1">🔴</span>}
        {todo.priority === "low" && <span className="mr-1">🟢</span>}
        {todo.title}
      </span>
      <button
        onClick={() => deleteTodo(todo.id)}
        className="rounded p-1 text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover/item:opacity-100"
        aria-label="Delete"
      >
        <Trash2 className="size-3.5" />
      </button>
    </motion.div>
  );
}
