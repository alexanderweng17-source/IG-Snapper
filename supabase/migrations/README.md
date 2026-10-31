# Supabase migrations

These files reproduce the production schema in version order.

- `20261029020339_licenses_v2.sql` — the original License schema and server-side License RPCs, reconstructed from the production migration history.
- `20261029154943_web_store.sql` — customer orders, private raw License Key storage and order/license RPCs.
- `20261029154948_refund_web_orders.sql` — refund status and License revocation.
- `20261031191819_index_web_license_secrets_user_id.sql` — index for the `web_license_secrets.user_id` foreign key; applied to the production project.

Do not edit an applied migration. Create a new timestamped migration for every later schema change. Compare `supabase migration list` against production history before pushing changes.
