"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SearchHit = {
  routePath: string;
  title: string;
  categoryTitle: string;
};

type Props = {
  onMenuClick: () => void;
};

export function SiteHeader({ onMenuClick }: Props) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/notes/search?q=${encodeURIComponent(q)}`
        );
        const data = (await res.json()) as { hits?: SearchHit[] };
        setHits(data.hits ?? []);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => window.clearTimeout(t);
  }, [query]);

  const showPanel = query.trim().length > 0;

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-700 lg:hidden"
          aria-label="Open menu"
          onClick={onMenuClick}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <Link
          href="/"
          className="shrink-0 font-sans text-lg font-bold tracking-tight text-gray-900"
        >
          PocketGram
        </Link>

        <div className="relative mx-auto w-full max-w-md min-w-0">
          <label htmlFor="site-search" className="sr-only">
            Search notes
          </label>
          <input
            id="site-search"
            type="search"
            placeholder="Search notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          {showPanel && (
            <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {loading && (
                <p className="px-3 py-2 text-sm text-gray-500">Searching…</p>
              )}
              {!loading && hits.length > 0 && (
                <ul className="max-h-72 overflow-auto" role="listbox">
                  {hits.map((h) => (
                    <li key={`${h.routePath}`} role="option">
                      <Link
                        href={`/note/${h.routePath}`}
                        className="block px-3 py-2 text-sm text-gray-900 hover:bg-gray-50"
                        onClick={() => setQuery("")}
                      >
                        <span className="font-medium">{h.title}</span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {h.categoryTitle}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {!loading && hits.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-600">No matches.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
