"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Quote,
  Undo2, Redo2, Plus, Trash2, Heading1, Heading2, Code,
} from "lucide-react";

import { createNote, updateNote, deleteNote } from "@/app/(dash)/notes/actions";
import { Button, Input, Separator } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Note } from "@/db/schema";

export function NotesClient({ notes: initialNotes }: { notes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [activeId, setActiveId] = useState<number | null>(initialNotes[0]?.id ?? null);
  const [title, setTitle] = useState("");

  const active = notes.find((n) => n.id === activeId);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content: active?.content ?? "",
    editable: true,
    onUpdate: ({ editor: ed }) => {
      if (activeId) {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          updateNote(activeId, { content: ed.getHTML() });
        }, 800);
      }
    },
  });

  useEffect(() => {
    if (editor && active) {
      const current = editor.getHTML();
      if (current !== (active.content ?? "")) {
        editor.commands.setContent(active.content ?? "");
      }
    }
    setTitle(active?.title ?? "");
  }, [activeId, active?.id]);

  const handleNew = useCallback(async () => {
    const note = await createNote();
    if (note) {
      setNotes((prev) => [note, ...prev]);
      setActiveId(note.id);
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const handleTitleChange = useCallback(
    (val: string) => {
      setTitle(val);
      if (activeId) updateNote(activeId, { title: val });
    },
    [activeId],
  );

  if (!editor) return null;

  return (
    <div className="flex min-h-0 flex-1">
      {/* Sidebar */}
      <div className="flex w-52 shrink-0 flex-col border-r">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">All notes</span>
          <Button size="icon-xs" variant="ghost" onClick={handleNew}>
            <Plus className="size-3.5" />
          </Button>
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => setActiveId(note.id)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted group/item",
                activeId === note.id && "bg-muted font-medium",
              )}
            >
              <span className="flex-1 truncate">{note.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover/item:opacity-100"
              >
                <Trash2 className="size-3" />
              </button>
            </button>
          ))}
          {notes.length === 0 && (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              No notes yet
            </p>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex min-w-0 flex-1 flex-col">
        {active ? (
          <>
            <div className="flex items-center gap-2 border-b px-4 py-2">
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="h-7 border-none px-0 text-sm font-medium shadow-none focus-visible:ring-0"
                placeholder="Note title..."
              />
            </div>
            <div className="flex items-center gap-0.5 border-b px-2 py-1">
              <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
                <Bold className="size-3.5" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
                <Italic className="size-3.5" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>
                <Strikethrough className="size-3.5" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")}>
                <Code className="size-3.5" />
              </ToolbarButton>
              <span className="mx-1 h-4 w-px bg-border" />
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}>
                <Heading1 className="size-3.5" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
                <Heading2 className="size-3.5" />
              </ToolbarButton>
              <span className="mx-1 h-4 w-px bg-border" />
              <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
                <List className="size-3.5" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
                <ListOrdered className="size-3.5" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
                <Quote className="size-3.5" />
              </ToolbarButton>
              <span className="mx-1 h-4 w-px bg-border" />
              <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                <Undo2 className="size-3.5" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                <Redo2 className="size-3.5" />
              </ToolbarButton>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <EditorContent editor={editor} className="tiptap flex-1" />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">Select a note or create a new one</p>
              <Button variant="outline" size="sm" onClick={handleNew}>
                <Plus className="size-4" />
                New note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick, active, disabled, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}
