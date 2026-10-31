# Changelog

## 2.3.2 — 2026-11-01

- Removed the Unfollow action from customer UI, shared relationship states, storage/rate-limit state, styles, labels and API providers. Follow is the only relationship action left.
- Reworked History labels to describe observed list membership, not assume a deliberate Unfollow. It separates lost followers, lost followers still in Following, accounts missing from both lists, new followers and Following-list changes.
- Ignore list order and profile-name changes when checking snapshot membership.
- Refuse to save/cache incomplete scans when Instagram promises more pages but omits/repeats a cursor or returns no new users.
- Bind connection caches to the active Instagram viewer ID and use a 10-minute TTL; manual Refresh forces a fresh scan.
- Add a protected Chrome ZIP download route requiring a signed-in admin or a paid order linked to an active, unexpired license.
- Move the public Chrome ZIP out of `public/downloads`; leave only the public iOS Userscript update endpoint.
- Separate versioned customer deliverables by device under `releases/v2.3.2/`.
- Consolidate AI prompts and device-specific hand-off guides under `workspace/`.
- Restore all applied Supabase migrations, deployed `verify-license` Edge Function source and generated database types into the repository.
- Add an index to `web_license_secrets.user_id` and record the applied production migration.
- Add regression tests for History semantics, no legacy Unfollow surfaces and incomplete pagination.
- Normalize line endings in the iOS build tool so it works with the Windows checkout.
- Update the download preview to present separate Desktop and iPhone/iPad install paths.
- Mark Chrome and iOS device support as untested until real-device acceptance is recorded.
