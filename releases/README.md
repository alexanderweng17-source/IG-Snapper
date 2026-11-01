# Customer releases

Versioned, device-specific customer deliverables live here. This folder does not contain editable source.

- v2.3.4/chrome/IG-Snapper-v2.3.4-customer.zip — Chrome desktop extension package.
- v2.3.4/ios/ig-snapper.user.js — iPhone/iPad Safari userscript.
- v2.3.3/ — previous customer release retained for reference.
- v2.3.2/ — previous customer release retained for reference.
- current/README.md — current release pointer.

The canonical source remains in extension/chrome/; rebuild instead of hand-editing release artifacts. Chrome ZIPs are stored privately under releases/ and delivered by GET /api/downloads/chrome after server-side license checks. The public iOS script at public/downloads/ig-snapper.user.js declares @version, @updateURL and @downloadURL. In Userscripts, open its Popup and choose Update/Available Updates; automatic checks are not guaranteed to be enabled. Old customer ZIPs are archived outside public/.
