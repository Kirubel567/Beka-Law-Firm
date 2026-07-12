import { NextResponse } from "next/server";
import { deleteInquiry } from "@/lib/cms/store";
import { audit, currentUser } from "@/lib/users";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ok = deleteInquiry(id);
  if (ok) audit(me.username, "inquiry.delete", { itemId: id });
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}
