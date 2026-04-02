import Link from "next/link";

export default function NoteNotFound() {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-xl font-semibold text-gray-900">Note not found</h1>
      <p className="mt-2 text-gray-600">
        That page may have moved or the link is wrong.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sky-800 underline-offset-2 hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}
