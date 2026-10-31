// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildClaim, clientIp } from "./decide.js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ valid: false, reason: "method" }, 405);
  try {
    const body = await req.json().catch(() => null);
    const claim: any = await buildClaim(body);
    if (claim.error) return json({ valid: false, reason: claim.error });

    const { data, error } = await supabase.rpc("claim_license", {
      p_key_hash: claim.args.keyHash,
      p_device: claim.args.device,
      p_account: claim.args.account,
      p_ip: clientIp(req.headers),
    });
    if (error) throw error;
    return json({ valid: !!data?.valid, reason: String(data?.reason || "server_error"), expiresAt: data?.expiresAt ?? null });
  } catch (error) {
    console.error(error);
    return json({ valid: false, reason: "server_error" }, 500);
  }
});
