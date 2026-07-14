import { NextResponse } from "next/server";
import { ragError, ragFetch } from "@/lib/assistant/server";
import { currentUser } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  if (user.role !== "admin") {
    return { error: NextResponse.json({ error: "Admins only" }, { status: 403 }) } as const;
  }
  return { user } as const;
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  try {
    const upstream = await ragFetch("/internal/admin/sources");
    if (!upstream.ok) return NextResponse.json({ error: await ragError(upstream) }, { status: 502 });
    return NextResponse.json(await upstream.json());
  } catch (error) {
    console.error("RAG source list failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Source service unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  const file = form.get("file");
  const title = form.get("title");
  if (!(file instanceof File) || typeof title !== "string" || title.trim().length < 2) {
    return NextResponse.json({ error: "A file and title are required" }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File exceeds 20 MB" }, { status: 413 });
  }
  const upstreamForm = new FormData();
  upstreamForm.set("file", file, file.name);
  upstreamForm.set("title", title.trim());
  upstreamForm.set("actor", auth.user.username);
  for (const key of ["canonical_url", "issuer", "jurisdiction"] as const) {
    const value = form.get(key);
    if (typeof value === "string" && value.trim()) upstreamForm.set(key, value.trim());
  }
  try {
    const upstream = await ragFetch("/internal/admin/sources/upload", {
      method: "POST",
      body: upstreamForm,
    }, 120_000);
    if (!upstream.ok) {
      return NextResponse.json({ error: await ragError(upstream) }, { status: upstream.status });
    }
    return NextResponse.json(await upstream.json(), { status: 201 });
  } catch (error) {
    console.error("RAG source upload failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Source service unavailable" }, { status: 503 });
  }
}
