# Changelog

## 2.3.4 — 2026-11-01

- Complete Snapshot History tab accessibility: tablist/tabpanel labelling, aria-controls/aria-labelledby, roving tab focus, Arrow/Home/End keyboard navigation and focus restoration after selecting a tab.
- Increase History Detail category tab hit targets to 44px minimum for touch screens.
- Correct the Extension header's stale hard-coded version label to match manifest v2.3.4.
- Expose server-derived checkout availability in the Store plans API. Direct Checkout pages and buttons remain disabled unless every visible plan is explicitly checkout-enabled; the action handler also fails closed.
- Add regression tests for accessible tab semantics, keyboard navigation, version consistency and server-driven checkout state.

## 2.3.3 — 2026-11-01

- Require verified, complete Followers and Following pagination metadata before creating or comparing a History snapshot; legacy snapshots remain stored but are marked unverified and cannot create change events.
- Normalize nested Instagram user / GraphQL node IDs consistently across transport, cache and snapshot compaction; reject missing or invalid stable IDs instead of silently dropping entries.
- Scope Snapshot History and protected-user lists to the current Instagram account; reject cross-account comparisons and backups, and wait for matching local state before loading a new account.
- Rename History's “You followed” claim to “New in Following” and explicitly explain that Snapshot comparison is not an Instagram activity log.
- Recognize nested pagination cursors and terminal flags; fail closed on an ambiguous final page and preserve retry/back-off for rate limits and transient errors.
- Reduce the inter-page pacing delay while retaining retry/back-off and concurrent Followers/Following scans; preserve chunked list rendering and lazy-loaded avatars.
- Fix PreviewSiteFrame auth-listener cleanup and resend auth state when its iframe loads.
- Update Store/Download copy for Chrome desktop and iPhone/iPad, manual Userscripts update instructions and the intentionally closed checkout.
- Remove legacy, unreferenced React storefront components and their duplicate FAQ/feature content source; keep the embedded Preview HTML as the active Store UI.

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
