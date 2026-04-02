import Link from "next/link";
import { CreateNoteForm } from "@/components/CreateNoteForm";
import { getCategoryOptions } from "@/lib/notes";

export const metadata = {
  title: "Create note | PocketGram",
};

export default async function CreateNotePage() {
  const categories = await getCategoryOptions();
  const defaultCategory =
    categories.find((c) => c.value === "general")?.value ??
    categories[0]?.value ??
    "general";

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-6 text-sm text-gray-500">
        <Link href="/" className="text-gray-700 hover:underline">
          Home
        </Link>
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
        New note
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Add a title, category, and content. Attached images are saved to your host
        (e.g. Vercel Blob in production or{" "}
        <code className="rounded bg-gray-100 px-1 text-gray-800">/uploads</code>{" "}
        locally).
      </p>
      <div className="mt-8">
        <CreateNoteForm
          categories={categories}
          defaultCategory={defaultCategory}
        />
      </div>
    </div>
  );
}
