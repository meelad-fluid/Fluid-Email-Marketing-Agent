// Minimal Klaviyo API client: one revision, JSON:API pagination, and patient retries on
// rate limits (the reporting endpoints allow ~2 requests a minute).

export const KLAVIYO_REVISION = "2025-10-15";
const BASE = "https://a.klaviyo.com/api";

export class KlaviyoError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function klaviyo<T = any>(key: string, path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}, attempt = 0): Promise<T> {
  const res = await fetch(path.startsWith("http") ? path : `${BASE}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Klaviyo-API-Key ${key}`,
      revision: KLAVIYO_REVISION,
      accept: "application/vnd.api+json",
      ...(init.body ? { "content-type": "application/vnd.api+json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (res.status === 429 && attempt < 6) {
    const wait = Math.min(Number(res.headers.get("retry-after") ?? 0) || 2 ** attempt * 2, 65);
    await new Promise((r) => setTimeout(r, wait * 1000));
    return klaviyo(key, path, init, attempt + 1);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new KlaviyoError(res.status, `Klaviyo ${res.status} on ${path.split("?")[0]}: ${body.errors?.[0]?.detail ?? "request failed"}`);
  return body as T;
}

/** Follows links.next. `stop` can end paging early (e.g. once results are older than needed). */
export async function klaviyoAll<T = any>(key: string, path: string, stop?: (page: T[]) => boolean): Promise<{ data: T[]; included: any[] }> {
  const data: T[] = [];
  const included: any[] = [];
  for (let url: string | null = path; url; ) {
    const page: any = await klaviyo(key, url);
    data.push(...page.data);
    included.push(...(page.included ?? []));
    url = stop?.(page.data) ? null : page.links?.next ?? null;
  }
  return { data, included };
}
