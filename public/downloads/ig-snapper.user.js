// ==UserScript==
// @name         IG Snapper (iPhone / iPad)
// @namespace    ig-snapper
// @version      2.3.2
// @description  IG Snapper for Safari on iPhone and iPad (Userscripts app)
// @match        https://www.instagram.com/*
// @match        https://instagram.com/*
// @noframes
// @run-at       document-idle
// @inject-into  content
// @connect      hihhomdldouekdymgmzn.supabase.co
// @updateURL    https://ig-snapper.vercel.app/downloads/ig-snapper.user.js
// @downloadURL  https://ig-snapper.vercel.app/downloads/ig-snapper.user.js
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==
(async function () {
  "use strict";
  if (window.__igSnapperIosLoaded) return;
  window.__igSnapperIosLoaded = true;

  /* ===== iOS / Userscripts shim: replaces the Chrome extension APIs ===== */
  const GMX = (typeof GM_xmlhttpRequest === "function") ? GM_xmlhttpRequest
    : (typeof GM !== "undefined" && GM.xmlHttpRequest) ? GM.xmlHttpRequest.bind(GM) : null;
  const KV = "igs:";
  async function kvGet(k) {
    try {
      let raw;
      if (typeof GM !== "undefined" && GM.getValue) raw = await GM.getValue(KV + k);
      else if (typeof GM_getValue === "function") raw = await GM_getValue(KV + k);
      else raw = localStorage.getItem(KV + k);
      return raw == null || raw === "" ? undefined : JSON.parse(raw);
    } catch (e) { return undefined; }
  }
  async function kvSet(k, v) {
    const raw = JSON.stringify(v);
    try {
      if (typeof GM !== "undefined" && GM.setValue) await GM.setValue(KV + k, raw);
      else if (typeof GM_setValue === "function") await GM_setValue(KV + k, raw);
      else localStorage.setItem(KV + k, raw);
    } catch (e) { try { localStorage.setItem(KV + k, raw); } catch (_) {} }
  }
  const area = {
    async get(keys) {
      const list = Array.isArray(keys) ? keys : [keys];
      const out = {};
      for (const k of list) { const v = await kvGet(k); if (v !== undefined) out[k] = v; }
      return out;
    },
    async set(obj) { for (const k of Object.keys(obj)) await kvSet(k, obj[k]); },
  };
  const sessionArea = {
    async get(keys) {
      const list = Array.isArray(keys) ? keys : [keys]; const out = {};
      for (const k of list) { try { const r = sessionStorage.getItem("igs-session:" + k); if (r != null) out[k] = JSON.parse(r); } catch (e) {} }
      return out;
    },
    async set(obj) { for (const k of Object.keys(obj)) { try { sessionStorage.setItem("igs-session:" + k, JSON.stringify(obj[k])); } catch (e) {} } },
  };
  const listeners = [];
  const chrome = {
    storage: { local: area, session: sessionArea },
    runtime: {
      onMessage: { addListener(fn) { listeners.push(fn); } },
      sendMessage(message) {
        return new Promise((resolve) => {
          let handledAsync = false;
          for (const fn of listeners) {
            let r;
            try { r = fn(message, {}, resolve); } catch (e) { r = false; }
            if (r === true) { handledAsync = true; break; }
          }
          if (!handledAsync) resolve(undefined);
        });
      },
    },
  };
  // fetch() replacement used only for the license server (Instagram's CSP blocks direct calls)
  const fetch = (url, opts = {}) => new Promise((resolve, reject) => {
    if (!GMX) { window.fetch(url, { method: opts.method, headers: opts.headers, body: opts.body }).then(resolve, reject); return; }
    GMX({
      url, method: opts.method || "GET", headers: opts.headers || {}, data: opts.body, timeout: 15000,
      onload: (r) => resolve({ ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => JSON.parse(r.responseText) }),
      onerror: () => reject(new Error("network")),
      ontimeout: () => reject(new Error("timeout")),
    });
  });

  /* ===== license config + storage/license logic ===== */
  (function () {
// Your license server (Supabase edge function "verify-license").
window.IG_SNAPPER_LICENSE_ENDPOINT = "https://hihhomdldouekdymgmzn.supabase.co/functions/v1/verify-license";

// Where customers buy / ask for a key (your Discord invite or shop link).
// Leave empty to hide the "Get a key" button. Must start with https://
window.IG_SNAPPER_BUY_URL = "";



chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message?.mifStorage) return false;

  (async () => {
    if (message.action === "get") {
      const [localState, sessionState] = await Promise.all([
        chrome.storage.local.get(["locale", "whitelist", "whitelists", "snapshots", "settings"]),
        chrome.storage.session.get("rateLimits"),
      ]);
      const accountId = String(message.payload?.accountId || "default");
      const accountWhitelist = localState.whitelists?.[accountId];
      const accountSnapshots = Array.isArray(localState.snapshots)
        ? localState.snapshots.filter((snapshot) => !snapshot?.viewerId || String(snapshot.viewerId) === accountId)
        : [];
      sendResponse({
        locale: localState.locale,
        rateLimits: sessionState.rateLimits,
        whitelist: Array.isArray(accountWhitelist) ? accountWhitelist : (localState.whitelist || []),
        snapshots: accountSnapshots,
        settings: localState.settings || {},
      });
      return;
    }

    if (message.action === "setLocale" && ["en", "th"].includes(message.payload)) {
      await chrome.storage.local.set({ locale: message.payload });
      sendResponse({ ok: true });
      return;
    }

    if (message.action === "setRateLimits") {
      const sanitized = {
        follow: Array.isArray(message.payload?.follow)
          ? message.payload.follow.filter(Number.isFinite)
          : [],
      };
      await chrome.storage.session.set({ rateLimits: sanitized });
      sendResponse({ ok: true });
    }
  })().catch((error) => sendResponse({ error: error.message }));

  return true;
});

/* ───────────── License ─────────────
 * The server (Supabase edge function -> database function claim_license) is the
 * only authority. One key can be used on a limited number of Instagram accounts
 * and browsers (set per key, default 1 account / 2 browsers).
 * The extension sends: the key, a random browser id and a one-way hash of the
 * Instagram account id. It only caches the answer and re-checks it periodically. */
const LICENSE_RECHECK_MS = 6 * 60 * 60 * 1000;
const LICENSE_OFFLINE_GRACE_MS = 24 * 60 * 60 * 1000;

function licenseResult(result) {
  const buyUrl = String(window.IG_SNAPPER_BUY_URL || "");
  return { ...result, buyUrl: /^https:\/\//.test(buyUrl) ? buyUrl : "" };
}

async function getDeviceId() {
  const { deviceId } = await chrome.storage.local.get("deviceId");
  if (/^[A-Za-z0-9-]{16,64}$/.test(deviceId || "")) return deviceId;
  const fresh = crypto.randomUUID();
  await chrome.storage.local.set({ deviceId: fresh });
  return fresh;
}

async function hashAccount(accountId) {
  const id = String(accountId || "");
  if (!/^\d{3,20}$/.test(id)) return "";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`ig-snapper:${id}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function askLicenseServer(key, accountHash) {
  const endpoint = window.IG_SNAPPER_LICENSE_ENDPOINT || "";
  if (!endpoint || endpoint.includes("YOUR-PROJECT-REF")) {
    return { ok: false, reason: "not_configured" };
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, deviceId: await getDeviceId(), accountHash }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json().catch(() => null);
    if (!data || typeof data.valid !== "boolean") return { ok: false, reason: "server_error" };
    return { ok: true, valid: data.valid, reason: data.reason || "ok", expiresAt: data.expiresAt || null };
  } catch {
    return { ok: false, reason: "offline" };
  }
}

async function licenseStatus(accountId = "", force = false) {
  const { license } = await chrome.storage.local.get("license");
  if (!license?.key) return licenseResult({ active: false, reason: "no_key" });
  const accountHash = await hashAccount(accountId);
  const age = Date.now() - Number(license.checkedAt || 0);
  // A different Instagram account than the one last checked must be verified by the server.
  const sameAccount = !accountHash || accountHash === license.accountHash;
  if (license.valid && !force && sameAccount && age < LICENSE_RECHECK_MS) {
    return licenseResult({ active: true, reason: "ok", expiresAt: license.expiresAt || null });
  }
  const answer = await askLicenseServer(license.key, accountHash || license.accountHash || "");
  if (answer.ok) {
    await chrome.storage.local.set({
      license: {
        ...license,
        valid: answer.valid,
        checkedAt: Date.now(),
        expiresAt: answer.expiresAt,
        accountHash: answer.valid ? (accountHash || license.accountHash || "") : license.accountHash,
      },
    });
    return licenseResult({ active: answer.valid, reason: answer.reason, expiresAt: answer.expiresAt });
  }
  // Server unreachable: keep working for a limited grace period only.
  if (license.valid && sameAccount && answer.reason === "offline" && age < LICENSE_OFFLINE_GRACE_MS) {
    return licenseResult({ active: true, reason: "ok_offline", expiresAt: license.expiresAt || null });
  }
  return licenseResult({ active: false, reason: answer.reason });
}

async function activateLicense(rawKey, accountId = "") {
  const key = String(rawKey || "").trim().toUpperCase().replace(/\s+/g, "");
  if (key.length < 12) return licenseResult({ active: false, reason: "not_found" });
  const accountHash = await hashAccount(accountId);
  const answer = await askLicenseServer(key, accountHash);
  if (!answer.ok) return licenseResult({ active: false, reason: answer.reason });
  if (answer.valid) {
    await chrome.storage.local.set({
      license: { key, valid: true, checkedAt: Date.now(), expiresAt: answer.expiresAt, accountHash },
    });
  }
  return licenseResult({ active: answer.valid, reason: answer.reason, expiresAt: answer.expiresAt });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message?.mifLicense) return false;
  const accountId = String(message.accountId || "").slice(0, 24);
  const work = message.op === "activate"
    ? activateLicense(message.key, accountId)
    : licenseStatus(accountId, false);
  work.then(sendResponse).catch(() => sendResponse(licenseResult({ active: false, reason: "server_error" })));
  return true;
});


  }).call(window);

  /* ===== first run + one-tap license link ===== */
  const igsCookie = (n) => { const m = document.cookie.match(new RegExp("(?:^|;\\s*)" + n + "=([^;]+)")); return m ? decodeURIComponent(m[1]) : ""; };
  let openNow = !(await kvGet("seen"));
  const linkMatch = location.hash.match(/(?:^#|&)igs-key=([A-Za-z0-9-]{12,64})/);
  if (linkMatch) {
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    await kvSet("pendingKey", linkMatch[1]);
  }
  const pendingKey = await kvGet("pendingKey");
  const viewerId = igsCookie("ds_user_id");
  if (pendingKey && viewerId) {
    const res = await chrome.runtime.sendMessage({ mifLicense: true, op: "activate", key: pendingKey, accountId: viewerId });
    if (!["offline", "server_error", "not_configured"].includes(res && res.reason)) await kvSet("pendingKey", "");
    openNow = true;
  }
  await kvSet("seen", true);
  window.__IGS_START_MINIMIZED = !openNow;

  const __css = document.createElement("style");
  __css.id = "igs-style";
  __css.textContent = "@property --mif-angle {\n  syntax: \"<angle>\";\n  inherits: false;\n  initial-value: 0deg;\n}\n\n@property --mif-num {\n  syntax: \"<integer>\";\n  inherits: false;\n  initial-value: 0;\n}\n\n#manage-instagram-followers-root {\n  --color-backdrop: lab(.161648% .436768 -1.24121 / .78);\n  --color-paper: lab(1.87255% 1.2136 -4.91494);\n  --color-paper-2: lab(4.21891% 2.46111 -9.16974);\n  --color-paper-3: lab(7.9557% 4.63581 -12.6296);\n  --color-paper-4: lab(14.8042% 6.17179 -15.6568);\n  --color-glass: lab(8.04467% 3.49055 -10.6245 / .55);\n  --color-glass-strong: lab(3.52215% 1.94205 -7.74898 / .78);\n  --color-rule-soft: lab(100% 0 0 / .07);\n  --color-rule: lab(100% 0 0 / .13);\n  --color-neutral: lab(76.6245% 1.94556 -7.26023);\n  --color-muted: lab(67.2966% 2.49037 -9.04255);\n  --color-ink: lab(96.452% .74625 -2.92361);\n  --color-accent: lab(64.9662% 34.9358 -58.4729);\n  --color-accent-soft: lab(15.0778% 18.7468 -29.069 / .55);\n  --color-accent-ink: lab(2.30495% 2.34277 -6.26451);\n  --color-focus: lab(84.5355% -30.9229 -25.5143);\n  --color-cyan: lab(83.585% -36.0629 -24.1434);\n  --color-magenta: lab(61.8855% 70.407 -28.4149);\n  --color-orange: lab(73.3985% 42.5187 50.063);\n  --color-success: lab(76.6826% -54.3513 28.0449);\n  --color-success-ink: lab(85.4696% -41.0309 21.1023);\n  --color-warning: lab(76.8315% 15.651 68.1009);\n  --color-warning-ink: lab(86.3214% 6.60247 45.7811);\n  --color-danger: lab(60.8138% 63.7243 32.9224);\n  --color-danger-soft: lab(13.2199% 28.7422 14.4469 / .6);\n  --color-danger-ink: lab(80.2411% 37.912 18.3049);\n  --color-shadow: lab(.0153446% .123382 -.317791 / .7);\n  --grad-brand: linear-gradient(120deg, #8f7bff 0%, #e45bd6 55%, #ff8a5c 100%);\n  --grad-cool: linear-gradient(120deg, #4fe3ff 0%, #8f7bff 100%);\n  --font-display: \"Segoe UI Variable Display\", \"SF Pro Display\", \"Inter\", \"Noto Sans Thai\", \"Leelawadee UI\", \"Sukhumvit Set\", \"Thonburi\", ui-sans-serif, system-ui, sans-serif;\n  --font-body: \"Segoe UI Variable Text\", \"SF Pro Text\", \"Inter\", \"Noto Sans Thai\", \"Leelawadee UI\", \"Sukhumvit Set\", \"Thonburi\", ui-sans-serif, system-ui, sans-serif;\n  --font-mono: \"JetBrains Mono\", \"SF Mono\", ui-monospace, \"Cascadia Code\", Consolas, monospace;\n  --text-xs: .75rem;\n  --text-sm: .875rem;\n  --text-base: 1rem;\n  --text-md: 1.25rem;\n  --text-lg: 1.65rem;\n  --text-xl: clamp(1.7rem, 4.6vw, 2.35rem);\n  --space-3xs: .125rem;\n  --space-2xs: .25rem;\n  --space-xs: .5rem;\n  --space-sm: .75rem;\n  --space-md: 1rem;\n  --space-lg: 1.5rem;\n  --space-xl: 2.5rem;\n  --space-2xl: 4rem;\n  --ease-out: cubic-bezier(.16, 1, .3, 1);\n  --ease-in: cubic-bezier(.7, 0, .84, 0);\n  --ease-in-out: cubic-bezier(.65, 0, .35, 1);\n  --ease-spring: cubic-bezier(.34, 1.56, .64, 1);\n  --dur-micro: .14s;\n  --dur-short: .24s;\n  --dur-long: .52s;\n  --dur-reduced: 1ms;\n  --rule-thin: 1px;\n  --rule-focus: 2px;\n  --rule-focus-offset: 2px;\n  --radius-sm: .6rem;\n  --radius-md: .85rem;\n  --radius-lg: 1.15rem;\n  --radius-xl: 1.75rem;\n  --radius-full: 999rem;\n  --control-size: 2.75rem;\n  --button-height: 3rem;\n  --button-height-touch: 3rem;\n  --z-base: 1;\n  --z-raised: 10;\n  --z-dropdown: 100;\n  --z-sticky: 200;\n  --z-modal: 400;\n  --z-toast: 500;\n  --z-tooltip: 600;\n}\n\n#manage-instagram-followers-root, #manage-instagram-followers-root *, #manage-instagram-followers-root :before, #manage-instagram-followers-root :after {\n  box-sizing: border-box;\n}\n\n#manage-instagram-followers-root {\n  z-index: var(--z-modal);\n  font-family: var(--font-body);\n  font-size: var(--text-base);\n  color: var(--color-ink);\n  text-align: left;\n  -webkit-font-smoothing: antialiased;\n  line-height: 1.5;\n  position: fixed;\n  inset: 0;\n  overflow-x: clip;\n}\n\n#manage-instagram-followers-root [hidden] {\n  display: none !important;\n}\n\n#manage-instagram-followers-root h1, #manage-instagram-followers-root h2, #manage-instagram-followers-root h3, #manage-instagram-followers-root p, #manage-instagram-followers-root ol, #manage-instagram-followers-root ul {\n  margin: 0;\n  padding: 0;\n}\n\n#manage-instagram-followers-root ol, #manage-instagram-followers-root ul {\n  list-style: none;\n}\n\n#manage-instagram-followers-root button, #manage-instagram-followers-root input, #manage-instagram-followers-root select, #manage-instagram-followers-root summary {\n  font: inherit;\n  color: inherit;\n}\n\n#manage-instagram-followers-root button, #manage-instagram-followers-root summary, #manage-instagram-followers-root a {\n  -webkit-tap-highlight-color: transparent;\n}\n\n#manage-instagram-followers-root button {\n  cursor: pointer;\n}\n\n#manage-instagram-followers-root button:disabled {\n  cursor: not-allowed;\n}\n\n#manage-instagram-followers-root a {\n  color: inherit;\n  text-decoration: none;\n}\n\n#manage-instagram-followers-root .sprite {\n  width: 0;\n  height: 0;\n  position: absolute;\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root .icon {\n  flex: none;\n  display: block;\n}\n\n#manage-instagram-followers-root :focus-visible {\n  outline: var(--rule-focus) solid var(--color-focus);\n  outline-offset: var(--rule-focus-offset);\n}\n\n#manage-instagram-followers-root .overlay {\n  padding: var(--space-md);\n  background: radial-gradient(120% 90% at 50% 0%, lab(6.21937% 14.332 -22.3152 / .55), transparent 60%),\r\n      var(--color-backdrop);\n  -webkit-backdrop-filter: blur(14px) saturate(140%);\n  animation: mif-fade var(--dur-long) var(--ease-out) both;\n  grid-template-columns: minmax(0, 1fr);\n  place-items: center;\n  display: grid;\n  position: fixed;\n  inset: 0;\n  overflow: auto;\n}\n\n#manage-instagram-followers-root .aurora {\n  pointer-events: none;\n  position: fixed;\n  inset: 0;\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root .aurora i {\n  filter: blur(90px);\n  opacity: .5;\n  will-change: transform;\n  border-radius: 50%;\n  width: 46vmax;\n  height: 46vmax;\n  position: absolute;\n}\n\n#manage-instagram-followers-root .aurora i:first-child {\n  background: #7c5cff;\n  animation: 22s ease-in-out infinite alternate mif-drift-a;\n  top: -18vmax;\n  left: -12vmax;\n}\n\n#manage-instagram-followers-root .aurora i:nth-child(2) {\n  opacity: .38;\n  background: #e45bd6;\n  animation: 26s ease-in-out infinite alternate mif-drift-b;\n  bottom: -20vmax;\n  right: -16vmax;\n}\n\n#manage-instagram-followers-root .aurora i:nth-child(3) {\n  opacity: .22;\n  background: #19c6ee;\n  width: 30vmax;\n  height: 30vmax;\n  animation: 30s ease-in-out infinite alternate mif-drift-c;\n  top: 30%;\n  left: 55%;\n}\n\n#manage-instagram-followers-root .my-component {\n  isolation: isolate;\n  border-radius: var(--radius-xl);\n  width: min(100%, 46rem);\n  min-width: 0;\n  max-height: min(92dvh, 58rem);\n  color: var(--color-ink);\n  box-shadow: 0 0 0 1px var(--color-rule-soft),\r\n      0 2rem 5rem var(--color-shadow),\r\n      0 0 7rem lab(44.4689% 46.1815 -61.6621 / .22);\n  -webkit-backdrop-filter: blur(28px) saturate(150%);\n  animation: mif-panel-in .8s var(--ease-out) both;\n  --mx: 50%;\n  --my: 0%;\n  background: linear-gradient(lab(100% 0 0 / .045), #0000 18%), lab(1.65766% 1.19244 -4.56553 / .9);\n  flex-direction: column;\n  display: flex;\n  position: relative;\n  overflow: clip;\n}\n\n#manage-instagram-followers-root .my-component:before {\n  content: \"\";\n  border-radius: inherit;\n  background: conic-gradient(from var(--mif-angle), transparent 0 55%, #8f7bff 70%, #e45bd6 82%, #ff8a5c 92%, #4fe3ff 97%, transparent 100%);\n  -webkit-mask-composite: xor;\n  pointer-events: none;\n  z-index: 5;\n  padding: 1px;\n  animation: 7s linear infinite mif-spin;\n  position: absolute;\n  inset: 0;\n  -webkit-mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);\n  mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);\n  -webkit-mask-position: 0 0, 0 0;\n  mask-position: 0 0, 0 0;\n  -webkit-mask-size: auto, auto;\n  mask-size: auto, auto;\n  -webkit-mask-repeat: repeat, repeat;\n  mask-repeat: repeat, repeat;\n  -webkit-mask-clip: content-box, border-box;\n  mask-clip: content-box, border-box;\n  -webkit-mask-origin: content-box, border-box;\n  mask-origin: content-box, border-box;\n  -webkit-mask-composite: xor;\n  mask-composite: exclude;\n  -webkit-mask-source-type: auto, auto;\n  mask-mode: match-source, match-source;\n}\n\n#manage-instagram-followers-root .my-component:after {\n  content: \"\";\n  opacity: .05;\n  mix-blend-mode: overlay;\n  pointer-events: none;\n  z-index: 4;\n  background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\");\n  position: absolute;\n  inset: 0;\n}\n\n#manage-instagram-followers-root .panel-spotlight {\n  background: radial-gradient(420px circle at var(--mx) var(--my), lab(62.1579% 43.5784 -61.9524 / .16), transparent 65%);\n  pointer-events: none;\n  z-index: -1;\n  position: absolute;\n  inset: 0;\n}\n\n#manage-instagram-followers-root .preloader {\n  z-index: 50;\n  justify-content: center;\n  align-items: center;\n  gap: var(--space-md);\n  animation: mif-pre-out .7s 1.9s var(--ease-in-out) forwards;\n  pointer-events: auto;\n  background: radial-gradient(60% 50% at 50% 38%, lab(16.7291% 26.9128 -38.6426 / .55), #0000 70%), lab(.832087% .835605 -2.9336);\n  flex-direction: column;\n  display: flex;\n  position: absolute;\n  inset: 0;\n}\n\n#manage-instagram-followers-root .preloader .pre-grid {\n  opacity: .5;\n  background-image: linear-gradient(var(--color-rule-soft) 1px, transparent 1px),\r\n        linear-gradient(90deg, var(--color-rule-soft) 1px, transparent 1px);\n  background-size: 38px 38px;\n  animation: 4s linear infinite mif-grid-pan;\n  position: absolute;\n  inset: 0;\n  -webkit-mask: radial-gradient(circle at 50% 42%, #000, #0000 70%);\n  mask: radial-gradient(circle at 50% 42%, #000, #0000 70%);\n}\n\n#manage-instagram-followers-root .preloader .pre-core {\n  animation: mif-pop .9s .1s var(--ease-spring) both;\n  place-items: center;\n  display: grid;\n  position: relative;\n}\n\n#manage-instagram-followers-root .preloader .pre-core:before {\n  content: \"\";\n  background: var(--grad-brand);\n  filter: blur(38px);\n  opacity: .45;\n  border-radius: 50%;\n  width: 9rem;\n  height: 9rem;\n  animation: 2.2s ease-in-out infinite mif-breathe;\n  position: absolute;\n}\n\n#manage-instagram-followers-root .preloader .pre-logo {\n  position: relative;\n  overflow: visible;\n}\n\n#manage-instagram-followers-root .preloader .pre-ring, #manage-instagram-followers-root .preloader .pre-node, #manage-instagram-followers-root .preloader .pre-link {\n  stroke-dasharray: 100;\n  stroke-dashoffset: 100px;\n  animation: mif-draw 1.1s var(--ease-out) forwards;\n}\n\n#manage-instagram-followers-root .preloader .pre-ring-b {\n  animation-delay: .25s;\n}\n\n#manage-instagram-followers-root .preloader .pre-node-a {\n  animation-delay: .45s;\n}\n\n#manage-instagram-followers-root .preloader .pre-node-b {\n  animation-delay: .6s;\n}\n\n#manage-instagram-followers-root .preloader .pre-link {\n  animation-delay: .8s;\n}\n\n#manage-instagram-followers-root .preloader .pre-orbit {\n  transform-origin: 60px 60px;\n  animation: 2.6s linear infinite mif-spin-rot;\n}\n\n#manage-instagram-followers-root .preloader .pre-orbit-rev {\n  animation-duration: 3.8s;\n  animation-direction: reverse;\n}\n\n#manage-instagram-followers-root .preloader .pre-title {\n  text-align: center;\n  animation: mif-rise .8s .5s var(--ease-out) both;\n  flex-direction: column;\n  align-items: center;\n  gap: .15rem;\n  display: flex;\n  position: relative;\n}\n\n#manage-instagram-followers-root .preloader .pre-title span {\n  font-size: var(--text-xs);\n  letter-spacing: .5em;\n  text-indent: .5em;\n  text-transform: uppercase;\n  color: var(--color-muted);\n  font-weight: 600;\n}\n\n#manage-instagram-followers-root .preloader .pre-title b {\n  font-family: var(--font-display);\n  font-size: var(--text-lg);\n  letter-spacing: -.02em;\n  background: var(--grad-brand);\n  color: #0000;\n  background-clip: text;\n  font-weight: 750;\n}\n\n#manage-instagram-followers-root .preloader .pre-progress {\n  border-radius: var(--radius-full);\n  background: var(--color-rule-soft);\n  width: min(15rem, 62%);\n  height: .3rem;\n  animation: mif-rise .6s .7s var(--ease-out) both;\n  position: relative;\n}\n\n#manage-instagram-followers-root .preloader .pre-progress i {\n  border-radius: inherit;\n  background: var(--grad-brand);\n  transform-origin: 0;\n  animation: mif-fill 1.5s .35s var(--ease-in-out) forwards;\n  position: absolute;\n  inset: 0;\n  transform: scaleX(0);\n  box-shadow: 0 0 1.2rem #e45bd6aa;\n}\n\n#manage-instagram-followers-root .preloader .pre-progress .pre-pct {\n  font-family: var(--font-mono);\n  font-size: var(--text-xs);\n  color: var(--color-muted);\n  counter-reset: mif-n var(--mif-num);\n  animation: 1.5s linear .35s forwards mif-count;\n  position: absolute;\n  top: .8rem;\n  right: 0;\n}\n\n#manage-instagram-followers-root .preloader .pre-progress .pre-pct:after {\n  content: counter(mif-n) \"%\";\n}\n\n#manage-instagram-followers-root .preloader .pre-credit {\n  font-size: var(--text-sm);\n  animation: mif-rise .8s .9s var(--ease-out) both;\n  align-items: baseline;\n  gap: .45rem;\n  display: flex;\n  position: absolute;\n  bottom: 1.4rem;\n}\n\n#manage-instagram-followers-root .preloader .pre-credit span {\n  color: var(--color-muted);\n  letter-spacing: .04em;\n}\n\n#manage-instagram-followers-root .preloader .pre-credit strong {\n  letter-spacing: .02em;\n  background: linear-gradient(100deg, #fff 20%, #c9b8ff 40%, #ff9fd9 55%, #fff 75%) 0 0 / 250% 100%;\n  color: #0000;\n  background-clip: text;\n  font-weight: 750;\n  animation: 2.4s linear infinite mif-shimmer;\n}\n\n#manage-instagram-followers-root .app-header {\n  justify-content: space-between;\n  align-items: center;\n  gap: var(--space-sm);\n  padding: var(--space-md) var(--space-lg);\n  border-bottom: 1px solid var(--color-rule-soft);\n  animation: mif-rise .7s 1.7s var(--ease-out) both;\n  display: flex;\n}\n\n#manage-instagram-followers-root .brand-block {\n  align-items: center;\n  gap: var(--space-sm);\n  min-width: 0;\n  display: flex;\n}\n\n#manage-instagram-followers-root .brand-mark {\n  border-radius: var(--radius-md);\n  width: 3rem;\n  height: 3rem;\n  box-shadow: inset 0 0 0 1px var(--color-rule), 0 0 1.6rem lab(50.3633% 50.4151 -54.7711 / .35);\n  background: linear-gradient(145deg, lab(13.1414% 13.852 -22.6972 / .9), lab(4.90115% 4.52057 -12.9749 / .9));\n  flex: none;\n  place-items: center;\n  display: grid;\n  position: relative;\n}\n\n#manage-instagram-followers-root .brand-mark .bm-ring {\n  transform-origin: 16px 16px;\n  animation: 14s linear infinite mif-spin-rot;\n}\n\n#manage-instagram-followers-root .brand-copy {\n  min-width: 0;\n}\n\n#manage-instagram-followers-root #appTitle {\n  overflow-wrap: anywhere;\n  min-width: 0;\n  font-family: var(--font-display);\n  font-size: var(--text-md);\n  letter-spacing: -.02em;\n  background: linear-gradient(100deg, #fff 30%, #d7cbff);\n  color: #0000;\n  background-clip: text;\n  font-weight: 750;\n  line-height: 1.15;\n}\n\n#manage-instagram-followers-root .app-kicker {\n  font-size: var(--text-xs);\n  letter-spacing: .14em;\n  text-transform: uppercase;\n  color: var(--color-muted);\n  align-items: center;\n  gap: .45rem;\n  margin-top: .15rem;\n  font-weight: 600;\n  display: flex;\n}\n\n#manage-instagram-followers-root .live-dot {\n  background: var(--color-success);\n  width: .45rem;\n  height: .45rem;\n  box-shadow: 0 0 0 0 var(--color-success);\n  border-radius: 50%;\n  animation: 2s ease-out infinite mif-ping;\n}\n\n#manage-instagram-followers-root .kicker-sep {\n  background: var(--color-rule);\n  width: 1px;\n  height: .7rem;\n}\n\n#manage-instagram-followers-root .kicker-ver {\n  font-family: var(--font-mono);\n  letter-spacing: .04em;\n  text-transform: none;\n}\n\n#manage-instagram-followers-root .header-actions {\n  align-items: center;\n  gap: var(--space-xs);\n  flex: none;\n  display: flex;\n}\n\n#manage-instagram-followers-root .language-switch {\n  border-radius: var(--radius-full);\n  box-shadow: inset 0 0 0 1px var(--color-rule-soft);\n  background: lab(100% 0 0 / .05);\n  grid-template-columns: 1fr 1fr;\n  padding: .2rem;\n  display: grid;\n  position: relative;\n}\n\n#manage-instagram-followers-root .language-switch .lang-thumb {\n  border-radius: var(--radius-full);\n  background: var(--grad-brand);\n  width: calc(50% - .2rem);\n  transition: transform var(--dur-long) var(--ease-spring);\n  position: absolute;\n  top: .2rem;\n  bottom: .2rem;\n  left: .2rem;\n  box-shadow: 0 .2rem 1rem #e45bd666;\n}\n\n#manage-instagram-followers-root .language-switch[data-active=\"en\"] .lang-thumb {\n  transform: translateX(100%);\n}\n\n#manage-instagram-followers-root .language-button {\n  z-index: 1;\n  border-radius: var(--radius-full);\n  min-width: 3rem;\n  height: 2rem;\n  font-size: var(--text-xs);\n  letter-spacing: .08em;\n  color: var(--color-muted);\n  transition: color var(--dur-short);\n  background: none;\n  border: 0;\n  padding: 0 .7rem;\n  font-weight: 750;\n  position: relative;\n}\n\n#manage-instagram-followers-root .language-button[aria-pressed=\"true\"] {\n  color: #fff;\n}\n\n#manage-instagram-followers-root .icon-button, #manage-instagram-followers-root .back-button, #manage-instagram-followers-root .refresh-button {\n  border-radius: var(--radius-full);\n  width: 2.5rem;\n  height: 2.5rem;\n  box-shadow: inset 0 0 0 1px var(--color-rule-soft);\n  color: var(--color-neutral);\n  transition: background var(--dur-short), color var(--dur-short), transform var(--dur-short) var(--ease-spring), box-shadow var(--dur-short);\n  background: lab(100% 0 0 / .05);\n  border: 0;\n  flex: none;\n  place-items: center;\n  display: grid;\n}\n\n:is(#manage-instagram-followers-root .icon-button, #manage-instagram-followers-root .back-button, #manage-instagram-followers-root .refresh-button):hover:not(:disabled) {\n  color: #fff;\n  box-shadow: inset 0 0 0 1px var(--color-rule);\n  background: lab(100% 0 0 / .11);\n}\n\n:is(#manage-instagram-followers-root .icon-button, #manage-instagram-followers-root .back-button, #manage-instagram-followers-root .refresh-button):active:not(:disabled) {\n  transform: scale(.92);\n}\n\n#manage-instagram-followers-root #closeExtensionButton:hover {\n  transform: rotate(90deg);\n}\n\n#manage-instagram-followers-root .refresh-button:hover:not(:disabled) .icon {\n  animation: mif-spin-rot .8s var(--ease-in-out);\n}\n\n#manage-instagram-followers-root .refresh-button:disabled .icon {\n  animation: 1s linear infinite mif-spin-rot;\n}\n\n#manage-instagram-followers-root .back-button:hover:not(:disabled) .icon {\n  transform: translateX(-2px);\n}\n\n#manage-instagram-followers-root .back-button .icon {\n  transition: transform var(--dur-short);\n}\n\n#manage-instagram-followers-root .intro-block {\n  min-height: 0;\n  padding: var(--space-lg);\n  gap: var(--space-lg);\n  scrollbar-width: thin;\n  scrollbar-color: var(--color-paper-4) transparent;\n  flex-direction: column;\n  flex: auto;\n  display: flex;\n  overflow-y: auto;\n}\n\n#manage-instagram-followers-root .hero {\n  align-items: center;\n  gap: var(--space-md);\n  grid-template-columns: 1fr;\n  display: grid;\n}\n\n@media (min-width: 40rem) {\n  #manage-instagram-followers-root .hero {\n    grid-template-columns: minmax(0, 1fr) 12.5rem;\n  }\n}\n\n#manage-instagram-followers-root .hero-copy {\n  align-items: flex-start;\n  gap: var(--space-sm);\n  animation: mif-rise .8s 1.8s var(--ease-out) both;\n  flex-direction: column;\n  display: flex;\n}\n\n#manage-instagram-followers-root .intro-eyebrow {\n  border-radius: var(--radius-full);\n  background: var(--color-accent-soft);\n  font-size: var(--text-xs);\n  letter-spacing: .1em;\n  text-transform: uppercase;\n  color: lab(85.032% 14.9006 -29.9513);\n  align-items: center;\n  gap: .4rem;\n  padding: .3rem .75rem .3rem .6rem;\n  font-weight: 700;\n  display: inline-flex;\n  box-shadow: inset 0 0 0 1px lab(69.0081% 27.6454 -49.0237 / .35);\n}\n\n#manage-instagram-followers-root .intro-eyebrow .icon {\n  animation: 2.4s ease-in-out infinite mif-twinkle;\n}\n\n#manage-instagram-followers-root .intro-block h2 {\n  font-family: var(--font-display);\n  font-size: var(--text-xl);\n  letter-spacing: -.03em;\n  background: linear-gradient(100deg, #fff 10%, #cdbfff 55%, #ff9fd9 100%);\n  color: #0000;\n  text-wrap: balance;\n  background-clip: text;\n  font-weight: 800;\n  line-height: 1.12;\n}\n\n#manage-instagram-followers-root #info-text {\n  max-width: 34rem;\n  color: var(--color-neutral);\n  text-wrap: pretty;\n}\n\n#manage-instagram-followers-root .hero-visual {\n  aspect-ratio: 1;\n  width: min(12.5rem, 38vw);\n  animation: mif-pop 1s 1.9s var(--ease-spring) both;\n  justify-self: center;\n  position: relative;\n}\n\n#manage-instagram-followers-root .hero-visual:before {\n  content: \"\";\n  background: var(--grad-cool);\n  filter: blur(40px);\n  opacity: .28;\n  border-radius: 50%;\n  position: absolute;\n  inset: 12%;\n}\n\n#manage-instagram-followers-root .hero-visual svg {\n  width: 100%;\n  height: 100%;\n  position: relative;\n  overflow: visible;\n}\n\n#manage-instagram-followers-root .hero-visual .rd-ring {\n  stroke: lab(100% 0 0 / .16);\n  stroke-width: 1px;\n}\n\n#manage-instagram-followers-root .hero-visual .rd-axis {\n  stroke: lab(100% 0 0 / .08);\n  stroke-width: 1px;\n}\n\n#manage-instagram-followers-root .hero-visual .rd-sweep {\n  transform-origin: 100px 100px;\n  animation: 4s linear infinite mif-spin-rot;\n}\n\n#manage-instagram-followers-root .hero-visual .rd-dot {\n  fill: #fff;\n  filter: drop-shadow(0 0 6px #ff8a5c);\n  animation: 4s ease-out infinite mif-blip;\n}\n\n#manage-instagram-followers-root .hero-visual .rd-dot-a {\n  animation-delay: .4s;\n}\n\n#manage-instagram-followers-root .hero-visual .rd-dot-b {\n  fill: #e45bd6;\n  animation-delay: 1.9s;\n}\n\n#manage-instagram-followers-root .hero-visual .rd-dot-c {\n  fill: #4fe3ff;\n  animation-delay: 2.8s;\n}\n\n#manage-instagram-followers-root .hero-visual .rd-dot-d {\n  fill: #8f7bff;\n  animation-delay: 3.5s;\n}\n\n#manage-instagram-followers-root .primary-cta {\n  isolation: isolate;\n  min-height: 3.35rem;\n  margin-top: var(--space-xs);\n  border-radius: var(--radius-full);\n  background: var(--grad-brand);\n  color: #fff;\n  transition: transform var(--dur-short) var(--ease-spring), box-shadow var(--dur-short), background-position var(--dur-long);\n  background-size: 160% 100%;\n  border: 0;\n  align-items: center;\n  gap: .7rem;\n  padding: 0 .6rem 0 1.5rem;\n  font-size: 1.02rem;\n  font-weight: 750;\n  display: inline-flex;\n  position: relative;\n  overflow: hidden;\n  box-shadow: 0 .6rem 2rem #c452e066, inset 0 1px #fff5;\n}\n\n#manage-instagram-followers-root .primary-cta .cta-arrow {\n  width: 2.3rem;\n  height: 2.3rem;\n  transition: transform var(--dur-short) var(--ease-spring);\n  background: lab(0% 0 0 / .22);\n  border-radius: 50%;\n  place-items: center;\n  display: grid;\n}\n\n#manage-instagram-followers-root .primary-cta .cta-shine {\n  z-index: -1;\n  background: radial-gradient(120px circle at var(--mx, 50%) var(--my, 50%), #fff5, transparent 70%);\n  opacity: 0;\n  transition: opacity var(--dur-short);\n  position: absolute;\n  inset: 0;\n}\n\n#manage-instagram-followers-root .primary-cta:after {\n  content: \"\";\n  z-index: -1;\n  background: linear-gradient(100deg, #0000, #fff6, #0000);\n  width: 40%;\n  animation: 3.4s ease-in-out 2.4s infinite mif-sweep;\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  left: -60%;\n  transform: skewX(-20deg);\n}\n\n#manage-instagram-followers-root .primary-cta:hover:not(:disabled) {\n  background-position: 100% 0;\n  transform: translateY(-2px) scale(1.02);\n  box-shadow: 0 .9rem 2.6rem #c452e099, inset 0 1px #fff6;\n}\n\n#manage-instagram-followers-root .primary-cta:hover:not(:disabled) .cta-shine {\n  opacity: 1;\n}\n\n#manage-instagram-followers-root .primary-cta:hover:not(:disabled) .cta-arrow {\n  transform: translateX(3px);\n}\n\n#manage-instagram-followers-root .primary-cta:active:not(:disabled) {\n  transform: scale(.97);\n}\n\n#manage-instagram-followers-root .primary-cta:disabled {\n  opacity: .55;\n  filter: saturate(.6);\n}\n\n#manage-instagram-followers-root .intro-steps {\n  gap: var(--space-sm);\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  display: grid;\n}\n\n#manage-instagram-followers-root .intro-steps li {\n  gap: var(--space-sm);\n  padding: var(--space-md);\n  border-radius: var(--radius-lg);\n  background: var(--color-glass);\n  box-shadow: inset 0 0 0 1px var(--color-rule-soft);\n  animation: mif-rise .7s var(--ease-out) both;\n  transition: transform var(--dur-short) var(--ease-out), box-shadow var(--dur-short);\n  flex-direction: column;\n  display: flex;\n  position: relative;\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root .intro-steps li:first-child {\n  animation-delay: 2s;\n}\n\n#manage-instagram-followers-root .intro-steps li:nth-child(2) {\n  animation-delay: 2.1s;\n}\n\n#manage-instagram-followers-root .intro-steps li:nth-child(3) {\n  animation-delay: 2.2s;\n}\n\n#manage-instagram-followers-root .intro-steps li:before {\n  content: \"\";\n  background: radial-gradient(180px circle at var(--mx, 50%) var(--my, 0%), lab(62.1579% 43.5784 -61.9524 / .2), transparent 70%);\n  opacity: 0;\n  transition: opacity var(--dur-short);\n  position: absolute;\n  inset: 0;\n}\n\n#manage-instagram-followers-root .intro-steps li:hover {\n  transform: translateY(-3px);\n  box-shadow: inset 0 0 0 1px lab(68.9354% 30.5885 -46.8988 / .4);\n}\n\n#manage-instagram-followers-root .intro-steps li:hover:before {\n  opacity: 1;\n}\n\n#manage-instagram-followers-root .intro-steps .step-num {\n  font-family: var(--font-mono);\n  font-size: var(--text-xs);\n  color: var(--color-muted);\n  opacity: .7;\n  position: absolute;\n  top: .7rem;\n  right: .85rem;\n}\n\n#manage-instagram-followers-root .intro-steps .step-icon {\n  border-radius: var(--radius-md);\n  background: var(--color-accent-soft);\n  color: lab(81.0583% 23.3431 -37.8781);\n  place-items: center;\n  width: 2.5rem;\n  height: 2.5rem;\n  display: grid;\n  box-shadow: inset 0 0 0 1px lab(69.0081% 27.6454 -49.0237 / .3);\n}\n\n#manage-instagram-followers-root .intro-steps li:nth-child(2) .step-icon {\n  color: lab(80.9275% 37.5199 -15.0317);\n  background: lab(17.5098% 27.6275 -11.1386 / .5);\n  box-shadow: inset 0 0 0 1px lab(68.595% 52.5964 -21.1466 / .3);\n}\n\n#manage-instagram-followers-root .intro-steps li:nth-child(3) .step-icon {\n  color: lab(85.5598% 26.2249 41.102);\n  background: lab(20.5306% 23.2731 32.061 / .5);\n  box-shadow: inset 0 0 0 1px lab(73.61% 37.0682 50.7307 / .3);\n}\n\n#manage-instagram-followers-root .intro-steps strong {\n  font-weight: 700;\n  display: block;\n}\n\n#manage-instagram-followers-root .intro-steps small {\n  font-size: var(--text-xs);\n  color: var(--color-muted);\n  margin-top: .1rem;\n  line-height: 1.4;\n  display: block;\n}\n\n@media (max-width: 36rem) {\n  #manage-instagram-followers-root .intro-steps {\n    grid-template-columns: 1fr;\n  }\n\n  #manage-instagram-followers-root .intro-steps li {\n    flex-direction: row;\n    align-items: center;\n  }\n}\n\n#manage-instagram-followers-root .privacy-note {\n  font-size: var(--text-sm);\n  color: var(--color-muted);\n  justify-content: center;\n  align-items: center;\n  gap: .5rem;\n  display: flex;\n}\n\n#manage-instagram-followers-root .privacy-note .icon {\n  color: var(--color-success);\n}\n\n#manage-instagram-followers-root .list-tabs {\n  margin: var(--space-md) var(--space-lg) 0;\n  border-radius: var(--radius-full);\n  box-shadow: inset 0 0 0 1px var(--color-rule-soft);\n  background: lab(100% 0 0 / .04);\n  grid-template-columns: 1fr 1fr;\n  padding: .25rem;\n  display: grid;\n  position: relative;\n}\n\n#manage-instagram-followers-root .list-tabs:before {\n  content: \"\";\n  border-radius: var(--radius-full);\n  width: calc(50% - .25rem);\n  transition: transform var(--dur-long) var(--ease-spring);\n  background: linear-gradient(120deg, lab(23.8612% 25.2833 -38.7329 / .85), lab(18.8994% 40.858 -25.0748 / .85));\n  position: absolute;\n  top: .25rem;\n  bottom: .25rem;\n  left: .25rem;\n  box-shadow: inset 0 0 0 1px lab(74.8275% 33.122 -38.965 / .35), 0 0 1.5rem lab(49.9323% 56.2057 -60.1378 / .35);\n}\n\n#manage-instagram-followers-root .list-tabs:has(#loadFollowersButton.is-active):before {\n  transform: translateX(100%);\n}\n\n#manage-instagram-followers-root .list-tab {\n  z-index: 1;\n  border-radius: var(--radius-full);\n  min-height: 2.6rem;\n  color: var(--color-muted);\n  transition: color var(--dur-short);\n  background: none;\n  border: 0;\n  justify-content: center;\n  align-items: center;\n  gap: .5rem;\n  font-weight: 650;\n  display: flex;\n  position: relative;\n}\n\n#manage-instagram-followers-root .list-tab:hover:not(:disabled), #manage-instagram-followers-root .list-tab.is-active {\n  color: #fff;\n}\n\n#manage-instagram-followers-root .list-tab.is-active .icon {\n  animation: mif-pop .5s var(--ease-spring);\n}\n\n#manage-instagram-followers-root .notice {\n  margin: var(--space-sm) var(--space-lg) 0;\n  border-radius: var(--radius-md);\n  font-size: var(--text-sm);\n  animation: mif-notice .55s var(--ease-spring) both;\n  background: lab(18.4793% -2.52908 -23.5736 / .5);\n  align-items: center;\n  gap: .65rem;\n  padding: .7rem .75rem .7rem .9rem;\n  display: flex;\n  box-shadow: inset 0 0 0 1px lab(71.2821% -21.3549 -33.5852 / .35);\n}\n\n#manage-instagram-followers-root .notice #noticeText {\n  overflow-wrap: anywhere;\n  flex: 1;\n  min-width: 0;\n}\n\n#manage-instagram-followers-root .notice .notice-icon {\n  color: var(--color-cyan);\n  display: grid;\n}\n\n#manage-instagram-followers-root .notice .ni {\n  display: none;\n}\n\n#manage-instagram-followers-root .notice .ni-info {\n  display: block;\n}\n\n#manage-instagram-followers-root .notice[data-tone] .ni-info {\n  display: none;\n}\n\n#manage-instagram-followers-root .notice[data-tone=\"warning\"] .ni-warning, #manage-instagram-followers-root .notice[data-tone=\"error\"] .ni-error, #manage-instagram-followers-root .notice[data-tone=\"success\"] .ni-success {\n  display: block;\n}\n\n#manage-instagram-followers-root .notice[data-tone=\"warning\"] {\n  background: lab(21.1053% 7.79338 31.5372 / .5);\n  box-shadow: inset 0 0 0 1px lab(76.8535% 14.2021 61.9688 / .4);\n}\n\n#manage-instagram-followers-root .notice[data-tone=\"warning\"] .notice-icon {\n  color: var(--color-warning-ink);\n}\n\n#manage-instagram-followers-root .notice[data-tone=\"error\"] {\n  background: var(--color-danger-soft);\n  box-shadow: inset 0 0 0 1px lab(63.1376% 63.6988 32.7469 / .45);\n}\n\n#manage-instagram-followers-root .notice[data-tone=\"error\"] .notice-icon {\n  color: var(--color-danger-ink);\n}\n\n#manage-instagram-followers-root .notice[data-tone=\"success\"] {\n  background: lab(19.7039% -22.4526 11.596 / .5);\n  box-shadow: inset 0 0 0 1px lab(76.5589% -51.0203 26.3074 / .4);\n}\n\n#manage-instagram-followers-root .notice[data-tone=\"success\"] .notice-icon {\n  color: var(--color-success-ink);\n}\n\n#manage-instagram-followers-root .notice-dismiss {\n  width: 1.8rem;\n  height: 1.8rem;\n  color: inherit;\n  opacity: .7;\n  background: none;\n  border: 0;\n  border-radius: 50%;\n  place-items: center;\n  display: grid;\n}\n\n#manage-instagram-followers-root .notice-dismiss:hover {\n  opacity: 1;\n  background: lab(100% 0 0 / .1);\n}\n\n#manage-instagram-followers-root .workspace {\n  min-height: 0;\n  padding: 0 var(--space-lg) var(--space-md);\n  gap: var(--space-sm);\n  scrollbar-width: thin;\n  scrollbar-color: oklch(45% .06 290) transparent;\n  animation: mif-fade .5s var(--ease-out) both;\n  flex-direction: column;\n  flex: auto;\n  display: flex;\n  overflow-y: auto;\n}\n\n#manage-instagram-followers-root .workspace::-webkit-scrollbar {\n  width: 8px;\n}\n\n#manage-instagram-followers-root .workspace::-webkit-scrollbar-thumb {\n  background: lab(29.8344% 7.32318 -17.1537);\n  border-radius: 8px;\n}\n\n#manage-instagram-followers-root .list-heading {\n  z-index: 20;\n  gap: var(--space-sm);\n  margin: 0 calc(var(--space-lg) * -1);\n  padding: var(--space-md) var(--space-lg) var(--space-sm);\n  -webkit-backdrop-filter: blur(10px);\n  background: linear-gradient(lab(1.65766% 1.19244 -4.56553 / .96) 70%, lab(1.65766% 1.19244 -4.56553 / 0));\n  flex-direction: column;\n  display: flex;\n  position: sticky;\n  top: 0;\n}\n\n@media (max-height: 40rem) {\n  #manage-instagram-followers-root .list-heading {\n    position: static;\n  }\n}\n\n#manage-instagram-followers-root .title-copy {\n  align-items: center;\n  gap: var(--space-sm);\n  display: flex;\n}\n\n#manage-instagram-followers-root .title-copy .title-text {\n  flex: 1;\n  min-width: 0;\n}\n\n#manage-instagram-followers-root .title-copy h2 {\n  font-family: var(--font-display);\n  font-size: var(--text-lg);\n  letter-spacing: -.03em;\n  background: linear-gradient(100deg, #fff, #cdbfff);\n  color: #0000;\n  background-clip: text;\n  font-weight: 800;\n  line-height: 1.1;\n}\n\n#manage-instagram-followers-root .results-summary, #manage-instagram-followers-root .updated-at, #manage-instagram-followers-root .advanced-summary-note {\n  font-size: var(--text-sm);\n  color: var(--color-muted);\n}\n\n#manage-instagram-followers-root .updated-at {\n  font-size: var(--text-xs);\n  text-align: right;\n  min-height: 0;\n  margin-top: -.25rem;\n}\n\n#manage-instagram-followers-root .updated-at:empty {\n  display: none;\n}\n\n#manage-instagram-followers-root .filter-buttons {\n  flex-wrap: wrap;\n  gap: .4rem;\n  display: flex;\n}\n\n#manage-instagram-followers-root .filter {\n  border-radius: var(--radius-full);\n  min-height: 2.25rem;\n  box-shadow: inset 0 0 0 1px var(--color-rule-soft);\n  font-size: var(--text-sm);\n  color: var(--color-neutral);\n  white-space: nowrap;\n  transition: background var(--dur-short), color var(--dur-short), box-shadow var(--dur-short), transform var(--dur-short) var(--ease-spring);\n  background: lab(100% 0 0 / .05);\n  border: 0;\n  align-items: center;\n  gap: .45rem;\n  padding: 0 .85rem;\n  font-weight: 600;\n  display: inline-flex;\n  position: relative;\n}\n\n#manage-instagram-followers-root .filter:hover:not(:disabled) {\n  color: #fff;\n  background: lab(100% 0 0 / .1);\n  transform: translateY(-1px);\n}\n\n#manage-instagram-followers-root .filter:active:not(:disabled) {\n  transform: scale(.96);\n}\n\n#manage-instagram-followers-root .filter.filter-active {\n  color: #fff;\n  background: linear-gradient(120deg, lab(27.8941% 32.8722 -48.3328 / .9), lab(23.1347% 50.5568 -25.7429 / .9));\n  box-shadow: inset 0 0 0 1px lab(74.6637% 35.6658 -41.6731 / .5), 0 0 1.3rem lab(49.9752% 58.4869 -55.5982 / .35);\n}\n\n#manage-instagram-followers-root .filter-count {\n  border-radius: var(--radius-full);\n  min-width: 1.45rem;\n  font-family: var(--font-mono);\n  font-size: var(--text-xs);\n  text-align: center;\n  background: lab(0% 0 0 / .3);\n  padding: .05rem .4rem;\n}\n\n#manage-instagram-followers-root .filter-count:empty {\n  display: none;\n}\n\n#manage-instagram-followers-root .select-chip {\n  box-shadow: none;\n  border: 1px dashed var(--color-rule);\n  color: var(--color-neutral);\n  background: none;\n  margin-left: auto;\n}\n\n#manage-instagram-followers-root .select-chip .icon {\n  color: var(--color-cyan);\n}\n\n#manage-instagram-followers-root .select-chip + .select-chip {\n  margin-left: 0;\n}\n\n#manage-instagram-followers-root .insight-strip {\n  gap: var(--space-xs);\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  display: grid;\n}\n\n@media (max-width: 36rem) {\n  #manage-instagram-followers-root .insight-strip {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n}\n\n#manage-instagram-followers-root .insight-stat {\n  --tint: 295;\n  border-radius: var(--radius-lg);\n  background: var(--color-glass);\n  box-shadow: inset 0 0 0 1px var(--color-rule-soft);\n  animation: mif-rise .6s var(--ease-out) both;\n  transition: transform var(--dur-short) var(--ease-out), box-shadow var(--dur-short);\n  align-items: center;\n  gap: .65rem;\n  padding: .75rem .85rem;\n  display: flex;\n  position: relative;\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root .insight-stat:nth-child(2) {\n  --tint: 215;\n  animation-delay: 60ms;\n}\n\n#manage-instagram-followers-root .insight-stat:nth-child(3) {\n  --tint: 155;\n  animation-delay: .12s;\n}\n\n#manage-instagram-followers-root .insight-stat:nth-child(4) {\n  --tint: 22;\n  animation-delay: .18s;\n}\n\n#manage-instagram-followers-root .insight-stat[data-tone=\"followers\"] {\n  --tint: 295;\n}\n\n#manage-instagram-followers-root .insight-stat:before {\n  content: \"\";\n  background: radial-gradient(160px circle at var(--mx, 100%) var(--my, 0%), oklch(70% .18 var(--tint) / .22), transparent 70%);\n  opacity: .7;\n  position: absolute;\n  inset: 0;\n}\n\n#manage-instagram-followers-root .insight-stat:hover {\n  box-shadow: inset 0 0 0 1px oklch(75% .16 var(--tint) / .5);\n  transform: translateY(-2px);\n}\n\n#manage-instagram-followers-root .insight-stat .stat-icon {\n  border-radius: var(--radius-sm);\n  background: oklch(35% .1 var(--tint) / .55);\n  width: 2.2rem;\n  height: 2.2rem;\n  color: oklch(88% .12 var(--tint));\n  flex: none;\n  place-items: center;\n  display: grid;\n  position: relative;\n}\n\n#manage-instagram-followers-root .insight-stat div {\n  min-width: 0;\n  position: relative;\n}\n\n#manage-instagram-followers-root .insight-stat strong {\n  font-family: var(--font-mono);\n  font-variant-numeric: tabular-nums;\n  font-size: 1.35rem;\n  font-weight: 700;\n  line-height: 1.1;\n  display: block;\n}\n\n#manage-instagram-followers-root .insight-stat div span {\n  font-size: var(--text-xs);\n  color: var(--color-muted);\n  line-height: 1.25;\n  display: block;\n}\n\n#manage-instagram-followers-root .input-group {\n  gap: var(--space-xs);\n  grid-template-columns: minmax(0, 1fr) minmax(0, 9.5rem) minmax(0, 9.5rem);\n  align-items: end;\n  display: grid;\n}\n\n#manage-instagram-followers-root .input-group label {\n  font-size: var(--text-xs);\n  letter-spacing: .08em;\n  text-transform: uppercase;\n  color: var(--color-muted);\n  margin-bottom: .3rem;\n  font-weight: 650;\n  display: block;\n}\n\n@media (max-width: 36rem) {\n  #manage-instagram-followers-root .input-group {\n    grid-template-columns: 1fr 1fr;\n  }\n\n  #manage-instagram-followers-root .search-control {\n    grid-column: 1 / -1;\n  }\n}\n\n#manage-instagram-followers-root .search-field, #manage-instagram-followers-root .select-wrap {\n  border-radius: var(--radius-md);\n  min-height: 2.75rem;\n  box-shadow: inset 0 0 0 1px var(--color-rule-soft);\n  transition: box-shadow var(--dur-short), background var(--dur-short);\n  background: lab(100% 0 0 / .05);\n  align-items: center;\n  display: flex;\n  position: relative;\n}\n\n:is(#manage-instagram-followers-root .search-field, #manage-instagram-followers-root .select-wrap):focus-within {\n  background: lab(100% 0 0 / .08);\n  box-shadow: inset 0 0 0 1px lab(68.9354% 30.5885 -46.8988 / .7), 0 0 0 4px lab(56.279% 44.3061 -61.85 / .18);\n}\n\n#manage-instagram-followers-root .search-field > .icon {\n  color: var(--color-muted);\n  margin-left: .85rem;\n}\n\n#manage-instagram-followers-root .search-field input {\n  min-width: 0;\n  height: 2.75rem;\n  color: var(--color-ink);\n  background: none;\n  border: 0;\n  outline: 0;\n  flex: 1;\n  padding: 0 .85rem 0 .6rem;\n}\n\n#manage-instagram-followers-root .search-field input::placeholder {\n  color: var(--color-muted);\n  opacity: .8;\n}\n\n#manage-instagram-followers-root .search-field input::-webkit-search-cancel-button {\n  filter: invert();\n  opacity: .6;\n}\n\n#manage-instagram-followers-root .select-wrap > .icon {\n  pointer-events: none;\n  color: var(--color-muted);\n  position: absolute;\n  right: .7rem;\n}\n\n#manage-instagram-followers-root .sort-select {\n  -webkit-appearance: none;\n  appearance: none;\n  width: 100%;\n  height: 2.75rem;\n  color: var(--color-ink);\n  text-overflow: ellipsis;\n  background: none;\n  border: 0;\n  outline: 0;\n  padding: 0 2.1rem 0 .85rem;\n}\n\n#manage-instagram-followers-root .sort-select option {\n  background: var(--color-paper-2);\n  color: var(--color-ink);\n}\n\n#manage-instagram-followers-root .tools-strip {\n  grid-template-columns: repeat(6, minmax(0, 1fr));\n  gap: .4rem;\n  display: grid;\n}\n\n@media (max-width: 36rem) {\n  #manage-instagram-followers-root .tools-strip {\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n  }\n}\n\n#manage-instagram-followers-root .tool-button {\n  text-align: center;\n  border-radius: var(--radius-sm);\n  min-height: 3.1rem;\n  box-shadow: inset 0 0 0 1px var(--color-rule-soft);\n  color: var(--color-neutral);\n  transition: background var(--dur-short), color var(--dur-short), transform var(--dur-short) var(--ease-spring);\n  background: none;\n  border: 0;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  gap: .25rem;\n  padding: .4rem .3rem;\n  font-size: .7rem;\n  font-weight: 650;\n  line-height: 1.2;\n  display: flex;\n}\n\n#manage-instagram-followers-root .tool-button .icon {\n  color: var(--color-cyan);\n  transition: transform var(--dur-short) var(--ease-spring);\n}\n\n#manage-instagram-followers-root .tool-button:hover {\n  color: #fff;\n  background: lab(100% 0 0 / .08);\n  transform: translateY(-1px);\n}\n\n#manage-instagram-followers-root .tool-button:hover .icon {\n  transform: scale(1.15);\n}\n\n#manage-instagram-followers-root .tool-button:active {\n  transform: scale(.96);\n}\n\n#manage-instagram-followers-root .workspace > * {\n  flex-shrink: 0;\n}\n\n#manage-instagram-followers-root .user-list {\n  flex-direction: column;\n  gap: .5rem;\n  display: flex;\n}\n\n#manage-instagram-followers-root .user {\n  --mx: 50%;\n  --my: 50%;\n  border-radius: var(--radius-lg);\n  background: var(--color-glass);\n  box-shadow: inset 0 0 0 1px var(--color-rule-soft);\n  animation: mif-rise .55s var(--ease-out) both;\n  animation-delay: calc(var(--i, 0) * 32ms);\n  transition: transform var(--dur-short) var(--ease-out), box-shadow var(--dur-short), background var(--dur-short);\n  flex-shrink: 0;\n  align-items: center;\n  gap: .8rem;\n  padding: .7rem .8rem;\n  display: flex;\n  position: relative;\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root .user:before {\n  content: \"\";\n  background: radial-gradient(260px circle at var(--mx) var(--my), lab(62.1579% 43.5784 -61.9524 / .16), transparent 65%);\n  opacity: 0;\n  transition: opacity var(--dur-short);\n  pointer-events: none;\n  position: absolute;\n  inset: 0;\n}\n\n#manage-instagram-followers-root .user:hover {\n  background: lab(11.3879% 5.29483 -13.983 / .65);\n  transform: translateY(-2px);\n  box-shadow: inset 0 0 0 1px lab(69.1029% 28.2492 -43.8558 / .35), 0 .8rem 2rem lab(0% 0 0 / .3);\n}\n\n#manage-instagram-followers-root .user:hover:before {\n  opacity: 1;\n}\n\n#manage-instagram-followers-root .user:has(.user-select:checked) {\n  background: lab(15.5448% 28.7117 14.9904 / .35);\n  box-shadow: inset 0 0 0 1px lab(63.1376% 63.6988 32.7469 / .5);\n}\n\n#manage-instagram-followers-root .user > * {\n  position: relative;\n}\n\n#manage-instagram-followers-root .user-photo-link {\n  background: conic-gradient(from var(--mif-angle), #8f7bff, #e45bd6, #ff8a5c, #4fe3ff, #8f7bff);\n  transition: transform var(--dur-short) var(--ease-spring);\n  border-radius: 50%;\n  flex: none;\n  padding: 2px;\n  display: block;\n}\n\n.user:hover :is(#manage-instagram-followers-root .user-photo-link) {\n  animation: 3s linear infinite mif-spin;\n  transform: scale(1.06);\n}\n\n#manage-instagram-followers-root .user-photo {\n  border: 2px solid var(--color-paper);\n  object-fit: cover;\n  background: var(--color-paper-3);\n  border-radius: 50%;\n  width: 2.9rem;\n  height: 2.9rem;\n  display: block;\n}\n\n#manage-instagram-followers-root .user-details {\n  flex-direction: column;\n  flex: 8rem;\n  gap: .1rem;\n  min-width: 0;\n  display: flex;\n}\n\n#manage-instagram-followers-root .username {\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  transition: color var(--dur-short);\n  font-weight: 700;\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root .username:hover {\n  color: lab(81.0583% 23.3431 -37.8781);\n}\n\n#manage-instagram-followers-root .full-name {\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-size: var(--text-sm);\n  color: var(--color-muted);\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root .full-name:empty {\n  display: none;\n}\n\n#manage-instagram-followers-root .relationship-info {\n  font-size: var(--text-xs);\n  color: var(--color-muted);\n  align-items: center;\n  gap: .4rem;\n  font-weight: 600;\n  display: inline-flex;\n}\n\n#manage-instagram-followers-root .relationship-info:before {\n  content: \"\";\n  background: currentColor;\n  border-radius: 50%;\n  flex: none;\n  width: .4rem;\n  height: .4rem;\n}\n\n#manage-instagram-followers-root .relationship-info[data-relationship=\"nonFollower\"] {\n  color: var(--color-warning-ink);\n}\n\n#manage-instagram-followers-root .relationship-info[data-relationship=\"nonFollower\"]:before {\n  box-shadow: 0 0 .6rem;\n}\n\n#manage-instagram-followers-root .relationship-info[data-relationship=\"mutual\"] {\n  color: var(--color-success-ink);\n}\n\n#manage-instagram-followers-root .account-signals {\n  flex-wrap: wrap;\n  gap: .3rem;\n  margin-top: .15rem;\n  display: flex;\n}\n\n#manage-instagram-followers-root .chip {\n  border-radius: var(--radius-full);\n  color: var(--color-neutral);\n  background: lab(100% 0 0 / .06);\n  align-items: center;\n  gap: .25rem;\n  padding: .08rem .5rem .08rem .4rem;\n  font-size: .7rem;\n  font-weight: 650;\n  display: inline-flex;\n}\n\n#manage-instagram-followers-root .chip.chip-verified {\n  color: lab(86.6209% -23.9094 -23.877);\n  background: lab(21.1791% -13.4313 -27.3381 / .55);\n}\n\n#manage-instagram-followers-root .chip.chip-private {\n  color: lab(81.7374% 11.1722 -27.6462);\n  background: lab(20.2562% 10.2033 -24.2784 / .6);\n}\n\n#manage-instagram-followers-root .chip.chip-ratio {\n  font-family: var(--font-mono);\n  font-weight: 600;\n}\n\n#manage-instagram-followers-root .protect-button {\n  width: 2.2rem;\n  height: 2.2rem;\n  color: var(--color-muted);\n  transition: color var(--dur-short), background var(--dur-short), transform var(--dur-short) var(--ease-spring);\n  background: none;\n  border: 0;\n  border-radius: 50%;\n  flex: none;\n  place-items: center;\n  display: grid;\n}\n\n#manage-instagram-followers-root .protect-button:hover {\n  color: var(--color-warning-ink);\n  background: lab(100% 0 0 / .08);\n  transform: scale(1.12) rotate(-8deg);\n}\n\n#manage-instagram-followers-root .protect-button[aria-pressed=\"true\"] {\n  color: var(--color-warning);\n}\n\n#manage-instagram-followers-root .protect-button[aria-pressed=\"true\"] .icon {\n  fill: currentColor;\n  filter: drop-shadow(0 0 6px lab(76.8315% 15.651 68.1009 / .7));\n  animation: mif-pop .5s var(--ease-spring);\n}\n\n#manage-instagram-followers-root .user-select {\n  -webkit-appearance: none;\n  appearance: none;\n  width: 1.35rem;\n  height: 1.35rem;\n  box-shadow: inset 0 0 0 1.5px var(--color-rule);\n  cursor: pointer;\n  transition: background-color var(--dur-short), box-shadow var(--dur-short), transform var(--dur-short) var(--ease-spring);\n  background: lab(100% 0 0 / .06) center / .9rem no-repeat;\n  border-radius: .45rem;\n  flex: none;\n  margin: 0;\n}\n\n#manage-instagram-followers-root .user-select:hover {\n  box-shadow: inset 0 0 0 1.5px lab(68.9354% 30.5885 -46.8988 / .8);\n}\n\n#manage-instagram-followers-root .user-select:checked {\n  background-color: #0000;\n  background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 12.5 4.5 4.5L19 7.5'/%3E%3C/svg%3E\"), var(--grad-brand);\n  animation: mif-pop .4s var(--ease-spring);\n  box-shadow: 0 0 1rem #e45bd688;\n}\n\n#manage-instagram-followers-root .action-button {\n  border-radius: var(--radius-full);\n  min-height: 2.35rem;\n  box-shadow: inset 0 0 0 1px var(--color-rule);\n  font-size: var(--text-sm);\n  color: #fff;\n  white-space: nowrap;\n  transition: background var(--dur-short), box-shadow var(--dur-short), transform var(--dur-short) var(--ease-spring), color var(--dur-short);\n  background: lab(100% 0 0 / .07);\n  border: 0;\n  flex: none;\n  align-items: center;\n  gap: .4rem;\n  padding: 0 .95rem 0 .8rem;\n  font-weight: 700;\n  display: inline-flex;\n  position: relative;\n}\n\n#manage-instagram-followers-root .action-button:before {\n  content: \"\";\n  width: 1rem;\n  height: 1rem;\n  -webkit-mask: var(--ic) center / contain no-repeat;\n  -webkit-mask: var(--ic) center / contain no-repeat;\n  mask: var(--ic) center / contain no-repeat;\n  --ic: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m7 7 10 10M17 7 7 17'/%3E%3C/svg%3E\");\n  background: currentColor;\n}\n\n#manage-instagram-followers-root .action-button[data-action=\"follow\"] {\n  background: var(--grad-brand);\n  box-shadow: 0 .4rem 1.2rem #c452e055, inset 0 1px #fff4;\n}\n\n#manage-instagram-followers-root .action-button[data-action=\"follow\"]:before {\n  --ic: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 8c-.7-3.2-2.7-5-6-5s-5.3 1.8-6 5m13-9h5m-2.5-2.5v5'/%3E%3C/svg%3E\");\n}\n\n#manage-instagram-followers-root .action-button:hover:not(:disabled) {\n  transform: translateY(-1px) scale(1.03);\n}\n\n#manage-instagram-followers-root .action-button:active:not(:disabled) {\n  transform: scale(.95);\n}\n\n#manage-instagram-followers-root .action-button:disabled {\n  opacity: .45;\n  filter: saturate(.5);\n}\n\n#manage-instagram-followers-root .action-button[data-state=\"loading\"] {\n  pointer-events: none;\n}\n\n#manage-instagram-followers-root .action-button[data-state=\"loading\"]:before {\n  --ic: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.4' stroke-linecap='round'%3E%3Cpath d='M12 3a9 9 0 1 0 9 9'/%3E%3C/svg%3E\");\n  animation: .7s linear infinite mif-spin-rot;\n}\n\n@media (max-width: 32rem) {\n  #manage-instagram-followers-root .user {\n    flex-wrap: wrap;\n  }\n\n  #manage-instagram-followers-root .action-button {\n    order: 9;\n    justify-content: center;\n    width: 100%;\n  }\n\n  #manage-instagram-followers-root .user-details {\n    flex-basis: 6rem;\n  }\n}\n\n#manage-instagram-followers-root .empty-state {\n  padding: var(--space-xl) var(--space-md);\n  text-align: center;\n  border-radius: var(--radius-lg);\n  border: 1px dashed var(--color-rule);\n  animation: mif-rise .6s var(--ease-out) both;\n  flex-direction: column;\n  align-items: center;\n  gap: .4rem;\n  display: flex;\n}\n\n#manage-instagram-followers-root .empty-state .icon {\n  background: var(--color-accent-soft);\n  color: lab(81.0583% 23.3431 -37.8781);\n  border-radius: 50%;\n  width: 3.4rem;\n  height: 3.4rem;\n  padding: .9rem;\n  animation: 3s ease-in-out infinite mif-float;\n}\n\n#manage-instagram-followers-root .empty-state strong {\n  font-size: var(--text-md);\n  margin-top: .4rem;\n}\n\n#manage-instagram-followers-root .empty-state span {\n  color: var(--color-muted);\n}\n\n#manage-instagram-followers-root .loader {\n  align-items: stretch;\n  gap: var(--space-sm);\n  padding-top: var(--space-xs);\n  flex-direction: column;\n  animation: .4s both mif-fade;\n  display: none;\n}\n\n#manage-instagram-followers-root .loader .scan-visual {\n  align-self: center;\n  width: 6rem;\n  height: 6rem;\n  position: relative;\n}\n\n#manage-instagram-followers-root .loader .scan-visual:before {\n  content: \"\";\n  background: var(--grad-cool);\n  filter: blur(24px);\n  opacity: .4;\n  border-radius: 50%;\n  animation: 2s ease-in-out infinite mif-breathe;\n  position: absolute;\n  inset: 10%;\n}\n\n#manage-instagram-followers-root .loader .scan-visual svg {\n  width: 100%;\n  height: 100%;\n  position: relative;\n  overflow: visible;\n}\n\n#manage-instagram-followers-root .loader .sc-ring {\n  stroke: lab(100% 0 0 / .18);\n  stroke-width: 1px;\n}\n\n#manage-instagram-followers-root .loader .sc-sweep {\n  transform-origin: 60px 60px;\n  animation: 1.8s linear infinite mif-spin-rot;\n}\n\n#manage-instagram-followers-root .loader .sc-blip {\n  fill: #fff;\n  filter: drop-shadow(0 0 5px #4fe3ff);\n  animation: 1.8s ease-out infinite mif-blip;\n}\n\n#manage-instagram-followers-root .loader .sc-blip-b {\n  animation-delay: .9s;\n}\n\n#manage-instagram-followers-root .loading-progress {\n  text-align: center;\n  color: var(--color-neutral);\n  font-weight: 600;\n  animation: 1.6s ease-in-out infinite mif-pulse;\n}\n\n#manage-instagram-followers-root .scan-bar {\n  border-radius: var(--radius-full);\n  background: var(--color-rule-soft);\n  height: .25rem;\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root .scan-bar i {\n  border-radius: inherit;\n  background: var(--grad-brand);\n  width: 40%;\n  height: 100%;\n  animation: mif-indeterminate 1.3s var(--ease-in-out) infinite;\n  display: block;\n}\n\n#manage-instagram-followers-root .skeleton-row {\n  border-radius: var(--radius-lg);\n  background: var(--color-glass);\n  grid-template-columns: 2.9rem 1fr 5.5rem;\n  align-items: center;\n  gap: .8rem;\n  padding: .7rem .8rem;\n  display: grid;\n}\n\n#manage-instagram-followers-root .skeleton-row span {\n  border-radius: var(--radius-full);\n  background: linear-gradient(100deg, lab(100% 0 0 / .05) 30%, lab(100% 0 0 / .16) 50%, lab(100% 0 0 / .05) 70%) 0 0 / 250% 100%;\n  height: .9rem;\n  animation: 1.4s linear infinite mif-skeleton;\n}\n\n#manage-instagram-followers-root .skeleton-row span:first-child {\n  border-radius: 50%;\n  height: 2.9rem;\n}\n\n#manage-instagram-followers-root .skeleton-row span:nth-child(3) {\n  height: 2.2rem;\n}\n\n#manage-instagram-followers-root .skeleton-row:nth-of-type(2) span {\n  animation-delay: .15s;\n}\n\n#manage-instagram-followers-root .skeleton-row:nth-of-type(3) span {\n  animation-delay: .3s;\n}\n\n#manage-instagram-followers-root .batch-bar {\n  z-index: 30;\n  justify-content: space-between;\n  align-items: center;\n  gap: var(--space-sm);\n  border-radius: var(--radius-lg);\n  background: var(--color-glass-strong);\n  -webkit-backdrop-filter: blur(18px) saturate(150%);\n  animation: mif-dock .5s var(--ease-spring) both;\n  flex-wrap: wrap;\n  padding: .65rem .7rem .65rem 1rem;\n  display: flex;\n  position: sticky;\n  bottom: .25rem;\n  box-shadow: inset 0 0 0 1px lab(68.9354% 30.5885 -46.8988 / .35), 0 1rem 2.5rem lab(0% 0 0 / .55), 0 0 2rem lab(49.9323% 56.2057 -60.1378 / .2);\n}\n\n#manage-instagram-followers-root .batch-bar .batch-count {\n  align-items: center;\n  gap: .5rem;\n  font-weight: 700;\n  display: inline-flex;\n}\n\n#manage-instagram-followers-root .batch-bar .batch-count .icon {\n  color: var(--color-cyan);\n}\n\n#manage-instagram-followers-root .batch-bar .batch-actions {\n  align-items: center;\n  gap: .4rem;\n  margin-left: auto;\n  display: flex;\n}\n\n#manage-instagram-followers-root .text-button, #manage-instagram-followers-root .danger-button, #manage-instagram-followers-root .diagnostic-button {\n  border-radius: var(--radius-full);\n  min-height: 2.5rem;\n  font-size: var(--text-sm);\n  transition: background var(--dur-short), box-shadow var(--dur-short), transform var(--dur-short) var(--ease-spring), color var(--dur-short);\n  border: 0;\n  justify-content: center;\n  align-items: center;\n  gap: .45rem;\n  padding: 0 1rem;\n  font-weight: 700;\n  display: inline-flex;\n}\n\n:is(#manage-instagram-followers-root .text-button, #manage-instagram-followers-root .danger-button, #manage-instagram-followers-root .diagnostic-button):active:not(:disabled) {\n  transform: scale(.96);\n}\n\n#manage-instagram-followers-root .text-button {\n  color: var(--color-neutral);\n  background: lab(100% 0 0 / .06);\n}\n\n#manage-instagram-followers-root .text-button:hover {\n  color: #fff;\n  background: lab(100% 0 0 / .12);\n}\n\n#manage-instagram-followers-root .danger-button {\n  color: #fff;\n  background: linear-gradient(120deg, lab(48.9658% 70.3532 38.6924), lab(44.5346% 75.0834 -14.7242));\n  box-shadow: 0 .4rem 1.4rem lab(51.2486% 70.6313 34.4055 / .4), inset 0 1px lab(100% 0 0 / .266667);\n}\n\n#manage-instagram-followers-root .danger-button:hover:not(:disabled) {\n  transform: translateY(-1px) scale(1.02);\n  box-shadow: 0 .7rem 1.8rem lab(51.2486% 70.6313 34.4055 / .55), inset 0 1px lab(100% 0 0 / .333333);\n}\n\n#manage-instagram-followers-root .danger-button:disabled {\n  opacity: .55;\n}\n\n#manage-instagram-followers-root .danger-button:disabled .icon {\n  animation: 1s ease-in-out infinite mif-pulse;\n}\n\n#manage-instagram-followers-root .advanced-panel {\n  margin-top: var(--space-xs);\n  border-radius: var(--radius-lg);\n  background: var(--color-glass);\n  box-shadow: inset 0 0 0 1px var(--color-rule-soft);\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root .advanced-panel summary {\n  cursor: pointer;\n  align-items: center;\n  gap: .75rem;\n  padding: .75rem .9rem;\n  list-style: none;\n  display: flex;\n}\n\n#manage-instagram-followers-root .advanced-panel summary::-webkit-details-marker {\n  display: none;\n}\n\n#manage-instagram-followers-root .advanced-panel summary:hover {\n  background: lab(100% 0 0 / .04);\n}\n\n#manage-instagram-followers-root .advanced-panel .adv-icon {\n  border-radius: var(--radius-sm);\n  width: 2.2rem;\n  height: 2.2rem;\n  color: var(--color-warning-ink);\n  background: lab(100% 0 0 / .06);\n  place-items: center;\n  display: grid;\n}\n\n#manage-instagram-followers-root .advanced-panel .adv-text {\n  flex-direction: column;\n  flex: 1;\n  font-weight: 650;\n  display: flex;\n}\n\n#manage-instagram-followers-root .advanced-panel .advanced-summary-note {\n  font-weight: 500;\n  font-size: var(--text-xs);\n}\n\n#manage-instagram-followers-root .advanced-panel .adv-chevron {\n  color: var(--color-muted);\n  transition: transform var(--dur-long) var(--ease-spring);\n}\n\n#manage-instagram-followers-root .advanced-panel[open] .adv-chevron {\n  transform: rotate(180deg);\n}\n\n#manage-instagram-followers-root .advanced-panel[open] summary {\n  box-shadow: 0 1px 0 var(--color-rule-soft);\n}\n\n#manage-instagram-followers-root .advanced-panel[open] > :not(summary) {\n  animation: mif-rise .45s var(--ease-out) both;\n}\n\n#manage-instagram-followers-root .diagnostic-button {\n  color: var(--color-neutral);\n  background: lab(100% 0 0 / .06);\n  margin: 0 .9rem .9rem;\n}\n\n#manage-instagram-followers-root .diagnostic-button:hover {\n  color: #fff;\n  background: lab(100% 0 0 / .12);\n}\n\n#manage-instagram-followers-root .diagnostic-button .icon {\n  color: var(--color-cyan);\n}\n\n#manage-instagram-followers-root .app-footer {\n  justify-content: space-between;\n  align-items: center;\n  gap: var(--space-sm) var(--space-md);\n  padding: .7rem var(--space-lg);\n  border-top: 1px solid var(--color-rule-soft);\n  font-size: var(--text-xs);\n  color: var(--color-muted);\n  animation: mif-rise .7s 1.9s var(--ease-out) both;\n  background: linear-gradient(#0000, lab(0% 0 0 / .25));\n  flex-wrap: wrap;\n  display: flex;\n}\n\n#manage-instagram-followers-root .footer-status {\n  flex: 14rem;\n  align-items: center;\n  gap: .55rem;\n  min-width: 0;\n  line-height: 1.35;\n  display: flex;\n}\n\n#manage-instagram-followers-root .status-dot {\n  background: var(--color-success);\n  border-radius: 50%;\n  flex: none;\n  width: .5rem;\n  height: .5rem;\n  animation: 2s ease-out infinite mif-ping;\n}\n\n#manage-instagram-followers-root .developer-credit {\n  border-radius: var(--radius-full);\n  white-space: nowrap;\n  background: linear-gradient(120deg, lab(12.9358% 16.4435 -25.8614 / .75), lab(10.6525% 23.9404 -12.2026 / .75));\n  align-items: center;\n  gap: .6rem;\n  margin-left: auto;\n  padding: .35rem 1rem .35rem .4rem;\n  animation: 3s ease-in-out infinite mif-glow;\n  display: inline-flex;\n  position: relative;\n  overflow: hidden;\n  box-shadow: inset 0 0 0 1px lab(74.6637% 35.6658 -41.6731 / .45), 0 0 1.8rem lab(49.9752% 58.4869 -55.5982 / .3);\n}\n\n#manage-instagram-followers-root .developer-credit:after {\n  content: \"\";\n  background: linear-gradient(100deg, #0000, #ffffff40, #0000);\n  width: 35%;\n  animation: 4s ease-in-out 1s infinite mif-sweep;\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  left: -50%;\n  transform: skewX(-20deg);\n}\n\n#manage-instagram-followers-root .developer-credit .credit-mark {\n  width: 2.2rem;\n  height: 2.2rem;\n  box-shadow: inset 0 0 0 1px var(--color-rule);\n  background: lab(1.43342% 1.58666 -4.9764);\n  border-radius: 50%;\n  place-items: center;\n  display: grid;\n}\n\n#manage-instagram-followers-root .developer-credit .credit-text {\n  flex-direction: column;\n  line-height: 1.1;\n  display: flex;\n}\n\n#manage-instagram-followers-root .developer-credit .credit-label {\n  letter-spacing: .22em;\n  text-transform: uppercase;\n  color: lab(81.8908% 11.0067 -19.2414);\n  font-size: .65rem;\n  font-weight: 600;\n}\n\n#manage-instagram-followers-root .developer-credit .credit-name {\n  letter-spacing: .01em;\n  background: linear-gradient(100deg, #fff 25%, #d4c4ff 42%, #ffa8dc 55%, #fff 72%) 0 0 / 250% 100%;\n  color: #0000;\n  background-clip: text;\n  font-size: 1.02rem;\n  font-weight: 800;\n  animation: 3s linear infinite mif-shimmer;\n}\n\n#manage-instagram-followers-root .confirm-backdrop {\n  z-index: 40;\n  padding: var(--space-md);\n  -webkit-backdrop-filter: blur(10px);\n  background: lab(.0947228% .236474 -.67766 / .7);\n  place-items: center;\n  animation: .3s both mif-fade;\n  display: grid;\n  position: absolute;\n  inset: 0;\n}\n\n#manage-instagram-followers-root .confirm-card, #manage-instagram-followers-root .history-card {\n  width: min(100%, 26rem);\n  max-height: 100%;\n  padding: var(--space-lg);\n  border-radius: var(--radius-xl);\n  background: linear-gradient(180deg, lab(100% 0 0 / .05), transparent), var(--color-paper-2);\n  box-shadow: inset 0 0 0 1px var(--color-rule), 0 2rem 4rem lab(0% 0 0 / .6);\n  animation: mif-dialog .5s var(--ease-spring) both;\n  overflow: auto;\n}\n\n#manage-instagram-followers-root .confirm-card {\n  align-items: center;\n  gap: var(--space-xs);\n  text-align: center;\n  flex-direction: column;\n  display: flex;\n}\n\n#manage-instagram-followers-root .confirm-card h2 {\n  font-family: var(--font-display);\n  font-size: var(--text-md);\n  font-weight: 750;\n}\n\n#manage-instagram-followers-root .confirm-card p {\n  color: var(--color-neutral);\n}\n\n#manage-instagram-followers-root .confirm-actions {\n  gap: var(--space-xs);\n  margin-top: var(--space-sm);\n  width: 100%;\n  display: flex;\n}\n\n#manage-instagram-followers-root .confirm-actions > * {\n  flex: 1;\n}\n\n#manage-instagram-followers-root .dialog-icon {\n  border-radius: var(--radius-md);\n  background: var(--color-accent-soft);\n  color: lab(81.0583% 23.3431 -37.8781);\n  flex: none;\n  place-items: center;\n  width: 2.8rem;\n  height: 2.8rem;\n  display: grid;\n}\n\n#manage-instagram-followers-root .dialog-icon.dialog-icon-danger {\n  background: var(--color-danger-soft);\n  width: 3.4rem;\n  height: 3.4rem;\n  color: var(--color-danger-ink);\n  border-radius: 50%;\n  animation: 1.8s ease-out infinite mif-pulse-ring;\n}\n\n#manage-instagram-followers-root .history-card {\n  gap: var(--space-sm);\n  flex-direction: column;\n  width: min(100%, 34rem);\n  display: flex;\n}\n\n#manage-instagram-followers-root .history-header {\n  align-items: flex-start;\n  gap: var(--space-sm);\n  display: flex;\n}\n\n#manage-instagram-followers-root .history-header > div {\n  flex: 1;\n  min-width: 0;\n}\n\n#manage-instagram-followers-root .history-header h2 {\n  font-family: var(--font-display);\n  font-size: var(--text-md);\n  font-weight: 750;\n}\n\n#manage-instagram-followers-root .history-summary {\n  border-radius: var(--radius-md);\n  font-size: var(--text-sm);\n  color: var(--color-neutral);\n  background: lab(100% 0 0 / .05);\n  padding: .7rem .9rem;\n}\n\n#manage-instagram-followers-root .history-summary strong {\n  color: #fff;\n  font-family: var(--font-mono);\n}\n\n#manage-instagram-followers-root .history-summary:empty {\n  display: none;\n}\n\n#manage-instagram-followers-root .history-list {\n  flex-direction: column;\n  gap: .5rem;\n  display: flex;\n}\n\n#manage-instagram-followers-root .history-row {\n  border-radius: var(--radius-md);\n  background: var(--color-glass);\n  box-shadow: inset 0 0 0 1px var(--color-rule-soft);\n  animation: mif-rise .5s var(--ease-out) both;\n  gap: .25rem;\n  padding: .75rem .9rem .75rem 1.2rem;\n  display: grid;\n  position: relative;\n}\n\n#manage-instagram-followers-root .history-row:before {\n  content: \"\";\n  background: var(--grad-brand);\n  border-radius: 3px;\n  width: 3px;\n  position: absolute;\n  top: .8rem;\n  bottom: .8rem;\n  left: .5rem;\n}\n\n#manage-instagram-followers-root .history-row:nth-child(2) {\n  animation-delay: 60ms;\n}\n\n#manage-instagram-followers-root .history-row:nth-child(3) {\n  animation-delay: .12s;\n}\n\n#manage-instagram-followers-root .history-row:nth-child(4) {\n  animation-delay: .18s;\n}\n\n#manage-instagram-followers-root .history-row strong {\n  font-weight: 700;\n}\n\n#manage-instagram-followers-root .history-row > div:first-child span {\n  font-size: var(--text-xs);\n  color: var(--color-muted);\n  margin-left: .5rem;\n}\n\n#manage-instagram-followers-root .history-row small {\n  font-size: var(--text-xs);\n  color: var(--color-muted);\n  line-height: 1.45;\n}\n\n#manage-instagram-followers-root .history-counts {\n  font-family: var(--font-mono);\n  font-size: var(--text-xs);\n  color: var(--color-cyan);\n  gap: .75rem;\n  display: flex;\n}\n\n#manage-instagram-followers-root .history-empty {\n  padding: var(--space-lg);\n  text-align: center;\n  color: var(--color-muted);\n  border: 1px dashed var(--color-rule);\n  border-radius: var(--radius-md);\n}\n\n#manage-instagram-followers-root .snap-logo {\n  display: block;\n  overflow: visible;\n}\n\n#manage-instagram-followers-root .snap-logo .lg-frame, #manage-instagram-followers-root .snap-logo .lg-flash, #manage-instagram-followers-root .snap-logo .lg-spin, #manage-instagram-followers-root .snap-logo .lg-snap, #manage-instagram-followers-root .snap-logo .lg-core, #manage-instagram-followers-root .snap-logo .lg-orbit {\n  transform-box: view-box;\n  transform-origin: 24px 24px;\n}\n\n#manage-instagram-followers-root .snap-logo .lg-spin {\n  animation: 18s linear infinite mif-lg-spin;\n}\n\n#manage-instagram-followers-root .snap-logo .lg-snap {\n  animation: mif-lg-snap 4.8s var(--ease-in-out) infinite;\n}\n\n#manage-instagram-followers-root .snap-logo .lg-frame {\n  animation: mif-lg-frame 4.8s var(--ease-in-out) infinite;\n}\n\n#manage-instagram-followers-root .snap-logo .lg-flash {\n  opacity: 0;\n  animation: 4.8s ease-out infinite mif-lg-flash;\n}\n\n#manage-instagram-followers-root .snap-logo .lg-core {\n  animation: 4.8s ease-in-out infinite mif-lg-core;\n}\n\n#manage-instagram-followers-root .snap-logo .lg-orbit {\n  animation: 7s linear infinite mif-spin-rot;\n}\n\n#manage-instagram-followers-root .snap-logo .lg-orbit circle {\n  filter: drop-shadow(0 0 2px #4fe3ff);\n}\n\n#manage-instagram-followers-root .snap-logo.lg-draw .lg-frame path, #manage-instagram-followers-root .snap-logo.lg-draw .lg-spin circle, #manage-instagram-followers-root .snap-logo.lg-draw .lg-spin path {\n  stroke-dasharray: 100;\n  stroke-dashoffset: 100px;\n  animation: mif-draw .9s var(--ease-out) forwards;\n}\n\n#manage-instagram-followers-root .snap-logo.lg-draw .lg-frame path:nth-child(2) {\n  animation-delay: .1s;\n}\n\n#manage-instagram-followers-root .snap-logo.lg-draw .lg-frame path:nth-child(3) {\n  animation-delay: .2s;\n}\n\n#manage-instagram-followers-root .snap-logo.lg-draw .lg-frame path:nth-child(4) {\n  animation-delay: .3s;\n}\n\n#manage-instagram-followers-root .snap-logo.lg-draw .lg-spin circle {\n  animation-delay: .45s;\n}\n\n#manage-instagram-followers-root .snap-logo.lg-draw .lg-spin path {\n  animation-delay: .7s;\n}\n\n#manage-instagram-followers-root .snap-logo.lg-draw .lg-snap, #manage-instagram-followers-root .snap-logo.lg-draw .lg-frame, #manage-instagram-followers-root .snap-logo.lg-draw .lg-flash, #manage-instagram-followers-root .snap-logo.lg-draw .lg-core {\n  animation-delay: -2.7s;\n}\n\n#manage-instagram-followers-root .snap-logo.lg-draw .lg-core {\n  opacity: 0;\n  animation: 4.8s ease-in-out -2.7s infinite mif-lg-core, .4s .9s forwards mif-fade;\n}\n\n#manage-instagram-followers-root .brand-mark .bm-logo {\n  filter: drop-shadow(0 0 6px lab(56.2359% 49.8987 -54.8666 / .5));\n}\n\n#manage-instagram-followers-root .pre-core {\n  place-items: center;\n  display: grid;\n}\n\n#manage-instagram-followers-root .pre-core > * {\n  grid-area: 1 / 1;\n}\n\n#manage-instagram-followers-root.is-minimized {\n  pointer-events: none;\n  width: 0;\n  height: 0;\n  inset: 0 auto auto 0;\n  overflow: visible;\n}\n\n#manage-instagram-followers-root .overlay.is-hidden {\n  visibility: hidden;\n  pointer-events: none;\n}\n\n#manage-instagram-followers-root .overlay.is-hidden * {\n  animation-play-state: paused !important;\n}\n\n#manage-instagram-followers-root .hud-orb {\n  --tilt: 0deg;\n  z-index: var(--z-toast);\n  cursor: grab;\n  touch-action: none;\n  -webkit-user-select: none;\n  user-select: none;\n  pointer-events: auto;\n  outline-offset: 8px;\n  width: 64px;\n  height: 64px;\n  animation: mif-orb-in .75s var(--ease-spring) both, mif-orb-bob 4.6s .75s ease-in-out infinite;\n  border-radius: 50%;\n  place-items: center;\n  display: grid;\n  position: fixed;\n  top: 0;\n  left: 0;\n}\n\n#manage-instagram-followers-root .hud-orb:after {\n  content: \"\";\n  border: 2px solid var(--color-cyan);\n  opacity: 0;\n  pointer-events: none;\n  border-radius: 50%;\n  position: absolute;\n  inset: 0;\n}\n\n#manage-instagram-followers-root .hud-orb.is-ping:after {\n  animation: 1.2s ease-out mif-orb-ping;\n}\n\n#manage-instagram-followers-root .hud-orb.is-dragging {\n  cursor: grabbing;\n  animation: mif-orb-in .75s var(--ease-spring) both;\n  translate: 0;\n}\n\n#manage-instagram-followers-root .hud-orb:hover .orb-quit, #manage-instagram-followers-root .hud-orb:focus-within .orb-quit, #manage-instagram-followers-root .hud-orb.is-dragging .orb-quit {\n  opacity: 1;\n  transform: scale(1);\n}\n\n#manage-instagram-followers-root .hud-orb:hover .orb-core {\n  box-shadow: inset 0 0 0 1px lab(100% 0 0 / .28), 0 .6rem 1.6rem lab(.0153446% .123382 -.317791 / .6), 0 0 2.4rem lab(55.5078% 66.0939 -55.2279 / .6);\n}\n\n#manage-instagram-followers-root .hud-orb .orb-halo {\n  pointer-events: none;\n  filter: blur(6px);\n  background: radial-gradient(closest-side, lab(59.0274% 65.9184 -55.2801 / .55), lab(50.4352% 42.1388 -64.5549 / .25) 60%, #0000 100%);\n  border-radius: 50%;\n  animation: 3.2s ease-in-out infinite mif-breathe;\n  position: absolute;\n  inset: -16px;\n}\n\n#manage-instagram-followers-root .hud-orb .orb-ring {\n  pointer-events: none;\n  width: 84px;\n  height: 84px;\n  position: absolute;\n  inset: -10px;\n  overflow: visible;\n}\n\n#manage-instagram-followers-root .hud-orb .orb-ring-a {\n  transform-box: view-box;\n  transform-origin: 42px 42px;\n  animation: 9s linear infinite mif-spin-rot;\n}\n\n#manage-instagram-followers-root .hud-orb .orb-ring-b {\n  transform-box: view-box;\n  transform-origin: 42px 42px;\n  opacity: .8;\n  animation: 14s linear infinite reverse mif-spin-rot;\n}\n\n#manage-instagram-followers-root .hud-orb .orb-core {\n  width: 64px;\n  height: 64px;\n  transform: rotate(var(--tilt)) scale(1);\n  transition: transform .45s var(--ease-spring), box-shadow var(--dur-short);\n  background: radial-gradient(circle at 30% 24%, lab(28.5441% 26.4305 -37.1304 / .9), #0000 62%), linear-gradient(150deg, lab(11.0069% 10.9584 -19.9274), lab(1.84449% 1.62659 -5.81987));\n  border-radius: 50%;\n  place-items: center;\n  display: grid;\n  position: relative;\n  box-shadow: inset 0 0 0 1px lab(100% 0 0 / .18), 0 .6rem 1.4rem lab(.0153446% .123382 -.317791 / .55), 0 0 1.8rem lab(52.3276% 58.2986 -55.6341 / .4);\n}\n\n#manage-instagram-followers-root .hud-orb.is-dragging .orb-core {\n  transform: rotate(var(--tilt)) scale(1.14);\n  transition-duration: .18s;\n}\n\n#manage-instagram-followers-root .hud-orb.is-dragging .orb-halo {\n  animation-duration: 1.2s;\n}\n\n#manage-instagram-followers-root .hud-orb .orb-badge {\n  border-radius: var(--radius-full);\n  min-width: 1.45rem;\n  height: 1.45rem;\n  font-family: var(--font-mono);\n  color: #fff;\n  background: linear-gradient(135deg, #ff5d73, #e45bd6);\n  place-items: center;\n  padding: 0 .35rem;\n  font-size: .7rem;\n  font-weight: 700;\n  animation: 1.8s ease-in-out infinite mif-orb-badge;\n  display: grid;\n  position: absolute;\n  top: -5px;\n  right: -5px;\n  box-shadow: 0 0 0 2px lab(1.87255% 1.2136 -4.91494), 0 0 1rem lab(62.6221% 63.5371 23.0232 / .6);\n}\n\n#manage-instagram-followers-root .hud-orb .orb-quit {\n  width: 1.35rem;\n  height: 1.35rem;\n  color: var(--color-neutral);\n  box-shadow: inset 0 0 0 1px var(--color-rule), 0 .2rem .6rem lab(0% 0 0 / .5);\n  opacity: 0;\n  transition: opacity var(--dur-short), transform var(--dur-short) var(--ease-spring), background var(--dur-micro);\n  background: lab(9.05606% 5.4497 -13.9474);\n  border: 0;\n  border-radius: 50%;\n  place-items: center;\n  padding: 0;\n  display: grid;\n  position: absolute;\n  top: -8px;\n  left: -8px;\n  transform: scale(.5);\n}\n\n#manage-instagram-followers-root .hud-orb .orb-quit:hover {\n  background: var(--color-danger-soft);\n  color: var(--color-danger-ink);\n}\n\n#manage-instagram-followers-root .hud-orb .orb-name {\n  white-space: nowrap;\n  border-radius: var(--radius-full);\n  font-family: var(--font-display);\n  letter-spacing: .01em;\n  color: #fff;\n  -webkit-backdrop-filter: blur(10px);\n  backdrop-filter: blur(10px);\n  box-shadow: inset 0 0 0 1px var(--color-rule), 0 .4rem 1rem lab(0% 0 0 / .45);\n  pointer-events: none;\n  background: lab(2.86876% 2.10149 -7.43679 / .82);\n  align-items: center;\n  gap: .4rem;\n  padding: .22rem .7rem;\n  font-size: .78rem;\n  font-weight: 750;\n  display: inline-flex;\n  position: absolute;\n  top: calc(100% + 12px);\n  left: 50%;\n  translate: -50%;\n}\n\n#manage-instagram-followers-root .hud-orb .orb-name .orb-name-dot {\n  background: var(--color-success);\n  border-radius: 50%;\n  width: .42rem;\n  height: .42rem;\n  animation: 2s ease-out infinite mif-ping;\n}\n\n#manage-instagram-followers-root[data-busy] .hud-orb .orb-ring-a {\n  animation-duration: 1.5s;\n}\n\n#manage-instagram-followers-root[data-busy] .hud-orb .orb-ring-b {\n  animation-duration: 2.4s;\n}\n\n#manage-instagram-followers-root[data-busy] .hud-orb .orb-name-dot {\n  background: var(--color-orange);\n}\n\n#manage-instagram-followers-root button.history-row {\n  text-align: left;\n  width: 100%;\n  font: inherit;\n  color: inherit;\n  cursor: pointer;\n  transition: transform var(--dur-short) var(--ease-out), background var(--dur-short), box-shadow var(--dur-short);\n  border: 0;\n  margin: 0;\n}\n\n#manage-instagram-followers-root button.history-row:hover {\n  background: lab(100% 0 0 / .09);\n  transform: translateY(-2px);\n  box-shadow: inset 0 0 0 1px lab(68.9354% 30.5885 -46.8988 / .45);\n}\n\n#manage-instagram-followers-root button.history-row:hover .history-go svg {\n  transform: translateX(3px);\n}\n\n#manage-instagram-followers-root .history-chips {\n  flex-wrap: wrap;\n  gap: .4rem;\n  margin-top: .1rem;\n  display: flex;\n}\n\n#manage-instagram-followers-root .hchip {\n  border-radius: var(--radius-full);\n  font-size: var(--text-xs);\n  color: var(--color-neutral);\n  background: lab(100% 0 0 / .07);\n  align-items: center;\n  gap: .3rem;\n  padding: .15rem .6rem;\n  font-weight: 650;\n  display: inline-flex;\n}\n\n#manage-instagram-followers-root .hchip.hchip-lost {\n  background: var(--color-danger-soft);\n  color: var(--color-danger-ink);\n}\n\n#manage-instagram-followers-root .hchip.hchip-new {\n  color: var(--color-success-ink);\n  background: lab(19.9456% -29.3159 15.2148 / .55);\n}\n\n#manage-instagram-followers-root .history-go {\n  font-size: var(--text-xs);\n  color: var(--color-cyan);\n  align-items: center;\n  gap: .3rem;\n  margin-top: .15rem;\n  font-weight: 650;\n  display: inline-flex;\n}\n\n#manage-instagram-followers-root .history-go svg {\n  transition: transform var(--dur-short) var(--ease-out);\n}\n\n#manage-instagram-followers-root .tool-badge {\n  border-radius: var(--radius-full);\n  font-family: var(--font-mono);\n  background: var(--color-danger-soft);\n  color: var(--color-danger-ink);\n  margin-left: .15rem;\n  padding: 0 .4rem;\n  font-size: .7rem;\n  font-weight: 700;\n  line-height: 1.35;\n}\n\n#manage-instagram-followers-root .history-detail {\n  gap: var(--space-sm);\n  flex-direction: column;\n  display: flex;\n}\n\n#manage-instagram-followers-root .detail-top {\n  justify-content: space-between;\n  gap: var(--space-xs);\n  flex-wrap: wrap;\n  display: flex;\n}\n\n#manage-instagram-followers-root .detail-top .text-button {\n  min-height: 0;\n  font-size: var(--text-sm);\n  align-items: center;\n  gap: .35rem;\n  padding: .4rem .8rem;\n  display: inline-flex;\n}\n\n#manage-instagram-followers-root .detail-range {\n  font-family: var(--font-mono);\n  font-size: var(--text-xs);\n  color: var(--color-muted);\n}\n\n#manage-instagram-followers-root .detail-tabs {\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: .4rem;\n  display: grid;\n}\n\n#manage-instagram-followers-root .detail-tab {\n  border-radius: var(--radius-md);\n  text-align: left;\n  min-width: 0;\n  font-size: var(--text-sm);\n  color: var(--color-neutral);\n  background: var(--color-glass);\n  box-shadow: inset 0 0 0 1px var(--color-rule-soft);\n  transition: background var(--dur-short), box-shadow var(--dur-short), color var(--dur-short);\n  border: 0;\n  align-items: center;\n  gap: .45rem;\n  padding: .6rem .75rem;\n  font-weight: 600;\n  display: flex;\n}\n\n#manage-instagram-followers-root .detail-tab span {\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root .detail-tab b {\n  font-family: var(--font-mono);\n  font-size: var(--text-xs);\n  border-radius: var(--radius-full);\n  background: lab(100% 0 0 / .1);\n  padding: .05rem .45rem;\n}\n\n#manage-instagram-followers-root .detail-tab:hover {\n  color: #fff;\n  background: lab(100% 0 0 / .09);\n}\n\n#manage-instagram-followers-root .detail-tab[aria-selected=\"true\"] {\n  color: #fff;\n  background: var(--color-accent-soft);\n  box-shadow: inset 0 0 0 1px lab(68.9354% 30.5885 -46.8988 / .6);\n}\n\n#manage-instagram-followers-root .detail-tab.tone-lost[aria-selected=\"true\"] {\n  background: var(--color-danger-soft);\n  box-shadow: inset 0 0 0 1px lab(63.1376% 63.6988 32.7469 / .65);\n}\n\n#manage-instagram-followers-root .detail-tab.tone-new[aria-selected=\"true\"] {\n  background: lab(17.5014% -25.9675 13.461 / .6);\n  box-shadow: inset 0 0 0 1px lab(73.1984% -54.4505 28.1104 / .6);\n}\n\n#manage-instagram-followers-root .detail-note {\n  font-size: var(--text-xs);\n  color: var(--color-muted);\n  line-height: 1.5;\n}\n\n#manage-instagram-followers-root .detail-note:empty {\n  display: none;\n}\n\n#manage-instagram-followers-root .profile-grid {\n  flex-direction: column;\n  gap: .5rem;\n  display: flex;\n}\n\n#manage-instagram-followers-root .profile-card {\n  border-radius: var(--radius-md);\n  background: var(--color-glass);\n  min-width: 0;\n  box-shadow: inset 0 0 0 1px var(--color-rule-soft);\n  animation: mif-rise .45s var(--ease-out) both;\n  animation-delay: calc(var(--i, 0) * 35ms);\n  transition: background var(--dur-short), box-shadow var(--dur-short), transform var(--dur-short) var(--ease-out);\n  align-items: center;\n  gap: .75rem;\n  padding: .65rem .8rem;\n  display: flex;\n}\n\n#manage-instagram-followers-root .profile-card:is(a):hover {\n  background: lab(100% 0 0 / .09);\n  transform: translateY(-1px);\n  box-shadow: inset 0 0 0 1px lab(68.9354% 30.5885 -46.8988 / .45);\n}\n\n#manage-instagram-followers-root .profile-card:is(a):hover .pc-open {\n  color: var(--color-cyan);\n  transform: translateX(3px);\n}\n\n#manage-instagram-followers-root .pc-avatar {\n  width: 2.7rem;\n  height: 2.7rem;\n  font-family: var(--font-display);\n  color: #fff;\n  text-shadow: 0 1px 2px lab(0% 0 0 / .4);\n  background: linear-gradient(135deg, hsl(var(--h, 280) 72% 58%), hsl(calc(var(--h, 280) + 55) 78% 52%));\n  box-shadow: 0 0 0 2px lab(100% 0 0 / .14), 0 0 1rem hsl(var(--h, 280) 80% 55% / .35);\n  border-radius: 50%;\n  flex: none;\n  place-items: center;\n  font-size: 1.05rem;\n  font-weight: 750;\n  display: grid;\n}\n\n#manage-instagram-followers-root .pc-body {\n  flex-direction: column;\n  flex: 1;\n  min-width: 0;\n  display: flex;\n}\n\n#manage-instagram-followers-root .pc-body strong {\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-weight: 700;\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root .pc-body small {\n  font-size: var(--text-sm);\n  color: var(--color-muted);\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root .pc-chips {\n  flex-wrap: wrap;\n  gap: .3rem;\n  margin-top: .25rem;\n  display: flex;\n}\n\n#manage-instagram-followers-root .pc-open {\n  color: var(--color-muted);\n  transition: color var(--dur-short), transform var(--dur-short) var(--ease-out);\n}\n\n#manage-instagram-followers-root .chip.chip-warning {\n  color: var(--color-warning-ink);\n  background: lab(21.0706% 9.4385 35.803 / .55);\n}\n\n#manage-instagram-followers-root .chip.chip-info {\n  color: lab(86.681% -23.6515 -19.3011);\n  background: lab(18.8911% -11.8623 -21.9911 / .55);\n}\n\n@media (max-width: 39.99rem) {\n  #manage-instagram-followers-root .overlay {\n    padding: 0;\n  }\n\n  #manage-instagram-followers-root .my-component {\n    border-radius: 0;\n    width: 100%;\n    height: 100dvh;\n    max-height: 100dvh;\n  }\n\n  #manage-instagram-followers-root .app-header, #manage-instagram-followers-root .intro-block, #manage-instagram-followers-root .app-footer, #manage-instagram-followers-root .workspace {\n    padding-left: var(--space-md);\n    padding-right: var(--space-md);\n  }\n\n  #manage-instagram-followers-root .list-heading {\n    margin: 0 calc(var(--space-md) * -1);\n    padding-left: var(--space-md);\n    padding-right: var(--space-md);\n  }\n\n  #manage-instagram-followers-root .list-tabs, #manage-instagram-followers-root .notice {\n    margin-left: var(--space-md);\n    margin-right: var(--space-md);\n  }\n\n  #manage-instagram-followers-root .brand-mark {\n    width: 2.6rem;\n    height: 2.6rem;\n  }\n\n  #manage-instagram-followers-root #appTitle {\n    font-size: var(--text-base);\n  }\n\n  #manage-instagram-followers-root .developer-credit {\n    justify-content: center;\n    width: 100%;\n    margin-left: 0;\n  }\n}\n\n@media (max-width: 29rem) {\n  #manage-instagram-followers-root .detail-tabs {\n    grid-template-columns: minmax(0, 1fr);\n  }\n\n  #manage-instagram-followers-root .history-card, #manage-instagram-followers-root .confirm-card {\n    padding: var(--space-md);\n  }\n}\n\n@media (max-width: 23.5rem) {\n  #manage-instagram-followers-root .language-button {\n    min-width: 2.5rem;\n  }\n\n  #manage-instagram-followers-root .kicker-sep, #manage-instagram-followers-root .kicker-ver {\n    display: none;\n  }\n}\n\n@media (pointer: coarse) {\n  #manage-instagram-followers-root .filter, #manage-instagram-followers-root .tool-button, #manage-instagram-followers-root .text-button, #manage-instagram-followers-root .danger-button {\n    min-height: 2.75rem;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  #manage-instagram-followers-root *, #manage-instagram-followers-root :before, #manage-instagram-followers-root :after {\n    animation-duration: var(--dur-reduced) !important;\n    transition-duration: var(--dur-reduced) !important;\n    scroll-behavior: auto !important;\n    animation-iteration-count: 1 !important;\n    animation-delay: 0s !important;\n  }\n\n  #manage-instagram-followers-root .preloader {\n    display: none;\n  }\n\n  #manage-instagram-followers-root .my-component {\n    animation: none;\n  }\n}\n\n#manage-instagram-followers-root .sr-only {\n  clip: rect(0 0 0 0);\n  white-space: nowrap;\n  border: 0;\n  width: 1px;\n  height: 1px;\n  margin: -1px;\n  padding: 0;\n  position: absolute;\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root .list-heading #title, #manage-instagram-followers-root .search-control label, #manage-instagram-followers-root .sort-control label, #manage-instagram-followers-root .signal-control label {\n  clip: rect(0 0 0 0);\n  width: 1px;\n  height: 1px;\n  position: absolute;\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root[data-busy] .filter-buttons, #manage-instagram-followers-root[data-busy] #searchGroup, #manage-instagram-followers-root[data-busy] .updated-at, #manage-instagram-followers-root[data-busy] .results-summary, #manage-instagram-followers-root[data-busy] .advanced-panel {\n  display: none;\n}\n\n#manage-instagram-followers-root .loader-cancel {\n  margin-top: var(--space-xs);\n  align-self: center;\n}\n\n#manage-instagram-followers-root .history-trigger {\n  position: relative;\n}\n\n#manage-instagram-followers-root .history-trigger .tool-badge {\n  margin: 0;\n  position: absolute;\n  top: -.3rem;\n  right: -.3rem;\n}\n\n#manage-instagram-followers-root .tools-grid {\n  margin-bottom: var(--space-sm);\n  grid-template-columns: repeat(auto-fit, minmax(5.5rem, 1fr));\n  gap: .4rem;\n  display: grid;\n}\n\n#manage-instagram-followers-root .history-when {\n  flex-direction: column;\n  gap: .1rem;\n  display: flex;\n}\n\n#manage-instagram-followers-root .history-when span {\n  font-size: var(--text-xs);\n  color: var(--color-muted);\n}\n\n#manage-instagram-followers-root .license-card {\n  gap: var(--space-sm);\n}\n\n#manage-instagram-followers-root .license-input {\n  text-align: center;\n  width: 100%;\n  font-family: var(--font-mono);\n  font-size: var(--text-sm);\n  letter-spacing: .08em;\n  text-transform: uppercase;\n  color: #fff;\n  border-radius: var(--radius-md);\n  box-shadow: inset 0 0 0 1px var(--color-rule);\n  background: lab(100% 0 0 / .06);\n  border: 0;\n  padding: .8rem 1rem;\n}\n\n#manage-instagram-followers-root .license-input:focus-visible {\n  outline: 2px solid var(--color-cyan);\n  outline-offset: 2px;\n}\n\n#manage-instagram-followers-root .license-message {\n  min-height: 1.4em;\n  font-size: var(--text-sm);\n  color: var(--color-neutral);\n}\n\n#manage-instagram-followers-root .license-message:empty {\n  visibility: hidden;\n}\n\n#manage-instagram-followers-root .license-activate {\n  border-radius: var(--radius-full);\n  cursor: pointer;\n  color: #fff;\n  background: var(--grad-brand);\n  border: 0;\n  padding: .7rem 1.2rem;\n  font-weight: 750;\n}\n\n#manage-instagram-followers-root .license-activate:disabled {\n  opacity: .6;\n  cursor: progress;\n}\n\n#manage-instagram-followers-root .license-message[data-tone=\"error\"] {\n  color: var(--color-danger-ink);\n}\n\n#manage-instagram-followers-root .license-message[data-tone=\"success\"] {\n  color: var(--color-success-ink);\n}\n\n#manage-instagram-followers-root .license-buy {\n  font-size: var(--text-sm);\n  color: var(--color-cyan);\n  justify-content: center;\n  align-items: center;\n  gap: .35rem;\n  font-weight: 650;\n  text-decoration: none;\n  display: inline-flex;\n}\n\n#manage-instagram-followers-root .license-buy:hover {\n  text-decoration: underline;\n}\n\n#manage-instagram-followers-root .license-buy[hidden] {\n  display: none;\n}\n\n#manage-instagram-followers-root .license-banner {\n  margin: 0 var(--space-lg) var(--space-xs);\n  border-radius: var(--radius-md);\n  font-size: var(--text-sm);\n  background: lab(21.1053% 7.79338 31.5372 / .5);\n  align-items: center;\n  gap: .6rem;\n  padding: .6rem .8rem;\n  display: flex;\n  box-shadow: inset 0 0 0 1px lab(76.8535% 14.2021 61.9688 / .4);\n}\n\n#manage-instagram-followers-root .license-banner[hidden] {\n  display: none;\n}\n\n#manage-instagram-followers-root .license-banner .lb-icon {\n  color: var(--color-warning-ink);\n  place-items: center;\n  display: grid;\n}\n\n#manage-instagram-followers-root .license-banner .lb-text {\n  flex: 1;\n  min-width: 0;\n}\n\n#manage-instagram-followers-root .license-banner-button {\n  border-radius: var(--radius-full);\n  cursor: pointer;\n  font-weight: 700;\n  font-size: var(--text-sm);\n  color: #fff;\n  background: var(--grad-brand);\n  border: 0;\n  padding: .4rem .9rem;\n}\n\n#manage-instagram-followers-root .license-chip {\n  border-radius: var(--radius-full);\n  cursor: pointer;\n  max-width: 11rem;\n  font-size: var(--text-xs);\n  white-space: nowrap;\n  color: var(--color-success-ink);\n  background: lab(19.7039% -22.4526 11.596 / .5);\n  border: 0;\n  align-items: center;\n  gap: .35rem;\n  padding: .3rem .7rem;\n  font-weight: 650;\n  display: inline-flex;\n  box-shadow: inset 0 0 0 1px lab(76.5589% -51.0203 26.3074 / .4);\n}\n\n#manage-instagram-followers-root .license-chip span {\n  text-overflow: ellipsis;\n  overflow: hidden;\n}\n\n#manage-instagram-followers-root .license-chip[data-tone=\"soon\"] {\n  color: var(--color-warning-ink);\n  background: lab(21.1053% 7.79338 31.5372 / .5);\n  box-shadow: inset 0 0 0 1px lab(76.8535% 14.2021 61.9688 / .4);\n}\n\n#manage-instagram-followers-root .license-chip[hidden] {\n  display: none;\n}\n\n#manage-instagram-followers-root .license-chip:focus-visible {\n  outline: 2px solid var(--color-cyan);\n  outline-offset: 2px;\n}\n\n@media (max-width: 36rem) {\n  #manage-instagram-followers-root .license-chip {\n    padding: .5rem;\n  }\n\n  #manage-instagram-followers-root .license-chip span {\n    display: none;\n  }\n}\n\n@keyframes mif-fade {\n  from {\n    opacity: 0;\n  }\n\n  to {\n    opacity: 1;\n  }\n}\n\n@keyframes mif-rise {\n  from {\n    opacity: 0;\n    transform: translateY(14px);\n  }\n\n  to {\n    opacity: 1;\n    transform: none;\n  }\n}\n\n@keyframes mif-pop {\n  0% {\n    opacity: 0;\n    transform: scale(.6);\n  }\n\n  100% {\n    opacity: 1;\n    transform: scale(1);\n  }\n}\n\n@keyframes mif-panel-in {\n  from {\n    opacity: .001;\n    filter: blur(8px);\n    transform: translateY(24px) scale(.96);\n  }\n\n  to {\n    opacity: 1;\n    filter: none;\n    transform: none;\n  }\n}\n\n@keyframes mif-dialog {\n  from {\n    opacity: 0;\n    transform: translateY(18px) scale(.92);\n  }\n\n  to {\n    opacity: 1;\n    transform: none;\n  }\n}\n\n@keyframes mif-dock {\n  from {\n    opacity: 0;\n    transform: translateY(24px) scale(.96);\n  }\n\n  to {\n    opacity: 1;\n    transform: none;\n  }\n}\n\n@keyframes mif-notice {\n  from {\n    opacity: 0;\n    transform: translateY(-10px) scale(.97);\n  }\n\n  to {\n    opacity: 1;\n    transform: none;\n  }\n}\n\n@keyframes mif-spin {\n  to {\n    --mif-angle: 360deg;\n  }\n}\n\n@keyframes mif-spin-rot {\n  to {\n    transform: rotate(360deg);\n  }\n}\n\n@keyframes mif-draw {\n  to {\n    stroke-dashoffset: 0;\n  }\n}\n\n@keyframes mif-fill {\n  to {\n    transform: scaleX(1);\n  }\n}\n\n@keyframes mif-count {\n  from {\n    --mif-num: 0;\n  }\n\n  to {\n    --mif-num: 100;\n  }\n}\n\n@keyframes mif-pre-out {\n  0% {\n    opacity: 1;\n    filter: none;\n    visibility: visible;\n    transform: none;\n  }\n\n  100% {\n    opacity: 0;\n    filter: blur(14px);\n    visibility: hidden;\n    pointer-events: none;\n    transform: scale(1.08);\n  }\n}\n\n@keyframes mif-grid-pan {\n  to {\n    background-position: 38px 38px;\n  }\n}\n\n@keyframes mif-breathe {\n  0%, 100% {\n    opacity: .35;\n    transform: scale(.9);\n  }\n\n  50% {\n    opacity: .6;\n    transform: scale(1.15);\n  }\n}\n\n@keyframes mif-shimmer {\n  to {\n    background-position: -250% 0;\n  }\n}\n\n@keyframes mif-sweep {\n  0% {\n    left: -60%;\n  }\n\n  55%, 100% {\n    left: 130%;\n  }\n}\n\n@keyframes mif-ping {\n  0% {\n    box-shadow: 0 0 lab(76.6826% -54.3513 28.0449 / .7);\n  }\n\n  80%, 100% {\n    box-shadow: 0 0 0 .5rem lab(76.6826% -54.3513 28.0449 / 0);\n  }\n}\n\n@keyframes mif-pulse {\n  0%, 100% {\n    opacity: .6;\n  }\n\n  50% {\n    opacity: 1;\n  }\n}\n\n@keyframes mif-pulse-ring {\n  0% {\n    box-shadow: 0 0 lab(60.8138% 63.7243 32.9224 / .5);\n  }\n\n  100% {\n    box-shadow: 0 0 0 1rem lab(60.8138% 63.7243 32.9224 / 0);\n  }\n}\n\n@keyframes mif-glow {\n  0%, 100% {\n    box-shadow: inset 0 0 0 1px lab(74.6637% 35.6658 -41.6731 / .45), 0 0 1.2rem lab(49.9752% 58.4869 -55.5982 / .2);\n  }\n\n  50% {\n    box-shadow: inset 0 0 0 1px lab(80.484% 35.5088 -41.7392 / .7), 0 0 2.2rem lab(55.5078% 66.0939 -55.2279 / .45);\n  }\n}\n\n@keyframes mif-twinkle {\n  0%, 100% {\n    opacity: 1;\n    transform: scale(1) rotate(0);\n  }\n\n  50% {\n    opacity: .6;\n    transform: scale(.7) rotate(25deg);\n  }\n}\n\n@keyframes mif-float {\n  0%, 100% {\n    transform: translateY(0);\n  }\n\n  50% {\n    transform: translateY(-6px);\n  }\n}\n\n@keyframes mif-blip {\n  0%, 8% {\n    opacity: 0;\n    transform: scale(.4);\n  }\n\n  12% {\n    opacity: 1;\n    transform: scale(1.5);\n  }\n\n  60%, 100% {\n    opacity: 0;\n    transform: scale(1);\n  }\n}\n\n@keyframes mif-skeleton {\n  to {\n    background-position: -250% 0;\n  }\n}\n\n@keyframes mif-indeterminate {\n  0% {\n    transform: translateX(-110%);\n  }\n\n  100% {\n    transform: translateX(260%);\n  }\n}\n\n@keyframes mif-drift-a {\n  to {\n    transform: translate(14vmax, 10vmax) scale(1.2);\n  }\n}\n\n@keyframes mif-drift-b {\n  to {\n    transform: translate(-12vmax, -14vmax) scale(1.15);\n  }\n}\n\n@keyframes mif-drift-c {\n  to {\n    transform: translate(-20vmax, 8vmax) scale(.8);\n  }\n}\n\n@keyframes mif-lg-spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n\n@keyframes mif-lg-snap {\n  0%, 80%, 100% {\n    transform: rotate(0) scale(1);\n  }\n\n  86% {\n    transform: rotate(-32deg) scale(.68);\n  }\n\n  92% {\n    transform: rotate(8deg) scale(1.1);\n  }\n\n  96% {\n    transform: rotate(0) scale(.98);\n  }\n}\n\n@keyframes mif-lg-frame {\n  0%, 80%, 100% {\n    transform: scale(1);\n  }\n\n  86% {\n    transform: scale(.88);\n  }\n\n  92% {\n    transform: scale(1.05);\n  }\n}\n\n@keyframes mif-lg-flash {\n  0%, 85% {\n    opacity: 0;\n    transform: scale(.6);\n  }\n\n  87% {\n    opacity: .95;\n    transform: scale(.9);\n  }\n\n  100% {\n    opacity: 0;\n    transform: scale(2.1);\n  }\n}\n\n@keyframes mif-lg-core {\n  0%, 80%, 100% {\n    opacity: .9;\n    transform: scale(1);\n  }\n\n  87% {\n    opacity: 1;\n    transform: scale(2.1);\n  }\n\n  94% {\n    transform: scale(.9);\n  }\n}\n\n@keyframes mif-orb-in {\n  0% {\n    opacity: 0;\n    transform: scale(.2) rotate(-90deg);\n  }\n\n  100% {\n    opacity: 1;\n    transform: none;\n  }\n}\n\n@keyframes mif-orb-bob {\n  0%, 100% {\n    translate: 0;\n  }\n\n  50% {\n    translate: 0 -6px;\n  }\n}\n\n@keyframes mif-orb-ping {\n  0% {\n    opacity: .9;\n    transform: scale(1);\n  }\n\n  100% {\n    opacity: 0;\n    transform: scale(2.1);\n  }\n}\n\n@keyframes mif-orb-badge {\n  0%, 100% {\n    transform: scale(1);\n  }\n\n  50% {\n    transform: scale(1.14);\n  }\n}\n\n/* ---- iOS Safari tweaks ---- */\n#manage-instagram-followers-root { -webkit-text-size-adjust: 100%; }\n#manage-instagram-followers-root input,\n#manage-instagram-followers-root select,\n#manage-instagram-followers-root textarea { font-size: 16px !important; }\n#manage-instagram-followers-root .app-header { flex-wrap: wrap; row-gap: 0.6rem; }\n#manage-instagram-followers-root .brand-block { flex: 1 1 auto; min-width: 8.5rem; }\n#manage-instagram-followers-root #appTitle { white-space: nowrap; overflow-wrap: normal; }\n#manage-instagram-followers-root .header-actions { margin-left: auto; }\n@media (max-width: 39.99rem) {\n  #manage-instagram-followers-root .list-heading { position: static; }\n  #manage-instagram-followers-root .footer-status { display: none; }\n  #manage-instagram-followers-root .app-footer { padding-top: 0.5rem; padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px)); }\n  #manage-instagram-followers-root .developer-credit { padding: 0.35rem 0.8rem; min-height: 0; }\n  #manage-instagram-followers-root .credit-mark svg { width: 20px; height: 20px; }\n  #manage-instagram-followers-root .tools-grid { padding: var(--space-sm) var(--space-md) 0; }\n  #manage-instagram-followers-root .diagnostic-button { margin-left: var(--space-md); margin-bottom: var(--space-md); }\n}\n@media (max-width: 30rem) {\n  #manage-instagram-followers-root .kicker-sep,\n  #manage-instagram-followers-root .kicker-ver { display: none; }\n}\n";
  (document.head || document.documentElement).appendChild(__css);

  /* ===== html.js ===== */
  (function () {
const init = () => {
  const existingRoot = document.getElementById("manage-instagram-followers-root");
  if (existingRoot) existingRoot.remove();

  const icon = (name, size = 18, cls = "") =>
    `<svg class="icon ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" aria-hidden="true"><use href="#mif-i-${name}"/></svg>`;


  // IG Snapper logo: viewfinder frame + rotating aperture that "snaps".
  const logoMark = (cls = "", size = 32, draw = false) => {
    const d = draw ? ' pathLength="100"' : "";
    return `<svg class="snap-logo ${cls}${draw ? " lg-draw" : ""}" viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" aria-hidden="true" focusable="false">
      <g class="lg-frame" stroke="url(#mif-grad)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path${d} d="M6 16V11a5 5 0 0 1 5-5h5"/>
        <path${d} d="M32 6h5a5 5 0 0 1 5 5v5"/>
        <path${d} d="M42 32v5a5 5 0 0 1-5 5h-5"/>
        <path${d} d="M16 42h-5a5 5 0 0 1-5-5v-5"/>
      </g>
      <circle class="lg-flash" cx="24" cy="24" r="10" stroke="url(#mif-grad-cool)" stroke-width="2"/>
      <g class="lg-spin"><g class="lg-snap"><g transform="translate(12 12)" stroke="url(#mif-grad)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        <circle${d} cx="12" cy="12" r="10"/>
        <path${d} d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/>
      </g></g></g>
      <circle class="lg-core" cx="24" cy="24" r="2.4" fill="url(#mif-grad-cool)"/>
      <g class="lg-orbit"><circle cx="24" cy="2.6" r="1.7" fill="#4fe3ff"/></g>
    </svg>`;
  };

  const root = document.createElement("div");
  root.id = "manage-instagram-followers-root";
  root.innerHTML = `
    <svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="mif-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#8f7bff" />
          <stop offset="0.55" stop-color="#e45bd6" />
          <stop offset="1" stop-color="#ff8a5c" />
        </linearGradient>
        <linearGradient id="mif-grad-cool" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#4fe3ff" />
          <stop offset="1" stop-color="#8f7bff" />
        </linearGradient>
        <radialGradient id="mif-sweep" cx="0" cy="1" r="1">
          <stop offset="0" stop-color="#4fe3ff" stop-opacity="0.55" />
          <stop offset="1" stop-color="#4fe3ff" stop-opacity="0" />
        </radialGradient>
        <symbol id="mif-i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
        <symbol id="mif-i-x" viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
        <symbol id="mif-i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-chevron-left" viewBox="0 0 24 24"><path d="m15 6-6 6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-chevron-down" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-refresh" viewBox="0 0 24 24"><path d="M20 6v5h-5M4 18v-5h5M18.5 9A7 7 0 0 0 6 6.5L4 9m2 6a7 7 0 0 0 12 2.5L20 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-lock" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
        <symbol id="mif-i-shield" viewBox="0 0 24 24"><path d="M12 3 4.5 6v5.5c0 4.4 3.1 8 7.5 9.5 4.4-1.5 7.5-5.1 7.5-9.5V6L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m9 12 2.2 2.2L15.2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-star" viewBox="0 0 24 24"><path d="m12 3.6 2.55 5.2 5.7.83-4.13 4.02.98 5.7L12 16.7l-5.1 2.65.98-5.7L3.75 9.63l5.7-.83L12 3.6Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-verified" viewBox="0 0 24 24"><path d="m12 2.8 2.3 1.7 2.8-.1.9 2.7 2.3 1.6-.9 2.7.9 2.7-2.3 1.6-.9 2.7-2.8-.1L12 21.2l-2.3-1.7-2.8.1-.9-2.7-2.3-1.6.9-2.7-.9-2.7 2.3-1.6.9-2.7 2.8.1L12 2.8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m8.6 12.1 2.3 2.3 4.5-4.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-user-plus" viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 8c-.7-3.2-2.7-5-6-5s-5.3 1.8-6 5m13-9h5m-2.5-2.5v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-user-check" viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6.5 8c.7-3.2 2.7-5 6.5-5 1.6 0 3 .4 4 1.1m2 2.4 2 2 3.6-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-user-minus" viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 8c.7-3.2 2.7-5 6-5s5.3 1.8 6 5m1-9h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-user-x" viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 8c.7-3.2 2.7-5 6-5 1.9 0 3.4.5 4.5 1.5M16 9l5 5m0-5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-swap" viewBox="0 0 24 24"><path d="M7 7h12m0 0-3-3m3 3-3 3M17 17H5m0 0 3-3m-3 3 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-save" viewBox="0 0 24 24"><path d="M5 4h11l3 3v13H5V4Zm3 0v5h7V4M8 20v-6h8v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-history" viewBox="0 0 24 24"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5M3.5 4v4.5H8M12 8v4.5l3 1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-download" viewBox="0 0 24 24"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-table" viewBox="0 0 24 24"><path d="M4 5.5h16v13H4v-13Zm0 5h16M10 5.5v13" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-braces" viewBox="0 0 24 24"><path d="M9 4c-2 0-3 1-3 3v2c0 1.5-.8 2.5-2 3 1.2.5 2 1.5 2 3v2c0 2 1 3 3 3M15 4c2 0 3 1 3 3v2c0 1.5.8 2.5 2 3-1.2.5-2 1.5-2 3v2c0 2-1 3-3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-cloud-up" viewBox="0 0 24 24"><path d="M7 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 18 9.5 4.3 4.3 0 0 1 17 18M12 20v-7m0 0-2.5 2.5M12 13l2.5 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-rotate" viewBox="0 0 24 24"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5m0-4.5v4.5H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 10.5V16m0-8.5h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
        <symbol id="mif-i-alert" viewBox="0 0 24 24"><path d="M12 4 2.8 19.5h18.4L12 4Zm0 5.5v4.5m0 2.7h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-check-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="m8 12.4 2.8 2.8 5.2-5.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-sparkle" viewBox="0 0 24 24"><path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-compare" viewBox="0 0 24 24"><circle cx="9" cy="12" r="5.5" stroke="currentColor" stroke-width="1.8"/><circle cx="15" cy="12" r="5.5" stroke="currentColor" stroke-width="1.8"/></symbol>
        <symbol id="mif-i-eye" viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></symbol>
        <symbol id="mif-i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="currentColor"/></symbol>
        <symbol id="mif-i-sliders" viewBox="0 0 24 24"><path d="M4 7h9m4 0h3M4 17h3m4 0h9M15 5v4M9 15v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
        <symbol id="mif-i-copy" viewBox="0 0 24 24"><path d="M9 9h10.5v11H9V9Zm-4 7V4h10.5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></symbol>
        <symbol id="mif-i-stop" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/></symbol>
        <symbol id="mif-i-eraser" viewBox="0 0 24 24"><path d="m5 15 8-9.5 6 5-6.5 8H8L5 15Zm3 3.5h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-checks" viewBox="0 0 24 24"><path d="m3.5 12.5 3.5 3.5 6-7m-1 7.5 1 .5 7-8.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
        <symbol id="mif-i-chart" viewBox="0 0 24 24"><path d="M5 20V10m7 10V4m7 16v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
      </defs>
    </svg>

    <div class="overlay" id="overlay">
      <div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div>
      <section class="my-component" role="dialog" aria-modal="true" aria-labelledby="appTitle" aria-describedby="info-text">
        <span class="panel-spotlight" aria-hidden="true"></span>

        <div class="preloader" aria-hidden="true">
          <div class="pre-grid"></div>
          <div class="pre-core">
            <svg class="pre-logo" viewBox="0 0 120 120" width="150" height="150" fill="none">
              <circle class="pre-ring pre-ring-a" cx="60" cy="60" r="56" stroke="url(#mif-grad)" stroke-width="1.5" pathLength="100" />
              <circle class="pre-ring pre-ring-b" cx="60" cy="60" r="46" stroke="url(#mif-grad-cool)" stroke-width="1" pathLength="100" />
              <g class="pre-orbit"><circle cx="60" cy="4" r="3.4" fill="url(#mif-grad)" /></g>
              <g class="pre-orbit pre-orbit-rev"><circle cx="60" cy="14" r="2.4" fill="#4fe3ff" /></g>
            </svg>
            ${logoMark("pre-snap", 82, true)}
          </div>
          <p class="pre-title"><span>IG</span><b>Snapper</b></p>
          <div class="pre-progress"><i></i><span class="pre-pct"></span></div>
          <p class="pre-credit"><span>Made by</span><strong>Alexander Weng</strong></p>
        </div>

        <header class="app-header">
          <div class="brand-block">
            <span class="brand-mark" aria-hidden="true">${logoMark("bm-logo", 36)}</span>
            <div class="brand-copy">
              <h1 id="appTitle" data-i18n="appTitle">IG Snapper</h1>
              <p class="app-kicker"><span class="live-dot" aria-hidden="true"></span>Instagram<span class="kicker-sep" aria-hidden="true"></span><span class="kicker-ver">v2.3.1</span></p>
            </div>
          </div>

          <div class="header-actions">
            <button type="button" id="licenseChip" class="license-chip" hidden>${icon("shield", 14)}<span id="licenseChipText"></span></button>
            <div class="language-switch" role="group" aria-label="Language" data-active="en">
              <span class="lang-thumb" aria-hidden="true"></span>
              <button type="button" class="language-button" data-locale="th" aria-pressed="false">TH</button>
              <button type="button" class="language-button" data-locale="en" aria-pressed="true">ENG</button>
            </div>
            <button type="button" id="historyButton" class="icon-button history-trigger" data-i18n-aria-label="history" aria-label="History" data-i18n-title="history" title="History">${icon("history", 20)}</button>
            <button type="button" id="closeExtensionButton" class="icon-button" data-i18n-aria-label="close" aria-label="Close">${icon("x", 20)}</button>
          </div>
        </header>

        <div id="licenseBanner" class="license-banner" hidden>
          <span class="lb-icon" aria-hidden="true">${icon("lock", 16)}</span>
          <span class="lb-text" data-i18n="licenseBannerText">IG Snapper is not activated yet.</span>
          <button type="button" id="licenseBannerButton" class="license-banner-button" data-i18n="licenseBannerButton">Enter key</button>
        </div>

        <div class="intro-block">
          <div class="hero">
            <div class="hero-copy">
              <span class="intro-eyebrow">${icon("sparkle", 14)}<span data-i18n="introEyebrow">Connection checkup</span></span>
              <h2 data-i18n="introTitle">See who doesn’t follow you back.</h2>
              <p id="info-text" data-i18n="introBody">Compare your connections, find non-followers, and clean up your following list.</p>
              <button type="button" id="findNonFollowersButton" class="primary-cta data-action-control">
                <span class="cta-label" data-i18n="findNonFollowers">Find non-followers</span>
                <span class="cta-arrow">${icon("arrow-right", 18)}</span>
                <i class="cta-shine" aria-hidden="true"></i>
              </button>
            </div>
            <div class="hero-visual" aria-hidden="true">
              <svg viewBox="0 0 200 200" width="200" height="200" fill="none">
                <circle cx="100" cy="100" r="92" class="rd-ring" />
                <circle cx="100" cy="100" r="68" class="rd-ring" />
                <circle cx="100" cy="100" r="44" class="rd-ring" />
                <circle cx="100" cy="100" r="20" class="rd-ring" />
                <path class="rd-axis" d="M100 8v184M8 100h184" />
                <g class="rd-sweep"><path d="M100 100V8A92 92 0 0 1 192 100Z" fill="url(#mif-sweep)" /><path d="M100 100V8" stroke="#4fe3ff" stroke-width="1.5" stroke-linecap="round" /></g>
                <circle class="rd-dot rd-dot-a" cx="146" cy="62" r="4" />
                <circle class="rd-dot rd-dot-b" cx="62" cy="128" r="3.4" />
                <circle class="rd-dot rd-dot-c" cx="128" cy="142" r="3" />
                <circle class="rd-dot rd-dot-d" cx="78" cy="58" r="2.6" />
                <circle cx="100" cy="100" r="5" fill="url(#mif-grad)" />
              </svg>
            </div>
          </div>

          <p class="privacy-note">
            ${icon("shield", 16)}
            <span data-i18n="privacyNote">Your connection data stays in this browser.</span>
          </p>
        </div>

        <nav id="listTabs" class="list-tabs" aria-label="Connection lists" data-i18n-aria-label="listsLabel" hidden>
          <button type="button" id="loadFollowingButton" class="list-tab data-action-control">
            ${icon("user-check", 18)}
            <span data-i18n="followingTab">Following</span>
          </button>
          <button type="button" id="loadFollowersButton" class="list-tab data-action-control">
            ${icon("user-plus", 18)}
            <span data-i18n="followersTab">Followers</span>
          </button>
        </nav>

        <div id="notice" class="notice" role="status" aria-live="polite" hidden>
          <span class="notice-icon">
            ${icon("info", 18, "ni ni-info")}${icon("alert", 18, "ni ni-warning")}${icon("alert", 18, "ni ni-error")}${icon("check-circle", 18, "ni ni-success")}
          </span>
          <span id="noticeText"></span>
          <button type="button" id="dismissNoticeButton" class="notice-dismiss" data-i18n-aria-label="dismiss" aria-label="Dismiss">${icon("x", 16)}</button>
        </div>

        <div class="workspace" id="workspace" hidden>
          <div id="titleAndFilter" class="list-heading">
            <div class="title-copy">
              <button type="button" id="backHomeButton" class="back-button" data-i18n-aria-label="backHome" aria-label="Back to start">${icon("chevron-left", 18)}</button>
              <div class="title-text">
                <h2 id="title">Following</h2>
                <p id="resultsSummary" class="results-summary" aria-live="polite"></p>
              </div>
              <button type="button" id="refreshButton" class="refresh-button data-action-control" data-i18n-aria-label="refresh" aria-label="Refresh">${icon("refresh", 18)}</button>
            </div>
            <div class="filter-buttons">
              <button type="button" id="filterAllButton" class="filter data-action-control filter-active" data-filter="all"><span data-i18n="allFilter">All</span><span class="filter-count" data-count="all"></span></button>
              <button type="button" id="filterNotFollowingBackButton" class="filter data-action-control" data-filter="notFollowingBack"><span data-i18n="nonFollowersFilter">Not following you</span><span class="filter-count" data-count="notFollowingBack"></span></button>
              <button type="button" id="filterMutualButton" class="filter data-action-control" data-filter="mutual"><span data-i18n="mutualFilter">Mutual</span><span class="filter-count" data-count="mutual"></span></button>
              <button type="button" id="filterNotFollowedBackButton" class="filter data-action-control" data-filter="notFollowedBack"><span data-i18n="notFollowedBackFilter">You don’t follow</span><span class="filter-count" data-count="notFollowedBack"></span></button>
              <button type="button" id="filterRequestedButton" class="filter data-action-control" data-filter="requested"><span data-i18n="requestedFilter">Requested</span><span class="filter-count" data-count="requested"></span></button>
            </div>
          </div>

          <div class="input-group" id="searchGroup">
            <div class="search-control">
              <label for="searchInput" class="sr-only" data-i18n="searchLabel">Search accounts</label>
              <div class="search-field">
                ${icon("search", 18)}
                <input type="search" id="searchInput" data-i18n-placeholder="searchPlaceholder" placeholder="Username or name" autocomplete="off" />
              </div>
            </div>
            <div class="sort-control">
              <label for="sortSelect" class="sr-only" data-i18n="sortLabel">Sort</label>
              <div class="select-wrap">
                <select id="sortSelect" class="sort-select data-action-control">
                  <option value="relationship" data-i18n="sortRelationship">Relationship</option>
                  <option value="username" data-i18n="sortUsername">Username</option>
                  <option value="name" data-i18n="sortName">Name</option>
                  <option value="ratio" data-i18n="sortRatio">Follower ratio</option>
                </select>
                ${icon("chevron-down", 16)}
              </div>
            </div>
            <div class="signal-control">
              <label for="signalFilter" class="sr-only" data-i18n="signalLabel">Signals</label>
              <div class="select-wrap">
                <select id="signalFilter" class="sort-select data-action-control">
                  <option value="all" data-i18n="signalAll">All signals</option>
                  <option value="protected" data-i18n="signalProtected">Protected</option>
                  <option value="verified" data-i18n="signalVerified">Verified</option>
                  <option value="private" data-i18n="signalPrivate">Private</option>
                  <option value="highRatio" data-i18n="signalHighRatio">High follower ratio</option>
                </select>
                ${icon("chevron-down", 16)}
              </div>
            </div>
          </div>

          <p id="updatedAt" class="updated-at" aria-live="polite"></p>

          <div class="user-list" id="userList"></div>

          <div class="loader" id="loader" aria-hidden="true">
            <div class="scan-visual" aria-hidden="true">
              <svg viewBox="0 0 120 120" width="96" height="96" fill="none">
                <circle cx="60" cy="60" r="54" class="sc-ring" />
                <circle cx="60" cy="60" r="36" class="sc-ring" />
                <circle cx="60" cy="60" r="18" class="sc-ring" />
                <g class="sc-sweep"><path d="M60 60V6A54 54 0 0 1 114 60Z" fill="url(#mif-sweep)" /><path d="M60 60V6" stroke="#4fe3ff" stroke-width="1.5" stroke-linecap="round" /></g>
                <circle class="sc-blip sc-blip-a" cx="88" cy="38" r="3" />
                <circle class="sc-blip sc-blip-b" cx="38" cy="78" r="2.6" />
                <circle cx="60" cy="60" r="3.6" fill="url(#mif-grad)" />
              </svg>
            </div>
            <p id="loadingProgress" class="loading-progress" data-i18n="loadingConnections">Comparing your connections…</p>
            <div class="scan-bar" aria-hidden="true"><i></i></div>
            <button type="button" id="cancelLoadButton" class="text-button loader-cancel"><span data-i18n="cancelLoad">Cancel</span></button>
          </div>

          <details class="advanced-panel" id="advancedPanel">
            <summary>
              <span class="adv-icon">${icon("sliders", 18)}</span>
              <span class="adv-text"><span data-i18n="advancedTitle">Tools</span><span class="advanced-summary-note" data-i18n="advancedSummary">Export and backup</span></span>
              ${icon("chevron-down", 18, "adv-chevron")}
            </summary>
          <div class="tools-grid">
            <button type="button" class="tool-button" id="saveSnapshotButton">${icon("save", 16)}<span data-i18n="saveSnapshot">Save snapshot</span></button>
            <button type="button" class="tool-button" id="exportCsvButton">${icon("table", 16)}<span data-i18n="exportCsv">Export CSV</span></button>
            <button type="button" class="tool-button" id="exportJsonButton">${icon("braces", 16)}<span data-i18n="exportJson">Export JSON</span></button>
            <button type="button" class="tool-button" id="backupButton">${icon("cloud-up", 16)}<span data-i18n="backup">Backup</span></button>
            <button type="button" class="tool-button" id="restoreButton">${icon("rotate", 16)}<span data-i18n="restore">Restore</span></button>
            <input type="file" id="restoreInput" accept="application/json,.json" hidden>
          </div>
            <button type="button" id="copyDiagnosticsButton" class="diagnostic-button">${icon("copy", 16)}<span data-i18n="copyDiagnostics">Copy diagnostic report</span></button>
          </details>
        </div>

        <footer class="app-footer">
          <div class="footer-status">
            <span class="status-dot" aria-hidden="true"></span>
            <span data-i18n="footerNote">Actions are verified with Instagram before the interface changes.</span>
          </div>
          <div class="developer-credit" aria-label="Made by Alexander Weng">
            <span class="credit-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="26" height="26" fill="none"><path d="M3 22 8 8l5 14M5 17.5h6" stroke="url(#mif-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="m15.5 8 2.2 14 3.3-9 3.3 9 2.2-14" stroke="url(#mif-grad-cool)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
            <span class="credit-text"><span class="credit-label">Made by</span><strong class="credit-name">Alexander Weng</strong></span>
          </div>
        </footer>

        <div id="historyDialog" class="confirm-backdrop" hidden>
          <div class="history-card" role="dialog" aria-modal="true" aria-labelledby="historyTitle">
            <div class="history-header">
              <span class="dialog-icon">${icon("history", 20)}</span>
              <div>
                <h2 id="historyTitle" data-i18n="historyTitle">Scan history</h2>
                <p id="historySubtitle" class="results-summary" data-i18n="historySubtitle">Local snapshots and changes since previous scans.</p>
              </div>
              <button type="button" id="closeHistoryButton" class="icon-button" data-i18n-aria-label="closeHistory" aria-label="Close history">${icon("x", 20)}</button>
            </div>
            <div id="historySummary" class="history-summary"></div>
            <div id="historyList" class="history-list"></div>
            <div id="historyDetail" class="history-detail" hidden>
              <div class="detail-top">
                <button type="button" id="historyDetailBack" class="text-button detail-back">${icon("chevron-left", 16)}<span data-i18n="historyDetailBack">Back to history</span></button>
                <button type="button" id="historyCopyButton" class="text-button detail-copy">${icon("copy", 16)}<span data-i18n="copyUsernames">Copy usernames</span></button>
              </div>
              <p id="historyDetailRange" class="detail-range"></p>
              <div id="historyDetailTabs" class="detail-tabs" role="tablist"></div>
              <p id="historyDetailNote" class="detail-note"></p>
              <div id="historyDetailList" class="profile-grid"></div>
            </div>
          </div>
        </div>

        <div id="licenseDialog" class="confirm-backdrop" hidden>
          <div class="confirm-card license-card" role="dialog" aria-modal="true" aria-labelledby="licenseTitle">
            <span class="dialog-icon">${icon("shield", 22)}</span>
            <h2 id="licenseTitle" data-i18n="licenseTitle">Activate IG Snapper</h2>
            <p data-i18n="licenseBody">Enter your license key to unlock the app. One key works on 1 Instagram account and up to 2 browsers.</p>
            <input type="text" id="licenseInput" class="license-input" placeholder="IGS-XXXXX-XXXXX-XXXXX-XXXXX" autocomplete="off" spellcheck="false" maxlength="40" />
            <p id="licenseMessage" class="license-message" role="status" aria-live="polite"></p>
            <a id="licenseBuyLink" class="license-buy" target="_blank" rel="noopener noreferrer" hidden><span data-i18n="licenseGetKey">Get a key</span>${icon("arrow-right", 14)}</a>
            <div class="confirm-actions">
              <button type="button" id="licenseCloseButton" class="text-button" data-i18n="cancel">Cancel</button>
              <button type="button" id="licenseActivateButton" class="license-activate" data-i18n="licenseActivate">Activate</button>
            </div>
          </div>
        </div>

      </section>
    </div>

    <div class="hud-orb" id="hudOrb" role="button" tabindex="0" hidden data-i18n-aria-label="orbOpen" aria-label="Open IG Snapper">
      <span class="orb-halo" aria-hidden="true"></span>
      <svg class="orb-ring" viewBox="0 0 84 84" fill="none" aria-hidden="true">
        <circle class="orb-ring-a" cx="42" cy="42" r="39" stroke="url(#mif-grad)" stroke-width="2" stroke-linecap="round" stroke-dasharray="46 22 18 24" />
        <circle class="orb-ring-b" cx="42" cy="42" r="33" stroke="url(#mif-grad-cool)" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="3 9" />
      </svg>
      <span class="orb-core" aria-hidden="true">${logoMark("orb-logo", 42)}</span>
      <span class="orb-badge" id="hudOrbBadge" hidden>0</span>
      <button type="button" class="orb-quit" id="hudOrbQuit" data-i18n-aria-label="orbQuit" aria-label="Quit IG Snapper">${icon("x", 12)}</button>
      <span class="orb-name" aria-hidden="true"><i class="orb-name-dot"></i>IG Snapper</span>
    </div>
  `;

  document.body.insertBefore(root, document.body.firstChild);

  const preloader = root.querySelector(".preloader");
  setTimeout(() => preloader?.remove(), 3200);
};

init();

if (!window.__manageInstagramFollowersStorageBridge) {
  window.__manageInstagramFollowersStorageBridge = true;
  window.addEventListener("message", async (event) => {
    if (event.source !== window || !event.data?.mifStorage) return;
    const { action, payload, requestId } = event.data;

    if (action === "get") {
      const state = await chrome.runtime.sendMessage({
        mifStorage: true,
        action: "get",
        payload: { accountId: String(payload?.accountId || "default") },
      });
      window.postMessage(
        {
          mifStorage: true,
          action: "state",
          requestId,
          payload: {
            locale: state?.locale,
            rateLimits: state?.rateLimits,
            whitelist: state?.whitelist,
            snapshots: state?.snapshots,
            settings: state?.settings,
          },
        },
        window.location.origin
      );
    }

    if (action === "license") {
      const result = await chrome.runtime.sendMessage({
        mifLicense: true,
        op: payload?.op === "activate" ? "activate" : "status",
        key: String(payload?.key || "").slice(0, 64),
        accountId: String(payload?.accountId || "").slice(0, 24),
      });
      window.postMessage(
        { mifStorage: true, action: "licenseResult", requestId, payload: result || { active: false, reason: "server_error" } },
        window.location.origin
      );
      return;
    }

    if (action === "setLocale" && ["en", "th"].includes(payload)) {
      await chrome.runtime.sendMessage({
        mifStorage: true,
        action: "setLocale",
        payload,
      });
    }

    if (action === "setState") {
      const payload = event.data?.payload || {};
      const sanitizedWhitelist = Array.isArray(payload.whitelist)
        ? payload.whitelist.map((value) => String(value)).filter(Boolean).slice(0, 5000)
        : [];
      const accountId = String(payload.accountId || "default");
      const existing = await chrome.storage.local.get("whitelists");
      const whitelists = existing.whitelists && typeof existing.whitelists === "object"
        ? existing.whitelists
        : {};
      whitelists[accountId] = sanitizedWhitelist;
      const existingSnapshotsState = await chrome.storage.local.get("snapshots");
      const incomingSnapshots = Array.isArray(payload.snapshots) ? payload.snapshots.slice(0, 12) : [];
      const otherAccountSnapshots = Array.isArray(existingSnapshotsState.snapshots)
        ? existingSnapshotsState.snapshots.filter((snapshot) => String(snapshot?.viewerId || "default") !== accountId)
        : [];
      const snapshots = [...incomingSnapshots, ...otherAccountSnapshots]
        .sort((a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0))
        .slice(0, 48);
      const sanitized = {
        locale: ["en", "th"].includes(payload.locale) ? payload.locale : "en",
        snapshots,
        settings: payload.settings && typeof payload.settings === "object" ? payload.settings : {},
        whitelists,
      };
      await chrome.storage.local.set(sanitized);
      if (payload.rateLimits) {
        const rateLimits = {
          follow: Array.isArray(payload.rateLimits.follow) ? payload.rateLimits.follow.filter(Number.isFinite).slice(-60) : [],
        };
        await chrome.storage.session.set({ rateLimits });
      }
      window.postMessage({ mifStorage: true, action: "saved", requestId }, window.location.origin);
      return;
    }

    if (action === "setRateLimits") {
      const sanitized = {
        follow: Array.isArray(payload?.follow)
          ? payload.follow.filter(Number.isFinite)
          : [],
      };
      await chrome.runtime.sendMessage({
        mifStorage: true,
        action: "setRateLimits",
        payload: sanitized,
      });
    }
  });
}

  }).call(window);

  /* ===== core.js ===== */
  (function () {
(function exposeManageInstagramFollowersCore(root, factory) {
  const core = factory();
  if (typeof module === "object" && module.exports) module.exports = core;
  if (root) root.ManageInstagramFollowersCore = core;
})(typeof window !== "undefined" ? window : globalThis, function createCore() {
  function normalizeConnectionUser(user, type) {
    const friendship = user.friendship_status || {};
    return {
      ...user,
      id: String(user.id || user.pk),
      followed_by_viewer:
        user.followed_by_viewer ?? friendship.following ?? type === "Following",
      follows_viewer:
        user.follows_viewer ?? friendship.followed_by ?? type === "Followers",
      requested_by_viewer:
        user.requested_by_viewer ?? friendship.outgoing_request ?? false,
    };
  }

  function getRelationshipState(user) {
    if (user.requested_by_viewer) {
      return {
        infoKey: "requestSent",
        labelKey: null,
        action: null,
        tone: "requested",
      };
    }
    if (user.followed_by_viewer && user.follows_viewer) {
      return {
        infoKey: "mutual",
        labelKey: null,
        action: null,
        tone: "mutual",
      };
    }
    if (user.followed_by_viewer && !user.follows_viewer) {
      return {
        infoKey: "notFollowingYou",
        labelKey: null,
        action: null,
        tone: "nonFollower",
      };
    }
    if (!user.followed_by_viewer && user.follows_viewer) {
      return {
        infoKey: "youDontFollow",
        labelKey: "followBack",
        action: "follow",
        tone: "notFollowedBack",
      };
    }
    return {
      infoKey: "neither",
      labelKey: "follow",
      action: "follow",
      tone: "none",
    };
  }

  function filterUsers(users, filter) {
    if (filter === "notFollowingBack") {
      return users.filter(
        (user) => user.followed_by_viewer && !user.follows_viewer
      );
    }
    if (filter === "mutual") {
      return users.filter(
        (user) => user.followed_by_viewer && user.follows_viewer
      );
    }
    if (filter === "notFollowedBack") {
      return users.filter(
        (user) => !user.followed_by_viewer && user.follows_viewer
      );
    }
    if (filter === "requested") {
      return users.filter((user) => user.requested_by_viewer);
    }
    return [...users];
  }

  function sortUsers(users, sort, locale = "en") {
    const collator = new Intl.Collator(locale, { sensitivity: "base" });
    const result = [...users];
    if (sort === "username") {
      return result.sort((a, b) => collator.compare(a.username, b.username));
    }
    if (sort === "ratio") {
      return sortByRatio(result);
    }
    if (sort === "name") {
      return result.sort((a, b) =>
        collator.compare(a.full_name || a.username, b.full_name || b.username)
      );
    }
    if (sort === "relationship") {
      const order = {
        nonFollower: 0,
        notFollowedBack: 1,
        requested: 2,
        mutual: 3,
        none: 4,
      };
      return result.sort((a, b) => {
        const difference =
          order[getRelationshipState(a).tone] -
          order[getRelationshipState(b).tone];
        return difference || collator.compare(a.username, b.username);
      });
    }
    return result;
  }

  function countRelationships(users) {
    return users.reduce(
      (counts, user) => {
        counts.all += 1;
        const tone = getRelationshipState(user).tone;
        if (tone === "nonFollower") counts.notFollowingBack += 1;
        if (tone === "mutual") counts.mutual += 1;
        if (tone === "notFollowedBack") counts.notFollowedBack += 1;
        if (tone === "requested") counts.requested += 1;
        return counts;
      },
      {
        all: 0,
        notFollowingBack: 0,
        mutual: 0,
        notFollowedBack: 0,
        requested: 0,
      }
    );
  }

  function reconcileConnectionMaps(following, followers) {
    [following, followers].forEach((connections) => {
      connections?.forEach((user) => {
        if (following) user.followed_by_viewer = following.has(user.id);
        if (followers) user.follows_viewer = followers.has(user.id);
      });
    });
    return { following, followers };
  }

  function responseMatchesFriendshipAction(data, action) {
    const relationship = data?.friendship_status || data;
    const following = relationship?.following;
    const outgoingRequest = relationship?.outgoing_request;
    return action === "follow"
      ? following === true || outgoingRequest === true
      : following === false && outgoingRequest !== true;
  }


  function getAccountSignals(user) {
    const followerCount = Number(
      user.follower_count ?? user.followers_count ?? user?.edge_followed_by?.count ?? NaN
    );
    const followingCount = Number(
      user.following_count ?? user.follows_count ?? user?.edge_follow?.count ?? NaN
    );
    const mediaCount = Number(
      user.media_count ?? user.posts_count ?? user?.edge_owner_to_timeline_media?.count ?? NaN
    );
    const ratio = Number.isFinite(followerCount) && Number.isFinite(followingCount) && followingCount > 0
      ? followerCount / followingCount
      : null;
    return {
      verified: Boolean(user.is_verified || user.verified),
      private: Boolean(user.is_private || user.private),
      followerCount: Number.isFinite(followerCount) ? followerCount : null,
      followingCount: Number.isFinite(followingCount) ? followingCount : null,
      mediaCount: Number.isFinite(mediaCount) ? mediaCount : null,
      followerFollowingRatio: ratio,
    };
  }

  function compactSnapshotUsers(users = []) {
    const seen = new Set();
    return users.reduce((result, user) => {
      const id = String(user?.id ?? user?.pk ?? "");
      if (!id || seen.has(id)) return result;
      seen.add(id);
      result.push([
        id,
        String(user?.username ?? ""),
        String(user?.full_name ?? ""),
      ]);
      return result;
    }, []);
  }

  function buildSnapshot({ viewerId, following = [], followers = [], createdAt = Date.now() }) {
    return {
      id: `${String(viewerId || "unknown")}:${createdAt}`,
      viewerId: viewerId ? String(viewerId) : null,
      createdAt,
      following: compactSnapshotUsers(following),
      followers: compactSnapshotUsers(followers),
    };
  }

  function snapshotMap(list = []) {
    return new Map(
      list
        .filter(Array.isArray)
        .map(([id, username = "", fullName = ""]) => [
          String(id),
          { id: String(id), username: String(username || ""), full_name: String(fullName || "") },
        ])
    );
  }

  function diffSnapshotLists(previous = [], current = []) {
    const oldMap = snapshotMap(previous);
    const newMap = snapshotMap(current);
    const added = [];
    const removed = [];
    for (const [id, user] of newMap) if (!oldMap.has(id)) added.push(user);
    for (const [id, user] of oldMap) if (!newMap.has(id)) removed.push(user);
    return { added, removed };
  }

  function snapshotMembershipFingerprint(snapshot) {
    const ids = (list = []) => list
      .map((entry) => Array.isArray(entry) ? entry[0] : entry?.id ?? entry?.pk)
      .map((id) => String(id ?? "").trim())
      .filter(Boolean)
      .sort();
    return JSON.stringify([ids(snapshot?.following), ids(snapshot?.followers)]);
  }

  function diffSnapshots(previous, current) {
    if (!previous || !current) {
      return {
        comparable: false,
        following: { added: [], removed: [] },
        followers: { added: [], removed: [] },
        lostStillFollowing: [],
        bothRemoved: [],
      };
    }

    const following = diffSnapshotLists(previous.following, current.following);
    const followers = diffSnapshotLists(previous.followers, current.followers);
    const currentFollowingIds = new Set(snapshotMap(current.following).keys());
    const removedFollowingIds = new Set(following.removed.map((user) => String(user.id)));

    return {
      comparable: true,
      following,
      followers,
      // Accounts that stopped following the viewer but remain in the viewer's
      // current Following list. This is derived from the current snapshot, not
      // the live cache, so old history remains correct after an app restart.
      lostStillFollowing: followers.removed.filter((user) => currentFollowingIds.has(String(user.id))),
      // Accounts removed from both sides between the same two complete snapshots.
      bothRemoved: followers.removed.filter((user) => removedFollowingIds.has(String(user.id))),
    };
  }

  function filterBySignal(users, filter, protectedIds = new Set()) {
    if (!filter || filter === "all") return [...users];
    if (filter === "protected") return users.filter((user) => protectedIds.has(String(user.id)));
    if (filter === "verified") return users.filter((user) => getAccountSignals(user).verified);
    if (filter === "private") return users.filter((user) => getAccountSignals(user).private);
    if (filter === "highRatio") {
      return users.filter((user) => {
        const ratio = getAccountSignals(user).followerFollowingRatio;
        return ratio != null && ratio >= 5;
      });
    }
    return [...users];
  }

  function sortByRatio(users) {
    return [...users].sort((a, b) => {
      const ar = getAccountSignals(a).followerFollowingRatio;
      const br = getAccountSignals(b).followerFollowingRatio;
      if (ar == null && br == null) return String(a.username || "").localeCompare(String(b.username || ""));
      if (ar == null) return 1;
      if (br == null) return -1;
      return br - ar;
    });
  }

  return {
    buildSnapshot,
    compactSnapshotUsers,
    countRelationships,
    diffSnapshots,
    diffSnapshotLists,
    filterUsers,
    getAccountSignals,
    getRelationshipState,
    filterBySignal,
    normalizeConnectionUser,
    reconcileConnectionMaps,
    responseMatchesFriendshipAction,
    snapshotMap,
    snapshotMembershipFingerprint,
    sortByRatio,
    sortUsers,
  };
});

  }).call(window);

  /* ===== instagram-api.js ===== */
  (function () {
(function exposeManageInstagramFollowersTransport(root, factory) {
  const transport = factory(root || globalThis);
  if (typeof module === "object" && module.exports) module.exports = transport;
  if (root) root.ManageInstagramFollowersTransport = transport;
})(typeof window !== "undefined" ? window : globalThis, function createTransport(env) {
  const VIEWER_PROVIDERS = [
    {
      id: "instagram-web-account-self",
      build: () => `${env.location.origin}/api/v1/accounts/edit/web_form_data/`,
    },
    {
      id: "instagram-web-current-user",
      build: () => `${env.location.origin}/api/v1/accounts/current_user/?edit=true`,
    },
    {
      id: "instagram-i-current-user",
      build: () => `https://i.instagram.com/api/v1/accounts/current_user/?edit=true`,
    },
  ];

  const LIST_PROVIDERS = [
    {
      id: "instagram-web-rest-v1",
      build: (type, viewerId, params) =>
        `${env.location.origin}/api/v1/friendships/${viewerId}/${type.toLowerCase()}/?${params}` ,
    },
    {
      id: "instagram-i-rest-v1",
      build: (type, viewerId, params) =>
        `https://i.instagram.com/api/v1/friendships/${viewerId}/${type.toLowerCase()}/?${params}` ,
    },
  ];

  const ACTION_PROVIDERS = {
    follow: [
      {
        id: "instagram-web-follow-v1",
        build: (userId) => ({
          endpoint: `${env.location.origin}/api/v1/friendships/create/${userId}/`,
          body: new URLSearchParams({
            container_module: "profile",
            include_follow_friction_check: "true",
            nav_chain: "PolarisFeedRoot:feedPage:1:via_cold_start",
            user_id: userId,
          }),
        }),
      },
    ],
    verify: [
      {
        id: "instagram-web-friendship-show-v1",
        build: (userId) =>
          `${env.location.origin}/api/v1/friendships/show/${userId}/`,
      },
      {
        id: "instagram-i-friendship-show-v1",
        build: (userId) =>
          `https://i.instagram.com/api/v1/friendships/show/${userId}/`,
      },
    ],
  };

  let preferredListProviderId = null;
  const preferredActionProviderIds = new Map();
  let lastNetwork = null;
  let resolvedViewerId = null;
  let resolvingViewerPromise = null;

  function safeDecode(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  function readCookie(name) {
    const cookie = String(env.document?.cookie || "");
    const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`, "i"));
    return match ? safeDecode(match[1]) : null;
  }

  // Serialising Instagram's whole DOM is expensive and buildHeaders() used to do
  // it ~6 times per request. Cache the markup briefly so paging stays fast.
  let bodyHtmlCache = { at: 0, html: "" };
  function getBodyHtml() {
    const now = Date.now();
    if (!bodyHtmlCache.html || now - bodyHtmlCache.at > 15000) {
      bodyHtmlCache = { at: now, html: String(env.document?.body?.innerHTML || "") };
    }
    return bodyHtmlCache.html;
  }

  function readBodyValue(pattern) {
    const match = getBodyHtml().match(pattern);
    return match ? match[1] : null;
  }

  const REQUEST_TIMEOUT_MS = 20000;
  const MAX_PAGES = 600;
  const PAGE_RETRIES = 3;
  const sleep = (ms, signal) =>
    new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(makeAbortError());
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener("abort", () => { clearTimeout(timer); reject(makeAbortError()); }, { once: true });
    });
  function makeAbortError() {
    const error = new Error("Cancelled");
    error.name = "AbortError";
    return error;
  }

  function extractViewerIdFromPayload(data) {
    const candidates = [
      data?.user?.pk,
      data?.user?.id,
      data?.user?.user?.pk,
      data?.user?.user?.id,
      data?.data?.user?.pk,
      data?.data?.user?.id,
      data?.viewer?.pk,
      data?.viewer?.id,
      data?.config?.viewerId,
      data?.config?.viewer_id,
    ];
    const value = candidates.find((candidate) => candidate != null && String(candidate).trim() !== "");
    return value != null ? String(value) : null;
  }

  function getViewerId() {
    const cookieViewerId = readCookie("ds_user_id");
    if (cookieViewerId) return String(cookieViewerId);

    const direct =
      readBodyValue(/"viewerId":"(\w+)"/i) ||
      readBodyValue(/"viewer_id":"(\w+)"/i) ||
      readBodyValue(/"appScopedIdentity":"(\w+)"/i) ||
      readBodyValue(/"viewer_id":\s*"(\w+)"/i);

    if (direct) return direct;

    const sharedData = env.window?._sharedData || env._sharedData;
    const sharedViewerId =
      sharedData?.config?.viewerId ||
      sharedData?.config?.viewer_id ||
      sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user?.id;

    return sharedViewerId ? String(sharedViewerId) : null;
  }

  async function resolveViewerId() {
    const direct = getViewerId();
    if (direct) {
      resolvedViewerId = direct;
      return direct;
    }
    if (resolvedViewerId) return resolvedViewerId;
    if (resolvingViewerPromise) return resolvingViewerPromise;

    resolvingViewerPromise = (async () => {
      let lastError = null;
      for (const provider of VIEWER_PROVIDERS) {
        try {
          const endpoint = provider.build();
          const { response, data } = await requestJson(endpoint, {
            method: "GET",
            headers: { Accept: "application/json, text/plain, */*" },
          });
          if (!response.ok) {
            lastError = new Error(`Viewer lookup HTTP ${response.status}`);
            continue;
          }
          const viewer = extractViewerIdFromPayload(data);
          if (viewer) {
            resolvedViewerId = viewer;
            return viewer;
          }
          lastError = new Error(`Viewer ID missing in ${provider.id} response.`);
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError || new Error("Instagram viewer ID is unavailable.");
    })().finally(() => {
      resolvingViewerPromise = null;
    });

    return resolvingViewerPromise;
  }

  function buildHeaders() {
    const headers = {
      "X-Requested-With": "XMLHttpRequest",
      "X-Asbd-Id": readBodyValue(/"X-ASBD-ID":"([^"]+)"/i) || "129477",
      "X-Ig-Www-Claim":
        env.sessionStorage?.getItem("www-claim-v2") ||
        readBodyValue(/"wwwClaimV2":"([^"]+)"/i) ||
        "",
    };

    const csrfToken =
      readBodyValue(/(?<="csrf_token":").+?(?=")/i) || readCookie("csrftoken");
    if (csrfToken) headers["X-Csrftoken"] = csrfToken;

    headers["X-Ig-App-Id"] =
      readBodyValue(/(?<="X-IG-App-ID":").+?(?=")/i) ||
      readBodyValue(/"X-IG-App-ID":"([^"]+)"/i) ||
      "936619743392459";

    const rolloutHash =
      readBodyValue(/"rollout_hash":"([^"]+)"/i) ||
      readBodyValue(/"rolloutHash":"([^"]+)"/i);
    if (rolloutHash) headers["X-Instagram-Ajax"] = rolloutHash;

    return headers;
  }

  function findUsersArray(data) {
    const candidates = [
      data?.users,
      data?.items,
      data?.data?.users,
      data?.data?.items,
      data?.data?.followers?.users,
      data?.data?.following?.users,
    ];
    return candidates.find(Array.isArray) || null;
  }

  function findGraphQlEdges(data) {
    const candidates = [
      data?.data?.user?.edge_followed_by?.edges,
      data?.data?.user?.edge_follow?.edges,
      data?.data?.user?.edge_follow?.edges,
    ];
    const edges = candidates.find(Array.isArray);
    return edges ? edges.map((edge) => edge?.node).filter(Boolean) : null;
  }

  function extractUsers(data) {
    const users = findUsersArray(data);
    if (users) return { users, shape: "array" };

    const edges = findGraphQlEdges(data);
    if (edges) return { users: edges, shape: "graphql-edges" };

    return { users: null, shape: null };
  }

  function getNextCursor(data) {
    const pageInfo =
      data?.page_info ||
      data?.pagination?.page_info ||
      data?.data?.page_info ||
      data?.data?.user?.edge_followed_by?.page_info ||
      data?.data?.user?.edge_follow?.page_info;

    return (
      data?.next_max_id ??
      data?.pagination?.next_max_id ??
      data?.next_cursor ??
      data?.pagination_token ??
      pageInfo?.end_cursor ??
      null
    );
  }

  function hasMore(data, cursor) {
    // Prefer explicit pagination flags. If Instagram says another page exists
    // but omits the cursor, requestConnections() will reject the scan instead
    // of quietly treating a partial list as complete.
    if (
      data?.has_more === true ||
      data?.more_available === true ||
      data?.pagination?.has_more === true ||
      data?.pagination?.more_available === true ||
      data?.page_info?.has_next_page === true ||
      data?.data?.page_info?.has_next_page === true ||
      data?.data?.user?.edge_followed_by?.page_info?.has_next_page === true ||
      data?.data?.user?.edge_follow?.page_info?.has_next_page === true
    ) return true;

    if (data?.has_more === false || data?.more_available === false) return false;
    if (data?.pagination?.has_more === false || data?.pagination?.more_available === false) return false;
    if (data?.page_info?.has_next_page === false) return false;
    if (data?.data?.page_info?.has_next_page === false) return false;
    if (data?.data?.user?.edge_followed_by?.page_info?.has_next_page === false) return false;
    if (data?.data?.user?.edge_follow?.page_info?.has_next_page === false) return false;
    return Boolean(cursor);
  }

  function isUsableListPayload(data) {
    const extracted = extractUsers(data);
    if (!extracted.users) return false;
    return data?.status !== "fail" && data?.status !== "error";
  }

  function getOrderedProviders(providers, preferredId) {
    if (!preferredId) return providers;
    const preferred = providers.find((provider) => provider.id === preferredId);
    return preferred
      ? [preferred, ...providers.filter((provider) => provider.id !== preferredId)]
      : providers;
  }

  async function requestJson(endpoint, options = {}) {
    const { signal: outerSignal, timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    const onOuterAbort = () => controller.abort();
    if (outerSignal?.aborted) controller.abort();
    else outerSignal?.addEventListener("abort", onOuterAbort, { once: true });

    const requestOptions = {
      credentials: "include",
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        ...(fetchOptions.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        ...buildHeaders(),
        ...(fetchOptions.headers || {}),
      },
    };

    try {
      const response = await env.fetch(endpoint, requestOptions);
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      lastNetwork = { endpoint, status: response.status, ok: response.ok };
      return { response, data };
    } catch (error) {
      if (outerSignal?.aborted) throw makeAbortError();
      if (timedOut) {
        const timeoutError = new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
        timeoutError.code = "TIMEOUT";
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timer);
      outerSignal?.removeEventListener("abort", onOuterAbort);
    }
  }

  async function requestConnectionPage(type, viewerId, params, preferredId, signal) {
    let lastError = null;

    for (const provider of getOrderedProviders(LIST_PROVIDERS, preferredId)) {
      const endpoint = provider.build(type, viewerId, params);
      try {
        const { response, data } = await requestJson(endpoint, { signal });
        if (!response.ok) {
          lastError = new Error(`HTTP Error: ${response.status}`);
          lastError.status = response.status;
          lastError.retryAfter = Number(response.headers?.get?.("retry-after")) || 0;
          continue;
        }

        if (!isUsableListPayload(data)) {
          lastError = new Error(
            `Unsupported Instagram response schema from ${provider.id}.`
          );
          continue;
        }

        const extracted = extractUsers(data);
        preferredListProviderId = provider.id;

        return {
          providerId: provider.id,
          users: extracted.users,
          shape: extracted.shape,
          nextCursor: getNextCursor(data),
          hasMore: hasMore(data, getNextCursor(data)),
          data,
          status: response.status,
          endpoint,
        };
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        lastError = error;
      }
    }

    throw (
      lastError ||
      new Error(`No compatible Instagram connection endpoint is available.`)
    );
  }

  function isRetryable(error) {
    if (!error || error.name === "AbortError") return false;
    if (error.code === "TIMEOUT") return true;
    if (error.status) return error.status === 429 || error.status >= 500;
    return error instanceof TypeError; // network failure
  }

  // One page with exponential back-off, so a 429 or a hiccup pauses instead of
  // leaving the UI "loading" forever or aborting the whole scan.
  async function requestConnectionPageWithRetry(type, viewerId, params, preferredId, signal, onRetry) {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await requestConnectionPage(type, viewerId, params, preferredId, signal);
      } catch (error) {
        if (attempt >= PAGE_RETRIES || !isRetryable(error)) throw error;
        const wait = Math.max(error.retryAfter * 1000 || 0, 2000 * 2 ** attempt);
        onRetry?.({ attempt: attempt + 1, wait, status: error.status || null });
        await sleep(wait, signal);
      }
    }
  }

  async function requestConnections(type, onProgress, options = {}) {
    const { signal, pageDelayMs = 350 } = options;
    const viewerId = await resolveViewerId();

    const users = [];
    const seen = new Set();
    const seenCursors = new Set();
    let nextCursor = null;
    let page = 0;
    let providerId = null;

    do {
      if (signal?.aborted) throw makeAbortError();
      // The current web friendships endpoints expect the follow-list surface
      // parameters. `count` is advisory and `max_id` is the REST cursor.
      const params = new URLSearchParams({
        count: "200",
        search_surface: "follow_list_page",
        query: "",
        includes_hashtags: "false",
        enable_groups: "true",
      });
      if (nextCursor) params.set("max_id", nextCursor);

      const result = await requestConnectionPageWithRetry(
        type,
        viewerId,
        params,
        providerId || preferredListProviderId,
        signal,
        (retry) => onProgress?.({ count: users.length, page, retry, type })
      );
      providerId = result.providerId;

      let added = 0;
      for (const rawUser of result.users) {
        const id = String(rawUser?.id ?? rawUser?.pk ?? rawUser?.user?.id ?? rawUser?.user?.pk ?? "");
        if (!id || seen.has(id)) continue;
        seen.add(id);
        users.push(rawUser);
        added += 1;
      }

      page += 1;
      onProgress?.({
        type,
        count: users.length,
        page,
        providerId,
        endpoint: result.endpoint,
        shape: result.shape,
        nextCursor: result.nextCursor,
      });

      // Never cache or snapshot a partial list. These guards used to stop the
      // loop silently, which made missing pages look like genuine relationship changes.
      if (!result.hasMore) {
        nextCursor = null;
      } else {
        const cursor = result.nextCursor == null ? "" : String(result.nextCursor);
        if (!cursor) {
          throw new Error(`Incomplete ${type.toLowerCase()} scan: Instagram reported more pages but returned no cursor. Refresh and retry.`);
        }
        if (!added) {
          throw new Error(`Incomplete ${type.toLowerCase()} scan: a page contained no new accounts while more pages remained. Refresh and retry.`);
        }
        if (seenCursors.has(cursor)) {
          throw new Error(`Incomplete ${type.toLowerCase()} scan: Instagram repeated a pagination cursor. Refresh and retry.`);
        }
        if (page >= MAX_PAGES) {
          throw new Error(`Incomplete ${type.toLowerCase()} scan: the safety page limit was reached. Refresh and retry.`);
        }

        seenCursors.add(cursor);
        nextCursor = cursor;
        await sleep(pageDelayMs + Math.random() * 250, signal);
      }
    } while (nextCursor);

    return {
      users,
      providerId,
      pages: page,
      viewerId,
    };
  }

  async function requestAction(action, userId) {
    const providers = ACTION_PROVIDERS[action] || [];
    if (!providers.length) throw new Error(`Unsupported action: ${action}.`);
    const preferredId = preferredActionProviderIds.get(action);

    let lastError = null;
    for (const provider of getOrderedProviders(providers, preferredId)) {
      const request = provider.build(userId);
      try {
        const { response, data } = await requestJson(request.endpoint, {
          method: "POST",
          body: request.body,
        });

        if (!response.ok || data?.status === "fail") {
          lastError = {
            error: new Error(
              data?.feedback_message ||
                data?.message ||
                `HTTP ${response.status}`
            ),
            response,
            data,
            providerId: provider.id,
            endpoint: request.endpoint,
          };
          if (
            response.status === 401 ||
            response.status === 403 ||
            response.status === 429 ||
            data?.feedback_required ||
            data?.checkpoint_required
          ) {
            throw lastError;
          }
          continue;
        }

        preferredActionProviderIds.set(action, provider.id);
        return {
          data,
          response,
          providerId: provider.id,
          endpoint: request.endpoint,
        };
      } catch (error) {
        if (error?.error && error?.response) throw error;
        lastError = {
          error,
          response: error?.response || null,
          data: error?.data || null,
          providerId: provider.id,
          endpoint: request.endpoint,
        };
      }
    }

    throw (
      lastError || {
        error: new Error(`No compatible Instagram ${action} endpoint is available.`),
        response: null,
        data: null,
        providerId: null,
        endpoint: null,
      }
    );
  }

  async function verifyFriendshipAction(userId, action, matches) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1000));

      const providers = ACTION_PROVIDERS.verify;
      for (const provider of getOrderedProviders(providers, "instagram-web-friendship-show-v1")) {
        try {
          const endpoint = provider.build(userId);
          const { response, data } = await requestJson(endpoint);
          if (!response.ok) continue;
          if (matches(data, action)) {
            return {
              matched: true,
              providerId: provider.id,
              endpoint,
              data,
            };
          }
        } catch {
          // Try the next verification provider.
        }
      }
    }

    return {
      matched: false,
      providerId: null,
      endpoint: lastNetwork?.endpoint || null,
      data: null,
    };
  }

  function getDiagnostics() {
    return {
      viewerAvailable: Boolean(getViewerId()),
      listProvider: preferredListProviderId,
      actionProviders: Object.fromEntries(preferredActionProviderIds),
      lastNetwork,
      providerCount: LIST_PROVIDERS.length,
      listProviders: LIST_PROVIDERS.map((provider) => provider.id),
    };
  }

  return {
    ACTION_PROVIDERS,
    createTransport: (customEnv = env) => createTransport(customEnv),
    LIST_PROVIDERS,
    VIEWER_PROVIDERS,
    buildHeaders,
    extractUsers,
    getDiagnostics,
    getNextCursor,
    getViewerId,
    extractViewerIdFromPayload,
    hasMore,
    isUsableListPayload,
    requestAction,
    requestConnections,
    resolveViewerId,
    requestJson,
    verifyFriendshipAction,
  };
});

  }).call(window);

  /* ===== script.js ===== */
  (function () {
(() => {
window.__manageInstagramFollowersDispose?.();
const lifecycle = new AbortController();
window.__manageInstagramFollowersDispose = () => lifecycle.abort();
const core = window.ManageInstagramFollowersCore;
const instagramTransport = window.ManageInstagramFollowersTransport;

if (!core || !instagramTransport) {
  const root = document.getElementById("manage-instagram-followers-root");
  const target = root?.querySelector("#notice");
  const targetText = root?.querySelector("#noticeText");
  if (target && targetText) {
    targetText.textContent = "The extension could not start its Instagram connection layer. Reload Instagram and try again.";
    target.hidden = false;
    target.dataset.tone = "error";
  }
  console.error("IG Snapper bootstrap failed.", { core: Boolean(core), transport: Boolean(instagramTransport) });
  return;
}

const translations = {
  en: {
    appTitle: "IG Snapper",
    introTitle: "See who doesn’t follow you back.",
    introEyebrow: "Connection checkup",
    introBody:
      "Compare your connections, find non-followers, and review changes over time.",
    howItWorks: "How it works",
    stepCompare: "Compare",
    stepCompareDetail: "Followers and following",
    stepReview: "Review",
    stepReviewDetail: "See the relationship status",
    stepDecide: "History",
    stepDecideDetail: "Open the list of changes",
    privacyNote: "Your connection data stays in this browser.",
    backHome: "Back to start",
    followingTab: "Following",
    followersTab: "Followers",
    listsLabel: "Connection lists",
    close: "Close",
    dismiss: "Dismiss message",
    searchLabel: "Search accounts",
    searchPlaceholder: "Username or name",
    findNonFollowers: "Find non-followers",
    allFilter: "All",
    nonFollowersFilter: "Not following you",
    mutualFilter: "Mutual",
    notFollowedBackFilter: "You don’t follow",
    requestedFilter: "Requested",
    sortLabel: "Sort",
    sortRelationship: "Relationship",
    sortUsername: "Username",
    sortName: "Name",
    sortRatio: "Follower ratio",
    signalLabel: "Signals",
    signalAll: "All signals",
    signalProtected: "Saved",
    signalVerified: "Verified",
    signalPrivate: "Private",
    signalHighRatio: "High follower ratio",
    selectSafe: "Select safe",
    followersStat: "Followers",
    followingStat: "Following",
    mutualStat: "Mutual",
    nonFollowersStat: "Not following back",
    saveSnapshot: "Save snapshot",
    snapshotSaved: "Snapshot saved locally.",
    history: "History",
    historyTitle: "Scan history",
    historySubtitle: "Choose a scan to see changes in your Followers and Following lists, including accounts that disappeared from one or both lists.",
    closeHistory: "Close history",
    historyNoData: "No snapshots yet. Run a complete scan and save one.",
    historyFirst: "Baseline snapshot",
    historyChanges: "+{added} new · −{removed} removed",
    followersGained: "Followers gained",
    followersLost: "Followers lost",
    followingAdded: "Following added",
    followingRemoved: "No longer in Following list",
    currentSnapshot: "Current snapshot",
    previousSnapshot: "Previous snapshot",
    exportCsv: "Export CSV",
    exportJson: "Export JSON",
    backup: "Backup",
    restore: "Restore",
    exportDone: "Export created.",
    backupDone: "Backup created.",
    restoreDone: "Backup restored locally.",
    invalidBackup: "That backup file is not compatible.",
    protectedAccount: "Save account",
    unprotectedAccount: "Remove saved account",
    verifiedBadge: "Verified",
    privateBadge: "Private",
    ratioLabel: "Follower ratio: {ratio}",
    protectedHint: "Saved account",
    noHistoryChanges: "No changes since the previous snapshot.",
    refreshBeforeHistory: "Run a complete scan before comparing history.",
    historyDetailBack: "Back to history",
    viewChanges: "View who changed",
    tabLostFollowers: "No longer in your Followers list",
    tabLostStillFollowing: "You still follow them",
    tabRemovedBoth: "Gone from both lists",
    tabNewFollowers: "New followers",
    tabFollowingRemoved: "No longer in your Following list",
    tabYouFollowed: "You followed",
    detailEmpty: "Nobody in this group.",
    openProfile: "Open profile",
    youStillFollow: "You still follow them",
    youDontFollowBack: "You don’t follow back",
    lostNote: "These accounts disappeared from your Followers list. Instagram does not reveal whether they unfollowed, blocked you, or deactivated their account.",
    lostStillFollowingNote: "These accounts are no longer in your Followers list, but remain in your Following list. Instagram does not reveal why they disappeared.",
    removedBothNote: "These accounts disappeared from both your Followers and Following lists in this interval. Instagram does not reveal the reason.",
    newNote: "Accounts that started following you since the previous snapshot.",
    followingRemovedNote: "These accounts are no longer present in your Following list compared with the previous snapshot. This does not by itself prove why they disappeared.",
    youFollowedNote: "Accounts you started following since the previous snapshot.",
    copyUsernames: "Copy usernames",
    usernamesCopied: "Usernames copied.",
    lostFollowersAlert: "{count} accounts are no longer in your Followers list since the last snapshot. Open History to review the changes.",
    orbOpen: "Open IG Snapper",
    orbQuit: "Quit IG Snapper",
    noChanges: "No changes",
    peopleCount: "{count} accounts",
    refresh: "Refresh",
    updatedNow: "Updated just now",
    updatedMinutes: "Updated {count} min ago",
    loadingConnections: "Comparing your connections…",
    loadingPage: "Comparing your connections… {count} loaded",
    loadingBoth: "Following {following} · Followers {followers}",
    loadingRetry: "Instagram asked us to slow down. Retrying in {seconds}s…",
    cancelLoad: "Cancel",
    loadCancelled: "Loading cancelled.",
    licenseTitle: "Activate IG Snapper",
    licenseBody: "Enter your license key to unlock the app. One key works on 1 Instagram account and up to 2 browsers.",
    licenseActivate: "Activate",
    licenseChecking: "Checking…",
    licenseOk: "Activated. Thank you!",
    licenseOkUntil: "Activated until {date}.",
    licenseEmpty: "Please enter your key.",
    license_not_found: "Key not found. Check it and try again.",
    license_revoked: "This key has been disabled.",
    license_expired: "This key has expired. Ask the seller to renew it.",
    license_device_limit: "This key is already used on 2 browsers. Contact the seller to move it.",
    license_account_limit: "This key is already used on another Instagram account. Contact the seller to change it.",
    license_rate_limited: "Too many wrong attempts. Try again in a few minutes.",
    license_bad_request: "Could not verify the key. Reinstall the extension and try again.",
    license_offline: "Cannot reach the license server. Check your internet.",
    license_server_error: "License server error. Try again later.",
    license_not_configured: "License server is not configured in this build.",
    licenseLocked: "Activate a license key to use this feature.",
    licenseGetKey: "Get a key",
    licenseBannerText: "IG Snapper is not activated yet.",
    licenseBannerButton: "Enter key",
    licenseChipUntil: "Active until {date}",
    licenseChipForever: "Active",
    licenseChipSoon: "Expires in {days} d",
    licenseChipTitle: "License active. Click to change the key.",
    cancel: "Cancel",
    copyDiagnostics: "Copy diagnostic report",
    diagnosticsCopied: "Diagnostic report copied. It contains no usernames, IDs, cookies, or tokens.",
    advancedTitle: "Tools",
    advancedSummary: "Export and backup",
    footerNote:
      "Follow requests are verified with Instagram before the interface changes.",
    followingTitle: "Following",
    followersTitle: "Followers",
    resultCount: "{count} account",
    resultCountPlural: "{count} accounts",
    filteredCount: "{count} of {total} accounts",
    noUsersTitle: "No accounts here",
    noUsersBody: "Instagram returned an empty list for this view.",
    noSearchTitle: "No matching accounts",
    noSearchBody: "Try another username or name.",
    noFilterTitle: "You’re all caught up",
    noFilterBody: "No accounts match this filter.",
    loginRequired:
      "Log in to Instagram, then reopen the extension to manage your connections.",
    loadError:
      "Instagram couldn’t load this list. Wait a moment and try again.",
    mutual: "You follow each other",
    notFollowingYou: "Doesn’t follow you back",
    youDontFollow: "You don’t follow back",
    neither: "You don’t follow each other",
    requestSent: "Follow request sent",
    follow: "Follow",
    followBack: "Follow back",
    cancelRequest: "Cancel request",
    followingLoading: "Following…",
    cancellingLoading: "Cancelling…",
    minuteLimit:
      "You reached the extension’s {action} limit for one minute. Wait before trying again.",
    hourLimit:
      "You reached the extension’s {action} limit for one hour. Wait before trying again.",
    actionFollow: "follow",
    instagramBlocked:
      "Instagram blocked the {action} request: {reason}.",
    instagramRejected: "Instagram rejected the {action} request: {reason}.",
    relationshipUnchanged:
      "Instagram answered the {action} request, but the relationship didn’t change.",
    actionFailed: "Instagram couldn’t complete the {action} request.",
  },
  th: {
    appTitle: "IG Snapper",
    introTitle: "ดูว่าใครไม่ติดตามคุณกลับ",
    introEyebrow: "ตรวจสอบการเชื่อมต่อ",
    introBody:
      "เปรียบเทียบรายชื่อผู้ติดตามและกำลังติดตาม ค้นหาคนที่ไม่ติดตามกลับ และตรวจดูการเปลี่ยนแปลงในแต่ละวัน",
    howItWorks: "ขั้นตอนการใช้งาน",
    stepCompare: "เปรียบเทียบ",
    stepCompareDetail: "ผู้ติดตามและกำลังติดตาม",
    stepReview: "ตรวจสอบ",
    stepReviewDetail: "ดูสถานะความสัมพันธ์",
    stepDecide: "ประวัติ",
    stepDecideDetail: "เปิดดูรายชื่อที่เปลี่ยนแปลง",
    privacyNote: "ข้อมูลการเชื่อมต่อของคุณอยู่ในเบราว์เซอร์นี้เท่านั้น",
    backHome: "กลับหน้าแรก",
    followingTab: "กำลังติดตาม",
    followersTab: "ผู้ติดตาม",
    listsLabel: "รายการการเชื่อมต่อ",
    close: "ปิด",
    dismiss: "ปิดข้อความ",
    searchLabel: "ค้นหาบัญชี",
    searchPlaceholder: "ชื่อผู้ใช้หรือชื่อ",
    findNonFollowers: "ค้นหาคนที่ไม่ติดตามกลับ",
    allFilter: "ทั้งหมด",
    nonFollowersFilter: "ไม่ติดตามคุณ",
    mutualFilter: "ติดตามกันและกัน",
    notFollowedBackFilter: "คุณยังไม่ติดตาม",
    requestedFilter: "ส่งคำขอแล้ว",
    sortLabel: "เรียงตาม",
    sortRelationship: "ความสัมพันธ์",
    sortUsername: "ชื่อผู้ใช้",
    sortName: "ชื่อ",
    sortRatio: "อัตราส่วนผู้ติดตาม",
    signalLabel: "สัญญาณบัญชี",
    signalAll: "ทุกสัญญาณ",
    signalProtected: "ที่บันทึกไว้",
    signalVerified: "ยืนยันตัวตนแล้ว",
    signalPrivate: "บัญชีส่วนตัว",
    signalHighRatio: "อัตราส่วนผู้ติดตามสูง",
    selectSafe: "เลือกเฉพาะที่ปลอดภัย",
    followersStat: "ผู้ติดตาม",
    followingStat: "กำลังติดตาม",
    mutualStat: "ติดตามกัน",
    nonFollowersStat: "ไม่ติดตามกลับ",
    saveSnapshot: "บันทึกสแนปช็อต",
    snapshotSaved: "บันทึกสแนปช็อตในเครื่องแล้ว",
    history: "ประวัติ",
    historyTitle: "ประวัติการสแกน",
    historySubtitle: "เลือกช่วงเวลาที่สแกน เพื่อดูการเปลี่ยนแปลงในรายชื่อผู้ติดตามและกำลังติดตาม รวมถึงบัญชีที่หายไปจากหนึ่งหรือทั้งสองรายการ",
    closeHistory: "ปิดประวัติ",
    historyNoData: "ยังไม่มีสแนปช็อต ลองสแกนให้ครบแล้วบันทึกไว้หนึ่งรายการ",
    historyFirst: "สแนปช็อตเริ่มต้น",
    historyChanges: "+{added} ใหม่ · −{removed} ลบออก",
    followersGained: "ผู้ติดตามเพิ่มขึ้น",
    followersLost: "ผู้ติดตามที่หายไป",
    followingAdded: "ติดตามเพิ่ม",
    followingRemoved: "ไม่อยู่ในรายชื่อที่กำลังติดตามแล้ว",
    currentSnapshot: "สแนปช็อตปัจจุบัน",
    previousSnapshot: "สแนปช็อตก่อนหน้า",
    exportCsv: "ส่งออก CSV",
    exportJson: "ส่งออก JSON",
    backup: "สำรองข้อมูล",
    restore: "กู้คืน",
    exportDone: "สร้างไฟล์ส่งออกแล้ว",
    backupDone: "สร้างไฟล์สำรองข้อมูลแล้ว",
    restoreDone: "กู้คืนข้อมูลสำรองในเครื่องแล้ว",
    invalidBackup: "ไฟล์สำรองข้อมูลนี้ใช้งานร่วมกันไม่ได้",
    protectedAccount: "บันทึกบัญชี",
    unprotectedAccount: "นำออกจากรายการบันทึก",
    verifiedBadge: "ยืนยันตัวตนแล้ว",
    privateBadge: "ส่วนตัว",
    ratioLabel: "อัตราส่วนผู้ติดตาม: {ratio}",
    protectedHint: "บัญชีที่บันทึกไว้",
    noHistoryChanges: "ไม่มีการเปลี่ยนแปลงจากสแนปช็อตก่อนหน้า",
    refreshBeforeHistory: "สแกนให้ครบก่อนจึงจะเปรียบเทียบประวัติได้",
    historyDetailBack: "กลับไปหน้าประวัติ",
    viewChanges: "ดูว่าใครเปลี่ยนไป",
    tabLostFollowers: "หายไปจากรายชื่อผู้ติดตาม",
    tabLostStillFollowing: "คุณยังติดตามเขาอยู่",
    tabRemovedBoth: "หายจากทั้งสองรายการ",
    tabNewFollowers: "ผู้ติดตามใหม่",
    tabFollowingRemoved: "หายไปจากรายชื่อที่คุณติดตาม",
    tabYouFollowed: "คุณติดตามเพิ่ม",
    detailEmpty: "ไม่มีใครในกลุ่มนี้",
    openProfile: "เปิดโปรไฟล์",
    youStillFollow: "คุณยังติดตามเขาอยู่",
    youDontFollowBack: "คุณยังไม่ได้ติดตามกลับ",
    lostNote: "บัญชีเหล่านี้หายไปจากรายชื่อผู้ติดตามของคุณ Instagram ไม่ได้บอกว่าเขาเลิกติดตาม บล็อกคุณ หรือปิด/ลบบัญชี",
    lostStillFollowingNote: "บัญชีเหล่านี้ไม่อยู่ในรายชื่อผู้ติดตามแล้ว แต่ยังอยู่ในรายชื่อที่คุณกำลังติดตาม โดย Instagram ไม่ได้เปิดเผยสาเหตุ",
    removedBothNote: "บัญชีเหล่านี้หายไปจากทั้งรายชื่อผู้ติดตามและกำลังติดตามในช่วงเดียวกัน Instagram ไม่ได้บอกสาเหตุ",
    newNote: "บัญชีที่เริ่มติดตามคุณตั้งแต่สแนปช็อตก่อนหน้า",
    followingRemovedNote: "บัญชีเหล่านี้ไม่อยู่ในรายชื่อที่คุณกำลังติดตามเมื่อเทียบกับสแนปช็อตก่อนหน้า ข้อมูลนี้ไม่ได้ยืนยันสาเหตุที่บัญชีหายไป",
    youFollowedNote: "บัญชีที่คุณเริ่มติดตามตั้งแต่สแนปช็อตก่อนหน้า",
    copyUsernames: "คัดลอกชื่อผู้ใช้",
    usernamesCopied: "คัดลอกชื่อผู้ใช้แล้ว",
    lostFollowersAlert: "มี {count} บัญชีที่ไม่อยู่ในรายชื่อผู้ติดตามตั้งแต่สแนปช็อตล่าสุด เปิดประวัติเพื่อตรวจดูการเปลี่ยนแปลง",
    orbOpen: "เปิด IG Snapper",
    orbQuit: "ปิด IG Snapper ทั้งหมด",
    noChanges: "ไม่มีการเปลี่ยนแปลง",
    peopleCount: "{count} บัญชี",
    refresh: "รีเฟรช",
    updatedNow: "อัปเดตเมื่อสักครู่",
    updatedMinutes: "อัปเดตเมื่อ {count} นาทีที่แล้ว",
    loadingConnections: "กำลังเปรียบเทียบรายชื่อของคุณ…",
    loadingPage: "กำลังเปรียบเทียบรายชื่อของคุณ… โหลดแล้ว {count} บัญชี",
    loadingBoth: "กำลังติดตาม {following} · ผู้ติดตาม {followers}",
    loadingRetry: "Instagram ให้ชะลอความเร็ว กำลังลองใหม่ใน {seconds} วิ…",
    cancelLoad: "ยกเลิก",
    loadCancelled: "ยกเลิกการโหลดแล้ว",
    licenseTitle: "เปิดใช้งาน IG Snapper",
    licenseBody: "ใส่คีย์ลิขสิทธิ์เพื่อปลดล็อกโปรแกรม 1 คีย์ใช้ได้กับ 1 บัญชี Instagram และสูงสุด 2 เบราว์เซอร์",
    licenseActivate: "เปิดใช้งาน",
    licenseChecking: "กำลังตรวจสอบ…",
    licenseOk: "เปิดใช้งานแล้ว ขอบคุณครับ",
    licenseOkUntil: "เปิดใช้งานแล้ว ถึงวันที่ {date}",
    licenseEmpty: "กรุณาใส่คีย์",
    license_not_found: "ไม่พบคีย์นี้ ตรวจสอบแล้วลองใหม่",
    license_revoked: "คีย์นี้ถูกปิดการใช้งานแล้ว",
    license_expired: "คีย์นี้หมดอายุแล้ว ติดต่อผู้ขายเพื่อต่ออายุ",
    license_device_limit: "คีย์นี้ใช้ครบ 2 เบราว์เซอร์แล้ว ติดต่อผู้ขายเพื่อย้ายเครื่อง",
    license_account_limit: "คีย์นี้ถูกใช้กับบัญชี Instagram อื่นอยู่แล้ว ติดต่อผู้ขายเพื่อเปลี่ยนบัญชี",
    license_rate_limited: "ใส่คีย์ผิดหลายครั้งเกินไป รอสักครู่แล้วลองใหม่",
    license_bad_request: "ตรวจคีย์ไม่สำเร็จ ลองติดตั้งส่วนขยายใหม่แล้วลองอีกครั้ง",
    license_offline: "เชื่อมต่อเซิร์ฟเวอร์ตรวจคีย์ไม่ได้ ตรวจสอบอินเทอร์เน็ต",
    license_server_error: "เซิร์ฟเวอร์ตรวจคีย์ขัดข้อง ลองใหม่ภายหลัง",
    license_not_configured: "ยังไม่ได้ตั้งค่าเซิร์ฟเวอร์ตรวจคีย์ในเวอร์ชันนี้",
    licenseLocked: "ใส่คีย์ลิขสิทธิ์เพื่อใช้ฟีเจอร์นี้",
    licenseGetKey: "ซื้อคีย์",
    licenseBannerText: "IG Snapper ยังไม่ได้เปิดใช้งาน",
    licenseBannerButton: "ใส่คีย์",
    licenseChipUntil: "ใช้ได้ถึง {date}",
    licenseChipForever: "เปิดใช้งานแล้ว",
    licenseChipSoon: "หมดอายุใน {days} วัน",
    licenseChipTitle: "เปิดใช้งานแล้ว กดเพื่อเปลี่ยนคีย์",
    cancel: "ยกเลิก",
    copyDiagnostics: "คัดลอกรายงานวินิจฉัย",
    diagnosticsCopied: "คัดลอกรายงานแล้ว ไม่มีชื่อผู้ใช้ รหัสบัญชี คุกกี้ หรือโทเคน",
    advancedTitle: "เครื่องมือ",
    advancedSummary: "ส่งออกและสำรองข้อมูล",
    footerNote:
      "คำขอติดตามจะได้รับการยืนยันกับ Instagram ก่อนอัปเดตหน้าจอ",
    followingTitle: "กำลังติดตาม",
    followersTitle: "ผู้ติดตาม",
    resultCount: "{count} บัญชี",
    resultCountPlural: "{count} บัญชี",
    filteredCount: "{count} จาก {total} บัญชี",
    noUsersTitle: "ไม่มีบัญชีในรายการนี้",
    noUsersBody: "Instagram ส่งรายการว่างกลับมาสำหรับมุมมองนี้",
    noSearchTitle: "ไม่พบบัญชีที่ตรงกัน",
    noSearchBody: "ลองใช้ชื่อผู้ใช้หรือชื่ออื่น",
    noFilterTitle: "เรียบร้อยหมดแล้ว",
    noFilterBody: "ไม่มีบัญชีที่ตรงกับตัวกรองนี้",
    loginRequired:
      "กรุณาเข้าสู่ระบบ Instagram แล้วเปิดส่วนขยายอีกครั้งเพื่อจัดการรายชื่อของคุณ",
    loadError:
      "Instagram โหลดรายการนี้ไม่สำเร็จ โปรดรอสักครู่แล้วลองอีกครั้ง",
    mutual: "ติดตามกันและกัน",
    notFollowingYou: "ไม่ได้ติดตามคุณกลับ",
    youDontFollow: "คุณยังไม่ได้ติดตามกลับ",
    neither: "ไม่ได้ติดตามกันทั้งคู่",
    requestSent: "ส่งคำขอติดตามแล้ว",
    follow: "ติดตาม",
    followBack: "ติดตามกลับ",
    cancelRequest: "ยกเลิกคำขอ",
    followingLoading: "กำลังติดตาม…",
    cancellingLoading: "กำลังยกเลิก…",
    minuteLimit:
      "คุณใช้ครบขีดจำกัดการ{action}ต่อนาทีของส่วนขยายแล้ว โปรดรอสักครู่ก่อนลองอีกครั้ง",
    hourLimit:
      "คุณใช้ครบขีดจำกัดการ{action}ต่อชั่วโมงของส่วนขยายแล้ว โปรดรอสักครู่ก่อนลองอีกครั้ง",
    actionFollow: "ติดตาม",
    instagramBlocked:
      "Instagram บล็อกคำขอ{action}: {reason}",
    instagramRejected: "Instagram ปฏิเสธคำขอ{action}: {reason}",
    relationshipUnchanged:
      "Instagram ตอบรับคำขอ{action} แต่ความสัมพันธ์ระหว่างบัญชีไม่เปลี่ยนแปลง",
    actionFailed: "Instagram ดำเนินการ{action}ไม่สำเร็จ",
  },
};

let currentLocale = "en";

function t(key, values = {}) {
  const template = translations[currentLocale]?.[key] || translations.en[key] || key;
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template
  );
}

function getPreferredLocale() {
  return navigator.language.toLowerCase().startsWith("th") ? "th" : "en";
}

const loadFollowersButton = document.getElementById("loadFollowersButton");
const loadFollowingButton = document.getElementById("loadFollowingButton");
const searchGroup = document.getElementById("searchGroup");
const titleAndFilter = document.getElementById("titleAndFilter");
const filterNotFollowingBackButton = document.getElementById(
  "filterNotFollowingBackButton"
);
const filterNotFollowedBackButton = document.getElementById(
  "filterNotFollowedBackButton"
);
const overlay = document.getElementById("overlay");
const infoText = document.getElementById("info-text");
const title = document.getElementById("title");
const workspace = document.getElementById("workspace");
const listTabs = document.getElementById("listTabs");
const introBlock = document.querySelector(".intro-block");
const userList = document.getElementById("userList");
const resultsSummary = document.getElementById("resultsSummary");
const notice = document.getElementById("notice");
const noticeText = document.getElementById("noticeText");
const filterAllButton = document.getElementById("filterAllButton");
const filterMutualButton = document.getElementById("filterMutualButton");
const filterRequestedButton = document.getElementById("filterRequestedButton");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const signalFilter = document.getElementById("signalFilter");
const updatedAt = document.getElementById("updatedAt");
const historyDialog = document.getElementById("historyDialog");
const historyList = document.getElementById("historyList");
const historySummary = document.getElementById("historySummary");

function setLocale(locale, persist = true) {
  currentLocale = locale === "th" ? "th" : "en";
  if (persist) {
    window.postMessage(
      { mifStorage: true, action: "setLocale", payload: currentLocale },
      window.location.origin
    );
  }

  document
    .getElementById("manage-instagram-followers-root")
    ?.setAttribute("lang", currentLocale === "th" ? "th" : "en");

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.title = t(element.dataset.i18nTitle);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });
  document.querySelectorAll(".language-button").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.locale === currentLocale)
    );
  });
  document
    .querySelector(".language-switch")
    ?.setAttribute("data-active", currentLocale);
  try { renderLicenseState(); } catch { /* license UI not ready yet */ }

  if (caller) {
    if (searchInput.value.trim()) {
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      renderCurrentUsers();
    }
    updateUpdatedAt();
  }
}

function showNotice(message, tone = "error") {
  noticeText.textContent = message;
  notice.dataset.tone = tone;
  notice.hidden = false;
  pingOrb();
}

function dismissNotice() {
  notice.hidden = true;
  noticeText.textContent = "";
  delete notice.dataset.tone;
}

function closeExtension() {
  clearTimeout(orbPingTimer);
  window.removeEventListener("resize", onOrbResize);
  document.getElementById("manage-instagram-followers-root")?.remove();
  lifecycle.abort();
}

/* ───────────── HUD Orb (minimized state) ───────────── */
const rootEl = document.getElementById("manage-instagram-followers-root");
const hudOrb = document.getElementById("hudOrb");
const hudOrbBadge = document.getElementById("hudOrbBadge");
const ORB_SIZE = 64;
const ORB_LABEL_SPACE = 34;
const ORB_MARGIN = 8;
let isMinimized = false;
let orbPos = null; // { fx, fy } as fractions of the free viewport area
let orbUnseen = 0;
let orbPingTimer = null;
let orbTransitioning = false;

function orbRange() {
  return {
    maxX: Math.max(ORB_MARGIN, window.innerWidth - ORB_SIZE - ORB_MARGIN),
    maxY: Math.max(ORB_MARGIN, window.innerHeight - ORB_SIZE - ORB_LABEL_SPACE - ORB_MARGIN),
  };
}

function clampOrb(x, y) {
  const { maxX, maxY } = orbRange();
  return {
    x: Math.min(Math.max(ORB_MARGIN, x), maxX),
    y: Math.min(Math.max(ORB_MARGIN, y), maxY),
  };
}

function placeOrb() {
  const { maxX, maxY } = orbRange();
  const fx = Number.isFinite(orbPos?.fx) ? orbPos.fx : 1;
  const fy = Number.isFinite(orbPos?.fy) ? orbPos.fy : 0.82;
  const { x, y } = clampOrb(ORB_MARGIN + fx * (maxX - ORB_MARGIN), ORB_MARGIN + fy * (maxY - ORB_MARGIN));
  hudOrb.style.left = `${x}px`;
  hudOrb.style.top = `${y}px`;
}

function saveOrbPos(x, y) {
  const { maxX, maxY } = orbRange();
  orbPos = {
    fx: maxX > ORB_MARGIN ? (x - ORB_MARGIN) / (maxX - ORB_MARGIN) : 1,
    fy: maxY > ORB_MARGIN ? (y - ORB_MARGIN) / (maxY - ORB_MARGIN) : 0.82,
  };
  settings = { ...settings, orbPos };
  persistState();
}

function onOrbResize() {
  if (isMinimized) placeOrb();
}
window.addEventListener("resize", onOrbResize);

function orbCenter() {
  const left = parseFloat(hudOrb.style.left) || 0;
  const top = parseFloat(hudOrb.style.top) || 0;
  return { x: left + ORB_SIZE / 2, y: top + ORB_SIZE / 2 };
}

function updateOrbBadge() {
  if (!hudOrbBadge) return;
  hudOrbBadge.hidden = orbUnseen <= 0;
  hudOrbBadge.textContent = orbUnseen > 99 ? "99+" : String(orbUnseen);
}

function pingOrb() {
  if (!isMinimized) return;
  hudOrb.classList.remove("is-ping");
  void hudOrb.offsetWidth;
  hudOrb.classList.add("is-ping");
  clearTimeout(orbPingTimer);
  orbPingTimer = setTimeout(() => hudOrb.classList.remove("is-ping"), 1400);
}

function panelFlight() {
  const panel = overlay.querySelector(".my-component");
  const box = panel.getBoundingClientRect();
  const orb = orbCenter();
  return {
    panel,
    dx: orb.x - (box.left + box.width / 2),
    dy: orb.y - (box.top + box.height / 2),
  };
}

function minimizeToOrb() {
  if (isMinimized || orbTransitioning) return;
  orbTransitioning = true;
  placeOrb();
  const { panel, dx, dy } = panelFlight();
  const duration = prefersReducedMotion.matches ? 1 : 460;
  const flight = panel.animate(
    [
      { transform: "none", opacity: 1, filter: "blur(0px)" },
      { transform: `translate(${dx}px, ${dy}px) scale(0.05)`, opacity: 0, filter: "blur(8px)" },
    ],
    { duration, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" }
  );
  const fade = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration,
    easing: "ease-in",
    fill: "forwards",
  });
  flight.finished
    .catch(() => {})
    .then(() => {
      overlay.classList.add("is-hidden");
      flight.cancel();
      fade.cancel();
      rootEl.classList.add("is-minimized");
      isMinimized = true;
      orbTransitioning = false;
      hudOrb.hidden = false;
      updateOrbBadge();
    });
}

function restoreFromOrb() {
  if (!isMinimized || orbTransitioning) return;
  orbTransitioning = true;
  const orb = orbCenter();
  hudOrb.hidden = true;
  rootEl.classList.remove("is-minimized");
  overlay.classList.remove("is-hidden");
  isMinimized = false;
  orbUnseen = 0;
  updateOrbBadge();
  const panel = overlay.querySelector(".my-component");
  const box = panel.getBoundingClientRect();
  const dx = orb.x - (box.left + box.width / 2);
  const dy = orb.y - (box.top + box.height / 2);
  const duration = prefersReducedMotion.matches ? 1 : 560;
  const flight = panel.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(0.05)`, opacity: 0, filter: "blur(8px)" },
      { transform: "none", opacity: 1, filter: "blur(0px)" },
    ],
    { duration, easing: "cubic-bezier(0.34, 1.3, 0.64, 1)" }
  );
  overlay.animate([{ opacity: 0 }, { opacity: 1 }], { duration: Math.min(duration, 320), easing: "ease-out" });
  flight.finished.catch(() => {}).then(() => {
    orbTransitioning = false;
    document.getElementById("findNonFollowersButton")?.focus({ preventScroll: true });
  });
}

rootEl.addEventListener("mif-restore", restoreFromOrb, { signal: lifecycle.signal });

// Dragging: pointer events with a movement threshold so a tap still opens the app.
(() => {
  let drag = null;
  const THRESHOLD = 5;

  hudOrb.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0 || event.target.closest(".orb-quit")) return;
      const left = parseFloat(hudOrb.style.left) || 0;
      const top = parseFloat(hudOrb.style.top) || 0;
      drag = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        left,
        top,
        lastX: event.clientX,
        lastT: performance.now(),
        moved: false,
      };
      hudOrb.setPointerCapture(event.pointerId);
    },
    { signal: lifecycle.signal }
  );

  hudOrb.addEventListener(
    "pointermove",
    (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < THRESHOLD) return;
      if (!drag.moved) {
        drag.moved = true;
        hudOrb.classList.add("is-dragging");
      }
      const { x, y } = clampOrb(drag.left + dx, drag.top + dy);
      hudOrb.style.left = `${x}px`;
      hudOrb.style.top = `${y}px`;
      const now = performance.now();
      const velocity = (event.clientX - drag.lastX) / Math.max(1, now - drag.lastT);
      hudOrb.style.setProperty("--tilt", `${Math.max(-26, Math.min(26, velocity * 14))}deg`);
      drag.lastX = event.clientX;
      drag.lastT = now;
    },
    { signal: lifecycle.signal }
  );

  const finish = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const wasMoved = drag.moved;
    drag = null;
    hudOrb.classList.remove("is-dragging");
    hudOrb.style.setProperty("--tilt", "0deg");
    if (hudOrb.hasPointerCapture?.(event.pointerId)) hudOrb.releasePointerCapture(event.pointerId);
    if (wasMoved) {
      saveOrbPos(parseFloat(hudOrb.style.left) || 0, parseFloat(hudOrb.style.top) || 0);
    } else if (event.type === "pointerup") {
      restoreFromOrb();
    }
  };
  hudOrb.addEventListener("pointerup", finish, { signal: lifecycle.signal });
  hudOrb.addEventListener("pointercancel", finish, { signal: lifecycle.signal });

  hudOrb.addEventListener(
    "keydown",
    (event) => {
      if (event.target.closest(".orb-quit")) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        restoreFromOrb();
      }
      const step = event.shiftKey ? 40 : 16;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[event.key]) {
        event.preventDefault();
        const { x, y } = clampOrb(
          (parseFloat(hudOrb.style.left) || 0) + moves[event.key][0],
          (parseFloat(hudOrb.style.top) || 0) + moves[event.key][1]
        );
        hudOrb.style.left = `${x}px`;
        hudOrb.style.top = `${y}px`;
        saveOrbPos(x, y);
      }
    },
    { signal: lifecycle.signal }
  );

  document.getElementById("hudOrbQuit").addEventListener("click", (event) => {
    event.stopPropagation();
    closeExtension();
  }, { signal: lifecycle.signal });
})();

document.querySelectorAll(".language-button").forEach((button) => {
  button.addEventListener("click", () => setLocale(button.dataset.locale));
});
document
  .getElementById("closeExtensionButton")
  .addEventListener("click", minimizeToOrb);
document
  .getElementById("dismissNoticeButton")
  .addEventListener("click", dismissNotice);
document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Escape") {
      if (!licenseDialog.hidden) licenseDialog.hidden = true;
      else if (!historyDialog.hidden) historyDialog.hidden = true;
      else if (!isMinimized) minimizeToOrb();
    }
  },
  { signal: lifecycle.signal }
);

function resetUI() {
  loadedUsers.clear();
  currentFilter = "all";
  document.getElementById("userList").innerHTML = "";
  searchInput.value = "";
  sortSelect.value = "relationship";
  title.textContent =
    caller === "Followers" ? t("followersTitle") : t("followingTitle");
  title.style.display = "flex";
  document
    .querySelectorAll(".filter")
    .forEach((element) => {
      element.classList.remove("filter-active");
      if (element.dataset.filter) element.setAttribute("aria-pressed", "false");
    });
  filterAllButton.classList.add("filter-active");
  filterAllButton.setAttribute("aria-pressed", "true");
  infoText.style.display = "none";
  searchGroup.style.display = "grid";
  titleAndFilter.style.display = "flex";
  workspace.hidden = false;
  introBlock.hidden = true;
  listTabs.hidden = false;
  dismissNotice();
}

function showHome() {
  viewGeneration += 1;
  cancelLoading();
  setLoading(false);
  caller = null;
  currentFilter = "all";
  userList.innerHTML = "";
  workspace.hidden = true;
  listTabs.hidden = true;
  introBlock.hidden = false;
  loadFollowingButton.classList.remove("is-active");
  loadFollowersButton.classList.remove("is-active");
  loadFollowingButton.removeAttribute("aria-current");
  loadFollowersButton.removeAttribute("aria-current");
  dismissNotice();
  document
    .getElementById("findNonFollowersButton")
    .focus({ preventScroll: true });
}

function toggleFilterButtons(type) {
  filterAllButton.style.display = "flex";
  filterMutualButton.style.display = "flex";
  filterNotFollowingBackButton.style.display =
    type === "Following" ? "flex" : "none";
  filterRequestedButton.style.display =
    type === "Following" ? "flex" : "none";
  filterNotFollowedBackButton.style.display =
    type === "Followers" ? "flex" : "none";
}

async function openList(type, initialFilter = "all") {
  if (!ensureLicensed()) return;
  try {
    viewerId = await instagramTransport.resolveViewerId();
  } catch (error) {
    diagnostics.lastError = error?.message || String(error);
    showNotice(t("loginRequired"));
    console.error("Unable to resolve Instagram viewer ID.", error);
    return;
  }
  if (!viewerId) {
    showNotice(t("loginRequired"));
    return;
  }
  // Now that the Instagram account is known, let the server check it against the key's account limit.
  license = await licenseRequest("status");
  renderLicenseState();
  if (!ensureLicensed()) return;
  const generation = ++viewGeneration;
  caller = type;
  resetUI();
  currentFilter = initialFilter;
  setActiveListTab(type);
  toggleFilterButtons(type);
  await fetchConnections(type, generation);
  if (generation !== viewGeneration) return;
  setFilter(initialFilter);
}

loadFollowersButton.addEventListener("click", () => openList("Followers"));
loadFollowingButton.addEventListener("click", () => openList("Following"));
document
  .getElementById("findNonFollowersButton")
  .addEventListener("click", () => openList("Following", "notFollowingBack"));
document.getElementById("backHomeButton").addEventListener("click", showHome);
document.getElementById("cancelLoadButton").addEventListener("click", () => {
  cancelLoading();
});

function setActiveListTab(type) {
  loadFollowingButton.classList.toggle("is-active", type === "Following");
  loadFollowersButton.classList.toggle("is-active", type === "Followers");
  loadFollowingButton.setAttribute(
    "aria-current",
    type === "Following" ? "page" : "false"
  );
  loadFollowersButton.setAttribute(
    "aria-current",
    type === "Followers" ? "page" : "false"
  );
}

overlay.addEventListener("click", function (event) {
  if (event.target === this) {
    minimizeToOrb();
  }
});

const loadedUsers = new Map();
const connectionCache = {
  Following: null,
  Followers: null,
};
const connectionRequests = {
  Following: null,
  Followers: null,
};
const connectionCacheUpdatedAt = {
  Following: 0,
  Followers: 0,
};
const connectionCacheViewerId = {
  Following: null,
  Followers: null,
};
const connectionCacheTtl = 10 * 60 * 1000;
let caller = null;
let currentFilter = "all";
let lastUpdatedAt = null;
let searchTimer = null;
let renderGeneration = 0;
let viewGeneration = 0;
let visibleUserIds = [];
const protectedUserIds = new Set();
let snapshotHistory = [];
let latestDiff = null;
let settings = {};
const diagnostics = { lastError: null, lastEndpoint: null, lastStatus: null };
let followAttempts = [];

function persistRateLimitState() {
  window.postMessage(
    {
      mifStorage: true,
      action: "setRateLimits",
      payload: { follow: followAttempts },
    },
    window.location.origin
  );
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(renderCurrentUsers, 150);
});
sortSelect.addEventListener("change", renderCurrentUsers);
signalFilter?.addEventListener("change", renderCurrentUsers);

function normalizeConnectionUser(user, type) {
  return core.normalizeConnectionUser(user, type);
}

function setLoading(isLoading) {
  const loader = document.getElementById("loader");
  if (isLoading) {
    document.getElementById("loadingProgress").textContent = t(
      "loadingConnections"
    );
  }
  rootEl?.toggleAttribute("data-busy", isLoading);
  if (!isLoading) pingOrb();
  loader.style.display = isLoading ? "flex" : "none";
  loader.setAttribute("aria-hidden", String(!isLoading));
  userList.style.display = isLoading ? "none" : caller ? "flex" : "none";
  document
    .querySelector(".my-component")
    ?.setAttribute("aria-busy", String(isLoading));
  document.querySelectorAll(".data-action-control").forEach((element) => {
    element.disabled = isLoading;
    element.setAttribute("aria-disabled", String(isLoading));
  });
}

function updateResultsMeta(users) {
  const total = loadedUsers.size;
  const count = users.length;
  resultsSummary.textContent =
    currentFilter !== "all" || count !== total
      ? t("filteredCount", { count, total })
      : t(count === 1 ? "resultCount" : "resultCountPlural", { count });
}

function renderEmptyState(reason = "empty") {
  const titleKey =
    reason === "search"
      ? "noSearchTitle"
      : reason === "filter"
      ? "noFilterTitle"
      : "noUsersTitle";
  const bodyKey =
    reason === "search"
      ? "noSearchBody"
      : reason === "filter"
      ? "noFilterBody"
      : "noUsersBody";

  userList.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
        <circle cx="10" cy="9" r="3.5" stroke="currentColor" stroke-width="1.7" />
        <path d="M3.5 19c.7-3.1 2.8-4.8 6.5-4.8 2.2 0 3.9.6 5 1.8m2-7 4 4m0-4-4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
      </svg>
      <strong>${t(titleKey)}</strong>
      <span>${t(bodyKey)}</span>
    </div>
  `;
  userList.style.display = "flex";
}

const loadProgress = { Following: 0, Followers: 0 };
let loadController = null;

async function requestConnections(type, signal) {
  loadProgress[type] = 0;
  const result = await instagramTransport.requestConnections(
    type,
    (progress) => {
      diagnostics.lastEndpoint = `${type.toLowerCase()} list via ${progress.providerId || "retry"}`;
      diagnostics.lastStatus = progress.retry?.status || 200;
      loadProgress[type] = progress.count;
      const label = document.getElementById("loadingProgress");
      label.textContent = progress.retry
        ? t("loadingRetry", { seconds: Math.ceil(progress.retry.wait / 1000) })
        : t("loadingBoth", {
            following: formatNumber(loadProgress.Following),
            followers: formatNumber(loadProgress.Followers),
          });
    },
    { signal }
  );

  diagnostics.lastEndpoint = `${type.toLowerCase()} list via ${result.providerId}`;
  diagnostics.lastStatus = 200;
  return result.users.map((user) => normalizeConnectionUser(user, type));
}

function cancelLoading() {
  loadController?.abort();
  connectionRequests.Following = null;
  connectionRequests.Followers = null;
}

function refreshRelationshipFlags() {
  core.reconcileConnectionMaps(
    connectionCache.Following,
    connectionCache.Followers
  );
}

async function ensureConnections(type, signal) {
  const cacheOwner = String(viewerId || "");
  if (connectionCacheViewerId[type] !== cacheOwner) {
    connectionCache[type] = null;
    connectionCacheUpdatedAt[type] = 0;
    connectionCacheViewerId[type] = cacheOwner;
  }

  const cacheIsFresh =
    connectionCache[type] &&
    Date.now() - connectionCacheUpdatedAt[type] < connectionCacheTtl;
  if (cacheIsFresh) return connectionCache[type];
  connectionCache[type] = null;

  if (!connectionRequests[type]) {
    const request = requestConnections(type, signal)
      .then((users) => {
        if (cacheOwner !== String(viewerId || "")) {
          throw new Error("Instagram account changed during the scan. Please scan again.");
        }
        const connections = new Map(users.map((user) => [user.id, user]));
        connectionCache[type] = connections;
        connectionCacheUpdatedAt[type] = Date.now();
        return connections;
      })
      .finally(() => {
        if (connectionRequests[type] === request) connectionRequests[type] = null;
      });
    connectionRequests[type] = request;
  }

  const connections = await connectionRequests[type];
  refreshRelationshipFlags();
  return connections;
}

async function fetchConnections(type, generation) {
  caller = type;
  title.textContent =
    type === "Followers" ? t("followersTitle") : t("followingTitle");
  setLoading(true);

  try {
    const companionType = type === "Following" ? "Followers" : "Following";
    cancelLoading();
    loadController = new AbortController();
    const { signal } = loadController;
    const [selectedConnections] = await Promise.all([
      ensureConnections(type, signal),
      ensureConnections(companionType, signal),
    ]);
    if (generation !== viewGeneration) return;
    refreshRelationshipFlags();
    const users = [...selectedConnections.values()];
    loadedUsers.clear();
    updateUIWithData(users, type);
    lastUpdatedAt = Date.now();
    updateUpdatedAt();
    updateInsightStrip();
    saveCurrentSnapshot(false);
  } catch (error) {
    if (generation !== viewGeneration) return;
    if (error?.name === "AbortError") {
      showNotice(t("loadCancelled"), "info");
      renderEmptyState();
      return;
    }
    diagnostics.lastError = error?.message || String(error);
    console.error("Error when fetching data from Instagram:", error);
    showNotice(`${t("loadError")} ${diagnostics.lastError}`.trim());
    renderEmptyState();
  } finally {
    if (generation === viewGeneration) {
      setLoading(false);
      const loader = document.getElementById("loader");
      if (loader) loader.setAttribute("aria-hidden", "true");
    }
  }
}

function updateUIWithData(edges, functionCalled) {
  searchInput.style.display = "block";
  populateLoadedUser(edges, functionCalled);
  updateFilterCounts();
  renderCurrentUsers();
}

function populateLoadedUser(users, functionCalled) {
  if (caller !== functionCalled) {
    caller = functionCalled;
  }
  users.forEach((edge) => {
    const user = edge.node ?? edge;
    if (!loadedUsers.has(user.id)) {
      loadedUsers.set(user.id, user);
    }
  });
}

function getRelationshipState(user) {
  return core.getRelationshipState(user);
}

function isProtected(userId) {
  return protectedUserIds.has(String(userId));
}

function persistState() {
  window.postMessage(
    {
      mifStorage: true,
      action: "setState",
      requestId: crypto.randomUUID(),
      payload: {
        accountId: viewerId || "default",
        locale: currentLocale,
        rateLimits: { follow: followAttempts },
        whitelist: [...protectedUserIds],
        snapshots: snapshotHistory,
        settings,
      },
    },
    window.location.origin
  );
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function updateInsightStrip() {}

function snapshotFingerprint(snapshot) {
  return core.snapshotMembershipFingerprint(snapshot);
}

function saveCurrentSnapshot(force = false) {
  const following = connectionCache.Following
    ? [...connectionCache.Following.values()]
    : [];
  const followers = connectionCache.Followers
    ? [...connectionCache.Followers.values()]
    : [];
  if (!connectionCache.Following || !connectionCache.Followers) {
    showNotice(t("refreshBeforeHistory"), "warning");
    return false;
  }

  const snapshot = core.buildSnapshot({
    viewerId: viewerId,
    following,
    followers,
  });
  const previous = snapshotHistory[0]?.viewerId === snapshot.viewerId
    ? snapshotHistory[0]
    : null;
  if (!force && previous && snapshotFingerprint(previous) === snapshotFingerprint(snapshot)) {
    latestDiff = core.diffSnapshots(previous, snapshot);
    return false;
  }

  latestDiff = core.diffSnapshots(previous, snapshot);
  snapshotHistory = [snapshot, ...snapshotHistory.filter((item) => item.id !== snapshot.id)].slice(0, 12);
  persistState();
  renderHistory();
  const lostCount = latestDiff.comparable ? latestDiff.followers.removed.length : 0;
  if (lostCount > 0) {
    orbUnseen = lostCount;
    updateOrbBadge();
    showNotice(t("lostFollowersAlert", { count: lostCount }), "warning");
  } else {
    showNotice(t("snapshotSaved"), "success");
  }
  return true;
}

function formatNumber(value) {
  return Number.isFinite(value)
    ? new Intl.NumberFormat(currentLocale === "th" ? "th-TH" : "en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value)
    : "—";
}

function relationshipLabel(user) {
  return t(getRelationshipState(user).infoKey);
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadText(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getExportUsers() {
  let users = core.filterUsers([...loadedUsers.values()], currentFilter);
  const searchTerm = searchInput.value.trim().toLocaleLowerCase(currentLocale);
  if (searchTerm) {
    users = users.filter(
      (user) =>
        user.username.toLocaleLowerCase(currentLocale).includes(searchTerm) ||
        (user.full_name || "").toLocaleLowerCase(currentLocale).includes(searchTerm)
    );
  }
  users = core.filterBySignal(users, signalFilter?.value || "all", protectedUserIds);
  return core.sortUsers(users, sortSelect.value, currentLocale);
}

function exportCsv() {
  const users = getExportUsers();
  const rows = [
    [
      "username",
      "full_name",
      "relationship",
      "verified",
      "private",
      "protected",
      "followers",
      "following",
      "follower_following_ratio",
      "profile_url",
    ],
    ...users.map((user) => {
      const signals = core.getAccountSignals(user);
      return [
        user.username,
        user.full_name || "",
        relationshipLabel(user),
        signals.verified,
        signals.private,
        isProtected(user.id),
        signals.followerCount ?? "",
        signals.followingCount ?? "",
        signals.followerFollowingRatio == null
          ? ""
          : signals.followerFollowingRatio.toFixed(2),
        `https://www.instagram.com/${encodeURIComponent(user.username)}/`,
      ];
    }),
  ];
  downloadText(
    `instagram-${(caller || "connections").toLowerCase()}-${Date.now()}.csv`,
    rows.map((row) => row.map(escapeCsv).join(",")).join("\n"),
    "text/csv;charset=utf-8"
  );
  showNotice(t("exportDone"), "success");
}

function exportJson() {
  const users = getExportUsers();
  const payload = {
    exportedAt: new Date().toISOString(),
    view: caller,
    users: users.map((user) => ({
      id: user.id,
      username: user.username,
      full_name: user.full_name || "",
      relationship: getRelationshipState(user).tone,
      verified: core.getAccountSignals(user).verified,
      private: core.getAccountSignals(user).private,
      protected: isProtected(user.id),
      profile_url: `https://www.instagram.com/${encodeURIComponent(user.username)}/`,
    })),
  };
  downloadText(
    `instagram-${(caller || "connections").toLowerCase()}-${Date.now()}.json`,
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8"
  );
  showNotice(t("exportDone"), "success");
}

function exportBackup() {
  const payload = {
    format: "manage-instagram-followers-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    locale: currentLocale,
    whitelist: [...protectedUserIds],
    snapshots: snapshotHistory,
    settings,
  };
  downloadText(
    `manage-instagram-followers-backup-${Date.now()}.json`,
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8"
  );
  showNotice(t("backupDone"), "success");
}

function restoreBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || ""));
      if (
        payload?.format !== "manage-instagram-followers-backup" ||
        !Array.isArray(payload.whitelist) ||
        !Array.isArray(payload.snapshots)
      ) throw new Error("invalid backup");
      protectedUserIds.clear();
      payload.whitelist.map(String).filter(Boolean).slice(0, 5000).forEach((id) => protectedUserIds.add(id));
      snapshotHistory = payload.snapshots.slice(0, 12);
      settings = payload.settings && typeof payload.settings === "object" ? payload.settings : {};
      latestDiff = core.diffSnapshots(snapshotHistory[1], snapshotHistory[0]);
      persistState();
      renderCurrentUsers();
      renderHistory();
      showNotice(t("restoreDone"), "success");
    } catch {
      showNotice(t("invalidBackup"), "error");
    }
  };
  reader.readAsText(file);
}

function icon(name, size = 16, cls = "") {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" aria-hidden="true"><use href="#mif-i-${name}"/></svg>`;
}

function formatSnapshotDate(snapshot) {
  return new Date(snapshot.createdAt).toLocaleString(currentLocale === "th" ? "th-TH" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function renderHistory() {
  if (!historyList) return;
  updateHistoryBadge();
  if (!snapshotHistory.length) {
    historySummary.textContent = "";
    historyList.innerHTML = `<div class="history-empty">${t("historyNoData")}</div>`;
    return;
  }

  latestDiff = core.diffSnapshots(snapshotHistory[1], snapshotHistory[0]);
  historySummary.textContent = "";

  historyList.innerHTML = snapshotHistory.map((snapshot, index) => {
    const prev = snapshotHistory[index + 1];
    const diff = core.diffSnapshots(prev, snapshot);
    const dateLabel = formatSnapshotDate(snapshot);
    const lost = diff.followers.removed.length;
    const gained = diff.followers.added.length;
    const chips = diff.comparable
      ? `<div class="history-chips">
          ${lost ? `<span class="hchip hchip-lost">${icon("user-x", 13)}−${lost} ${t("tabLostFollowers")}</span>` : ""}
          ${diff.lostStillFollowing.length ? `<span class="hchip">${icon("user-check", 13)}${diff.lostStillFollowing.length} ${t("tabLostStillFollowing")}</span>` : ""}
          ${diff.bothRemoved.length ? `<span class="hchip hchip-lost">${icon("user-minus", 13)}${diff.bothRemoved.length} ${t("tabRemovedBoth")}</span>` : ""}
          ${gained ? `<span class="hchip hchip-new">${icon("user-plus", 13)}+${gained} ${t("tabNewFollowers")}</span>` : ""}
          ${diff.following.removed.length ? `<span class="hchip">${icon("user-minus", 13)}−${diff.following.removed.length} ${t("tabFollowingRemoved")}</span>` : ""}
          ${diff.following.added.length ? `<span class="hchip">${icon("user-check", 13)}+${diff.following.added.length} ${t("tabYouFollowed")}</span>` : ""}
          ${!lost && !gained && !diff.following.added.length && !diff.following.removed.length ? `<span class="hchip">${t("noChanges")}</span>` : ""}
        </div>`
      : `<div class="history-chips"><span class="hchip">${t("historyFirst")}</span></div>`;
    const body = `
      <div class="history-when"><strong>${index === 0 ? t("currentSnapshot") : dateLabel}</strong>${index === 0 ? `<span>${dateLabel}</span>` : ""}</div>
      <div class="history-counts"><span>${formatNumber(snapshot.followers?.length || 0)} ${t("followersStat")}</span><span>${formatNumber(snapshot.following?.length || 0)} ${t("followingStat")}</span></div>
      ${chips}
      ${diff.comparable ? `<span class="history-go">${t("viewChanges")}${icon("arrow-right", 14)}</span>` : ""}`;
    return diff.comparable
      ? `<button type="button" class="history-row is-clickable" data-index="${index}">${body}</button>`
      : `<div class="history-row">${body}</div>`;
  }).join("");
}

/* ───────────── History detail: who changed ───────────── */
const historyDetail = document.getElementById("historyDetail");
const historyDetailTabs = document.getElementById("historyDetailTabs");
const historyDetailList = document.getElementById("historyDetailList");
const historyDetailRange = document.getElementById("historyDetailRange");
const historyDetailNote = document.getElementById("historyDetailNote");
const historyDetailState = { index: 0, tab: "lost" };

const DETAIL_TABS = [
  { id: "lost", label: "tabLostFollowers", note: "lostNote", icon: "user-x", tone: "lost" },
  { id: "lostStillFollowing", label: "tabLostStillFollowing", note: "lostStillFollowingNote", icon: "user-check", tone: "neutral" },
  { id: "bothRemoved", label: "tabRemovedBoth", note: "removedBothNote", icon: "user-minus", tone: "lost" },
  { id: "new", label: "tabNewFollowers", note: "newNote", icon: "user-plus", tone: "new" },
  { id: "followingRemoved", label: "tabFollowingRemoved", note: "followingRemovedNote", icon: "user-minus", tone: "neutral" },
  { id: "followed", label: "tabYouFollowed", note: "youFollowedNote", icon: "user-check", tone: "neutral" },
];

function getDetailGroups(index) {
  const diff = core.diffSnapshots(snapshotHistory[index + 1], snapshotHistory[index]);
  return {
    lost: diff.followers.removed,
    lostStillFollowing: diff.lostStillFollowing,
    bothRemoved: diff.bothRemoved,
    new: diff.followers.added,
    followingRemoved: diff.following.removed,
    followed: diff.following.added,
  };
}

function connectionHas(type, id) {
  const map = connectionCache[type];
  if (!map) return null;
  return map.has(String(id)) || map.has(Number(id));
}

function avatarHue(id) {
  let hash = 7;
  for (const char of String(id)) hash = (hash * 131 + char.charCodeAt(0) * 17) % 360;
  return hash;
}

function buildProfileCard(user, tabId, index) {
  const username = String(user.username || "");
  const displayName = String(user.full_name || "").trim() || username || `ID ${user.id}`;
  const card = document.createElement(username ? "a" : "div");
  card.className = "profile-card";
  card.style.setProperty("--i", String(Math.min(index, 14)));
  if (username) {
    card.href = `https://www.instagram.com/${encodeURIComponent(username)}/`;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("aria-label", `${t("openProfile")}: @${username}`);
  }

  const avatar = document.createElement("span");
  avatar.className = "pc-avatar";
  avatar.style.setProperty("--h", String(avatarHue(username || user.id)));
  avatar.textContent = (displayName.replace(/^@/, "").trim()[0] || "?").toUpperCase();

  const body = document.createElement("span");
  body.className = "pc-body";
  const name = document.createElement("strong");
  name.textContent = displayName;
  body.append(name);
  if (username) {
    const handle = document.createElement("small");
    handle.textContent = `@${username}`;
    body.append(handle);
  }

  const chips = document.createElement("span");
  chips.className = "pc-chips";
  if (tabId === "lost" && connectionHas("Following", user.id)) {
    chips.append(createChip("warning", t("youStillFollow")));
  }
  if (tabId === "lostStillFollowing") {
    chips.append(createChip("warning", t("youStillFollow")));
  }
  if (tabId === "new" && connectionHas("Following", user.id) === false) {
    chips.append(createChip("info", t("youDontFollowBack")));
  }
  if (chips.childElementCount) body.append(chips);

  card.append(avatar, body);
  if (username) {
    const open = document.createElement("span");
    open.className = "pc-open";
    open.setAttribute("aria-hidden", "true");
    open.innerHTML = icon("arrow-right", 16);
    card.append(open);
  }
  return card;
}

function renderHistoryDetail() {
  const { index, tab } = historyDetailState;
  const groups = getDetailGroups(index);
  const snapshot = snapshotHistory[index];
  const previous = snapshotHistory[index + 1];
  if (!snapshot || !previous) return;

  historyDetailRange.textContent = `${formatSnapshotDate(previous)}  →  ${formatSnapshotDate(snapshot)}`;

  historyDetailTabs.innerHTML = "";
  DETAIL_TABS.forEach((def) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `detail-tab tone-${def.tone}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(def.id === tab));
    button.dataset.tab = def.id;
    button.innerHTML = `${icon(def.icon, 15)}<span>${t(def.label)}</span><b>${groups[def.id].length}</b>`;
    historyDetailTabs.append(button);
  });

  const activeDef = DETAIL_TABS.find((def) => def.id === tab) || DETAIL_TABS[0];
  historyDetailNote.textContent = groups[activeDef.id].length ? t(activeDef.note) : "";

  historyDetailList.innerHTML = "";
  const users = [...groups[activeDef.id]].sort((a, b) =>
    String(a.username || a.id).localeCompare(String(b.username || b.id))
  );
  if (!users.length) {
    historyDetailList.innerHTML = `<div class="history-empty">${t("detailEmpty")}</div>`;
    return;
  }
  const fragment = document.createDocumentFragment();
  users.forEach((user, i) => fragment.append(buildProfileCard(user, activeDef.id, i)));
  historyDetailList.append(fragment);
}

function openHistoryDetail(index, preferredTab = null) {
  const groups = getDetailGroups(index);
  const firstWithItems = DETAIL_TABS.find((def) => groups[def.id].length)?.id || "lost";
  historyDetailState.index = index;
  historyDetailState.tab = preferredTab || (groups.lost.length ? "lost" : firstWithItems);
  renderHistoryDetail();
  historyList.hidden = true;
  historySummary.hidden = true;
  historyDetail.hidden = false;
  historyDetail.scrollTop = 0;
  if (index === 0) {
    orbUnseen = 0;
    updateOrbBadge();
  }
}

function closeHistoryDetail() {
  historyDetail.hidden = true;
  historyList.hidden = false;
  historySummary.hidden = false;
}

function updateHistoryBadge() {
  const button = document.getElementById("historyButton");
  if (!button) return;
  let badge = button.querySelector(".tool-badge");
  const lost = snapshotHistory.length > 1 ? core.diffSnapshots(snapshotHistory[1], snapshotHistory[0]).followers.removed.length : 0;
  if (!lost) {
    badge?.remove();
    return;
  }
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "tool-badge";
    button.append(badge);
  }
  badge.textContent = `−${lost}`;
}

historyList.addEventListener("click", (event) => {
  const row = event.target.closest(".history-row[data-index]");
  if (row) openHistoryDetail(Number(row.dataset.index));
});
historyDetailTabs.addEventListener("click", (event) => {
  const tabButton = event.target.closest(".detail-tab");
  if (!tabButton) return;
  historyDetailState.tab = tabButton.dataset.tab;
  renderHistoryDetail();
});
document.getElementById("historyDetailBack").addEventListener("click", closeHistoryDetail);
document.getElementById("historyCopyButton").addEventListener("click", async () => {
  const users = getDetailGroups(historyDetailState.index)[historyDetailState.tab] || [];
  const text = users.filter((user) => user.username).map((user) => `@${user.username}`).join("\n");
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showNotice(t("usernamesCopied"), "success");
  } catch (error) {
    showNotice(String(error?.message || error), "warning");
  }
});

function toggleProtected(userId) {
  const id = String(userId);
  if (protectedUserIds.has(id)) protectedUserIds.delete(id);
  else protectedUserIds.add(id);
  persistState();
  renderCurrentUsers();
}

function updateFilterCounts() {
  const counts = core.countRelationships([...loadedUsers.values()]);
  document.querySelectorAll("[data-count]").forEach((element) => {
    element.textContent = String(counts[element.dataset.count] || 0);
  });
  if (caller === "Following") {
    filterRequestedButton.style.display = counts.requested ? "flex" : "none";
  }
  updateInsightStrip();
}

function setFilter(filter) {
  currentFilter = filter || "all";
  document.querySelectorAll(".filter[data-filter]").forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("filter-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderCurrentUsers();
}

function renderCurrentUsers() {
  let users = core.filterUsers([...loadedUsers.values()], currentFilter);
  const searchTerm = searchInput.value.trim().toLocaleLowerCase(currentLocale);
  if (searchTerm) {
    users = users.filter(
      (user) =>
        user.username.toLocaleLowerCase(currentLocale).includes(searchTerm) ||
        (user.full_name || "")
          .toLocaleLowerCase(currentLocale)
          .includes(searchTerm)
    );
  }
  users = core.filterBySignal(users, signalFilter?.value || "all", protectedUserIds);
  const filteredUsers = core.sortUsers(users, sortSelect.value, currentLocale);
  visibleUserIds = filteredUsers.map((user) => user.id);
  addUsersToDom(
    filteredUsers,
    filteredUsers.length === 0
      ? searchTerm
        ? "search"
        : currentFilter !== "all"
        ? "filter"
        : "empty"
      : null
  );
}

function updateUpdatedAt() {
  if (!lastUpdatedAt) {
    updatedAt.textContent = "";
    return;
  }
  const minutes = Math.floor((Date.now() - lastUpdatedAt) / 60000);
  updatedAt.textContent =
    minutes < 1 ? t("updatedNow") : t("updatedMinutes", { count: minutes });
}

const ICON_STAR =
  '<svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="m12 3.6 2.55 5.2 5.7.83-4.13 4.02.98 5.7L12 16.7l-5.1 2.65.98-5.7L3.75 9.63l5.7-.83L12 3.6Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
const CHIP_ICONS = {
  verified:
    '<svg class="icon" viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true"><path d="m12 2.8 2.3 1.7 2.8-.1.9 2.7 2.3 1.6-.9 2.7.9 2.7-2.3 1.6-.9 2.7-2.8-.1L12 21.2l-2.3-1.7-2.8.1-.9-2.7-2.3-1.6.9-2.7-.9-2.7 2.3-1.6.9-2.7 2.8.1L12 2.8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m8.6 12.1 2.3 2.3 4.5-4.7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  private:
    '<svg class="icon" viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  ratio:
    '<svg class="icon" viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true"><path d="M5 20V10m7 10V4m7 16v-7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
};

function createChip(kind, label) {
  const chip = document.createElement("span");
  chip.className = `chip chip-${kind}`;
  chip.insertAdjacentHTML("afterbegin", CHIP_ICONS[kind] || "");
  const text = document.createElement("span");
  text.textContent = label;
  chip.append(text);
  return chip;
}

function addUsersToDom(users, emptyReason = null) {
  const generation = ++renderGeneration;
  userList.innerHTML = "";
  userList.style.display = "flex";
  title.textContent =
    caller === "Followers" ? t("followersTitle") : t("followingTitle");
  updateResultsMeta(users);

  if (users.length === 0) {
    renderEmptyState(emptyReason || (currentFilter ? "filter" : "empty"));
    return;
  }

  const renderChunk = (startIndex) => {
    if (generation !== renderGeneration) return;
    const fragment = document.createDocumentFragment();
    users.slice(startIndex, startIndex + 80).forEach((user, itemIndex) => {
    const relationState = getRelationshipState(user);
    const profileUrl = `https://www.instagram.com/${encodeURIComponent(
      user.username
    )}/`;
    const userDiv = document.createElement("article");
    userDiv.className = "user";
    userDiv.dataset.id = user.id;
    userDiv.style.setProperty("--i", String(Math.min(itemIndex, 14)));

    const photoLink = document.createElement("a");
    photoLink.className = "user-photo-link";
    photoLink.href = profileUrl;
    photoLink.target = "_blank";
    photoLink.rel = "noreferrer";
    photoLink.setAttribute("aria-label", `@${user.username}`);

    const photo = document.createElement("img");
    photo.className = "user-photo";
    photo.src = user.profile_pic_url;
    photo.alt = "";
    photo.width = 44;
    photo.height = 44;
    photo.loading = "lazy";
    photoLink.appendChild(photo);

    const details = document.createElement("div");
    details.className = "user-details";

    const username = document.createElement("a");
    username.className = "username";
    username.href = profileUrl;
    username.target = "_blank";
    username.rel = "noreferrer";
    username.textContent = `@${user.username}`;

    const fullName = document.createElement("span");
    fullName.className = "full-name";
    fullName.textContent = user.full_name || "";

    const relationshipInfo = document.createElement("span");
    relationshipInfo.className = "relationship-info";
    relationshipInfo.dataset.relationship = relationState.tone;
    relationshipInfo.textContent = t(relationState.infoKey);

    const signals = core.getAccountSignals(user);
    const signalInfo = document.createElement("span");
    signalInfo.className = "account-signals";
    const chips = [];
    if (signals.verified) chips.push(createChip("verified", t("verifiedBadge")));
    if (signals.private) chips.push(createChip("private", t("privateBadge")));
    if (signals.followerFollowingRatio != null) {
      chips.push(
        createChip(
          "ratio",
          t("ratioLabel", {
            ratio:
              signals.followerFollowingRatio >= 10
                ? "10+"
                : signals.followerFollowingRatio.toFixed(1),
          })
        )
      );
    }
    signalInfo.append(...chips);
    signalInfo.hidden = chips.length === 0;

    details.append(username, fullName, relationshipInfo, signalInfo);

    const protectButton = document.createElement("button");
    protectButton.type = "button";
    protectButton.className = "protect-button";
    protectButton.dataset.id = user.id;
    protectButton.innerHTML = ICON_STAR;
    protectButton.setAttribute("aria-pressed", String(isProtected(user.id)));
    protectButton.setAttribute(
      "aria-label",
      isProtected(user.id) ? t("unprotectedAccount") : t("protectedAccount")
    );
    protectButton.title = isProtected(user.id)
      ? t("unprotectedAccount")
      : t("protectedAccount");

    const actionButton = relationState.action === "follow"
      ? document.createElement("button")
      : null;
    if (actionButton) {
      actionButton.type = "button";
      actionButton.className = "action-button data-action-control";
      actionButton.dataset.id = user.id;
      actionButton.dataset.action = "follow";
      actionButton.textContent = t("follow");
    }

    userDiv.append(photoLink, details, protectButton);
    if (actionButton) userDiv.appendChild(actionButton);
      fragment.appendChild(userDiv);
    });
    userList.appendChild(fragment);
    if (startIndex + 80 < users.length) {
      requestAnimationFrame(() => renderChunk(startIndex + 80));
    }
  };
  renderChunk(0);
}

userList.addEventListener("click", (event) => {
  const protectButton = event.target.closest(".protect-button");
  if (protectButton) {
    toggleProtected(protectButton.dataset.id);
    return;
  }
  const button = event.target.closest(".action-button");
  if (button) handleActionButtonClick({ target: button });
});
let viewerId = instagramTransport.getViewerId() || null;

function isFollowWithinLimit() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const oneHourAgo = now - 3600000;
  followAttempts = followAttempts.filter((timestamp) => timestamp >= oneHourAgo);
  const attemptsLastMinute = followAttempts.filter((timestamp) => timestamp >= oneMinuteAgo).length;
  const attemptsLastHour = followAttempts.length;

  if (attemptsLastMinute >= 5) {
    showNotice(t("minuteLimit", { action: t("actionFollow") }), "warning");
    return false;
  }
  if (attemptsLastHour >= 60) {
    showNotice(t("hourLimit", { action: t("actionFollow") }), "warning");
    return false;
  }

  followAttempts.push(now);
  persistRateLimitState();
  return true;
}
const handleActionButtonClick = async (event) => {
  if (!ensureLicensed()) return;
  const userId = event.target.getAttribute("data-id");
  const action = event.target.getAttribute("data-action");
  if (action !== "follow" || !isFollowWithinLimit()) return;
  await followUser(userId, event.target);
};

function getInstagramErrorMessage(action, response, data) {
  const actionLabel = t("actionFollow");
  const reason =
    data?.feedback_message ||
    data?.message ||
    data?.error_type ||
    `HTTP ${response.status}`;
  const wasBlocked =
    response.status === 401 ||
    response.status === 403 ||
    response.status === 429 ||
    data?.feedback_required ||
    data?.spam ||
    data?.require_login ||
    data?.checkpoint_required ||
    /feedback_required|checkpoint_required|challenge_required|login_required/i.test(
      reason
    );

  if (wasBlocked) {
    return t("instagramBlocked", { action: actionLabel, reason });
  }

  return t("instagramRejected", { action: actionLabel, reason });
}

const responseMatchesFriendshipAction =
  core.responseMatchesFriendshipAction;

function getInstagramModule(moduleName) {
  try {
    const moduleRequire =
      typeof require === "function" ? require : window.require;
    return typeof moduleRequire === "function"
      ? moduleRequire(moduleName)
      : null;
  } catch (error) {
    console.warn(`Instagram module ${moduleName} is unavailable:`, error);
    return null;
  }
}

function getInstagramNavigationContext() {
  const navChain = getInstagramModule("IGNavChain")?.getInstance?.();
  const containerUtils = getInstagramModule("PolarisContainerModuleUtils");
  const pageId = navChain?.last?.()?.pageID;

  return {
    container_module:
      containerUtils?.getContainerModule?.(pageId) || "profile",
    nav_chain:
      navChain?.getNavChainForSend?.() ||
      "PolarisFeedRoot:feedPage:1:via_cold_start",
  };
}

async function performNativeInstagramFollow(userId) {
  const instapi = getInstagramModule("PolarisInstapi");
  if (!instapi?.apiPost) return { handled: false, data: null };

  const navigation = getInstagramNavigationContext();
  const response = await instapi.apiPost(
    "/api/v1/friendships/create/{target_user_id}/",
    {
      body: {
        container_module: navigation.container_module,
        include_follow_friction_check: true,
        nav_chain: navigation.nav_chain,
        user_id: userId,
      },
      path: { target_user_id: userId },
    }
  );

  return { handled: true, data: response?.data || response };
}

async function verifyFriendshipAction(userId, action) {
  const result = await instagramTransport.verifyFriendshipAction(
    userId,
    action,
    responseMatchesFriendshipAction
  );
  diagnostics.lastEndpoint = "friendship verification";
  diagnostics.lastStatus = result.matched ? 200 : null;
  return result.matched;
}

async function performFriendshipAction(userId, action) {
  if (action !== "follow") throw new Error(t("actionFailed", { action: t("actionFollow") }));
  try {
    if (action === "follow") {
      const nativeResult = await performNativeInstagramFollow(userId);
      if (nativeResult.handled) {
        diagnostics.lastEndpoint = "native Instagram follow";
        diagnostics.lastStatus = 200;
        if (
          responseMatchesFriendshipAction(nativeResult.data, action) ||
          (await verifyFriendshipAction(userId, action))
        ) {
          return nativeResult.data;
        }
        throw new Error(
          t("relationshipUnchanged", { action: t("actionFollow") })
        );
      }
    }

    const result = await instagramTransport.requestAction(action, userId);
    diagnostics.lastEndpoint = result.providerId;
    diagnostics.lastStatus = result.response?.status ?? null;

    if (
      responseMatchesFriendshipAction(result.data, action) ||
      (await verifyFriendshipAction(userId, action))
    ) {
      return result.data;
    }

    throw new Error(
      t("relationshipUnchanged", {
        action: t("actionFollow"),
      })
    );
  } catch (error) {
    const response = error?.response;
    const data = error?.data;
    const reason =
      data?.feedback_message ||
      data?.message ||
      error?.error?.message ||
      error?.message ||
      "unknown error";

    const responseLike = response || {
      status: diagnostics.lastStatus || 500,
    };

    throw new Error(
      getInstagramErrorMessage(action, responseLike, { ...data, message: reason })
    );
  }
}

const followUser = async (userId, button) => {
  button.disabled = true;
  button.dataset.state = "loading";
  button.textContent = t("followingLoading");
  dismissNotice();
  try {
    await performFriendshipAction(userId, "follow");
    console.log("User followed successfully.");
    const user = loadedUsers.get(userId);
    user.followed_by_viewer = true;
    user.requested_by_viewer = false;
    connectionCache.Following?.set(userId, user);
    connectionCacheUpdatedAt.Following = Date.now();
    updateFilterCounts();
    renderCurrentUsers();
    return true;
  } catch (error) {
    diagnostics.lastError = error?.message || String(error);
    const user = loadedUsers.get(userId);
    if (user) button.textContent = t(getRelationshipState(user).labelKey);
    showNotice(error.message || t("actionFailed", { action: t("actionFollow") }));
    console.error("Error in the follow request:", error);
    return false;
  } finally {
    delete button.dataset.state;
    button.disabled = false;
  }
};

document.querySelectorAll(".filter[data-filter]").forEach((button) => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

document.getElementById("refreshButton").addEventListener("click", async () => {
  if (!caller) return;
  connectionCache.Following = null;
  connectionCache.Followers = null;
  connectionCacheUpdatedAt.Following = 0;
  connectionCacheUpdatedAt.Followers = 0;
  // Must pass a fresh generation: without it fetchConnections bails out after
  // loading and never hides the loader (the "reload spins forever" bug).
  await fetchConnections(caller, ++viewGeneration);
});

document.getElementById("saveSnapshotButton").addEventListener("click", () => {
  saveCurrentSnapshot(true);
});
document.getElementById("historyButton").addEventListener("click", () => {
  if (!ensureLicensed()) return;
  renderHistory();
  closeHistoryDetail();
  historyDialog.hidden = false;
});
document.getElementById("closeHistoryButton").addEventListener("click", () => {
  historyDialog.hidden = true;
});
historyDialog.addEventListener("click", (event) => {
  if (event.target === historyDialog) historyDialog.hidden = true;
});
document.getElementById("exportCsvButton").addEventListener("click", exportCsv);
document.getElementById("exportJsonButton").addEventListener("click", exportJson);
document.getElementById("backupButton").addEventListener("click", exportBackup);
document.getElementById("restoreButton").addEventListener("click", () => {
  document.getElementById("restoreInput").click();
});
document.getElementById("restoreInput").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) restoreBackup(file);
  event.target.value = "";
});


/* ───────────── License gate ───────────── */
let license = { active: false, reason: "checking" };
const licenseDialog = document.getElementById("licenseDialog");
const licenseInput = document.getElementById("licenseInput");
const licenseMessage = document.getElementById("licenseMessage");
const licenseActivateButton = document.getElementById("licenseActivateButton");
const licenseBuyLink = document.getElementById("licenseBuyLink");
const licenseBanner = document.getElementById("licenseBanner");
const licenseChip = document.getElementById("licenseChip");
const licenseChipText = document.getElementById("licenseChipText");

function licenseRequest(op, key = "") {
  return new Promise((resolve) => {
    const requestId = crypto.randomUUID();
    const finish = (payload) => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      resolve(payload);
    };
    const onMessage = (event) => {
      if (
        event.source !== window ||
        !event.data?.mifStorage ||
        event.data.action !== "licenseResult" ||
        event.data.requestId !== requestId
      ) return;
      finish(event.data.payload || { active: false, reason: "server_error" });
    };
    const timer = setTimeout(() => finish({ active: false, reason: "offline" }), 25000);
    window.addEventListener("message", onMessage);
    window.postMessage(
      { mifStorage: true, action: "license", requestId, payload: { op, key, accountId: viewerId || "" } },
      window.location.origin
    );
  });
}

function licenseDate(value) {
  return new Date(value).toLocaleDateString(currentLocale === "th" ? "th-TH" : "en-US", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function licenseReasonText() {
  const reason = license.reason;
  if (!reason || reason === "no_key" || reason === "checking") return "";
  const key = `license_${reason}`;
  return translations.en[key] ? t(key) : t("license_server_error");
}

// Banner (locked), status chip (active) and the "Get a key" link follow the license state.
function renderLicenseState() {
  const checking = license.reason === "checking";
  licenseBanner.hidden = license.active || checking;
  licenseChip.hidden = !license.active;
  if (license.active) {
    let label = t("licenseChipForever");
    let tone = "ok";
    if (license.expiresAt) {
      const daysLeft = Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / 86400000);
      if (daysLeft <= 3) {
        label = t("licenseChipSoon", { days: Math.max(daysLeft, 0) });
        tone = "soon";
      } else {
        label = t("licenseChipUntil", { date: licenseDate(license.expiresAt) });
      }
    }
    licenseChipText.textContent = label;
    licenseChip.dataset.tone = tone;
    licenseChip.title = t("licenseChipTitle");
  }
  const buyUrl = license.buyUrl || "";
  licenseBuyLink.hidden = !buyUrl;
  if (buyUrl) licenseBuyLink.href = buyUrl;
}

function setLicenseMessage(text, tone = "") {
  licenseMessage.textContent = text;
  if (tone) licenseMessage.dataset.tone = tone;
  else delete licenseMessage.dataset.tone;
}

function showLicenseDialog(message = "", tone = "error") {
  setLicenseMessage(message, tone);
  licenseDialog.hidden = false;
  licenseInput.focus({ preventScroll: true });
}

function ensureLicensed() {
  if (license.active) return true;
  showLicenseDialog(licenseReasonText());
  return false;
}

async function activateFromDialog() {
  const key = licenseInput.value.trim();
  if (!key) {
    setLicenseMessage(t("licenseEmpty"), "error");
    return;
  }
  licenseActivateButton.disabled = true;
  setLicenseMessage(t("licenseChecking"));
  const result = await licenseRequest("activate", key);
  licenseActivateButton.disabled = false;
  if (result.active) {
    license = result;
    licenseInput.value = "";
    setLicenseMessage(
      result.expiresAt ? t("licenseOkUntil", { date: licenseDate(result.expiresAt) }) : t("licenseOk"),
      "success"
    );
    setTimeout(() => { licenseDialog.hidden = true; }, 900);
  } else {
    // A wrong key must not lock out someone whose current key still works.
    if (!license.active) license = result;
    else license = { ...license, buyUrl: result.buyUrl || license.buyUrl };
    const text = result.reason && translations.en[`license_${result.reason}`]
      ? t(`license_${result.reason}`)
      : t("license_server_error");
    setLicenseMessage(text, "error");
  }
  renderLicenseState();
}

licenseActivateButton.addEventListener("click", activateFromDialog);
licenseInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") activateFromDialog();
});
document.getElementById("licenseCloseButton").addEventListener("click", () => {
  licenseDialog.hidden = true;
});
document.getElementById("licenseBannerButton").addEventListener("click", () => showLicenseDialog(licenseReasonText()));
licenseChip.addEventListener("click", () => showLicenseDialog("", ""));

licenseRequest("status").then((result) => {
  license = result;
  renderLicenseState();
  if (!result.active) setTimeout(() => ensureLicensed(), 3400); // after the preloader
});

const storageRequestId = crypto.randomUUID();
window.addEventListener(
  "message",
  (event) => {
    if (
      event.source !== window ||
      !event.data?.mifStorage ||
      event.data.action !== "state" ||
      event.data.requestId !== storageRequestId
    ) {
      return;
    }
    const storedLocale = event.data.payload?.locale;
    if (storedLocale === "en" || storedLocale === "th") {
      setLocale(storedLocale, false);
    }
    const storedLimits = event.data.payload?.rateLimits;
    followAttempts = Array.isArray(storedLimits?.follow) ? storedLimits.follow : [];
    protectedUserIds.clear();
    (Array.isArray(event.data.payload?.whitelist) ? event.data.payload.whitelist : [])
      .map(String)
      .filter(Boolean)
      .slice(0, 5000)
      .forEach((id) => protectedUserIds.add(id));
    snapshotHistory = Array.isArray(event.data.payload?.snapshots)
      ? event.data.payload.snapshots.slice(0, 12)
      : [];
    settings = event.data.payload?.settings && typeof event.data.payload.settings === "object"
      ? event.data.payload.settings
      : {};
    const storedOrb = settings.orbPos;
    if (storedOrb && Number.isFinite(storedOrb.fx) && Number.isFinite(storedOrb.fy)) {
      orbPos = { fx: Math.min(1, Math.max(0, storedOrb.fx)), fy: Math.min(1, Math.max(0, storedOrb.fy)) };
      if (isMinimized) placeOrb();
    }
    latestDiff = core.diffSnapshots(snapshotHistory[1], snapshotHistory[0]);
    renderHistory();
    renderCurrentUsers();
  },
  { signal: lifecycle.signal }
);
window.postMessage(
  {
    mifStorage: true,
    action: "get",
    requestId: storageRequestId,
    payload: { accountId: viewerId || "default" },
  },
  window.location.origin
);

document
  .getElementById("copyDiagnosticsButton")
  .addEventListener("click", async () => {
    const counts = core.countRelationships([...loadedUsers.values()]);
    const report = {
      extension: "IG Snapper",
      version: "2.3.2",
      locale: currentLocale,
      view: caller || "home",
      filter: currentFilter,
      counts,
      lastEndpoint: diagnostics.lastEndpoint,
      lastStatus: diagnostics.lastStatus,
      lastFailure: Boolean(diagnostics.lastError),
      generatedAt: new Date().toISOString(),
    };
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    showNotice(t("diagnosticsCopied"), "success");
  });

document.getElementById("manage-instagram-followers-root")?.addEventListener(
  "pointermove",
  (event) => {
    const panel = event.target.closest?.(".my-component");
    if (panel) {
      const box = panel.getBoundingClientRect();
      panel.style.setProperty("--mx", `${event.clientX - box.left}px`);
      panel.style.setProperty("--my", `${event.clientY - box.top}px`);
    }
    const glowTarget = event.target.closest?.(
      ".user, .primary-cta, .intro-steps li, .insight-stat"
    );
    if (glowTarget) {
      const box = glowTarget.getBoundingClientRect();
      glowTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
      glowTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
    }
  },
  { signal: lifecycle.signal, passive: true }
);

if (window.__IGS_START_MINIMIZED) {
  rootEl.querySelector(".preloader")?.remove();
  overlay.classList.add("is-hidden");
  rootEl.classList.add("is-minimized");
  isMinimized = true;
  placeOrb();
  hudOrb.hidden = false;
  updateOrbBadge();
}
setLocale(getPreferredLocale(), false);
document
  .getElementById("findNonFollowersButton")
  .focus({ preventScroll: true });
})();

  }).call(window);
})();
