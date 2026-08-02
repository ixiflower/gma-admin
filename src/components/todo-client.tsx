"use client";

import { useRef, useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, CheckCircle2, Circle, Clock, GripVertical } from "lucide-react";

import { addTodo, moveTodo, toggleTodo, deleteTodo } from "@/app/(dash)/todos/actions";
import { Button, Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import type { Todo } from "@/db/schema";

const COLUMNS = [
  { key: "todo", label: "To Do", icon: Circle, color: "border-t-sky-400" },
  { key: "in_progress", label: "In Progress", icon: Clock, color: "border-t-amber-400" },
  { key: "done", label: "Done", icon: CheckCircle2, color: "border-t-emerald-400" },
] as const;

export function TodoClient({ todos }: { todos: Todo[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [items, setItems] = useState(todos);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const id = Number(active.id);
    const overId = over.id as string;

    if (COLUMNS.some((c) => c.key === overId)) {
      moveTodo(id, overId);
      setItems((prev) => prev.map((t) => t.id === id ? { ...t, status: overId } : t));
    }
  };

  const getItems = (status: string) => items.filter((t) => t.status === status);

  return (
    <div className="flex flex-col gap-4">
      <form
        ref={formRef}
        action={async (fd) => { await addTodo(fd); formRef.current?.reset(); }}
        className="flex items-center gap-2"
      >
        <Input name="title" placeholder="What needs to be done?" className="flex-1" required />
        <Select name="priority" defaultValue="medium">
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">🟢 Low</SelectItem>
            <SelectItem value="medium">🟡 Medium</SelectItem>
            <SelectItem value="high">🔴 High</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="icon-sm"><Plus className="size-4" /></Button>
      </form>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map(({ key, label, icon: Icon, color }) => {
            const colItems = getItems(key);
            return (
              <div key={key} className={`flex flex-col rounded-xl border border-t-2 ${color} bg-muted/30`}>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <Icon className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{label}</span>
                  <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{colItems.length}</span>
                </div>
                <SortableContext items={colItems.map((t) => String(t.id))} strategy={verticalListSortingStrategy} id={key}>
                  <div className="flex min-h-[200px] flex-1 flex-col gap-2 p-2">
                    <AnimatePresence mode="popLayout">
                      {colItems.map((todo) => (
                        <SortableItem
                          key={todo.id}
                          todo={todo}
                          onToggle={() => {
                            toggleTodo(todo.id);
                            setItems((prev) =>
                              prev.map((t) => t.id === todo.id ? { ...t, completed: t.completed ? 0 as const : 1 as const } : t),
                            );
                          }}
                          onDelete={() => {
                            deleteTodo(todo.id);
                            setItems((prev) => prev.filter((t) => t.id !== todo.id));
                          }}
                        />
                      ))}
                    </AnimatePresence>
                    {colItems.length === 0 && (
                      <div className="flex flex-1 items-center justify-center">
                        <p className="text-xs text-muted-foreground">Drop tasks here</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}

function SortableItem({
  todo, onToggle, onDelete,
}: {
  todo: Todo; onToggle: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(todo.id) });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      ref={setNodeRef}
      style={style}
      className={`group/item rounded-lg border bg-background p-2.5 shadow-sm transition-shadow ${
        isDragging ? "z-50 shadow-lg ring-1 ring-primary/20 opacity-80" : "hover:shadow"
      } ${todo.completed ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="mt-0.5 shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground touch-none">
          <GripVertical className="size-3.5" />
        </div>
        <Checkbox checked={todo.completed === 1} onCheckedChange={onToggle} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
            {todo.priority === "high" ? "🔴 " : todo.priority === "low" ? "🟢 " : ""}
            {todo.title}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover/item:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
