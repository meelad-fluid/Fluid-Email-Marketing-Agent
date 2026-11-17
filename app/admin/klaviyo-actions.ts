"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/staff";
import { syncKlaviyo, type SyncResult } from "@/lib/klaviyo/sync";

export async function syncKlaviyoAction(clientId: string): Promise<SyncResult> {
  const staff = await requireStaff();
  const result = await syncKlaviyo(clientId, staff.dev ? undefined : staff.id);
  revalidatePath(`/admin/c/${clientId}`, "layout");
  return result;
}
