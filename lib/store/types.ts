import type { AnswerValue } from "../onboarding/questions";

// Storage for clients and onboarding. Two implementations share this interface:
// Supabase (production) and a local file store used only in development when Supabase isn't
// configured. Server-side only: both read and write with full access, so every caller must
// check who's asking first (a valid onboarding token, or a signed-in Fluid staff member).

export type OnboardingStatus = "not_started" | "in_progress" | "submitted";

export type Client = {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  contact_email: string | null;
  onboarding_status: OnboardingStatus;
  onboarding_submitted_at: string | null;
  created_at: string;
};

export type Asset = {
  id: string;
  client_id: string;
  question_id: string | null;
  kind: string;
  file_name: string | null;
  content_type: string | null;
  bytes: number | null;
  storage_path: string;
  created_at: string;
};

export type Provider = "klaviyo" | "shopify";

// Never contains the secret itself.
export type Connection = {
  provider: Provider;
  status: "connected" | "failed" | "revoked";
  account_name: string | null;
  verified_at: string | null;
  last_error: string | null;
  meta: Record<string, unknown>;
};

export type Answers = Record<string, AnswerValue>;

export type UploadTarget =
  | { kind: "supabase"; url: string; anonKey: string; bucket: string; path: string; token: string }
  | { kind: "local"; uploadUrl: string; path: string };

export type Via = "onboarding" | "team";

export interface Store {
  readonly mode: "supabase" | "local";

  listClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | null>;
  createClient(input: { name: string; websiteUrl?: string; contactEmail?: string }, staffId?: string): Promise<Client>;
  setOnboardingStatus(clientId: string, status: OnboardingStatus, questionnaireVersion?: number): Promise<void>;

  /** Revokes any existing link and returns a new token. Only the hash is stored. */
  newOnboardingLink(clientId: string, staffId?: string): Promise<string>;
  /** The client for a valid, unexpired, unrevoked token, or null. */
  resolveOnboardingToken(token: string): Promise<Client | null>;
  hasActiveLink(clientId: string): Promise<boolean>;

  getAnswers(clientId: string): Promise<Answers>;
  saveAnswer(clientId: string, questionId: string, value: AnswerValue, via: Via): Promise<void>;

  listAssets(clientId: string): Promise<Asset[]>;
  createUpload(clientId: string, fileName: string): Promise<UploadTarget>;
  recordAsset(clientId: string, a: { path: string; questionId: string; kind: string; fileName: string; contentType: string; bytes: number }, via: Via): Promise<Asset>;
  removeAsset(clientId: string, assetId: string): Promise<void>;
  assetUrl(asset: Asset): Promise<string>;

  listConnections(clientId: string): Promise<Connection[]>;
  saveConnection(clientId: string, provider: Provider, secret: string, meta: Record<string, unknown>, accountName: string | null): Promise<void>;
}
