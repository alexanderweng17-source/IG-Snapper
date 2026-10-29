import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerSecret, getSupabaseUrl } from "./env";

export function createSupabaseAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServerSecret(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
