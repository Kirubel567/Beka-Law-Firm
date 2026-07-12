import { NextResponse } from "next/server";
import { audit, createUser, currentUser, listUsers, type Role } from "@/lib/users";

/** Staff account management — admin role only. */

export async function GET() {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });
  return NextResponse.json(listUsers());
}

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as {
    username?: string;
    password?: string;
    displayName?: string;
    role?: Role;
  } | null;
  if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "username and password are required" }, { status: 400 });
  }

  const result = createUser({
    username: body.username,
    password: body.password,
    displayName: typeof body.displayName === "string" ? body.displayName : "",
    role: body.role === "admin" ? "admin" : "editor",
  });
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  audit(me.username, "user.create", { detail: `${result.username} (${result.role})` });
  return NextResponse.json(result);
}
