import { clientForToken, json, linkExpired } from "@/lib/onboarding/link";
import { validateAnswer } from "@/lib/onboarding/progress";
import { getStore } from "@/lib/store";

// PUT { questionId, value } → saves one answer (the form autosaves field by field).
export async function PUT(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const client = await clientForToken((await params).token);
  if (!client) return linkExpired();
  const body = await req.json().catch(() => null);
  if (!body || typeof body.questionId !== "string") return json({ error: "Missing questionId" }, 400);
  const v = validateAnswer(body.questionId, body.value);
  if (!v.ok) return json({ error: v.error }, 422);
  const store = getStore();
  await store.saveAnswer(client.id, body.questionId, v.value, "onboarding");
  if (client.onboarding_status === "not_started") await store.setOnboardingStatus(client.id, "in_progress");
  return json({ ok: true, value: v.value });
}
