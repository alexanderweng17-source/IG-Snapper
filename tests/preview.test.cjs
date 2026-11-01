const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const preview = fs.readFileSync(require("node:path").join(__dirname, "../public/preview.html"), "utf8");

test("download preview offers separate device installs and protects the Chrome ZIP", () => {
  assert.ok(preview.includes("download:(device)=>"));
  assert.ok(preview.includes("#download/pc"));
  assert.ok(preview.includes("#download/ios"));
  assert.ok(preview.includes('href="/api/downloads/chrome"'));
  assert.ok(preview.includes('href="/downloads/ig-snapper.user.js"'));
  assert.ok(preview.includes("String.fromCodePoint"));
  assert.ok(!preview.includes("TH."));
  assert.ok(!preview.includes("/downloads/IG-Snapper-v"));
  assert.ok(!preview.includes("IG-Snapper-v2.3.1-customer.zip"));
  assert.ok(!preview.includes("row(n,i<3?'Unfollow':'Follow'"));
});

test("all inline JavaScript in the download preview parses", () => {
  const scripts = [];
  let cursor = 0;
  while (true) {
    const start = preview.indexOf("<script", cursor);
    if (start < 0) break;
    const contentStart = preview.indexOf(">", start) + 1;
    const end = preview.indexOf("</script>", contentStart);
    assert.ok(contentStart > 0 && end >= 0, "malformed script element");
    const source = preview.slice(contentStart, end);
    if (source.trim()) scripts.push(source);
    cursor = end + "</script>".length;
  }
  assert.ok(scripts.length > 0, "no inline scripts found");
  for (const [index, source] of scripts.entries()) {
    new vm.Script(source, { filename: `preview-inline-${index}.js` });
  }
});

test("download preview retains its Thai copy after generation", () => {
  const thaiCount = [...preview].filter((character) => {
    const code = character.codePointAt(0);
    return code >= 0x0e00 && code <= 0x0e7f;
  }).length;
  assert.ok(thaiCount >= 4500, `expected Thai copy, found ${thaiCount} characters`);
  assert.ok(!preview.includes("??????"));
});

test("store copy reflects Snapshot semantics, device editions and closed checkout", () => {
  assert.ok(preview.includes("Chrome คอมพิวเตอร์ · Safari iPhone/iPad (Userscripts) · v2.3.4"));
  assert.ok(preview.includes("ไม่ใช่บันทึกกิจกรรมจาก Instagram"));
  assert.ok(preview.includes("Update/Available Updates"));
  assert.ok(preview.includes("ขณะนี้ร้านยังไม่เปิดรับชำระเงินจริง"));
  assert.ok(preview.includes('aria-disabled="true"'));
  assert.ok(!preview.includes('href="/checkout?plan='));
  assert.ok(!preview.includes("เลิกติดตามคุณ"));
});

test("Chrome, iOS, Store and protected route are pinned to one release version", () => {
  const root = require("node:path").join(__dirname, "..");
  const manifest = JSON.parse(fs.readFileSync(require("node:path").join(root, "extension/chrome/manifest.json"), "utf8"));
  const site = fs.readFileSync(require("node:path").join(root, "src/content/site.ts"), "utf8");
  const nextConfig = fs.readFileSync(require("node:path").join(root, "next.config.mjs"), "utf8");
  const userscript = fs.readFileSync(require("node:path").join(root, "public/downloads/ig-snapper.user.js"), "utf8");
  assert.equal(manifest.version, "2.3.4");
  assert.ok(site.includes('version: "2.3.4"'));
  assert.ok(site.includes('IG-Snapper-v2.3.4-customer.zip'));
  assert.ok(nextConfig.includes("./releases/v2.3.4/chrome/IG-Snapper-v2.3.4-customer.zip"));
  const downloadRoute = fs.readFileSync(require("node:path").join(root, "src/app/api/downloads/chrome/route.ts"), "utf8");
  assert.ok(downloadRoute.includes('"v2.3.4", "chrome", "IG-Snapper-v2.3.4-customer.zip"'));
  assert.doesNotMatch(downloadRoute, /product\.version|product\.packageName/);
  assert.match(userscript, /@version\s+2\.3\.4/);
  assert.ok(userscript.includes("@updateURL    https://ig-snapper.vercel.app/downloads/ig-snapper.user.js"));
});

test("Store Checkout controls follow the server's closed/open state", () => {
  const root = require("node:path").join(__dirname, "..");
  const preview = fs.readFileSync(require("node:path").join(root, "public/preview.html"), "utf8");
  const api = fs.readFileSync(require("node:path").join(root, "src/app/api/store/plans/route.ts"), "utf8");

  assert.ok(api.includes("checkoutEnabled"));
  assert.ok(api.includes("every(checkoutIsEnabled)"));
  assert.ok(preview.includes("checkoutEnabled=payload.checkoutEnabled===true"));
  assert.ok(preview.includes("if(!checkoutEnabled)"));
  assert.match(preview, /checkoutEnabled \? '[\s\S]*?disabled aria-disabled="true"/);
  assert.ok(preview.includes("ร้านยังไม่เปิดรับชำระเงินจริง"));
});

test("Store plan links remain non-purchasable while checkout is closed", () => {
  assert.ok(preview.includes("aria-disabled=\"true\" role=\"status\""));
  assert.ok(!preview.includes('href="/checkout?plan='));
});
