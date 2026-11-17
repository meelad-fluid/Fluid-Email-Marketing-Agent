import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/store";

// /admin opens the last client you were looking at (or the newest one).
export default async function AdminHome() {
  const clients = await getStore().listClients();
  if (!clients.length) redirect("/admin/clients");
  const last = (await cookies()).get("fluid_last_client")?.value;
  redirect(`/admin/c/${clients.find((c) => c.id === last)?.id ?? clients[0].id}`);
}
