create table guestbook (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(nickname) between 1 and 20),
  message text not null check (char_length(message) between 1 and 200),
  avatar text not null default 'smile',
  created_at timestamptz not null default now()
);
create table contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  email text not null check (char_length(email) between 3 and 120),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table guestbook enable row level security;
alter table contacts enable row level security;

-- guestbook: anyone can read and write; no update/delete policies = denied
create policy "guestbook read"   on guestbook for select using (true);
create policy "guestbook insert" on guestbook for insert with check (true);
-- contacts: write-only for the public (inbox stays private; read it in the Supabase dashboard)
create policy "contacts insert"  on contacts  for insert with check (true);
