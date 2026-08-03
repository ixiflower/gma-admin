"use client";

import { useState } from "react";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { CheckCircle2, NotebookPen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addRepoTodo,
  toggleRepoTodo,
  deleteRepoTodo,
  addRepoNote,
  deleteRepoNote,
} from "@/app/(dash)/projects/actions";

interface Todo {
  id: number;
  title: string;
  completed: number;
  priority: string;
}
interface Note {
  id: number;
  title: string;
  content: string | null;
}

export function RepoAdminPanel({
  repo,
  initialTodos,
  initialNotes,
}: {
  repo: string;
  initialTodos: Todo[];
  initialNotes: Note[];
}) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [todoTitle, setTodoTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const send = async (
    action: (fd: FormData) => Promise<{ error?: string } | undefined>,
    fd: FormData,
  ) => {
    const res = await action(fd);
    if (res?.error) {
      toast.error(res.error);
      return false;
    }
    return true;
  };

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3 text-sm font-medium">Repository Admin</div>
        <Tabs defaultValue="todos" className="p-3">
          <TabsList className="w-full">
            <TabsTrigger value="todos" className="flex-1 gap-1">
              <CheckCircle2 className="size-3.5" /> Todos
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex-1 gap-1">
              <NotebookPen className="size-3.5" /> Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="mt-3 flex flex-col gap-3">
            <form
              className="flex flex-col gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData();
                fd.set("repo", repo);
                fd.set("title", todoTitle);
                fd.set("priority", priority);
                const ok = await send(addRepoTodo, fd);
                if (ok) {
                  setTodos((t) => [...t, { id: Date.now(), title: todoTitle, completed: 0, priority }]);
                  setTodoTitle("");
                }
              }}
            >
              <Input
                value={todoTitle}
                onChange={(e) => setTodoTitle(e.target.value)}
                placeholder="New todo…"
                className="h-8"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={priority} onValueChange={(value) => setPriority(value ?? "medium")}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" size="sm" className="h-8" disabled={!todoTitle.trim()}>
                  <Plus className="size-3.5" /> Add
                </Button>
              </div>
            </form>

            <ul className="flex flex-col gap-1.5">
              {todos.length === 0 && (
                <li className="py-4 text-center text-xs text-muted-foreground">
                  No todos for this repo yet.
                </li>
              )}
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
                >
                  <button
                    type="button"
                    className={todo.completed ? "text-emerald-500" : "text-muted-foreground"}
                    onClick={async () => {
                      const fd = new FormData();
                      fd.set("repo", repo);
                      fd.set("id", String(todo.id));
                      fd.set("completed", todo.completed ? "0" : "1");
                      const ok = await send(toggleRepoTodo, fd);
                      if (ok) {
                        setTodos((ts) =>
                          ts.map((t) =>
                            t.id === todo.id
                              ? { ...t, completed: t.completed ? 0 : 1 }
                              : t,
                          ),
                        );
                      }
                    }}
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <span className="block size-4 rounded-full border" />
                    )}
                  </button>
                  <span className={`flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                    {todo.title}
                  </span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={async () => {
                      const fd = new FormData();
                      fd.set("repo", repo);
                      fd.set("id", String(todo.id));
                      const ok = await send(deleteRepoTodo, fd);
                      if (ok) {
                        setTodos((ts) => ts.filter((t) => t.id !== todo.id));
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="notes" className="mt-3 flex flex-col gap-3">
            <form
              className="flex flex-col gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData();
                fd.set("repo", repo);
                fd.set("title", noteTitle);
                fd.set("content", noteContent);
                const ok = await send(addRepoNote, fd);
                if (ok) {
                  setNotes((ns) => [{ id: Date.now(), title: noteTitle, content: noteContent }, ...ns]);
                  setNoteTitle("");
                  setNoteContent("");
                }
              }}
            >
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title…"
                className="h-8"
              />
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Note content…"
                className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button type="submit" size="sm" className="h-8" disabled={!noteTitle.trim()}>
                <Plus className="size-3.5" /> Add note
              </Button>
            </form>

            <ul className="flex flex-col gap-2">
              {notes.length === 0 && (
                <li className="py-4 text-center text-xs text-muted-foreground">
                  No notes for this repo yet.
                </li>
              )}
              {notes.map((note) => (
                <li key={note.id} className="rounded-md border p-2 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="flex-1 font-medium">{note.title}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={async () => {
                        const fd = new FormData();
                        fd.set("repo", repo);
                        fd.set("id", String(note.id));
                        const ok = await send(deleteRepoNote, fd);
                        if (ok) {
                          setNotes((ns) => ns.filter((n) => n.id !== note.id));
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  {note.content && (
                    <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                      {note.content}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
