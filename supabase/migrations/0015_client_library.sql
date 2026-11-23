-- Client library: everything the team asks the bot to keep for one client (past designs, current copy,
-- references, logos, product photos, brand guidelines), so every new email follows the client's direction.
-- Files live in the private 'client-assets' bucket under <client_id>/library/<id>.<ext>.
-- Saved from Slack ("@Fluid store this") through the bot's save_to_library tool; service role only.

create table client_library (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  kind text not null check (kind in ('design', 'copy', 'reference', 'logo', 'product', 'photo', 'guidelines', 'other')),
  title text not null,
  notes text,                       -- what it is and what to take from it (layout, offer, what the client liked)
  copy_text text,                   -- every line of copy, in order (transcribed from a design, or pasted copy)
  email_type text,                  -- 'Welcome #2', 'BFCM sale', 'recipe', ...
  tags text[] not null default '{}',
  storage_path text,                -- null for link-only references (e.g. a Figma frame)
  file_name text,
  mime text,
  width int,
  height int,
  bytes int,
  source_url text,
  file_hash text,                   -- sha256 of the file, so the same file is never stored twice
  saved_by text,
  created_at timestamptz not null default now(),
  unique (client_id, file_hash)
);
create index client_library_client_idx on client_library (client_id, kind, created_at desc);
create index client_library_tags_idx on client_library using gin (tags);
alter table client_library enable row level security; -- no policies: only the service role (the bot) reads or writes

-- Brand book: brand_kits already holds one versioned JSON per client. Record who saved each version and why.
alter table brand_kits add column if not exists note text;
alter table brand_kits add column if not exists saved_by text;
