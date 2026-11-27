-- 'keys' link kind: a one-use page for the Fluid team to update a client's stored Klaviyo, Customer.io and Shopify keys.
alter table onboarding_links drop constraint onboarding_links_kind_check;
alter table onboarding_links add constraint onboarding_links_kind_check check (kind in ('client', 'internal', 'shopify', 'keys'));
