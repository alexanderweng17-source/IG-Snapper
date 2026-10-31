# Supabase / backend workspace

Production project: `Ig-Snapper` (`hihhomdldouekdymgmzn`, region `eu-west-1`).

Source layout:
- `supabase/config.toml` — local CLI project config.
- `supabase/migrations/` — ordered, reproducible SQL migrations.
- `supabase/functions/verify-license/` — deployed license verification source.

Rules:
1. Read current Supabase guidance before any schema, Auth or Edge Function changes.
2. Add new schema changes as migrations; never edit an already-applied migration.
3. Keep Row Level Security enabled. License, activation, failure, order and raw license-secret tables are server-only in this project. Do not add broad client policies just to silence an Advisor.
4. Review SECURITY DEFINER functions, fixed search_path, execution grants, constraints, indexes and webhook idempotency.
5. Do not print or commit database passwords, access tokens, secret/service-role keys or Stripe secrets.
6. Compare migration history before production changes; validate migrations in a clean local database first.
7. Back up and review the impact before changing customer records or production data.

Current finding: Supabase Auth Advisor reports leaked-password protection disabled. This is a Dashboard Auth setting; enable it in Auth settings and test signup/password-change flows. It is not fixed by a SQL migration.