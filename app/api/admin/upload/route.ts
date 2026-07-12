import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { audit, currentUser } from "@/lib/users";

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const MAX_BYTES = 8 * 1024 * 1024;

/** Magic-byte check so a renamed executable can't be stored as an "image". */
function sniffImage(buf: Buffer, ext: string): boolean {
  if (buf.length < 12) return false;
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case ".png":
      return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case ".webp":
      return buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP";
    case ".avif":
      return buf.subarray(4, 8).toString("latin1") === "ftyp";
    default:
      return false;
  }
}

/**
 * Uploads land in data/uploads (not public/) and are served by the
 * /uploads/[name] route handler — files in public/ are snapshotted at build
 * time, so anything uploaded after `next build` would otherwise 404.
 */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 8 MB" }, { status: 413 });
  }
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED.has(ext)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WEBP or AVIF images are accepted" },
      { status: 415 },
    );
  }
  const safeBase = path
    .basename(file.name, ext)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .slice(0, 48);
  const name = `${Date.now()}-${safeBase}${ext}`;
  const dir = path.join(process.cwd(), "data", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!sniffImage(buffer, ext)) {
    return NextResponse.json(
      { error: "File content does not match its extension" },
      { status: 415 },
    );
  }
  fs.writeFileSync(path.join(dir, name), buffer);
  audit(me.username, "upload", { detail: name });
  return NextResponse.json({ url: `/uploads/${name}` });
}
