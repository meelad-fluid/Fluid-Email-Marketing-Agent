import { clientForToken, json, linkExpired } from "@/lib/onboarding/link";
import { onboardingProgress } from "@/lib/onboarding/progress";
import { QUESTIONNAIRE_VERSION } from "@/lib/onboarding/questions";
import { getStore } from "@/lib/store";

// POST → marks onboarding submitted, once every required question is answered.
// The client can keep editing afterwards; changes still save.
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const client = await clientForToken((await params).token);
  if (!client) return linkExpired();
  const store = getStore();
  const [answers, assets, connections] = await Promise.all([store.getAnswers(client.id), store.listAssets(client.id), store.listConnections(client.id)]);
  const p = onboardingProgress(answers, assets, connections);
  if (p.requiredMissing.length) return json({ error: "Some required questions still need an answer.", missing: p.requiredMissing }, 422);
  await store.setOnboardingStatus(client.id, "submitted", QUESTIONNAIRE_VERSION);
  return json({ ok: true });
}
