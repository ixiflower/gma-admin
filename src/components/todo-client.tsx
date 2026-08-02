"use client";

import { useRef } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
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

  const getItems = (status: string) => todos.filter((t) => t.status === status);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const id = Number(result.draggableId);
    const newStatus = result.destination.droppableId;
    moveTodo(id, newStatus);
  };

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

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className={`flex flex-col rounded-xl border border-t-2 ${color} bg-muted/30`}>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">{label}</span>
                <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {getItems(key).length}
                </span>
              </div>
              <Droppable droppableId={key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex min-h-[200px] flex-1 flex-col gap-2 p-2 transition-colors ${
                      snapshot.isDraggingOver ? "bg-primary/5" : ""
                    }`}
                  >
                    <AnimatePresence mode="popLayout">
                      {getItems(key).map((todo, index) => (
                        <Draggable key={todo.id} draggableId={String(todo.id)} index={index}>
                          {(provided, snapshot) => (
                            <motion.div
                              layout
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`group/item rounded-lg border bg-background p-2.5 shadow-sm transition-shadow ${
                                snapshot.isDragging ? "shadow-lg ring-1 ring-primary/20" : "hover:shadow"
                              } ${todo.completed ? "opacity-60" : ""}`}
                            >
                              <div className="flex items-start gap-2">
                                <div {...provided.dragHandleProps} className="mt-0.5 shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground">
                                  <GripVertical className="size-3.5" />
                                </div>
                                <Checkbox
                                  checked={todo.completed === 1}
                                  onCheckedChange={() => toggleTodo(todo.id)}
                                  className="mt-0.5 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                                    {todo.priority === "high" && "🔴 "}
                                    {todo.priority === "low" && "🟢 "}
                                    {todo.title}
                                  </p>
                                </div>
                                <button
                                  onClick={() => deleteTodo(todo.id)}
                                  className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover/item:opacity-100"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                    {getItems(key).length === 0 && (
                      <div className="flex flex-1 items-center justify-center py-8">
                        <p className="text-xs text-muted-foreground">Drop tasks here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
