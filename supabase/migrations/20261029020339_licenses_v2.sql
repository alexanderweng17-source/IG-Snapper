create extension if not exists pgcrypto with schema extensions;

create table if not exists public.licenses (
  key_hash      text primary key,
  label         text,
  status        text not null default 'active' check (status in ('active', 'revoked')),
  expires_at    timestamptz,
  max_accounts  int  not null default 1 check (max_accounts between 1 and 20),
  max_devices   int  not null default 2 check (max_devices between 1 and 20),
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists public.license_activations (
  key_hash   text not null references public.licenses(key_hash) on delete cascade,
  kind       text not null check (kind in ('device', 'account')),
  value      text not null,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  primary key (key_hash, kind, value)
);

create table if not exists public.license_failures (
  id bigint generated always as identity primary key,
  ip text not null,
  at  timestamptz not null default now()
);
create index if not exists license_failures_ip_at on public.license_failures (ip, at);

alter table public.licenses            enable row level security;
alter table public.license_activations enable row level security;
alter table public.license_failures    enable row level security;

create or replace function public.claim_license(p_key_hash text, p_device text, p_account text, p_ip text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  lic public.licenses%rowtype;
  n int;
  dev_known boolean;
  acc_known boolean;
begin
  if coalesce(p_ip, '') <> '' then
    select count(*) into n from public.license_failures where ip = p_ip and at > now() - interval '10 minutes';
    if n >= 20 then
      return jsonb_build_object('valid', false, 'reason', 'rate_limited');
    end if;
  end if;

  select * into lic from public.licenses where key_hash = p_key_hash for update;
  if not found then
    insert into public.license_failures (ip) values (coalesce(p_ip, ''));
    delete from public.license_failures where at < now() - interval '1 day';
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;
  if lic.status <> 'active' then
    return jsonb_build_object('valid', false, 'reason', 'revoked');
  end if;
  if lic.expires_at is not null and lic.expires_at < now() then
    return jsonb_build_object('valid', false, 'reason', 'expired', 'expiresAt', lic.expires_at);
  end if;

  select exists (select 1 from public.license_activations where key_hash = p_key_hash and kind = 'device' and value = p_device) into dev_known;
  if not dev_known then
    select count(*) into n from public.license_activations where key_hash = p_key_hash and kind = 'device';
    if n >= lic.max_devices then
      return jsonb_build_object('valid', false, 'reason', 'device_limit', 'expiresAt', lic.expires_at);
    end if;
  end if;

  acc_known := true;
  if coalesce(p_account, '') <> '' then
    select exists (select 1 from public.license_activations where key_hash = p_key_hash and kind = 'account' and value = p_account) into acc_known;
    if not acc_known then
      select count(*) into n from public.license_activations where key_hash = p_key_hash and kind = 'account';
      if n >= lic.max_accounts then
        return jsonb_build_object('valid', false, 'reason', 'account_limit', 'expiresAt', lic.expires_at);
      end if;
    end if;
  end if;

  insert into public.license_activations (key_hash, kind, value) values (p_key_hash, 'device', p_device)
    on conflict (key_hash, kind, value) do update set last_seen = now();
  if coalesce(p_account, '') <> '' then
    insert into public.license_activations (key_hash, kind, value) values (p_key_hash, 'account', p_account)
      on conflict (key_hash, kind, value) do update set last_seen = now();
  end if;
  update public.licenses set last_seen_at = now() where key_hash = p_key_hash;

  return jsonb_build_object('valid', true, 'reason', 'ok', 'expiresAt', lic.expires_at);
end;
$$;

create or replace function public.license_hash(p_key text)
returns text language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(upper(regexp_replace(btrim(p_key), '\s+', '', 'g')), 'sha256'), 'hex');
$$;

create or replace function public.create_license(p_label text, p_days int default null, p_max_accounts int default 1, p_max_devices int default 2)
returns table (license_key text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  raw bytea := extensions.gen_random_bytes(20);
  chars text := '';
  k text;
  exp timestamptz := case when p_days is null then null else now() + make_interval(days => p_days) end;
begin
  for i in 0..19 loop
    chars := chars || substr(alphabet, (get_byte(raw, i) % 32) + 1, 1);
  end loop;
  k := 'IGS-' || substr(chars, 1, 5) || '-' || substr(chars, 6, 5) || '-' || substr(chars, 11, 5) || '-' || substr(chars, 16, 5);
  insert into public.licenses (key_hash, label, expires_at, max_accounts, max_devices)
    values (public.license_hash(k), p_label, exp, p_max_accounts, p_max_devices);
  return query select k, exp;
end;
$$;

create or replace function public.revoke_license(p_key text) returns int language sql security definer set search_path = public, extensions as $$
  with u as (update public.licenses set status = 'revoked' where key_hash = public.license_hash(p_key) returning 1) select count(*)::int from u;
$$;

create or replace function public.reset_license(p_key text) returns int language sql security definer set search_path = public, extensions as $$
  with d as (delete from public.license_activations where key_hash = public.license_hash(p_key) returning 1) select count(*)::int from d;
$$;

create or replace function public.extend_license(p_key text, p_days int) returns timestamptz language sql security definer set search_path = public, extensions as $$
  update public.licenses
     set expires_at = greatest(coalesce(expires_at, now()), now()) + make_interval(days => p_days), status = 'active'
   where key_hash = public.license_hash(p_key)
  returning expires_at;
$$;

revoke execute on function public.claim_license(text, text, text, text) from public, anon, authenticated;
revoke execute on function public.license_hash(text)                    from public, anon, authenticated;
revoke execute on function public.create_license(text, int, int, int)   from public, anon, authenticated;
revoke execute on function public.revoke_license(text)                  from public, anon, authenticated;
revoke execute on function public.reset_license(text)                   from public, anon, authenticated;
revoke execute on function public.extend_license(text, int)             from public, anon, authenticated;
grant  execute on function public.claim_license(text, text, text, text) to service_role;
