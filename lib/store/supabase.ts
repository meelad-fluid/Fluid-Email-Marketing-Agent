import { createClient as createSupabase, type SupabaseClient } from "@supabase/supabase-js";
import type { AnswerValue } from "../onboarding/questions";
import { hashToken, looksLikeToken, newToken, safeFileName, slugify } from "./tokens";
import type { Answers, Asset, Client, Connection, OnboardingStatus, Provider, Store, UploadTarget, Via } from "./types";

// Production store. Uses the service-role key, so it must only run on the server, and only after
// the caller has been checked (see lib/store/types.ts).

const BUCKET = "client-assets";
const CLIENT_COLS = "id,name,slug,website_url,contact_email,onboarding_status,onboarding_submitted_at,created_at";

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "unknown error"}`);
}

export class SupabaseStore implements Store {
  readonly mode = "supabase" as const;
  private db: SupabaseClient;

  constructor(private url: string, serviceKey: string, private anonKey: string) {
    this.db = createSupabase(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async listClients() {
    const { data, error } = await this.db.from("clients").select(CLIENT_COLS).order("created_at", { ascending: false });
    if (error) fail("list clients", error);
    return data as Client[];
  }

  async getClient(id: string) {
    const { data, error } = await this.db.from("clients").select(CLIENT_COLS).eq("id", id).maybeSingle();
    if (error) fail("get client", error);
    return data as Client | null;
  }

  async createClient(input: { name: string; websiteUrl?: string; contactEmail?: string }, staffId?: string) {
    // Slugs are unique; add a short suffix if the name is taken.
    const base = slugify(input.name);
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
      const { data, error } = await this.db
        .from("clients")
        .insert({ name: input.name, slug, website_url: input.websiteUrl || null, contact_email: input.contactEmail || null, created_by: staffId ?? null })
        .select(CLIENT_COLS)
        .single();
      if (!error) return data as Client;
      if (error.code !== "23505") fail("create client", error);
    }
    throw new Error("create client: couldn't find a free slug");
  }

  async setOnboardingStatus(clientId: string, status: OnboardingStatus, questionnaireVersion?: number) {
    const patch: Record<string, unknown> = { onboarding_status: status };
    if (status === "submitted") patch.onboarding_submitted_at = new Date().toISOString();
    if (questionnaireVersion) patch.questionnaire_version = questionnaireVersion;
    const { error } = await this.db.from("clients").update(patch).eq("id", clientId);
    if (error) fail("update status", error);
  }

  async newOnboardingLink(clientId: string, staffId?: string) {
    const now = new Date().toISOString();
    const { error: revokeError } = await this.db.from("onboarding_links").update({ revoked_at: now }).eq("client_id", clientId).is("revoked_at", null);
    if (revokeError) fail("revoke old links", revokeError);
    const token = newToken();
    const { error } = await this.db.from("onboarding_links").insert({ client_id: clientId, token_hash: hashToken(token), created_by: staffId ?? null });
    if (error) fail("create link", error);
    return token;
  }

  async resolveOnboardingToken(token: string) {
    if (!looksLikeToken(token)) return null;
    const { data, error } = await this.db
      .from("onboarding_links")
      .select("id, client_id, expires_at, revoked_at")
      .eq("token_hash", hashToken(token))
      .maybeSingle();
    if (error) fail("resolve link", error);
    if (!data || data.revoked_at || new Date(data.expires_at) < new Date()) return null;
    await this.db.from("onboarding_links").update({ last_opened_at: new Date().toISOString() }).eq("id", data.id);
    return this.getClient(data.client_id);
  }

  async hasActiveLink(clientId: string) {
    const { count, error } = await this.db
      .from("onboarding_links")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString());
    if (error) fail("check link", error);
    return (count ?? 0) > 0;
  }

  async getAnswers(clientId: string) {
    const { data, error } = await this.db.from("profile_answers").select("question_id, answer").eq("client_id", clientId);
    if (error) fail("get answers", error);
    return Object.fromEntries((data ?? []).map((r) => [r.question_id, r.answer as AnswerValue])) as Answers;
  }

  async saveAnswer(clientId: string, questionId: string, value: AnswerValue, via: Via) {
    const { error } = await this.db
      .from("profile_answers")
      .upsert({ client_id: clientId, question_id: questionId, answer: value, updated_via: via, updated_at: new Date().toISOString() });
    if (error) fail("save answer", error);
  }

  async listAssets(clientId: string) {
    const { data, error } = await this.db
      .from("assets")
      .select("id, client_id, question_id, kind, file_name, content_type, bytes, storage_path, created_at")
      .eq("client_id", clientId)
      .order("created_at");
    if (error) fail("list assets", error);
    return data as Asset[];
  }

  // Files go straight from the browser to Supabase Storage with a one-time signed URL, so large
  // photos don't pass through (and get cut off by) the Vercel function's request size limit.
  async createUpload(clientId: string, fileName: string): Promise<UploadTarget> {
    const path = `${clientId}/onboarding/${crypto.randomUUID()}-${safeFileName(fileName)}`;
    const { data, error } = await this.db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) fail("create upload", error);
    return { kind: "supabase", url: this.url, anonKey: this.anonKey, bucket: BUCKET, path: data.path, token: data.token };
  }

  async recordAsset(clientId: string, a: { path: string; questionId: string; kind: string; fileName: string; contentType: string; bytes: number }, via: Via) {
    if (!a.path.startsWith(`${clientId}/`)) throw new Error("asset path belongs to another client");
    const { data, error } = await this.db
      .from("assets")
      .insert({ client_id: clientId, storage_path: a.path, question_id: a.questionId, kind: a.kind, file_name: a.fileName, content_type: a.contentType, bytes: a.bytes, uploaded_via: via })
      .select("id, client_id, question_id, kind, file_name, content_type, bytes, storage_path, created_at")
      .single();
    if (error) fail("record asset", error);
    return data as Asset;
  }

  async removeAsset(clientId: string, assetId: string) {
    const { data, error } = await this.db.from("assets").delete().eq("id", assetId).eq("client_id", clientId).select("storage_path").maybeSingle();
    if (error) fail("remove asset", error);
    if (data) await this.db.storage.from(BUCKET).remove([data.storage_path]);
  }

  async assetUrl(asset: Asset) {
    const { data, error } = await this.db.storage.from(BUCKET).createSignedUrl(asset.storage_path, 60 * 60);
    if (error) fail("asset url", error);
    return data.signedUrl;
  }

  async listConnections(clientId: string) {
    const { data, error } = await this.db
      .from("client_connections")
      .select("provider, status, account_name, verified_at, last_error, meta")
      .eq("client_id", clientId);
    if (error) fail("list connections", error);
    return data as Connection[];
  }

  async saveConnection(clientId: string, provider: Provider, secret: string, meta: Record<string, unknown>, accountName: string | null) {
    const { error } = await this.db.rpc("store_connection_secret", {
      p_client: clientId,
      p_provider: provider,
      p_secret: secret,
      p_meta: meta,
      p_account_name: accountName,
    });
    if (error) fail("save connection", error);
  }
}
