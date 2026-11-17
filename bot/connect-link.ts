// Make a one-use secure link for a client to connect Klaviyo (or fill the onboarding form).
// Usage: PUBLIC_URL=https://<server> npx tsx bot/connect-link.ts <client-folder>
import { db } from "./db";
import { newConnectLink } from "./onboarding";
(async () => {
  const { data: c } = await db().from("clients").select("id, name").eq("folder", process.argv[2]).single();
  console.log(`${c!.name}: ${await newConnectLink(c!.id)}`);
  process.exit(0);
})();
