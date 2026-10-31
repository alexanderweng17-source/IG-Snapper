// Pure helpers (no I/O) so they can be unit-tested in Node and run in Deno.
// License limits, expiry and atomic binding live in public.claim_license.

export function normalizeKey(key) {
  return String(key || "").trim().toUpperCase().replace(/\s+/g, "");
}

export async function hashKey(key) {
  const bytes = new TextEncoder().encode(normalizeKey(key));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// IPv6 privacy addresses rotate within the same /64 prefix.
export function normalizeIp(ip) {
  const value = String(ip || "").trim().toLowerCase();
  if (!value) return "";
  if (value.includes(":") && !value.startsWith("::ffff:")) {
    const [head, tail = ""] = value.split("::");
    const left = head ? head.split(":") : [];
    const right = tail ? tail.split(":") : [];
    const missing = Math.max(0, 8 - left.length - right.length);
    const groups = [...left, ...Array(missing).fill("0"), ...right].map((g) => g.padStart(4, "0"));
    return `${groups.slice(0, 4).join(":")}::/64`;
  }
  return value.replace(/^::ffff:/, "");
}

// The IP is only used to slow down key guessing; it is not stored with licenses.
export function clientIp(headers) {
  const get = (name) => (typeof headers.get === "function" ? headers.get(name) : headers[name]);
  const forwarded = String(get("x-forwarded-for") || "").split(",")[0].trim();
  return normalizeIp(get("cf-connecting-ip") || forwarded || get("x-real-ip") || "");
}

const DEVICE_RE = /^[A-Za-z0-9-]{16,64}$/;
const ACCOUNT_RE = /^[a-f0-9]{64}$/;

export async function buildClaim(body) {
  const key = normalizeKey(body?.key);
  if (key.length < 12 || key.length > 64) return { error: "not_found" };
  const device = String(body?.deviceId || "");
  if (!DEVICE_RE.test(device)) return { error: "bad_request" };
  const account = String(body?.accountHash || "");
  if (account && !ACCOUNT_RE.test(account)) return { error: "bad_request" };
  return { args: { keyHash: await hashKey(key), device, account } };
}
