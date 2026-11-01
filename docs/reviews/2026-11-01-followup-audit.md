# Follow-up audit — 2026-11-01

## User-reported defect

The issue is a false positive in Snapshot History: a Following entry can be presented as newly followed even when the account was already in the user's Following list. Snapshot comparison must be treated as membership comparison, not as an Instagram activity event log.

## Changes in this audit

- Snapshot schema v2 stores viewer ID, independent scan-complete flags, page counts, and captured item counts for both Followers and Following.
- A history diff is only comparable when both adjacent snapshots prove completeness, have valid unique stable IDs, and belong to the same viewer ID. Legacy snapshots are retained, displayed as unverified, and excluded from diffs.
- API, normalizer and compact snapshot paths handle nested user/node IDs consistently. Missing IDs fail the scan closed instead of silently disappearing.
- Pagination recognizes nested cursor and terminal signals. An unknown terminal page is an incomplete scan; it cannot be cached as complete or used to create a history event.
- Local history and protected-user lists are scoped to Instagram viewer ID. Backups carry an account ID; known cross-account restore is rejected.
- History wording says "New in Following" / "พบเพิ่มในรายชื่อกำลังติดตาม", not "You followed". The detail note explains that list membership does not prove the user tapped Follow or when.
- Userscripts update guidance explains manual Update/Available Updates in the app Popup. The app may disable automatic checks in some versions, so no automatic-update guarantee is made.
- Store and Download copy describe Chrome desktop and the iPhone/iPad Safari userscript. Checkout remains deliberately closed until payment configuration and end-to-end acceptance are complete.
- Unreferenced React storefront components and their private FAQ/feature mirrors were removed after searching source imports. The active storefront is the embedded public/preview.html UI.
- PreviewSiteFrame now unsubscribes from Supabase auth state on cleanup and sends auth state again after iframe load.
- Inter-page pacing delay was reduced from 350ms + 0–250ms jitter to 150ms + 0–150ms jitter. Retry/back-off remains for 429, timeout and transient network/server errors. Followers and Following still scan concurrently; cursor-dependent pages remain sequential.

## Verification scope

Local verification completed: 27/27 automated tests pass, all canonical and generated JS files pass `node --check`, TypeScript passes, clean Next.js 15.5.28 production build passes (16/16 static pages), Chrome ZIP manifest is v2.3.3 with 14 files and no Unfollow action markers, the protected route trace includes only the v2.3.3 Chrome ZIP, and the public Userscript SHA-256 matches the versioned iOS artifact.

Automated verification covers stable-ID comparisons, reordered/renamed accounts, nested user/node identifiers, missing IDs, complete/incomplete and nested pagination, legacy snapshots, cross-viewer diffs, and account-scoped storage guards. Preview HTML scripts and Thai copy are validated by tests. The release still requires live Instagram acceptance with a real account, including an account with thousands of connections, plus physical Chrome/iPhone/iPad UI acceptance.

## Known limitations / open items

- Instagram does not expose an authoritative personal Follow-activity log to this feature. History cannot prove the exact time or actor of a membership change.
- The API can change. Unknown pagination shape intentionally fails closed and may require Refresh/retry; a live account test is needed to confirm supported current payload variants.
- The reduced pacing wait saves about 53% of the artificial inter-page delay only; end-to-end time depends on Instagram response latency and rate limiting. No benchmark on a real thousands-of-followers account is claimed.
- Chrome and iPhone/iPad compatibility remain unaccepted until checked on physical devices.
- Supabase Auth leaked-password protection remains disabled in project settings.
- Stripe Checkout remains disabled by configuration. Do not enable until payment and webhook tests, actual prices, policy/support information and payment eligibility are confirmed.
