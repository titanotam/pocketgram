import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { CategoryOption } from "@/lib/category";
import { normalizeCategory } from "@/lib/category";
import { prisma } from "@/lib/prisma";

export { normalizeCategory } from "@/lib/category";
export type { CategoryOption } from "@/lib/category";

const NOTES_DIR = path.join(process.cwd(), "notes");

/** Plain-text-ish excerpt for list views (not rendered as Markdown). */
function toContentPreview(markdown: string, maxLen = 160): string {
  const t = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/:::example[\s\S]*?:::/gi, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, "$1")
    .replace(/^[#>\s\-*]+/gm, " ")
    .replace(/[#*_]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= maxLen) return t || "—";
  return `${t.slice(0, maxLen - 1).trimEnd()}…`;
}

export type NoteIndexItem = {
  key: string;
  routePath: string;
  category: string;
  categoryTitle: string;
  title: string;
  order: number;
  searchText: string;
  contentPreview: string;
  source: "markdown" | "database";
};

export type NotePage = {
  routePath: string;
  category: string;
  categoryTitle: string;
  title: string;
  content: string;
  imagePath: string | null;
  source: "markdown" | "database";
};

export function toTitleCaseSegment(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function walkMarkdownFiles(dir: string, parts: string[] = []): NoteIndexItem[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: NoteIndexItem[] = [];

  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkMarkdownFiles(full, [...parts, ent.name]));
    } else if (ent.isFile() && ent.name.endsWith(".md")) {
      const slug = ent.name.replace(/\.md$/i, "");
      const slugPath = [...parts, slug].join("/");
      const raw = fs.readFileSync(full, "utf8");
      const { data, content } = matter(raw);
      const category = (parts[0] ?? "general").toLowerCase();
      const title =
        typeof data.title === "string"
          ? data.title
          : toTitleCaseSegment(slug);
      const order = typeof data.order === "number" ? data.order : 999;
      out.push({
        key: `md:${slugPath}`,
        routePath: slugPath,
        category,
        categoryTitle: toTitleCaseSegment(category),
        title,
        order,
        searchText: `${title} ${slugPath} ${content}`.toLowerCase(),
        contentPreview: toContentPreview(content),
        source: "markdown",
      });
    }
  }

  return out;
}

export function getMarkdownNotesIndex(): NoteIndexItem[] {
  return walkMarkdownFiles(NOTES_DIR).sort((a, b) => {
    const cat = a.category.localeCompare(b.category);
    if (cat !== 0) return cat;
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });
}

export async function getDatabaseNotesIndex(): Promise<NoteIndexItem[]> {
  const rows = await prisma.note.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
  return rows.map((n) => ({
    key: `db:${n.id}`,
    routePath: n.id,
    category: n.category,
    categoryTitle: toTitleCaseSegment(n.category),
    title: n.title,
    order: Math.floor(n.createdAt.getTime() / 1000),
    searchText: `${n.title} ${n.content}`.toLowerCase(),
    contentPreview: toContentPreview(n.content),
    source: "database",
  }));
}

export async function getAllNotesIndex(): Promise<NoteIndexItem[]> {
  const [md, db] = await Promise.all([
    Promise.resolve(getMarkdownNotesIndex()),
    getDatabaseNotesIndex(),
  ]);
  return [...db, ...md].sort((a, b) => {
    const cat = a.category.localeCompare(b.category);
    if (cat !== 0) return cat;
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });
}

/** Distinct categories from all notes, plus `general` if missing — for create-note dropdown. */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const notes = await getAllNotesIndex();
  const map = new Map<string, string>();
  for (const n of notes) {
    if (!map.has(n.category)) {
      map.set(n.category, n.categoryTitle);
    }
  }
  if (!map.has("general")) {
    map.set("general", toTitleCaseSegment("general"));
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, label]) => ({ value, label }));
}

export function getNoteBySlugPath(slugPath: string): NotePage | null {
  const safe = slugPath.replace(/\.md$/i, "").replace(/\\/g, "/");
  if (safe.includes("..") || safe.startsWith("/")) return null;

  const filePath = path.join(NOTES_DIR, `${safe}.md`);
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(path.normalize(NOTES_DIR))) return null;
  if (!fs.existsSync(normalized)) return null;

  const raw = fs.readFileSync(normalized, "utf8");
  const { data, content } = matter(raw);
  const segments = safe.split("/");
  const category = (segments[0] ?? "general").toLowerCase();
  const slug = segments[segments.length - 1] ?? safe;
  const title =
    typeof data.title === "string" ? data.title : toTitleCaseSegment(slug);

  return {
    routePath: safe,
    category,
    categoryTitle: toTitleCaseSegment(category),
    title,
    content,
    imagePath: null,
    source: "markdown",
  };
}

export async function getNoteById(id: string): Promise<NotePage | null> {
  const row = await prisma.note.findUnique({ where: { id } });
  if (!row) return null;
  return {
    routePath: row.id,
    category: row.category,
    categoryTitle: toTitleCaseSegment(row.category),
    title: row.title,
    content: row.content,
    imagePath: row.imagePath,
    source: "database",
  };
}

export async function resolveNotePage(
  slugParts: string[]
): Promise<NotePage | null> {
  const pathStr = slugParts.join("/");
  if (!pathStr) return null;

  if (slugParts.length === 1) {
    const db = await getNoteById(slugParts[0]!);
    if (db) return db;
  }

  return getNoteBySlugPath(pathStr);
}

function deleteMarkdownFileByRoutePath(
  routePath: string
): { ok: true } | { error: string } {
  const safe = routePath.replace(/\.md$/i, "").replace(/\\/g, "/");
  if (!safe || safe.includes("..") || safe.startsWith("/")) {
    return { error: "Invalid path" };
  }
  const filePath = path.join(NOTES_DIR, `${safe}.md`);
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(path.normalize(NOTES_DIR))) {
    return { error: "Invalid path" };
  }
  if (!fs.existsSync(normalized)) {
    return { error: "Not found" };
  }
  fs.unlinkSync(normalized);
  return { ok: true };
}

/**
 * Deletes a DB note (owner only) or a markdown file under notes/ (any caller must be authorized by API).
 */
export async function deleteNoteForUser(
  routePath: string,
  userId: string
): Promise<{ ok: true } | { error: string; status: number }> {
  const trimmed = routePath.trim().replace(/\\/g, "/");
  if (!trimmed || trimmed.includes("..")) {
    return { error: "Invalid path", status: 400 };
  }

  const segments = trimmed.split("/").filter(Boolean);
  const singleId = segments.length === 1 ? segments[0]! : null;

  if (singleId) {
    const row = await prisma.note.findUnique({ where: { id: singleId } });
    if (row) {
      if (row.userId != null && row.userId !== userId) {
        return { error: "Forbidden", status: 403 };
      }
      await prisma.note.delete({ where: { id: row.id } });
      return { ok: true };
    }
  }

  const md = deleteMarkdownFileByRoutePath(trimmed);
  if ("ok" in md) return { ok: true };
  return { error: md.error, status: 404 };
}

export async function canUserDeleteNote(
  userId: string | undefined,
  note: Pick<NotePage, "source" | "routePath">
): Promise<boolean> {
  if (!userId) return false;
  if (note.source === "markdown") return true;
  const row = await prisma.note.findUnique({
    where: { id: note.routePath },
    select: { userId: true },
  });
  if (!row) return false;
  return row.userId == null || row.userId === userId;
}

/** Same rules as delete: markdown if signed in; DB if owner or legacy unowned. */
export async function canUserEditNote(
  userId: string | undefined,
  note: Pick<NotePage, "source" | "routePath">
): Promise<boolean> {
  return canUserDeleteNote(userId, note);
}

export type NoteUpdatePayload = {
  title: string;
  content: string;
  category: string;
  imagePath: string | null;
};

function resolveMarkdownAbsolutePath(routePath: string): string | null {
  const safe = routePath.replace(/\.md$/i, "").replace(/\\/g, "/");
  if (!safe || safe.includes("..") || safe.startsWith("/")) return null;
  const filePath = path.join(NOTES_DIR, `${safe}.md`);
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(path.normalize(NOTES_DIR))) return null;
  return normalized;
}

export async function updateNoteForUser(
  routePath: string,
  userId: string,
  payload: NoteUpdatePayload
): Promise<
  { ok: true; routePath: string } | { error: string; status: number }
> {
  const trimmed = routePath.trim().replace(/\\/g, "/");
  if (!trimmed || trimmed.includes("..")) {
    return { error: "Invalid path", status: 400 };
  }

  const category = normalizeCategory(payload.category) || "general";
  const title = payload.title.trim();
  if (!title) {
    return { error: "Title is required", status: 400 };
  }

  const segments = trimmed.split("/").filter(Boolean);
  const singleId = segments.length === 1 ? segments[0]! : null;

  if (singleId) {
    const row = await prisma.note.findUnique({ where: { id: singleId } });
    if (row) {
      if (row.userId != null && row.userId !== userId) {
        return { error: "Forbidden", status: 403 };
      }
      await prisma.note.update({
        where: { id: row.id },
        data: {
          title,
          content: payload.content,
          category,
          imagePath: payload.imagePath,
        },
      });
      return { ok: true, routePath: row.id };
    }
  }

  const oldAbs = resolveMarkdownAbsolutePath(trimmed);
  if (!oldAbs || !fs.existsSync(oldAbs)) {
    return { error: "Not found", status: 404 };
  }

  const raw = fs.readFileSync(oldAbs, "utf8");
  const parsed = matter(raw);
  const order =
    typeof parsed.data.order === "number" ? parsed.data.order : 999;

  const pathParts = trimmed.split("/").filter(Boolean);
  const fileSlug = pathParts[pathParts.length - 1]!;
  const newRelPath = `${category}/${fileSlug}`;
  const newAbs = resolveMarkdownAbsolutePath(newRelPath);
  if (!newAbs) {
    return { error: "Invalid path", status: 400 };
  }

  const fileBody = matter.stringify(payload.content, {
    title,
    order,
  });

  if (path.normalize(oldAbs) === path.normalize(newAbs)) {
    fs.writeFileSync(oldAbs, fileBody, "utf8");
    return { ok: true, routePath: trimmed };
  }

  if (fs.existsSync(newAbs)) {
    return { error: "A note already exists at that location", status: 409 };
  }

  fs.mkdirSync(path.dirname(newAbs), { recursive: true });
  fs.writeFileSync(newAbs, fileBody, "utf8");
  fs.unlinkSync(oldAbs);

  return { ok: true, routePath: newRelPath };
}
