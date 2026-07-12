import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";
import { destroySession } from "@/lib/users";

export async function POST(req: Request) {
  const cookie = req.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  const sid = await verifyToken(cookie);
  if (sid) destroySession(sid);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
