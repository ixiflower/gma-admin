"use client";

import { useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  useDroppable,
  type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, CheckCircle2, Circle, Clock, GripVertical, ChevronLeft, ChevronRight } from "lucide-react";

import { addTodo, moveTodo, toggleTodo, deleteTodo } from "@/app/(dash)/todos/actions";
import {
  Button, Checkbox, Input, Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui";
import type { Todo } from "@/db/schema";

const STATUS_ORDER = ["todo", "in_progress", "done"] as const;

const COLUMNS = [
  { key: "todo", label: "To Do", icon: Circle, color: "border-t-sky-400 bg-sky-50/50 dark:bg-sky-950/20" },
  { key: "in_progress", label: "In Progress", icon: Clock, color: "border-t-amber-400 bg-amber-50/50 dark:bg-amber-950/20" },
  { key: "done", label: "Done", icon: CheckCircle2, color: "border-t-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20" },
] as const;

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}

export function TodoClient({ todos }: { todos: Todo[] }) {
  const [items, setItems] = useState(todos);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Helper: given a sortable item id, find which column it's in
  const findColumn = (itemId: string): string | null => {
    const todo = items.find((t) => String(t.id) === itemId);
    return todo?.status ?? null;
  };

  // During drag: visual-only column switch (optimistic)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const activeCol = findColumn(activeId);
    // Is over a column container or a sortable item?
    const overCol = COLUMNS.some((c) => c.key === overId) ? overId : findColumn(overId);
    if (!activeCol || !overCol || activeCol === overCol) return;

    setItems((prev) =>
      prev.map((t) => (String(t.id) === activeId ? { ...t, status: overCol } : t)),
    );
  };

  // On drop: persist
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    // Find which column the item is now in (could have been moved by dragOver)
    const currentItem = items.find((t) => String(t.id) === activeId);
    if (!currentItem) return;

    // Determine target column
    const targetCol = COLUMNS.some((c) => c.key === overId) ? overId : findColumn(overId);
    if (!targetCol) return;

    moveTodo(Number(activeId), targetCol);
  };

  const getItems = (status: string) => items.filter((t) => t.status === status);

  const done = items.filter((t) => t.completed).length;

  const moveStatus = (todoId: number, currentStatus: string, direction: -1 | 1) => {
    const idx = STATUS_ORDER.indexOf(currentStatus as typeof STATUS_ORDER[number]);
    const target = STATUS_ORDER[idx + direction];
    if (!target) return;
    moveTodo(todoId, target);
    setItems((prev) => prev.map((t) => t.id === todoId ? { ...t, status: target } : t));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Todos</h2>
          <p className="text-sm text-muted-foreground">
            {items.length} task{items.length !== 1 && "s"} — {done} done
          </p>
        </div>
        <Button size="icon-sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>Add a new task to your todo list.</DialogDescription>
          </DialogHeader>
          <CreateTodoForm
            onCreated={(newTodo) => {
              setItems((prev) => [newTodo, ...prev]);
              setDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map(({ key, label, icon: Icon, color }) => {
            const colItems = getItems(key);
            return (
              <DroppableColumn key={key} id={key}>
                <div className={`flex flex-col rounded-xl border border-t-2 ${color}`}>
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{label}</span>
                    <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{colItems.length}</span>
                  </div>
                  <SortableContext items={colItems.map((t) => String(t.id))} strategy={verticalListSortingStrategy} id={key}>
                    <div className="flex min-h-[200px] flex-1 flex-col gap-2 rounded-b-xl p-2">
                      <AnimatePresence mode="popLayout">
                        {colItems.map((todo) => {
                          const idx = STATUS_ORDER.indexOf(key);
                          const canMoveLeft = idx > 0;
                          const canMoveRight = idx < STATUS_ORDER.length - 1;
                          return (
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
                              onMoveLeft={() => moveStatus(todo.id, key, -1)}
                              onMoveRight={() => moveStatus(todo.id, key, 1)}
                              canMoveLeft={canMoveLeft}
                              canMoveRight={canMoveRight}
                            />
                          );
                        })}
                      </AnimatePresence>
                      {colItems.length === 0 && (
                        <div className="flex flex-1 items-center justify-center">
                          <p className="text-xs text-muted-foreground">Drop tasks here</p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              </DroppableColumn>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}

function CreateTodoForm({ onCreated }: { onCreated: (todo: Todo) => void }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.set("title", title);
    fd.set("priority", priority);
    const newTodo = await addTodo(fd);
    setSubmitting(false);
    if (newTodo) {
      setTitle("");
      setPriority("medium");
      onCreated(newTodo);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          required
          autoFocus
        />
        <Select value={priority} onValueChange={(v) => setPriority(v ?? "medium")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">🟢 Low</SelectItem>
            <SelectItem value="medium">🟡 Medium</SelectItem>
            <SelectItem value="high">🔴 High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={submitting || !title.trim()}>
        {submitting ? "Adding..." : "Add Task"}
      </Button>
    </form>
  );
}

function SortableItem({
  todo, onToggle, onDelete, onMoveLeft, onMoveRight, canMoveLeft, canMoveRight,
}: {
  todo: Todo; onToggle: () => void; onDelete: () => void;
  onMoveLeft: () => void; onMoveRight: () => void;
  canMoveLeft: boolean; canMoveRight: boolean;
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
      className={`group/item rounded-lg border bg-background shadow-sm transition-shadow ${
        isDragging ? "z-50 shadow-xl ring-2 ring-primary/40 rotate-[2deg] scale-[1.03]" : "hover:shadow-md"
      } ${todo.completed ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-2 p-2.5">
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
        <div className="mt-0.5 flex shrink-0 items-center gap-0.5 opacity-0 transition-all group-hover/item:opacity-100">
          {canMoveLeft && (
            <button
              onClick={onMoveLeft}
              className="rounded p-0.5 text-muted-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
              title="Move left"
            >
              <ChevronLeft className="size-3.5" />
            </button>
          )}
          {canMoveRight && (
            <button
              onClick={onMoveRight}
              className="rounded p-0.5 text-muted-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
              title="Move right"
            >
              <ChevronRight className="size-3.5" />
            </button>
          )}
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
