import { getStore } from "../store";
import type { Client } from "../store/types";

// Every onboarding endpoint starts here: no valid link, no access.
export async function clientForToken(token: string): Promise<Client | null> {
  return getStore().resolveOnboardingToken(token);
}

export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
export const linkExpired = () => json({ error: "This onboarding link has expired or been replaced. Ask Fluid for a new one." }, 404);
