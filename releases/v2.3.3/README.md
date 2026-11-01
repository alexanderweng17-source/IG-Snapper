# IG Snapper v2.3.3

Source of truth: extension/chrome/ (manifest version 2.3.3).

Customer deliverables:
- Chrome desktop: chrome/IG-Snapper-v2.3.3-customer.zip
- Safari on iPhone/iPad: ios/ig-snapper.user.js

This release changes History to compare only complete, verifiable snapshots for the same Instagram viewer ID. Older snapshots remain stored but are marked unverified. History reports membership changes, not confirmed Instagram Follow activity.

Both builds are generated from the same canonical Chrome source. Do not edit artifacts by hand.

Automated tests, typecheck, build, package contents and delivery smoke tests must pass before release. Physical acceptance on Chrome desktop and iPhone/iPad is still required; do not label this release field-tested until those checks pass.

For iPhone/iPad, the Userscripts file publishes @version, @updateURL and @downloadURL. Open the script Popup inside Userscripts and choose Update/Available Updates to check manually; automatic update checks are not guaranteed to be enabled.
