import { prisma } from "@/lib/prisma";
import { getMarkdownNotesIndex, toTitleCaseSegment } from "@/lib/notes";

export type SearchHit = {
  routePath: string;
  title: string;
  categoryTitle: string;
};

const MAX = 20;

export async function searchNotes(query: string): Promise<SearchHit[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const hits: SearchHit[] = [];
  const seen = new Set<string>();

  const dbNotes = await prisma.note.findMany({
    orderBy: { updatedAt: "desc" },
  });

  for (const n of dbNotes) {
    if (hits.length >= MAX) break;
    const hay = `${n.title} ${n.content}`.toLowerCase();
    if (!hay.includes(needle)) continue;
    const key = `db:${n.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({
      routePath: n.id,
      title: n.title,
      categoryTitle: toTitleCaseSegment(n.category),
    });
  }

  for (const item of getMarkdownNotesIndex()) {
    if (hits.length >= MAX) break;
    if (!item.searchText.includes(needle)) continue;
    const key = item.key;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({
      routePath: item.routePath,
      title: item.title,
      categoryTitle: item.categoryTitle,
    });
  }

  return hits;
}
