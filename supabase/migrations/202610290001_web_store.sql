-- IG Snapper web storefront tables. Existing extension license schema is preserved.
create table if not exists public.web_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  plan_slug text not null,
  plan_name text not null,
  duration_days integer not null check (duration_days > 0 and duration_days <= 3660),
  amount_satang integer not null check (amount_satang > 0),
  currency text not null default 'thb' check (currency = lower(currency)),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded','canceled')),
  payment_method text check (payment_method is null or payment_method in ('promptpay','card','other')),
  license_key_hash text unique references public.licenses(key_hash),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists web_orders_user_created_idx on public.web_orders(user_id, created_at desc);
create index if not exists web_orders_status_created_idx on public.web_orders(payment_status, created_at desc);

-- Raw keys can only be read by trusted server-side service_role code; the extension only receives hashes in licenses.
create table if not exists public.web_license_secrets (
  order_id uuid primary key references public.web_orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  license_key text not null,
  created_at timestamptz not null default now()
);

alter table public.web_orders enable row level security;
alter table public.web_license_secrets enable row level security;
revoke all privileges on table public.web_orders, public.web_license_secrets from anon, authenticated, public;
grant select, insert, update, delete on table public.web_orders, public.web_license_secrets to service_role;

-- This operation runs inside one DB transaction and is idempotent for Stripe webhook retries.
create or replace function public.issue_web_order_license(
  p_session_id text,
  p_payment_intent text default null,
  p_payment_method text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  ord public.web_orders%rowtype;
  made record;
  new_hash text;
begin
  if coalesce(p_session_id, '') = '' then
    raise exception 'session_id_required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_session_id, 0));
  select * into ord from public.web_orders where stripe_checkout_session_id = p_session_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  if ord.payment_status = 'paid' and ord.license_key_hash is not null then
    return jsonb_build_object('status', 'already_processed', 'order_id', ord.id, 'order_number', ord.order_number);
  end if;

  select * into made from public.create_license(
    'web:' || ord.order_number,
    ord.duration_days,
    1,
    2
  );
  new_hash := public.license_hash(made.license_key);

  insert into public.web_license_secrets(order_id, user_id, license_key)
  values (ord.id, ord.user_id, made.license_key);

  update public.web_orders
     set payment_status = 'paid',
         stripe_payment_intent_id = coalesce(p_payment_intent, stripe_payment_intent_id),
         payment_method = case when p_payment_method in ('promptpay','card','other') then p_payment_method else payment_method end,
         license_key_hash = new_hash,
         paid_at = coalesce(paid_at, now())
   where id = ord.id;

  return jsonb_build_object('status', 'issued', 'order_id', ord.id, 'order_number', ord.order_number, 'expires_at', made.expires_at);
end;
$function$;
revoke all on function public.issue_web_order_license(text, text, text) from public, anon, authenticated;
grant execute on function public.issue_web_order_license(text, text, text) to service_role;

create or replace function public.update_web_order_status(
  p_session_id text,
  p_status text,
  p_payment_intent text default null,
  p_payment_method text default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $function$
begin
  if p_status not in ('failed','canceled','refunded') then
    raise exception 'invalid_status';
  end if;
  update public.web_orders
     set payment_status = p_status,
         stripe_payment_intent_id = coalesce(p_payment_intent, stripe_payment_intent_id),
         payment_method = case when p_payment_method in ('promptpay','card','other') then p_payment_method else payment_method end
   where stripe_checkout_session_id = p_session_id and payment_status = 'pending';
  return found;
end;
$function$;
revoke all on function public.update_web_order_status(text, text, text, text) from public, anon, authenticated;
grant execute on function public.update_web_order_status(text, text, text, text) to service_role;
