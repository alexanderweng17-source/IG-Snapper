importScripts("license-config.js");

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
        ? localState.snapshots.filter((snapshot) => accountId === "default"
          ? !snapshot?.viewerId
          : snapshot?.viewerId && String(snapshot.viewerId) === accountId)
        : [];
      sendResponse({
        locale: localState.locale,
        rateLimits: sessionState.rateLimits,
        whitelist: Array.isArray(accountWhitelist)
          ? accountWhitelist
          : accountId === "default" && Array.isArray(localState.whitelist)
          ? localState.whitelist
          : [],
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
  const buyUrl = String(self.IG_SNAPPER_BUY_URL || "");
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
  const endpoint = self.IG_SNAPPER_LICENSE_ENDPOINT || "";
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

chrome.action.onClicked.addListener(async (tab) => {
  // If IG Snapper already lives in the current Instagram tab (open or minimized
  // as the HUD orb), bring it back instead of opening another tab.
  if (tab?.id && /^https:\/\/([^/]+\.)?instagram\.com\//.test(tab.url || "")) {
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: restoreIfPresent,
      });
      if (result?.result) return;
      await injectExtension(tab.id);
      return;
    } catch (error) {
      // fall through to opening a fresh tab
    }
  }
  const targetTab = await chrome.tabs.create({
    url: "https://www.instagram.com/",
  });
  await waitForTab(targetTab.id);
  await injectExtension(targetTab.id);
});

function restoreIfPresent() {
  const root = document.getElementById("manage-instagram-followers-root");
  if (!root) return false;
  root.dispatchEvent(new Event("mif-restore"));
  return true;
}

async function waitForTab(tabId) {
  const tab = await chrome.tabs.get(tabId);
  if (tab.status === "complete") return;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      reject(new Error("Instagram took too long to load."));
    }, 30000);

    function onUpdated(updatedTabId, changeInfo) {
      if (updatedTabId !== tabId || changeInfo.status !== "complete") return;
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      resolve();
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
  });
}

async function injectExtension(tabId) {
  await chrome.scripting.insertCSS({
    files: ["tokens.css", "style.css"],
    target: { tabId },
  });
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["html.js"],
  });
  await chrome.scripting.executeScript({
    target: { tabId },
    function: injectPageScripts,
  });
}

function injectPageScripts() {
  const sources = ["core.js", "instagram-api.js", "script.js"].map((file) =>
    chrome.runtime.getURL(file)
  );

  const loadNext = () => {
    const source = sources.shift();
    if (!source) return;

    const script = document.createElement("script");
    script.src = source;
    script.onload = () => {
      script.remove();
      loadNext();
    };
    script.onerror = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  };

  loadNext();
}
