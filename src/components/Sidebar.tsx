"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { NoteIndexItem } from "@/lib/notes";

type Props = {
  categories: { id: string; title: string; notes: NoteIndexItem[] }[];
  open: boolean;
  onNavigate: () => void;
  userName: string | null;
  canCreate: boolean;
};

export function Sidebar({
  categories,
  open,
  onNavigate,
  userName,
  canCreate,
}: Props) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-gray-900/30 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        onClick={onNavigate}
      />
      <aside
        className={`fixed top-14 bottom-0 left-0 z-40 w-64 overflow-y-auto border-r border-gray-200 bg-white transition-transform duration-200 ease-out lg:static lg:top-auto lg:z-0 lg:shrink-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Categories"
      >
        <nav className="p-4 pb-24">
          <div className="mb-4 border-b border-gray-100 pb-4">
            {userName ? (
              <div className="space-y-2">
                <p className="truncate text-sm font-medium text-gray-900">
                  {userName}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                    onNavigate();
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-center text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={onNavigate}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-center text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
              >
                Login
              </Link>
            )}
          </div>

          {canCreate ? (
            <Link
              href="/notes/create"
              onClick={onNavigate}
              className="mb-3 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-center text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
            >
              Create
            </Link>
          ) : null}

          <Link
            href="/notes"
            onClick={onNavigate}
            className={`mb-6 block w-full rounded-md border px-3 py-2 text-center text-sm font-medium shadow-sm ${
              pathname === "/notes"
                ? "border-gray-400 bg-gray-100 text-gray-900"
                : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
            }`}
          >
            All notes
          </Link>

          {categories.map((cat) => (
            <div key={cat.id} className="mb-6 last:mb-0">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {cat.title}
              </h2>
              <ul className="space-y-0.5">
                {cat.notes.map((note) => {
                  const href = `/note/${note.routePath}`;
                  const active = pathname === href;
                  return (
                    <li key={note.key}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        className={`block rounded-md px-2 py-1.5 text-sm ${
                          active
                            ? "bg-gray-100 font-medium text-gray-900"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {note.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
