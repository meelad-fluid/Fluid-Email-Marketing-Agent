import { clientForToken, json, linkExpired } from "@/lib/onboarding/link";
import { validateUpload } from "@/lib/onboarding/progress";
import { QUESTION_BY_ID } from "@/lib/onboarding/questions";
import { getStore } from "@/lib/store";

// Uploads happen in two calls so files go straight to storage:
//   POST { action: "start",  questionId, fileName, contentType, bytes } → where to upload
//   POST { action: "finish", questionId, fileName, contentType, bytes, path } → records the asset
// DELETE ?id=<assetId> removes one.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const client = await clientForToken((await params).token);
  if (!client) return linkExpired();
  const b = await req.json().catch(() => null);
  const q = b && QUESTION_BY_ID.get(b.questionId);
  if (!q || q.type !== "files") return json({ error: "Unknown upload question" }, 400);
  const problem = validateUpload(String(b.fileName ?? ""), String(b.contentType ?? ""), Number(b.bytes ?? 0));
  if (problem) return json({ error: problem }, 422);

  const store = getStore();
  if (b.action === "start") return json({ target: await store.createUpload(client.id, b.fileName) });
  if (b.action === "finish" && typeof b.path === "string") {
    const asset = await store.recordAsset(
      client.id,
      { path: b.path, questionId: q.id, kind: q.assetKind ?? "other", fileName: b.fileName, contentType: b.contentType, bytes: Number(b.bytes) },
      "onboarding",
    );
    if (client.onboarding_status === "not_started") await store.setOnboardingStatus(client.id, "in_progress");
    return json({ asset: { ...asset, url: await store.assetUrl(asset) } });
  }
  return json({ error: "Unknown action" }, 400);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const client = await clientForToken((await params).token);
  if (!client) return linkExpired();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);
  await getStore().removeAsset(client.id, id);
  return json({ ok: true });
}
