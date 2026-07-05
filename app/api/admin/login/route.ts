import { NextResponse } from "next/server";
import { checkCredentials, createToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  if (!checkCredentials(body.username ?? "", body.password ?? "")) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
