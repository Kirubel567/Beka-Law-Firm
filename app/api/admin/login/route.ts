import { NextResponse } from "next/server";
import { createToken, SESSION_COOKIE } from "@/lib/auth";
import { audit, authenticate, createSession } from "@/lib/users";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  const username = (body.username ?? "").slice(0, 100);
  const password = (body.password ?? "").slice(0, 200);

  const result = authenticate(username, password);
  if (!result.ok) {
    audit(username || "(blank)", result.locked ? "login.locked" : "login.failed");
    return result.locked
      ? NextResponse.json(
          { error: "Too many failed attempts — try again in 15 minutes" },
          { status: 429 },
        )
      : NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const sid = createSession(result.user.id);
  audit(result.user.username, "login");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createToken(sid), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
