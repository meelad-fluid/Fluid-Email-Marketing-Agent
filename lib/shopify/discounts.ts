// The ONLY Shopify write Fluid can make: create a NEW discount code. Enforced here:
//   - the client must have clients.shopify_write = 'discounts' (default 'none' = read only)
//   - only two fixed mutations exist (discountCodeBasicCreate, discountCodeFreeShippingCreate); there is no code
//     path to update, deactivate or delete a discount, or to touch orders, products, customers or anything else
//   - a code that already exists is never touched: creation is refused
//   - every code needs an end date (at most 90 days after it starts) and stays within the client's max discount
//     ("Max discount: 30%" in memory.md; 30% when it isn't set)
// Every attempt is logged in shopify_writes.
import type { SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gqlRaw, shopifyConn, shopifyRead } from "./client";

export type DiscountRequest = {
  code: string; title?: string;
  kind: "percent" | "amount" | "free_shipping";
  value?: number;                       // 20 = 20% off, or $20 off
  min_subtotal?: number;
  starts_at: string; ends_at: string;   // ISO, client's timezone offset or Z
  once_per_customer?: boolean; usage_limit?: number;
  collections?: string[];               // collection titles; empty = whole store
  combines_with?: { product?: boolean; order?: boolean; shipping?: boolean };
};

const BASIC = `mutation($d: DiscountCodeBasicInput!) { discountCodeBasicCreate(basicCodeDiscount: $d) { codeDiscountNode { id } userErrors { field message code } } }`;
const FREE_SHIP = `mutation($d: DiscountCodeFreeShippingInput!) { discountCodeFreeShippingCreate(freeShippingCodeDiscount: $d) { codeDiscountNode { id } userErrors { field message code } } }`;

export function maxDiscount(clientDir: string) {
  // "Max discount: 25%", "Max discount 20%", "maximum discount is 15%" — the latest line wins.
  const text = existsSync(join(clientDir, "memory.md")) ? readFileSync(join(clientDir, "memory.md"), "utf8") : "";
  const all = [...text.matchAll(/max(?:imum)?\.?\s+discount\b[^0-9\n%]{0,20}(\d{1,2})\s*%/gi)];
  return all.length ? Number(all[all.length - 1][1]) : 30;
}

export async function createDiscount(db: SupabaseClient, clientId: string, clientDir: string, r: DiscountRequest, requestedBy?: string) {
  const { data: cl } = await db.from("clients").select("name, shopify_write").eq("id", clientId).single();
  if (cl?.shopify_write !== "discounts") throw new Error(`${cl?.name ?? "This client"}'s Shopify is read-only for Fluid. An admin has to allow discount codes first (/fluid shopify-discounts on).`);
  const conn = await shopifyConn(db, clientId);
  if (!conn) throw new Error("Shopify isn't connected for this client. Use /fluid shopify in their channel to get a connect link.");

  // Checks before anything is sent.
  const code = r.code.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,29}$/.test(code)) throw new Error("Codes are 3–30 letters/numbers (dashes and underscores allowed), e.g. WELCOME20.");
  const start = new Date(r.starts_at), end = new Date(r.ends_at);
  if (isNaN(+start) || isNaN(+end) || end <= start) throw new Error("Give a start and an end date (the end after the start).");
  if (+end - +start > 90 * 86400_000) throw new Error("Codes run 90 days at most. Ask for a new one later if needed.");
  if (+end < Date.now()) throw new Error("That end date is already past.");
  const cap = maxDiscount(clientDir);
  if (r.kind === "percent" && (!r.value || r.value <= 0 || r.value > cap)) throw new Error(`Percent off must be between 1 and ${cap}% (this client's max discount${cap === 30 ? ", default" : ""}).`);
  if (r.kind === "amount" && (!r.value || r.value <= 0)) throw new Error("Give the amount off.");
  const exists = await shopifyRead(conn, `query($c: String!) { codeDiscountNodeByCode(code: $c) { id } }`, { c: code });
  if (exists.codeDiscountNodeByCode) throw new Error(`${code} already exists in Shopify. Fluid never changes existing codes: pick a new code.`);

  let collectionIds: string[] = [];
  if (r.collections?.length) {
    for (const t of r.collections) {
      const d = await shopifyRead(conn, `query($q: String!) { collections(first: 5, query: $q) { nodes { id title } } }`, { q: `title:'${t.replace(/'/g, "")}'` });
      const hit = d.collections.nodes.find((n: any) => n.title.toLowerCase() === t.toLowerCase()) ?? d.collections.nodes[0];
      if (!hit) throw new Error(`No collection called "${t}" in Shopify.`);
      collectionIds.push(hit.id);
    }
  }

  const common: any = {
    title: r.title?.trim() || `${code} (Fluid)`, code, startsAt: start.toISOString(), endsAt: end.toISOString(),
    context: { all: "ALL" },
    appliesOncePerCustomer: r.once_per_customer ?? true,
    ...(r.usage_limit ? { usageLimit: r.usage_limit } : {}),
    ...(r.min_subtotal ? { minimumRequirement: { subtotal: { greaterThanOrEqualToSubtotal: String(r.min_subtotal) } } } : {}),
    combinesWith: { productDiscounts: !!r.combines_with?.product, orderDiscounts: !!r.combines_with?.order, shippingDiscounts: !!r.combines_with?.shipping },
  };
  const [mutation, name, input] = r.kind === "free_shipping"
    ? [FREE_SHIP, "discountCodeFreeShippingCreate", { ...common, destination: { all: true } }]
    : [BASIC, "discountCodeBasicCreate", { ...common, customerGets: { value: r.kind === "percent" ? { percentage: r.value! / 100 } : { discountAmount: { amount: String(r.value), appliesOnEachItem: false } }, items: collectionIds.length ? { collections: { add: collectionIds } } : { all: true } } }];

  const send = async (d: any) => (await gqlRaw(conn, mutation, { d }))[name];
  let res = await send(input);
  // Older stores/API versions use customerSelection instead of context.
  if (res?.userErrors?.some((e: any) => /context/i.test(`${e.field} ${e.message}`))) { const { context, ...rest } = input; res = await send({ ...rest, customerSelection: { all: true } }); }
  const errors = res?.userErrors ?? [];
  const id = res?.codeDiscountNode?.id ?? null;
  await db.from("shopify_writes").insert({ client_id: clientId, mutation: name, code, shopify_id: id, ok: !errors.length && !!id, detail: { request: r, errors }, requested_by: requestedBy ?? null });
  if (errors.length || !id) throw new Error(`Shopify didn't create ${code}: ${errors.map((e: any) => e.message).join("; ") || "unknown error"}`);
  const num = id.split("/").pop();
  return { created: true, code, id, starts_at: common.startsAt, ends_at: common.endsAt, admin_url: `https://${conn.shop}/admin/discounts/${num}`, summary: r.kind === "free_shipping" ? "free shipping" : r.kind === "percent" ? `${r.value}% off` : `$${r.value} off`, min_subtotal: r.min_subtotal ?? null, collections: r.collections ?? [] };
}
