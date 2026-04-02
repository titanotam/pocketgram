"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  routePath: string;
};

export function DeleteNoteButton({ routePath }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function performDelete() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routePath }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not delete note");
        return;
      }
      router.push("/notes");
      router.refresh();
    } catch {
      setError("Could not delete note");
    } finally {
      setPending(false);
    }
  }

  if (confirming) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-900">
          Delete this note permanently?
        </p>
        <p className="mt-1 text-xs text-gray-600">This cannot be undone.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            disabled={pending}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={performDelete}
            disabled={pending}
            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
          >
            {pending ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        className="text-sm text-red-700 underline-offset-2 hover:underline disabled:opacity-50"
      >
        Delete note
      </button>
    </div>
  );
}
