// Live check of the Supabase store: creates a throwaway client, exercises links, answers, a storage
// upload and a Vault-stored key, then deletes everything it made. Usage: npm run smoke:supabase
// Prints PASS/FAIL per step; never prints keys.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { SupabaseStore } from "../lib/store/supabase";

const env = Object.fromEntries([...readFileSync(".env.local", "utf8").matchAll(/^([A-Z_]+)=(.*)$/gm)].map((m) => [m[1], m[2].trim()]));
const url = env.NEXT_PUBLIC_SUPABASE_URL, anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, secret = env.SUPABASE_SERVICE_ROLE_KEY;
const store = new SupabaseStore(url, secret, anon);
const admin = createClient(url, secret, { auth: { persistSession: false } });
let failed = 0;
const check = (ok: boolean, msg: string) => { if (!ok) failed++; console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); };

async function main() {
  const client = await store.createClient({ name: "Smoke Test (delete me)", websiteUrl: "https://example.com", contactEmail: "smoke@example.invalid" });
  check(!!client.id && client.onboarding_status === "not_started", "client created");
  try {
    const t1 = await store.newOnboardingLink(client.id);
    check((await store.resolveOnboardingToken(t1))?.id === client.id, "onboarding link resolves to the client");
    const t2 = await store.newOnboardingLink(client.id);
    check((await store.resolveOnboardingToken(t1)) === null && (await store.resolveOnboardingToken(t2))?.id === client.id, "new link replaces the old one");
    check((await store.resolveOnboardingToken("x".repeat(43))) === null, "made-up token resolves to nothing");
    const { data: linkRows } = await admin.from("onboarding_links").select("token_hash").eq("client_id", client.id);
    check(!!linkRows?.length && linkRows.every((r) => r.token_hash.length === 64 && r.token_hash !== t2), "only token hashes are stored");

    await store.saveAnswer(client.id, "brand_description", "Smoke test answer.", "onboarding");
    await store.saveAnswer(client.id, "competitors", ["A", "B"], "onboarding");
    await store.saveAnswer(client.id, "max_discount", 20, "onboarding");
    const answers = await store.getAnswers(client.id);
    check(answers.brand_description === "Smoke test answer." && Array.isArray(answers.competitors) && answers.max_discount === 20, "answers save and read back (text, list, number)");

    const target = await store.createUpload(client.id, "logo test.png");
    if (target.kind !== "supabase") throw new Error("expected a Supabase upload target");
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const up = await createClient(url, anon).storage.from(target.bucket).uploadToSignedUrl(target.path, target.token, png, { contentType: "image/png" });
    check(!up.error, `browser-style upload with the public key + one-time URL${up.error ? `: ${up.error.message}` : ""}`);
    const asset = await store.recordAsset(client.id, { path: target.path, questionId: "logo_files", kind: "logo", fileName: "logo test.png", contentType: "image/png", bytes: png.length }, "onboarding");
    const fetched = await fetch(await store.assetUrl(asset));
    check(fetched.ok, `uploaded file readable through a signed URL (${fetched.status})`);
    const publicTry = await fetch(`${url}/storage/v1/object/public/client-assets/${target.path}`);
    check(!publicTry.ok, `same file is NOT readable without a signed URL (${publicTry.status})`);
    const anonList = await createClient(url, anon).from("clients").select("id");
    check((anonList.data ?? []).length === 0, "public key can't list clients");
    await store.removeAsset(client.id, asset.id);
    check((await store.listAssets(client.id)).length === 0, "asset removed (row + file)");

    await store.saveConnection(client.id, "klaviyo", "pk_smoke_test_not_a_real_key_000000", { account_id: "smoke" }, "Smoke Account");
    const conns = await store.listConnections(client.id);
    check(conns.length === 1 && conns[0].account_name === "Smoke Account" && !JSON.stringify(conns).includes("pk_smoke"), "connection saved; listing never includes the key");
    const { data: readBack } = await admin.rpc("get_connection_secret", { p_client: client.id, p_provider: "klaviyo" });
    check(readBack === "pk_smoke_test_not_a_real_key_000000", "key stored in Vault and readable by the server");
    const anonRpc = await createClient(url, anon).rpc("get_connection_secret", { p_client: client.id, p_provider: "klaviyo" });
    check(!!anonRpc.error && anonRpc.data == null, "public key can't read the stored key");

    await store.setOnboardingStatus(client.id, "submitted", 1);
    check((await store.getClient(client.id))?.onboarding_status === "submitted", "status updates to submitted");
    console.log(`\nLINK_FOR_HTTP_TEST=${t2}`);
    console.log(`CLIENT_ID=${client.id}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${(e as Error).message}`);
  }
  if (process.argv.includes("--keep")) return;
  await cleanup(client.id);
}

// Deleting the client cascades to links, answers, assets and connections; the connection's Vault
// key is removed by the client_connections_delete_secret trigger (0005).
async function cleanup(clientId: string) {
  const { error } = await admin.from("clients").delete().eq("id", clientId);
  check(!error, `test client deleted${error ? `: ${error.message}` : ""}`);
}

main().then(() => { console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed"); process.exit(failed ? 1 : 0); });
