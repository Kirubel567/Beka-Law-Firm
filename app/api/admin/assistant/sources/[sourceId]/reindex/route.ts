import { NextResponse } from "next/server";
import { ragError, ragFetch } from "@/lib/assistant/server";
import { currentUser } from "@/lib/users";

export const runtime = "nodejs";
type Params = { params: Promise<{ sourceId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await currentUser();
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const { sourceId } = await params;
  const form = new FormData();
  form.set("actor", user.username);
  try {
    const upstream = await ragFetch(
      `/internal/admin/sources/${encodeURIComponent(sourceId)}/reindex`,
      { method: "POST", body: form },
      120_000,
    );
    if (!upstream.ok) {
      return NextResponse.json({ error: await ragError(upstream) }, { status: upstream.status });
    }
    return NextResponse.json(await upstream.json());
  } catch {
    return NextResponse.json({ error: "Source service unavailable" }, { status: 503 });
  }
}
