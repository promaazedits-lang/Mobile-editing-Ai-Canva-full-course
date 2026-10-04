export async function api<T = any>(path: string, method = "GET", body?: unknown): Promise<T> {
  const r = await fetch("/api" + path, { method, credentials: "same-origin", headers: { "Content-Type": "application/json", "x-csrf": "1" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || "Something went wrong"), { status: r.status });
  return j;
}
