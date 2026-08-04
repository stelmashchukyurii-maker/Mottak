-- BaMavaremottak / UT TESTMODUS
-- Versjon 1 · 04.08.2026 kl. 20:31 CEST
-- Kjør hele filen én gang i Supabase SQL Editor.
-- Ingen LIVE-modus. Alle UT-oppdrag behandles som reversible tester.

alter table public.ut_orders
  add column if not exists is_test boolean not null default true;

alter table public.ut_orders
  add column if not exists test_state text not null default 'active';

alter table public.ut_orders
  add column if not exists test_dispatched_at timestamptz;

alter table public.ut_orders
  add column if not exists test_returned_at timestamptz;

alter table public.ut_orders
  add column if not exists test_before_bunner integer;

alter table public.ut_orders
  add column if not exists test_before_hyller integer;

alter table public.ut_orders
  add column if not exists test_after_dispatch_bunner integer;

alter table public.ut_orders
  add column if not exists test_after_dispatch_hyller integer;

alter table public.ut_orders
  add column if not exists test_after_return_bunner integer;

alter table public.ut_orders
  add column if not exists test_after_return_hyller integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ut_orders_test_state_check'
      and conrelid = 'public.ut_orders'::regclass
  ) then
    alter table public.ut_orders
      add constraint ut_orders_test_state_check
      check (test_state in ('active','dispatched','returned'));
  end if;
end $$;

update public.ut_orders
set is_test = true,
    test_state = case
      when status = 'completed' then 'dispatched'
      when status = 'cancelled' and coalesce(cancel_reason,'') like 'TEST_RETURNED%' then 'returned'
      else coalesce(test_state,'active')
    end;

create or replace function public.ut_physical_stock()
returns table(total_bunner integer,total_hyller integer)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(sum(case
      when product='bunner' then 10
      when product in ('hyller30','hyller60') then 1
      else 0 end),0)::integer as total_bunner,
    coalesce(sum(case
      when product='hyller30' then 30
      when product='hyller60' then 60
      else 0 end),0)::integer as total_hyller
  from public.mottak_scans
  where status='verified'
    and coalesce(stock_status,'in_stock') in ('in_stock','reserved','staged');
$$;

create or replace function public.test_dispatch_ut_order(p_order_id uuid)
returns public.ut_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.ut_orders%rowtype;
  v_bunner integer;
  v_h30 integer;
  v_h60 integer;
  v_before_b integer;
  v_before_h integer;
  v_after_b integer;
  v_after_h integer;
begin
  select * into v_order
  from public.ut_orders
  where id=p_order_id
  for update;

  if not found then raise exception 'Oppdraget finnes ikke.'; end if;
  if not coalesce(v_order.is_test,true) then raise exception 'Bare TEST-oppdrag er tillatt nå.'; end if;
  if v_order.status <> 'staged' then raise exception 'Oppdraget må stå På rampe før testavgang.'; end if;
  if coalesce(v_order.test_state,'active') <> 'active' then raise exception 'Denne testen er allerede behandlet.'; end if;

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

  select total_bunner,total_hyller
  into v_before_b,v_before_h
  from public.ut_physical_stock();

  update public.mottak_scans
  set stock_status='dispatched', dispatched_at=now()
  where ut_order_id=p_order_id and stock_status='staged';

  if not found then raise exception 'Ingen varer på rampen ble funnet for testavgang.'; end if;

  update public.ut_order_scans
  set dispatched_at=now()
  where order_id=p_order_id and released_at is null;

  select total_bunner,total_hyller
  into v_after_b,v_after_h
  from public.ut_physical_stock();

  update public.ut_orders
  set status='completed',
      completed_at=now(),
      test_state='dispatched',
      test_dispatched_at=now(),
      test_before_bunner=v_before_b,
      test_before_hyller=v_before_h,
      test_after_dispatch_bunner=v_after_b,
      test_after_dispatch_hyller=v_after_h
  where id=p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.return_ut_test_order(p_order_id uuid)
returns public.ut_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.ut_orders%rowtype;
  v_after_b integer;
  v_after_h integer;
begin
  select * into v_order
  from public.ut_orders
  where id=p_order_id
  for update;

  if not found then raise exception 'Oppdraget finnes ikke.'; end if;
  if not coalesce(v_order.is_test,true) then raise exception 'Dette er ikke et TEST-oppdrag.'; end if;
  if coalesce(v_order.test_state,'active') <> 'dispatched' then raise exception 'Testen er ikke midlertidig avsendt eller er allerede returnert.'; end if;

  update public.mottak_scans
  set stock_status='in_stock',
      ut_order_id=null,
      reserved_at=null,
      staged_at=null,
      dispatched_at=null
  where ut_order_id=p_order_id and stock_status='dispatched';

  if not found then raise exception 'Ingen midlertidig avsendte varer ble funnet.'; end if;

  update public.ut_order_scans
  set released_at=now(),
      released_reason='TEST_RETURNED_TO_STOCK'
  where order_id=p_order_id and released_at is null;

  select total_bunner,total_hyller
  into v_after_b,v_after_h
  from public.ut_physical_stock();

  update public.ut_orders
  set status='cancelled',
      cancelled_at=now(),
      cancel_reason='TEST_RETURNED_TO_STOCK',
      test_state='returned',
      test_returned_at=now(),
      test_after_return_bunner=v_after_b,
      test_after_return_hyller=v_after_h
  where id=p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

grant execute on function public.ut_physical_stock() to anon, authenticated;
grant execute on function public.test_dispatch_ut_order(uuid) to anon, authenticated;
grant execute on function public.return_ut_test_order(uuid) to anon, authenticated;

-- Kontroll etter installasjon:
select * from public.ut_physical_stock();
