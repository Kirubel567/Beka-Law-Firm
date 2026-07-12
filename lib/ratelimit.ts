import { getDb } from "@/lib/db";

/**
 * Fixed-window rate limiter backed by the database, so limits survive
 * restarts and apply across however many server processes run on the box.
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const db = getDb();
  const nowMs = Date.now();
  const row = db
    .prepare("SELECT count, window_start FROM rate_limits WHERE key = ?")
    .get(key) as { count: number; window_start: number } | undefined;

  if (!row || nowMs - row.window_start >= windowMs) {
    db.prepare(
      `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET count = 1, window_start = ?`,
    ).run(key, nowMs, nowMs);
    return true;
  }
  if (row.count >= max) return false;
  db.prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?").run(key);
  return true;
}

/** Client key for a request: first hop of x-forwarded-for, or "local". */
export function clientKey(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  const ip = xff?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  return ip;
}
