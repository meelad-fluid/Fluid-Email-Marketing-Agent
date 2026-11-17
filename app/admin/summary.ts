import { onboardingProgress, type Progress } from "@/lib/onboarding/progress";
import { getStore, type Client, type Connection } from "@/lib/store";

export type ClientSummary = { client: Client; progress: Progress; connections: Connection[]; hasActiveLink: boolean };

export async function clientSummary(client: Client): Promise<ClientSummary> {
  const store = getStore();
  const [answers, assets, connections, hasActiveLink] = await Promise.all([
    store.getAnswers(client.id),
    store.listAssets(client.id),
    store.listConnections(client.id),
    store.hasActiveLink(client.id),
  ]);
  return { client, progress: onboardingProgress(answers, assets, connections), connections, hasActiveLink };
}

export const STATUS_LABEL = { not_started: "Not started", in_progress: "In progress", submitted: "Submitted" } as const;
export const statusChip = (s: Client["onboarding_status"]) => (s === "submitted" ? "chip chip--good" : s === "in_progress" ? "chip chip--warn" : "chip");
