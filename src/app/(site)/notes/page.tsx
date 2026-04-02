import Link from "next/link";
import { getAllNotesIndex } from "@/lib/notes";

export const metadata = {
  title: "All notes | PocketGram",
};

export default async function AllNotesPage() {
  const notes = await getAllNotesIndex();

  const rows = [...notes].sort((a, b) => {
    const cat = a.category.localeCompare(b.category);
    if (cat !== 0) return cat;
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="mx-auto max-w-4xl">
      <p className="mb-2 text-sm text-gray-500">
        <Link href="/" className="text-gray-700 hover:underline">
          Home
        </Link>
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
        All notes
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Every note in one table, sorted by category then title.
      </p>

      {notes.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">
          No notes yet. Add Markdown under{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-gray-800">
            notes/
          </code>{" "}
          or sign in to create notes.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold text-gray-700"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold text-gray-700"
                >
                  Title
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold text-gray-700"
                >
                  Content
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.map((n) => (
                <tr key={n.key} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {n.categoryTitle}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top">
                    <Link
                      href={`/note/${n.routePath}`}
                      className="font-medium text-gray-900 underline-offset-2 hover:underline"
                    >
                      {n.title}
                    </Link>
                  </td>
                  <td className="max-w-md px-4 py-3 align-top text-gray-600">
                    <p className="line-clamp-2 text-xs leading-relaxed">
                      {n.contentPreview}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
