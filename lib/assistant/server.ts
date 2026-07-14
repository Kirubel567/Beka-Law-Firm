import "server-only";

const DEFAULT_TIMEOUT_MS = 50_000;

function ragConfig(): { baseUrl: string; apiKey: string } {
  const baseUrl = (process.env.RAG_SERVICE_URL ?? "http://127.0.0.1:8001").replace(/\/$/, "");
  const apiKey = process.env.RAG_INTERNAL_API_KEY ?? "";
  if (!apiKey) throw new Error("RAG_INTERNAL_API_KEY is not configured");
  return { baseUrl, apiKey };
}

export async function ragFetch(
  path: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const { baseUrl, apiKey } = ragConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(init.headers);
  headers.set("x-beka-rag-key", apiKey);
  try {
    return await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function ragError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as
    | { detail?: string | Array<{ msg?: string }>; error?: string }
    | null;
  if (typeof body?.detail === "string") return body.detail;
  if (Array.isArray(body?.detail)) {
    return body.detail.map((item) => item.msg).filter(Boolean).join("; ") || "Invalid request";
  }
  return body?.error ?? `RAG service returned ${response.status}`;
}
