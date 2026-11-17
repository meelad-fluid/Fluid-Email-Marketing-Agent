-- A short name for each planned send (the long topic stays as its message), and the content of
-- sent email campaigns so the strategist can read what the winners actually said.
alter table plan_sends add column name text;
alter table klaviyo_campaigns
  add column message_id text,
  add column body_text text,
  add column body_meta jsonb,
  add column body_synced_at timestamptz;
