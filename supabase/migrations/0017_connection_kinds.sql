-- Customer.io keys were refused by the provider check (only klaviyo/shopify were allowed). Also a 'shopify'
-- link kind: a one-use page for the Fluid team to connect a client's Shopify store without re-running onboarding.
alter table client_connections drop constraint client_connections_provider_check;
alter table client_connections add constraint client_connections_provider_check check (provider in ('klaviyo', 'shopify', 'customerio'));
alter table onboarding_links drop constraint onboarding_links_kind_check;
alter table onboarding_links add constraint onboarding_links_kind_check check (kind in ('client', 'internal', 'shopify'));
