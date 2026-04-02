import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canUserDeleteNote,
  canUserEditNote,
  getAllNotesIndex,
  resolveNotePage,
} from "@/lib/notes";
import { DeleteNoteButton } from "@/components/DeleteNoteButton";
import { NoteBody } from "@/components/NoteBody";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const pathStr = slug?.length ? slug.join("/") : "";
  if (!pathStr) {
    return { title: "Notes | PocketGram" };
  }
  const note = await resolveNotePage(slug ?? []);
  if (!note) return { title: "Not found | PocketGram" };
  return { title: `${note.title} | PocketGram` };
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params;

  if (!slug?.length) {
    const all = await getAllNotesIndex();
    const first = all[0];
    if (first) redirect(`/note/${first.routePath}`);
    return (
      <p className="text-gray-600">
        No notes yet.{" "}
        <a href="/login" className="text-gray-900 underline">
          Sign in
        </a>{" "}
        to create notes, or add Markdown under{" "}
        <code className="rounded bg-gray-100 px-1 py-0.5 text-sm text-gray-800">
          notes/
        </code>
        .
      </p>
    );
  }

  const note = await resolveNotePage(slug);
  if (!note) notFound();

  const session = await auth();
  const showDelete = await canUserDeleteNote(session?.user?.id, note);
  const showEdit = await canUserEditNote(session?.user?.id, note);

  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-gray-500">{note.categoryTitle}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
        {note.title}
      </h1>
      {note.imagePath && !note.content.includes(note.imagePath) ? (
        <img
          src={note.imagePath}
          alt=""
          className="mt-6 max-h-96 w-full rounded-lg border border-gray-200 object-contain"
        />
      ) : null}
      <div className="mt-8">
        <NoteBody markdown={note.content} />
      </div>
      {showEdit || showDelete ? (
        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-6">
          {showEdit ? (
            <Link
              href={`/notes/edit/${note.routePath}`}
              className="text-sm text-gray-900 underline-offset-2 hover:underline"
            >
              Edit note
            </Link>
          ) : null}
          {showDelete ? <DeleteNoteButton routePath={note.routePath} /> : null}
        </div>
      ) : null}
    </article>
  );
}
