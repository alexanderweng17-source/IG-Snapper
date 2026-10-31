# Customer releases

Versioned, device-specific customer deliverables live here. This folder does not contain editable source.

- `v2.3.2/chrome/IG-Snapper-v2.3.2-customer.zip` — Chrome desktop extension package.
- `v2.3.2/ios/ig-snapper.user.js` — iPhone/iPad Safari userscript.
- `current/README.md` — current release pointer.

The canonical source remains in `extension/chrome/`; rebuild instead of hand-editing release artifacts. Chrome ZIPs are stored privately under `releases/` and delivered by `GET /api/downloads/chrome` after server-side license checks. The public iOS update endpoint remains `public/downloads/ig-snapper.user.js` so Userscripts can auto-update. Old customer ZIPs are archived outside `public/`.
