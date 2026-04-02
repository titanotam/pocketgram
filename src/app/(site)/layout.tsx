import { auth } from "@/auth";
import { getAllNotesIndex } from "@/lib/notes";
import { NotesShell } from "@/components/NotesShell";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, notes] = await Promise.all([auth(), getAllNotesIndex()]);
  const userName = session?.user?.name ?? null;
  const canCreate = Boolean(session?.user?.id);

  return (
    <NotesShell
      notes={notes}
      userName={userName}
      canCreate={canCreate}
    >
      {children}
    </NotesShell>
  );
}
