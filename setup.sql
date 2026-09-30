-- Run this once in Supabase: SQL Editor > New query > paste > Run
create table if not exists profile(id int primary key, data jsonb default '{}'::jsonb);
create table if not exists files(id bigint generated always as identity primary key, cat text, name text, type text, size bigint, path text, created_at timestamptz default now());
alter table profile enable row level security;
alter table files enable row level security;
create policy "anyone reads profile" on profile for select using (true);
create policy "anyone reads files" on files for select using (true);
create policy "owner writes profile" on profile for all to authenticated using (true) with check (true);
create policy "owner writes files" on files for all to authenticated using (true) with check (true);
insert into storage.buckets(id,name,public) values('uploads','uploads',true) on conflict do nothing;
create policy "anyone reads uploads" on storage.objects for select using (bucket_id='uploads');
create policy "owner uploads" on storage.objects for insert to authenticated with check (bucket_id='uploads');
create policy "owner deletes uploads" on storage.objects for delete to authenticated using (bucket_id='uploads');
