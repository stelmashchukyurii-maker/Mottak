-- BaMavaremottak: photographs for camera + Nordic ID matching
-- Run once in Supabase SQL Editor.

alter table public.mottak_scans
  add column if not exists photo_url text not null default '',
  add column if not exists photo_path text not null default '',
  add column if not exists confidence numeric;

alter table public.mottak_scans
  drop constraint if exists mottak_confidence_range;

alter table public.mottak_scans
  add constraint mottak_confidence_range
  check (
    confidence is null
    or (confidence >= 0 and confidence <= 1)
  );

create index if not exists mottak_scans_upper_number_idx
on public.mottak_scans (upper_number);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'mottak-photos',
  'mottak-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "mottak_photos_public_read"
on storage.objects;

drop policy if exists "mottak_photos_demo_insert"
on storage.objects;

drop policy if exists "mottak_photos_demo_update"
on storage.objects;

create policy "mottak_photos_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'mottak-photos');

create policy "mottak_photos_demo_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'mottak-photos');

create policy "mottak_photos_demo_update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'mottak-photos')
with check (bucket_id = 'mottak-photos');

-- Deliberately no DELETE policy for browser clients.
