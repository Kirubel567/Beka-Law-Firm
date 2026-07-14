import { NextResponse } from "next/server";
import { buildWebsiteCorpus } from "@/lib/assistant/site-corpus";
import { ragError, ragFetch } from "@/lib/assistant/server";
import { currentUser } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await currentUser();
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  try {
    const documents = buildWebsiteCorpus();
    const upstream = await ragFetch("/internal/admin/sources/sync-site", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor: user.username, documents }),
    }, 120_000);
    if (!upstream.ok) {
      return NextResponse.json({ error: await ragError(upstream) }, { status: upstream.status });
    }
    return NextResponse.json(await upstream.json());
  } catch (error) {
    console.error("Website corpus sync failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Website sync failed" }, { status: 503 });
  }
}
