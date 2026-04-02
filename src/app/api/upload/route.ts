import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const ALLOWED = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/gif", ".gif"],
  ["image/webp", ".webp"],
]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const type = file.type;
  const ext = ALLOWED.get(type);
  if (!ext) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, GIF, and WebP images are allowed" },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const name = `${randomUUID()}${ext}`;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (blobToken) {
    try {
      const blob = await put(`uploads/${name}`, buf, {
        access: "public",
        token: blobToken,
        contentType: type,
      });
      return NextResponse.json({ url: blob.url });
    } catch (err) {
      console.error("[upload] Vercel Blob put failed:", err);
      return NextResponse.json(
        { error: "Upload storage failed. Check BLOB_READ_WRITE_TOKEN and Blob store in Vercel." },
        { status: 502 },
      );
    }
  }

  // Vercel has no writable disk under the app — disk fallback only for local / self-hosted.
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error:
          "Image uploads on Vercel need Vercel Blob. Add BLOB_READ_WRITE_TOKEN (Storage → Blob in your Vercel project) and redeploy.",
      },
      { status: 503 },
    );
  }

  try {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buf);
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (err) {
    console.error("[upload] disk write failed:", err);
    return NextResponse.json({ error: "Could not save file on disk." }, { status: 500 });
  }
}
