# Current release

**Current version: 2.3.4**

- Desktop Chrome: `../v2.3.4/chrome/IG-Snapper-v2.3.4-customer.zip`
- iPhone/iPad Safari: `../v2.3.4/ios/ig-snapper.user.js`

## Verification

- Local: 31 automated tests passed; TypeScript and Next.js 15.5.28 production build passed.
- Package integrity: all nine Chrome ZIP source files match by SHA-256; versioned and public iOS Userscript files are identical in the Windows working tree.
- GitHub Actions CI run #34 passed for code commit `17b3aec5fc3df856bf153b95e68288bb44e01dbb`.
- Vercel Production deployment `dpl_Fz8UN9CYrNsXmHMABaTf7UbXWt7C` is READY on `ig-snapper.vercel.app`.
- Production browser acceptance passed for direct Checkout, three disabled plan cards, Desktop/iPhone download paths, FAQ update/History guidance and absence of Unfollow claims.
- Production HTTP checks passed: Store API reports `checkoutEnabled=false` for all three plans; unauthenticated Chrome ZIP download redirects to Login; legacy public ZIP path returns 404; public Userscript is v2.3.4. The live LF-normalized Userscript SHA-256 matches the committed Git blob.
- No Vercel runtime errors found in the selected one-hour window.

Physical acceptance on Chrome desktop and iPhone/iPad is still required before describing this release as field-tested. Supabase Auth leaked-password protection is also still an open Dashboard setting; Checkout remains deliberately disabled.
