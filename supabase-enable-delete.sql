-- BaMavaremottak / camera-live.html
-- Enable deletion from the current browser app.
-- IMPORTANT: camera-live.html currently uses a public Supabase publishable key
-- without user login. Therefore this policy permits the anon role to delete.
-- Add authentication before production use if deletion must be restricted.

begin;

-- Table row deletion
grant delete on table public.mottak_scans to anon, authenticated;

drop policy if exists "Mottak scans delete" on public.mottak_scans;
create policy "Mottak scans delete"
on public.mottak_scans
for delete
to anon, authenticated
using (true);

-- Photo deletion from the mottak-photos bucket
-- The application already calls Supabase Storage API remove();
drop policy if exists "Mottak photos delete" on storage.objects;
create policy "Mottak photos delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'mottak-photos');

commit;
