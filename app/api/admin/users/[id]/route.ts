import { NextResponse } from "next/server";
import { audit, currentUser, deleteUser, getUser, updateUser, type Role } from "@/lib/users";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    displayName?: string;
    role?: Role;
    password?: string;
    disabled?: boolean;
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // an admin cannot disable their own account mid-session
  if (id === me.id && body.disabled === true) {
    return NextResponse.json({ error: "You cannot disable your own account" }, { status: 400 });
  }

  const result = updateUser(id, {
    displayName: typeof body.displayName === "string" ? body.displayName : undefined,
    role: body.role === "admin" || body.role === "editor" ? body.role : undefined,
    password: typeof body.password === "string" ? body.password : undefined,
    disabled: typeof body.disabled === "boolean" ? body.disabled : undefined,
  });
  if ("error" in result) {
    return NextResponse.json(result, { status: result.error === "Not found" ? 404 : 400 });
  }
  const changed = Object.keys(body).join(", ");
  audit(me.username, "user.update", { detail: `${result.username}: ${changed}` });
  return NextResponse.json(result);
}

export async function DELETE(_req: Request, { params }: Params) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id } = await params;
  if (id === me.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }
  const target = getUser(id);
  const result = deleteUser(id);
  if ("error" in result) {
    return NextResponse.json(result, { status: result.error === "Not found" ? 404 : 400 });
  }
  audit(me.username, "user.delete", { detail: target?.username ?? id });
  return NextResponse.json({ ok: true });
}
