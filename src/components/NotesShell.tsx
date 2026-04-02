"use client";

import { useMemo, useState } from "react";
import type { NoteIndexItem } from "@/lib/notes";
import { SiteHeader } from "./SiteHeader";
import { Sidebar } from "./Sidebar";

type Props = {
  notes: NoteIndexItem[];
  userName: string | null;
  canCreate: boolean;
  children: React.ReactNode;
};

export function NotesShell({ notes, userName, canCreate, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const categories = useMemo(() => {
    const map = new Map<string, NoteIndexItem[]>();
    for (const n of notes) {
      const list = map.get(n.category) ?? [];
      list.push(n);
      map.set(n.category, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.title.localeCompare(b.title);
      });
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, catNotes]) => ({
        id,
        title: catNotes[0]?.categoryTitle ?? id,
        notes: catNotes,
      }));
  }, [notes]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white text-gray-900">
      <SiteHeader onMenuClick={() => setMenuOpen((o) => !o)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          categories={categories}
          open={menuOpen}
          onNavigate={closeMenu}
          userName={userName}
          canCreate={canCreate}
        />
        <main className="min-h-[calc(100vh-3.5rem)] min-w-0 flex-1 overflow-x-hidden px-4 py-8 sm:px-8 lg:border-l lg:border-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}
