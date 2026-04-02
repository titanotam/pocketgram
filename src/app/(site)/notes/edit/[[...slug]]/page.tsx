import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { EditNoteForm } from "@/components/EditNoteForm";
import {
  canUserEditNote,
  getCategoryOptions,
  resolveNotePage,
} from "@/lib/notes";

export const metadata = {
  title: "Edit note | PocketGram",
};

type Props = {
  params: Promise<{ slug?: string[] }>;
};

export default async function EditNotePage({ params }: Props) {
  const { slug } = await params;
  if (!slug?.length) {
    redirect("/notes");
  }

  const note = await resolveNotePage(slug);
  if (!note) notFound();

  const session = await auth();
  if (!session?.user?.id) {
    const path = `/notes/edit/${slug.join("/")}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(path)}`);
  }

  const allowed = await canUserEditNote(session.user.id, note);
  if (!allowed) {
    return (
      <div className="mx-auto max-w-2xl text-gray-900">
        <p className="text-sm text-gray-600">
          You don&apos;t have permission to edit this note.
        </p>
        <Link
          href={`/note/${note.routePath}`}
          className="mt-4 inline-block text-sm text-gray-900 underline"
        >
          Back to note
        </Link>
      </div>
    );
  }

  const categories = await getCategoryOptions();

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-6 text-sm text-gray-500">
        <Link href={`/note/${note.routePath}`} className="text-gray-700 hover:underline">
          ← {note.title}
        </Link>
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
        Edit note
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Update title, category, or content. Moving a markdown note to another
        category updates its file path.
      </p>
      <div className="mt-8">
        <EditNoteForm
          routePath={note.routePath}
          initialTitle={note.title}
          initialContent={note.content}
          initialCategory={note.category}
          initialImagePath={note.imagePath}
          categories={categories}
        />
      </div>
    </div>
  );
}
