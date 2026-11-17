"use server";

import { revalidatePath } from "next/cache";
import { appOrigin, requireStaff } from "@/lib/auth/staff";
import { getStore } from "@/lib/store";

export type LinkResult = { ok: true; clientId: string; link: string } | { ok: false; error: string } | null;

// Creates a client and its onboarding link. The link is shown once: only its hash is stored.
export async function createClientAction(_prev: LinkResult, form: FormData): Promise<LinkResult> {
  const staff = await requireStaff();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Add the brand name" };
  let websiteUrl = String(form.get("website") ?? "").trim();
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) websiteUrl = `https://${websiteUrl}`;
  const contactEmail = String(form.get("email") ?? "").trim();
  const store = getStore();
  const staffId = staff.dev ? undefined : staff.id;
  const client = await store.createClient({ name, websiteUrl, contactEmail }, staffId);
  // Pre-fill what we already know so the client doesn't have to type it again.
  await store.saveAnswer(client.id, "brand_name", name, "team");
  if (websiteUrl) await store.saveAnswer(client.id, "brand_url", websiteUrl, "team");
  if (contactEmail) await store.saveAnswer(client.id, "client_email", contactEmail, "team");
  const token = await store.newOnboardingLink(client.id, staffId);
  revalidatePath("/admin/clients");
  return { ok: true, clientId: client.id, link: `${await appOrigin()}/onboard/${token}` };
}

// Replaces a client's onboarding link (the old one stops working).
export async function newLinkAction(clientId: string): Promise<LinkResult> {
  const staff = await requireStaff();
  const store = getStore();
  if (!(await store.getClient(clientId))) return { ok: false, error: "Client not found" };
  const token = await store.newOnboardingLink(clientId, staff.dev ? undefined : staff.id);
  revalidatePath(`/admin/c/${clientId}`, "layout");
  return { ok: true, clientId, link: `${await appOrigin()}/onboard/${token}` };
}
