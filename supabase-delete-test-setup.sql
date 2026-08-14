-- BaMavaremottak / Camera Live Delete Test
-- Temporary TEST permissions for real deletion from the browser.
-- Run this file in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Do not use anonymous delete permissions in a production deployment.

begin;

alter table public.mottak_scans enable row level security;

grant usage on schema public to anon, authenticated;
grant select, delete on public.mottak_scans to anon, authenticated;

drop policy if exists "mottak_delete_test_select" on public.mottak_scans;
create policy "mottak_delete_test_select"
on public.mottak_scans
for select
to anon, authenticated
using (true);

drop policy if exists "mottak_delete_test_delete" on public.mottak_scans;
create policy "mottak_delete_test_delete"
on public.mottak_scans
for delete
to anon, authenticated
using (true);

-- The bucket must already exist. This keeps the script idempotent.
insert into storage.buckets (id, name, public)
values ('mottak-photos', 'mottak-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "mottak_delete_test_storage_select" on storage.objects;
create policy "mottak_delete_test_storage_select"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'mottak-photos');

drop policy if exists "mottak_delete_test_storage_delete" on storage.objects;
create policy "mottak_delete_test_storage_delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'mottak-photos');

commit;

-- Verification queries. Both should return one row.
select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'mottak_scans'
  and policyname = 'mottak_delete_test_delete';

select policyname, cmd, roles
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname = 'mottak_delete_test_storage_delete';
