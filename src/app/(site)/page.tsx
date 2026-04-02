import Link from "next/link";
import { getAllNotesIndex } from "@/lib/notes";

export default async function HomePage() {
  const notes = await getAllNotesIndex();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
        Welcome
      </h1>
      <p className="mt-3 text-gray-600">
        PocketGram is a compact grammar reference. Open{" "}
        <Link
          href="/notes"
          className="text-gray-900 underline underline-offset-2"
        >
          All notes
        </Link>{" "}
        for everything on one page, use the sidebar by category, search in the
        header, or{" "}
        <Link
          href="/login"
          className="text-gray-900 underline underline-offset-2"
        >
          sign in
        </Link>{" "}
        to add notes.
      </p>
      {notes.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">
          No notes yet. Add Markdown under{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-gray-800">
            notes/
          </code>{" "}
          or create one in the app.
        </p>
      ) : (
        <ul className="mt-8 space-y-2 border-t border-gray-100 pt-6">
          {notes.map((n) => (
            <li key={n.key}>
              <Link
                href={`/note/${n.routePath}`}
                className="text-gray-900 underline-offset-2 hover:underline"
              >
                {n.title}
              </Link>
              <span className="ml-2 text-sm text-gray-500">
                {n.categoryTitle}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
