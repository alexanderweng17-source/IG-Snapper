/**
 * Business facts the site displays. Everything marked TODO must be confirmed by the owner.
 * Facts about the extension were read from the v2.3.3 customer package
 * (manifest.json, background.js, UI strings).
 */
export const product = {
  name: "IG Snapper",
  version: "2.3.3", // from manifest.json
  packageName: "IG-Snapper-v2.3.3-customer.zip",
  // Chrome ZIP downloads are delivered by an authenticated server route. The public iOS script declares update metadata; users check for updates from the Userscripts Popup.
  downloadUrl: "/api/downloads/chrome",
  /** Default limits from background.js comments: "1 account / 2 browsers, set per key". TODO confirm before selling. */
  defaultActivation: { accounts: 1, browsers: 2 },
  licenseRecheckHours: 6,
  offlineGraceHours: 24,
};

export const support = {
  // TODO: fill in real channels. Empty values render as "coming soon".
  email: "",
  line: "",
  discord: "",
  hours: "",
};
