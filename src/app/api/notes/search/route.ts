import { NextResponse } from "next/server";
import { searchNotes } from "@/lib/searchNotes";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const hits = await searchNotes(q);
  return NextResponse.json({ hits });
}
