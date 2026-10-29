import type { DataAdapter } from "./adapter";
import { supabaseAdapter } from "./supabase-adapter";

/** Production adapter: server-side Supabase access. Mock data remains for design/testing only. */
export const data: DataAdapter = supabaseAdapter;
export * from "./types";
