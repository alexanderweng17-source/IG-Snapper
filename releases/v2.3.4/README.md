# IG Snapper v2.3.4

Source of truth: `extension/chrome/` (manifest version 2.3.4).

## Customer deliverables

- Chrome desktop: `chrome/IG-Snapper-v2.3.4-customer.zip`
- Safari on iPhone/iPad: `ios/ig-snapper.user.js`

Both builds are generated from the same canonical Chrome source; do not hand-edit release artifacts.

## Changes from v2.3.3

- Snapshot History detail tabs now support tablist/tabpanel semantics, Arrow/Home/End keyboard navigation, roving focus, and focus restoration after mouse or touch selection.
- History category controls have a 44px minimum hit target.
- The Extension header version and diagnostic version now match the customer manifest.
- Store Checkout availability is derived from the server plans API. When Checkout is disabled or its configuration is incomplete, the direct Checkout route and payment action remain disabled.

## Verification status

Automated tests, TypeScript, production build, generated-script syntax, Chrome ZIP content/hashes, and protected download file tracing must pass before release. Physical acceptance on Chrome desktop and iPhone/iPad is still required; do not call this release field-tested until those checks pass.

For iPhone/iPad, the Userscripts file publishes `@version`, `@updateURL` and `@downloadURL`. Open the script Popup in Userscripts and choose Update/Available Updates to check manually; automatic update checks are not guaranteed to be enabled.
