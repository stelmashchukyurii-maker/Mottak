-- BaMavaremottak / UT — Lager og utsending
-- Versjon 1 · 03.08.2026
-- Kjør hele filen én gang i Supabase SQL Editor.
-- Den oppretter felles kontor-/lageroppdrag og trygg reservasjon/utsending av INN-poster.

create extension if not exists pgcrypto;

create table if not exists public.ut_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  ramp text not null,
  cmr_ref text,
  status text not null default 'new',
  bunner_stacks integer not null default 0 check (bunner_stacks >= 0),
  hyller30_sets integer not null default 0 check (hyller30_sets >= 0),
  hyller60_sets integer not null default 0 check (hyller60_sets >= 0),
  office_note text,
  warehouse_note text,
  problem_reason text,
  cancel_reason text,
  created_by text,
  received_by text,
  started_by text,
  staged_by text,
  completed_by text,
  cancelled_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  received_at timestamptz,
  started_at timestamptz,
  staged_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ut_orders_status_check'
      and conrelid = 'public.ut_orders'::regclass
  ) then
    alter table public.ut_orders
      add constraint ut_orders_status_check
      check (status in ('new','received','in_progress','staged','problem','completed','cancelled'));
  end if;
end $$;

create table if not exists public.ut_order_scans (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ut_orders(id) on delete cascade,
  mottak_scan_id text not null,
  product text not null,
  scanner_code text,
  upper_number text,
  lower_number text,
  scanned_at timestamptz not null default now(),
  staged_at timestamptz,
  dispatched_at timestamptz,
  released_at timestamptz,
  released_reason text
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ut_order_scans_product_check'
      and conrelid = 'public.ut_order_scans'::regclass
  ) then
    alter table public.ut_order_scans
      add constraint ut_order_scans_product_check
      check (product in ('bunner','hyller30','hyller60'));
  end if;
end $$;

create index if not exists ut_orders_status_created_idx
  on public.ut_orders(status, created_at desc);

create index if not exists ut_order_scans_order_idx
  on public.ut_order_scans(order_id, scanned_at desc);

create unique index if not exists ut_order_scans_active_mottak_unique
  on public.ut_order_scans(mottak_scan_id)
  where released_at is null and dispatched_at is null;

alter table public.mottak_scans
  add column if not exists stock_status text not null default 'in_stock';

alter table public.mottak_scans
  add column if not exists ut_order_id uuid;

alter table public.mottak_scans
  add column if not exists reserved_at timestamptz;

alter table public.mottak_scans
  add column if not exists staged_at timestamptz;

alter table public.mottak_scans
  add column if not exists dispatched_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'mottak_scans_stock_status_check'
      and conrelid = 'public.mottak_scans'::regclass
  ) then
    alter table public.mottak_scans
      add constraint mottak_scans_stock_status_check
      check (stock_status in ('in_stock','reserved','staged','dispatched'));
  end if;
end $$;

create index if not exists mottak_scans_stock_status_idx
  on public.mottak_scans(stock_status, product);

create index if not exists mottak_scans_ut_order_idx
  on public.mottak_scans(ut_order_id);

update public.mottak_scans
set stock_status = 'in_stock'
where stock_status is null;

create or replace function public.set_ut_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_ut_orders_updated_at on public.ut_orders;
create trigger set_ut_orders_updated_at
before update on public.ut_orders
for each row execute function public.set_ut_updated_at();

alter table public.ut_orders enable row level security;
alter table public.ut_order_scans enable row level security;

-- TEST policy for the current public GitHub Pages application.
-- Replace with authenticated role policies before production use.
drop policy if exists "ut_orders_public_select" on public.ut_orders;
create policy "ut_orders_public_select" on public.ut_orders for select to anon, authenticated using (true);

drop policy if exists "ut_orders_public_insert" on public.ut_orders;
create policy "ut_orders_public_insert" on public.ut_orders for insert to anon, authenticated with check (true);

drop policy if exists "ut_orders_public_update" on public.ut_orders;
create policy "ut_orders_public_update" on public.ut_orders for update to anon, authenticated using (true) with check (true);

drop policy if exists "ut_order_scans_public_select" on public.ut_order_scans;
create policy "ut_order_scans_public_select" on public.ut_order_scans for select to anon, authenticated using (true);

create or replace function public.reserve_ut_scan(p_order_id uuid, p_scan_value text)
returns setof public.ut_order_scans
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.ut_orders%rowtype;
  v_mottak public.mottak_scans%rowtype;
  v_value text := upper(trim(coalesce(p_scan_value,'')));
  v_expected integer;
  v_current integer;
begin
  if v_value = '' then
    raise exception 'Tom skanneverdi.';
  end if;

  select * into v_order
  from public.ut_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Oppdraget finnes ikke.';
  end if;

  if v_order.status not in ('received','in_progress','problem') then
    raise exception 'Oppdraget må være Mottatt eller Pågår før skanning.';
  end if;

  select * into v_mottak
  from public.mottak_scans
  where status = 'verified'
    and coalesce(stock_status,'in_stock') = 'in_stock'
    and (
      upper(coalesce(scanner_code,'')) = v_value
      or upper(coalesce(upper_number,'')) = v_value
      or upper(coalesce(lower_number,'')) = v_value
    )
  order by created_at desc
  limit 1
  for update skip locked;

  if not found then
    raise exception 'Nummeret finnes ikke som en ledig og godkjent INN-registrering.';
  end if;

  v_expected := case v_mottak.product
    when 'bunner' then v_order.bunner_stacks
    when 'hyller30' then v_order.hyller30_sets
    when 'hyller60' then v_order.hyller60_sets
    else 0
  end;

  if v_expected <= 0 then
    raise exception '% er ikke bestilt i dette oppdraget.', coalesce(v_mottak.product,'Ukjent produkt');
  end if;

  select count(*) into v_current
  from public.ut_order_scans
  where order_id = p_order_id
    and product = v_mottak.product
    and released_at is null;

  if v_current >= v_expected then
    raise exception 'Riktig antall % er allerede skannet.', v_mottak.product;
  end if;

  update public.mottak_scans
  set stock_status = 'reserved',
      ut_order_id = p_order_id,
      reserved_at = now(),
      staged_at = null,
      dispatched_at = null
  where id::text = v_mottak.id::text;

  return query
  insert into public.ut_order_scans (
    order_id,mottak_scan_id,product,scanner_code,upper_number,lower_number
  ) values (
    p_order_id,v_mottak.id::text,v_mottak.product,v_mottak.scanner_code,
    v_mottak.upper_number,v_mottak.lower_number
  )
  returning *;
end;
$$;

create or replace function public.remove_ut_scan(p_order_id uuid, p_mottak_scan_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ut_order_scans
  set released_at = now(), released_reason = 'Removed before dispatch'
  where order_id = p_order_id
    and mottak_scan_id = p_mottak_scan_id
    and released_at is null
    and dispatched_at is null;

  if not found then
    raise exception 'Aktiv skanning ble ikke funnet.';
  end if;

  update public.mottak_scans
  set stock_status = 'in_stock',
      ut_order_id = null,
      reserved_at = null,
      staged_at = null
  where id::text = p_mottak_scan_id
    and ut_order_id = p_order_id
    and coalesce(stock_status,'in_stock') in ('reserved','staged');
end;
$$;

create or replace function public.stage_ut_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.ut_orders%rowtype;
  v_bunner integer;
  v_h30 integer;
  v_h60 integer;
begin
  select * into v_order from public.ut_orders where id = p_order_id for update;
  if not found then raise exception 'Oppdraget finnes ikke.'; end if;

  select
    count(*) filter (where product='bunner'),
    count(*) filter (where product='hyller30'),
    count(*) filter (where product='hyller60')
  into v_bunner,v_h30,v_h60
  from public.ut_order_scans
  where order_id = p_order_id and released_at is null;

  if v_bunner <> v_order.bunner_stacks
     or v_h30 <> v_order.hyller30_sets
     or v_h60 <> v_order.hyller60_sets then
    raise exception 'Skannet antall stemmer ikke med bestillingen.';
  end if;

  update public.mottak_scans m
  set stock_status='staged', staged_at=now()
  where m.ut_order_id=p_order_id
    and coalesce(m.stock_status,'in_stock')='reserved';

  update public.ut_order_scans
  set staged_at=now()
  where order_id=p_order_id and released_at is null;

  update public.ut_orders
  set status='staged', staged_at=now()
  where id=p_order_id;
end;
$$;

create or replace function public.confirm_ut_dispatch(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.ut_orders%rowtype;
  v_bunner integer;
  v_h30 integer;
  v_h60 integer;
begin
  select * into v_order from public.ut_orders where id=p_order_id for update;
  if not found then raise exception 'Oppdraget finnes ikke.'; end if;
  if v_order.status <> 'staged' then raise exception 'Oppdraget er ikke markert På rampe.'; end if;

  select
    count(*) filter (where product='bunner'),
    count(*) filter (where product='hyller30'),
    count(*) filter (where product='hyller60')
  into v_bunner,v_h30,v_h60
  from public.ut_order_scans
  where order_id=p_order_id and released_at is null;

  if v_bunner <> v_order.bunner_stacks
     or v_h30 <> v_order.hyller30_sets
     or v_h60 <> v_order.hyller60_sets then
    raise exception 'Skannet antall stemmer ikke med bestillingen.';
  end if;

  update public.mottak_scans
  set stock_status='dispatched', dispatched_at=now()
  where ut_order_id=p_order_id and stock_status='staged';

  update public.ut_order_scans
  set dispatched_at=now()
  where order_id=p_order_id and released_at is null;

  update public.ut_orders
  set status='completed', completed_at=now()
  where id=p_order_id;
end;
$$;

create or replace function public.cancel_ut_order(p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status from public.ut_orders where id=p_order_id for update;
  if not found then raise exception 'Oppdraget finnes ikke.'; end if;
  if v_status='completed' then raise exception 'Et ferdig oppdrag kan ikke avbrytes.'; end if;

  update public.mottak_scans
  set stock_status='in_stock', ut_order_id=null, reserved_at=null, staged_at=null
  where ut_order_id=p_order_id and stock_status in ('reserved','staged');

  update public.ut_order_scans
  set released_at=now(), released_reason=coalesce(nullif(trim(p_reason),''),'Order cancelled')
  where order_id=p_order_id and released_at is null and dispatched_at is null;

  update public.ut_orders
  set status='cancelled', cancel_reason=p_reason, cancelled_at=now()
  where id=p_order_id;
end;
$$;

grant execute on function public.reserve_ut_scan(uuid,text) to anon, authenticated;
grant execute on function public.remove_ut_scan(uuid,text) to anon, authenticated;
grant execute on function public.stage_ut_order(uuid) to anon, authenticated;
grant execute on function public.confirm_ut_dispatch(uuid) to anon, authenticated;
grant execute on function public.cancel_ut_order(uuid,text) to anon, authenticated;

grant select, insert, update on public.ut_orders to anon, authenticated;
grant select on public.ut_order_scans to anon, authenticated;

-- Test order matching the photographed CMR (optional).
-- Uncomment only if you want a ready-made cloud test order.
-- insert into public.ut_orders(order_number,ramp,cmr_ref,bunner_stacks,hyller60_sets,office_note)
-- values ('UT-20260803-TEST','32','462391099',18,14,'CMR-test: 18 stabler Bunner + 14 Hyller x60.')
-- on conflict (order_number) do nothing;
