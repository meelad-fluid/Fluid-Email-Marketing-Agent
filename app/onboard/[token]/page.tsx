import { shopifyOAuthEnabled } from "@/lib/connections/shopify-oauth";
import { clientForToken } from "@/lib/onboarding/link";
import { getStore } from "@/lib/store";
import { OnboardingForm, type InitialAsset } from "./OnboardingForm";

// The client's onboarding link: /onboard/<token>. No login; the token is the key.
export const dynamic = "force-dynamic";
export const metadata = { title: "Onboarding · Fluid Creatives", robots: { index: false, follow: false } };

export default async function OnboardingPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ shopify?: string }> }) {
  const { token } = await params;
  const { shopify } = await searchParams;
  const client = await clientForToken(token);
  if (!client) {
    return (
      <main className="wrap" style={{ maxWidth: 560, paddingTop: 80 }}>
        <div className="card">
          <h1 style={{ fontSize: 24 }}>This link isn&apos;t active</h1>
          <p className="muted">It may have expired or been replaced with a new one. Ask your contact at Fluid Creatives to send you a fresh link.</p>
        </div>
      </main>
    );
  }
  const store = getStore();
  const [answers, assets, connections] = await Promise.all([store.getAnswers(client.id), store.listAssets(client.id), store.listConnections(client.id)]);
  const withUrls: InitialAsset[] = await Promise.all(assets.map(async (a) => ({ id: a.id, question_id: a.question_id, file_name: a.file_name, content_type: a.content_type, url: await store.assetUrl(a) })));
  return (
    <OnboardingForm
      token={token}
      clientName={client.name}
      submitted={client.onboarding_status === "submitted"}
      initialAnswers={answers}
      initialAssets={withUrls}
      initialConnections={connections.map((c) => ({ provider: c.provider, status: c.status, account_name: c.account_name }))}
      shopifyOAuth={shopifyOAuthEnabled()}
      shopifyNotice={shopify?.slice(0, 200)}
    />
  );
}
