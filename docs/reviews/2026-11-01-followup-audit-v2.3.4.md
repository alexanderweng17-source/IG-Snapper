# Follow-up audit — 2026-11-01 (v2.3.4)

## User-reported History defect
The reported defect is a false positive: a Following entry may appear as newly followed even when it was already present in the user's Following list. History is a comparison of list membership between complete scans, not an Instagram activity log.

## Data correctness and pagination
- Snapshot schema v2 stores viewer ID and independent completeness metadata for Followers and Following.
- A diff is permitted only when both snapshots verify full pagination, valid unique stable user IDs, captured counts, and matching viewer IDs.
- Old snapshots without completeness proof remain stored and are labelled unverified; they cannot create added/removed events.
- Nested user/node IDs are normalized consistently. Missing stable IDs now fail the scan rather than silently disappearing.
- Unknown pagination termination, missing/repeated cursors, pages with no new IDs and safety page limits fail closed.
- Per-page waits are reduced to 150ms + 0–150ms jitter; retry/back-off on 429, timeouts and transient network/server errors remains intact.
- Followers and Following requests remain concurrent; the page cursor chain within each list remains sequential. UI account rows still render in chunks of 80 with lazy avatar loading.

## UI and storefront
- History labels now say "New in Following", and detail copy disclaims any proof of when/whether a Follow action occurred.
- History tabs now expose tablist/tabpanel associations, roving tab focus, Arrow/Home/End navigation and a 44px minimum target height.
- Extension header version corrected from a stale hard-coded 2.3.1 to 2.3.4.
- The Store consumes an explicit checkout availability flag from its plans API. If the backend does not affirmatively allow checkout, the Store and direct Checkout route show a disabled state; the action handler also fails closed.
- Store includes Chrome desktop and Safari iPhone/iPad edition guidance; Userscripts update guidance is manual via Popup > Update/Available Updates.
- Unreferenced React storefront duplicates were removed in v2.3.3; public/preview.html remains the embedded Store source of truth.

## Verification scope
Automated regression tests cover complete/incomplete snapshots, nested IDs, legacy baselines, cross-viewer data, pagination, accessible History tabs, UI version pinning, closed Checkout UI and Store script parsing. Physical acceptance on Chrome desktop and actual iPhone/iPad is still required.

## Known limitations
- Instagram exposes no authoritative personal Follow activity event log; History cannot prove actor or timestamp.
- Unknown API pagination shapes intentionally fail closed and may require a Refresh/retry.
- No live benchmark against an actual account with thousands of followers has been performed. Reduced pacing saves about 53% of artificial inter-page wait only; end-to-end scan duration is still affected by Instagram response time and rate limiting.
- iOS compatibility and touch layout remain unverified on physical devices.
- Supabase Auth leaked-password protection is still disabled.
- Stripe Checkout remains disabled; do not enable without end-to-end purchase/webhook/legal/support and payment eligibility acceptance.
- UI audit CLI engine cannot run on the Windows device because the binary exits with missing-runtime/DLL code 0xC0000135. Manual source/UI inspection and live Store browser checks were used instead; no Impeccable audit score is claimed.
