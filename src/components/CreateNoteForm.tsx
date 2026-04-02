"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { CategoryOption } from "@/lib/category";
import { normalizeCategory } from "@/lib/category";
import { MarkdownToolbar } from "@/components/MarkdownToolbar";

const NEW_CATEGORY_VALUE = "__new__";

async function uploadImage(file: Blob): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Upload failed");
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

type Props = {
  categories: CategoryOption[];
  defaultCategory: string;
};

export function CreateNoteForm({ categories, defaultCategory }: Props) {
  const router = useRouter();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState("");
  const [categorySelect, setCategorySelect] = useState(defaultCategory);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [content, setContent] = useState("");
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isNewCategory = categorySelect === NEW_CATEGORY_VALUE;

  const insertImageMarkdown = useCallback((url: string) => {
    const snippet = `\n\n![](${url})\n\n`;
    setImagePath((prev) => prev ?? url);
    const el = taRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      setContent((prev) => prev.slice(0, start) + snippet + prev.slice(end));
      requestAnimationFrame(() => {
        const pos = start + snippet.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    } else {
      setContent((prev) => prev + snippet);
    }
  }, []);

  const onPasteImages = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item?.kind === "file" && item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          try {
            const url = await uploadImage(file);
            insertImageMarkdown(url);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Paste upload failed");
          }
        }
      }
    },
    [insertImageMarkdown]
  );

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setError(null);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      try {
        const url = await uploadImage(file);
        insertImageMarkdown(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    }
    e.target.value = "";
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    let categoryPayload: string;
    if (isNewCategory) {
      const normalized = normalizeCategory(newCategoryName);
      if (!normalized) {
        setError("Enter a name for the new category.");
        return;
      }
      categoryPayload = newCategoryName.trim();
    } else {
      categoryPayload = categorySelect;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content,
          category: categoryPayload || "general",
          imagePath,
        }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save note");
        return;
      }
      if (data.id) router.push(`/note/${data.id}`);
      else router.push("/");
      router.refresh();
    } catch {
      setError("Could not save note");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-2xl space-y-6 text-gray-900"
    >
      <div>
        <label
          htmlFor="note-title"
          className="block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          placeholder="e.g. Present perfect"
          required
        />
      </div>

      <div>
        <label
          htmlFor="note-category"
          className="block text-sm font-medium text-gray-700"
        >
          Category
        </label>
        <select
          id="note-category"
          value={categorySelect}
          onChange={(e) => {
            const v = e.target.value;
            setCategorySelect(v);
            if (v !== NEW_CATEGORY_VALUE) {
              setNewCategoryName("");
            }
          }}
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
          <option value={NEW_CATEGORY_VALUE}>+ New category…</option>
        </select>
        {isNewCategory ? (
          <div className="mt-2">
            <label htmlFor="note-category-new" className="sr-only">
              New category name
            </label>
            <input
              id="note-category-new"
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="e.g. Punctuation"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-gray-500">
              Saved as a slug (lowercase, hyphens). Special characters are
              removed.
            </p>
          </div>
        ) : null}
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="note-content"
            className="block text-sm font-medium text-gray-700"
          >
            Content
          </label>
          <label className="text-sm text-gray-600">
            <span className="mr-2">Attach images</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              className="text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-sm file:text-gray-800"
              onChange={onFileChange}
            />
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Use the toolbar for common formatting, or type Markdown. Paste images
          from the clipboard into the box.
        </p>
        <div className="mt-2 overflow-hidden rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-gray-200">
          <MarkdownToolbar
            textareaRef={taRef}
            value={content}
            setValue={setContent}
          />
          <textarea
            ref={taRef}
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={onPasteImages}
            rows={16}
            className="w-full resize-y border-0 border-t border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none"
            placeholder="Write your note… Or use the buttons above for bold, lists, links, and more."
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md border border-gray-300 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save note"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
