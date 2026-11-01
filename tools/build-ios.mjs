// Builds the iPhone/iPad (Safari + Userscripts app) edition of IG Snapper from the
// unpacked Chrome customer package.
//   node tools/build-ios.mjs <unpacked-customer-dir> <out.user.js> [https://your-site]
// The Chrome extension APIs are replaced by a small shim (storage -> GM storage,
// license check -> GM_xmlhttpRequest). Passing the site URL enables auto-update.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { transform } = require("lightningcss");

const [, , srcDir, outFile, siteUrlRaw = ""] = process.argv;
if (!srcDir || !outFile) {
  console.error("usage: node tools/build-ios.mjs <unpacked-customer-dir> <out.user.js> [siteUrl]");
  process.exit(1);
}
const siteUrl = siteUrlRaw.replace(/\/+$/, "");
const rd = (name) => fs.readFileSync(path.join(srcDir, name), "utf8");
const version = JSON.parse(rd("manifest.json")).version;

// ---- CSS: flatten nesting / add fallbacks for older Safari, then phone-sized fixes
let css = rd("tokens.css") + "\n" + rd("style.css");
css = new TextDecoder().decode(
  transform({ filename: "ig-snapper.css", code: Buffer.from(css), minify: false, targets: { safari: 15 << 16 }, errorRecovery: true }).code
);
css += `
/* ---- iOS Safari tweaks ---- */
#manage-instagram-followers-root { -webkit-text-size-adjust: 100%; }
#manage-instagram-followers-root input,
#manage-instagram-followers-root select,
#manage-instagram-followers-root textarea { font-size: 16px !important; }
#manage-instagram-followers-root .app-header { flex-wrap: wrap; row-gap: 0.6rem; }
#manage-instagram-followers-root .brand-block { flex: 1 1 auto; min-width: 8.5rem; }
#manage-instagram-followers-root #appTitle { white-space: nowrap; overflow-wrap: normal; }
#manage-instagram-followers-root .header-actions { margin-left: auto; }
@media (max-width: 39.99rem) {
  #manage-instagram-followers-root .list-heading { position: static; }
  #manage-instagram-followers-root .footer-status { display: none; }
  #manage-instagram-followers-root .app-footer { padding-top: 0.5rem; padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px)); }
  #manage-instagram-followers-root .developer-credit { padding: 0.35rem 0.8rem; min-height: 0; }
  #manage-instagram-followers-root .credit-mark svg { width: 20px; height: 20px; }
  #manage-instagram-followers-root .tools-grid { padding: var(--space-sm) var(--space-md) 0; }
  #manage-instagram-followers-root .diagnostic-button { margin-left: var(--space-md); margin-bottom: var(--space-md); }
}
@media (max-width: 30rem) {
  #manage-instagram-followers-root .kicker-sep,
  #manage-instagram-followers-root .kicker-ver { display: none; }
}
`;

// ---- background.js: keep the license + storage logic, drop tab / action code
let bg = rd("background.js").replace('importScripts("license-config.js");', "");
bg = bg.slice(0, bg.indexOf("chrome.action.onClicked.addListener"));
const cfg = rd("license-config.js");

// ---- script.js: optionally start as the floating orb so Instagram stays usable
let sc = rd("script.js").replace(/\r\n/g, "\n");
const marker = 'setLocale(getPreferredLocale(), false);\ndocument\n  .getElementById("findNonFollowersButton")';
if (!sc.includes(marker)) throw new Error("script.js layout changed: start-minimized marker not found");
sc = sc.replace(
  marker,
  `if (window.__IGS_START_MINIMIZED) {
  rootEl.querySelector(".preloader")?.remove();
  overlay.classList.add("is-hidden");
  rootEl.classList.add("is-minimized");
  isMinimized = true;
  placeOrb();
  hudOrb.hidden = false;
  updateOrbBadge();
}
` + marker
);

// ---- Chrome-extension API shim (runs inside the userscript)
const shim = String.raw`
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
`;

// ---- One-tap activation: the website opens instagram.com/#igs-key=KEY; the key is
// read from the URL fragment (never sent to any server), removed from the address bar,
// activated against the license server, and the window opens to show the result.
const keyLink = String.raw`
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
`;

// ---- Assemble
const wrap = (name, code) => `\n  /* ===== ${name} ===== */\n  (function () {\n${code}\n  }).call(window);\n`;

const updateLines = siteUrl
  ? `// @updateURL    ${siteUrl}/downloads/ig-snapper.user.js\n// @downloadURL  ${siteUrl}/downloads/ig-snapper.user.js\n`
  : "";
const header = `// ==UserScript==
// @name         IG Snapper (iPhone / iPad)
// @namespace    ig-snapper
// @version      ${version}
// @description  IG Snapper for Safari on iPhone and iPad (Userscripts app)
// @match        https://www.instagram.com/*
// @match        https://instagram.com/*
// @noframes
// @run-at       document-idle
// @inject-into  content
// @connect      hihhomdldouekdymgmzn.supabase.co
${updateLines}// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==
`;

let out = header + '(async function () {\n  "use strict";\n  if (window.__igSnapperIosLoaded) return;\n  window.__igSnapperIosLoaded = true;\n';
out += shim;
out += wrap("license config + storage/license logic", cfg.replaceAll("self.", "window.") + "\n" + bg.replaceAll("self.", "window."));
out += keyLink;
out += `\n  const __css = document.createElement("style");\n  __css.id = "igs-style";\n  __css.textContent = ${JSON.stringify(css)};\n  (document.head || document.documentElement).appendChild(__css);\n`;
out += wrap("html.js", rd("html.js"));
out += wrap("core.js", rd("core.js"));
out += wrap("instagram-api.js", rd("instagram-api.js"));
out += wrap("script.js", sc);
out += "})();\n";

fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
fs.writeFileSync(outFile, out, "utf8");
console.log(`built ${outFile} (${out.length} bytes, v${version}${siteUrl ? ", update URL " + siteUrl : ""})`);
