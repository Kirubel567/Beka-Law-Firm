import { NextResponse } from "next/server";
import { ragError, ragFetch } from "@/lib/assistant/server";
import { currentUser } from "@/lib/users";

export const runtime = "nodejs";
type Params = { params: Promise<{ sourceId: string }> };

async function admin() {
  const user = await currentUser();
  return user?.role === "admin" ? user : null;
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await admin();
  if (!user) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const { sourceId } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const allowed: Record<string, unknown> = { actor: user.username };
  if (["pending", "approved", "rejected"].includes(String(body.publication_status))) {
    allowed.publication_status = body.publication_status;
  }
  for (const key of ["title", "canonical_url", "issuer", "jurisdiction"] as const) {
    if (typeof body[key] === "string") allowed[key] = body[key];
  }
  try {
    const upstream = await ragFetch(`/internal/admin/sources/${encodeURIComponent(sourceId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allowed),
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: await ragError(upstream) }, { status: upstream.status });
    }
    return NextResponse.json(await upstream.json());
  } catch {
    return NextResponse.json({ error: "Source service unavailable" }, { status: 503 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await admin();
  if (!user) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const { sourceId } = await params;
  try {
    const upstream = await ragFetch(
      `/internal/admin/sources/${encodeURIComponent(sourceId)}?actor=${encodeURIComponent(user.username)}`,
      { method: "DELETE" },
    );
    if (!upstream.ok) {
      return NextResponse.json({ error: await ragError(upstream) }, { status: upstream.status });
    }
    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Source service unavailable" }, { status: 503 });
  }
}
