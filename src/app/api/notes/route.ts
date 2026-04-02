import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeCategory } from "@/lib/category";
import { deleteNoteForUser, updateNoteForUser } from "@/lib/notes";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string; content?: string; category?: string; imagePath?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";
  const rawCat =
    typeof body.category === "string" ? body.category : "general";
  const category = normalizeCategory(rawCat) || "general";
  const imagePath =
    typeof body.imagePath === "string" && body.imagePath.trim()
      ? body.imagePath.trim()
      : null;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      title,
      content,
      category,
      imagePath,
      userId: session.user.id,
    },
  });

  return NextResponse.json({
    id: note.id,
    routePath: note.id,
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { routePath?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const routePath =
    typeof body.routePath === "string" ? body.routePath.trim() : "";
  if (!routePath) {
    return NextResponse.json({ error: "routePath is required" }, { status: 400 });
  }

  const result = await deleteNoteForUser(routePath, session.user.id);
  if ("ok" in result) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json(
    { error: result.error },
    { status: result.status }
  );
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    routePath?: string;
    title?: string;
    content?: string;
    category?: string;
    imagePath?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const routePath =
    typeof body.routePath === "string" ? body.routePath.trim() : "";
  const title = typeof body.title === "string" ? body.title : "";
  const content = typeof body.content === "string" ? body.content : "";
  const rawCat =
    typeof body.category === "string" ? body.category : "general";
  const imagePath =
    typeof body.imagePath === "string" && body.imagePath.trim()
      ? body.imagePath.trim()
      : null;

  if (!routePath) {
    return NextResponse.json({ error: "routePath is required" }, { status: 400 });
  }

  const result = await updateNoteForUser(routePath, session.user.id, {
    title,
    content,
    category: rawCat,
    imagePath,
  });

  if ("ok" in result) {
    return NextResponse.json({
      ok: true,
      routePath: result.routePath,
    });
  }
  return NextResponse.json(
    { error: result.error },
    { status: result.status }
  );
}
