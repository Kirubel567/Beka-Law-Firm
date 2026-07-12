import { NextResponse } from "next/server";
import { currentUser } from "@/lib/users";

/** Identity + role for the signed-in staff member (drives portal nav). */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(user);
}
