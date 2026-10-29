"use client";
import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;
export function createSupabaseBrowserClient() {
  if (!browserClient) browserClient = createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
  return browserClient;
}
