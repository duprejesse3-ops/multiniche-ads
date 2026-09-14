create table if not exists campaigns (
  id text primary key,
  body jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists auction_events (
  id text primary key,
  body jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists open_sites (
  id text primary key,
  domain text not null,
  name text not null,
  tags jsonb not null default '[]'::jsonb,
  hits integer not null default 0,
  last_seen timestamptz not null default now()
);

create index if not exists auction_events_created_idx on auction_events (created_at desc);
create index if not exists open_sites_last_seen_idx on open_sites (last_seen desc);
