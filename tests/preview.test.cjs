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
