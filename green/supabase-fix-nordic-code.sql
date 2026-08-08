-- BaMavaremottak / Nordic ID
-- Repairs rows where the complete 24-character EPC was stored in scanner_code
-- and protects the table against the same mistake from old/cached pages.
-- Expected EPC structure:
--   12-character service code + 6-digit upper number + 6-character lower number

begin;

-- 1. Merge a malformed Nordic ID row into an existing camera-only row
--    when both belong to the same physical label.
with malformed as (
  select
    id,
    scanner_code as full_code,
    substring(scanner_code from 1 for 12) as fixed_service_code,
    substring(scanner_code from 13 for 6) as fixed_upper_number,
    substring(scanner_code from 19 for 6) as fixed_lower_number,
    product,
    status,
    device_id
  from public.mottak_scans
  where source like '%nordic_id%'
    and scanner_code ~ '^[A-Z0-9]{12}[0-9]{6}[A-Z0-9]{6}$'
),
matches as (
  select
    m.*,
    c.id as camera_id
  from malformed m
  join lateral (
    select c.id
    from public.mottak_scans c
    where c.id <> m.id
      and coalesce(c.scanner_code, '') = ''
      and c.upper_number = m.fixed_upper_number
      and upper(c.lower_number) = m.fixed_lower_number
    order by c.created_at desc
    limit 1
  ) c on true
),
merged as (
  update public.mottak_scans c
  set
    scanner_code = m.fixed_service_code,
    product = coalesce(nullif(c.product, ''), m.product),
    source = 'camera+nordic_id',
    status = case
      when c.status = 'verified' or m.status = 'verified' then 'verified'
      else 'pending'
    end,
    device_id = coalesce(nullif(c.device_id, ''), m.device_id),
    raw_data = m.full_code
  from matches m
  where c.id = m.camera_id
  returning m.id as malformed_id
)
delete from public.mottak_scans d
using merged m
where d.id = m.malformed_id;

-- 2. Repair remaining malformed Nordic ID rows that have no camera match.
update public.mottak_scans
set
  raw_data = case
    when coalesce(raw_data, '') = '' then scanner_code
    else raw_data
  end,
  scanner_code = substring(scanner_code from 1 for 12),
  upper_number = substring(scanner_code from 13 for 6),
  lower_number = substring(scanner_code from 19 for 6)
where source like '%nordic_id%'
  and scanner_code ~ '^[A-Z0-9]{12}[0-9]{6}[A-Z0-9]{6}$';

-- 3. Normalize and validate all future inserts/edits at database level.
create or replace function public.normalize_mottak_scan_codes()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  full_code text;
  raw_compact text;
begin
  new.scanner_code := upper(regexp_replace(coalesce(new.scanner_code, ''), '[^A-Z0-9]', '', 'g'));
  new.upper_number := regexp_replace(coalesce(new.upper_number, ''), '[^0-9]', '', 'g');
  new.lower_number := upper(regexp_replace(coalesce(new.lower_number, ''), '[^A-Z0-9]', '', 'g'));
  raw_compact := upper(regexp_replace(coalesce(new.raw_data, ''), '[^A-Z0-9]', '', 'g'));

  full_code := null;

  if new.scanner_code ~ '^[A-Z0-9]{12}[0-9]{6}[A-Z0-9]{6}$' then
    full_code := new.scanner_code;
  elsif raw_compact ~ '^[A-Z0-9]{12}[0-9]{6}[A-Z0-9]{6}$'
        and (new.scanner_code = '' or length(new.scanner_code) <> 12) then
    full_code := raw_compact;
  end if;

  if full_code is not null then
    new.scanner_code := substring(full_code from 1 for 12);
    new.upper_number := substring(full_code from 13 for 6);
    new.lower_number := substring(full_code from 19 for 6);
    new.raw_data := full_code;
  end if;

  if new.scanner_code <> '' and new.scanner_code !~ '^[A-Z0-9]{12}$' then
    raise exception 'Invalid scanner_code. Expected 12 characters A-Z/0-9.';
  end if;

  if new.upper_number !~ '^[0-9]{6}$' then
    raise exception 'Invalid upper_number. Expected exactly 6 digits.';
  end if;

  if new.lower_number !~ '^[A-Z0-9]{6}$' then
    raise exception 'Invalid lower_number. Expected exactly 6 characters A-Z/0-9.';
  end if;

  return new;
end;
$$;

drop trigger if exists normalize_mottak_scan_codes_trigger on public.mottak_scans;

create trigger normalize_mottak_scan_codes_trigger
before insert or update of scanner_code, upper_number, lower_number, raw_data
on public.mottak_scans
for each row
execute function public.normalize_mottak_scan_codes();

commit;
