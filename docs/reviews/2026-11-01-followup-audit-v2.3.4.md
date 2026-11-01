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

## UI and storefront changes
- History labels say "New in Following", and detail copy disclaims any proof of when/whether a Follow action occurred.
- History Detail tabs now expose tablist/tabpanel associations, roving tab focus, Arrow/Home/End navigation, focus restoration, and a 44px minimum target height.
- Extension header and diagnostic versions match the manifest v2.3.4.
- The Store consumes an explicit server-derived Checkout availability flag. If backend configuration does not affirmatively allow Checkout, direct Checkout and plan purchase controls are disabled. The payment action also fails closed.
- Store includes Chrome desktop and Safari iPhone/iPad edition guidance; Userscripts update guidance is manual via Popup > Update/Available Updates.
- Unreferenced React storefront duplicates were removed in v2.3.3; public/preview.html remains the embedded Store source of truth.

## Verification
- Local: 31/31 tests passed; TypeScript, Next.js 15.5.28 production build, Userscript syntax checks and Git diff checks passed.
- Chrome ZIP v2.3.4 contains nine files; each file hash matches canonical extension/chrome source.
- Versioned iOS Userscript matches the public update artifact in the Windows working tree. CRLF-to-LF normalization is expected in Git/Vercel; normalized live bytes match the committed Git blob SHA-256.
- GitHub Actions run #34 passed for code commit 17b3aec5fc3df856bf153b95e68288bb44e01dbb.
- Vercel Production deployment dpl_Fz8UN9CYrNsXmHMABaTf7UbXWt7C is READY and aliased to https://ig-snapper.vercel.app.
- Production HTTP smoke: preview v2.3.4 returns 200; Store plans API returns checkoutEnabled=false for all three plans; unauthenticated Chrome ZIP access returns 307 to Login; retired public v2.3.2 ZIP path returns 404; public iOS Userscript returns 200 and @version 2.3.4.
- Production browser acceptance passed for direct Checkout disabled state, all plan-card states, Desktop/iPhone downloads, manual Userscripts update instructions, Snapshot History limitation copy, and no Unfollow claims.
- No Vercel runtime errors found in the selected one-hour window.

## Known limitations / open items
- Instagram exposes no authoritative personal Follow activity event log; History cannot prove actor or timestamp.
- Unknown API pagination shapes intentionally fail closed and may require a Refresh/retry.
- No live benchmark against an actual account with thousands of followers has been performed. Reduced pacing saves about 53% of artificial inter-page wait only; end-to-end scan duration is still affected by Instagram response time and rate limiting.
- Chrome and iPhone/iPad physical-device acceptance remains outstanding.
- Supabase Auth leaked-password protection is still disabled.
- Stripe Checkout remains disabled; do not enable without end-to-end purchase/webhook/legal/support and payment eligibility acceptance.
- The Impeccable audit engine could not run on the Windows device because its executable exited with missing-runtime/DLL status 0xC0000135. Manual source review and production browser acceptance were used instead; no automated Impeccable score is claimed.
