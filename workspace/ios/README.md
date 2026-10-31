# iPhone / iPad workspace

Target: iPhone/iPad Safari with a compatible Userscripts manager.

The userscript is generated from canonical Chrome source in `extension/chrome/` using `tools/build-ios.mjs`. Do not hand-edit `public/downloads/ig-snapper.user.js`.

Build from repository root:

```powershell
npm ci
npm ci --prefix tools
node tools/build-ios.mjs extension/chrome public/downloads/ig-snapper.user.js https://ig-snapper.vercel.app
node --check public/downloads/ig-snapper.user.js
```

Before release, copy the generated userscript into `releases/vX.Y.Z/ios/`, compare its header version with `extension/chrome/manifest.json`, then test installation, update, activation, storage, touch UI, safe-area behavior and long scans on a real iPhone and iPad. Desktop syntax checks are not real-device tests.