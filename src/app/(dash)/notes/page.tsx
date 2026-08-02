import { Separator } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getNotes } from "@/app/(dash)/notes/actions";
import { NotesClient } from "@/components/notes-client";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const user = await getSession();
  const notes = user ? await getNotes(user.id) : [];

  return (
    <div className="flex flex-1 flex-col gap-0 overflow-hidden -mx-4">
      <div className="px-4 pb-3">
        <h2 className="text-lg font-semibold">Notes</h2>
        <p className="text-sm text-muted-foreground">{notes.length} note{notes.length !== 1 && "s"}</p>
      </div>
      <Separator />
      <NotesClient notes={notes} />
    </div>
  );
}
