-- Support cleanup and lookups by account owner for the private license-secret table.
create index if not exists web_license_secrets_user_id_idx
  on public.web_license_secrets (user_id);
