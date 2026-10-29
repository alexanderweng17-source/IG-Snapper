import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { safeNext } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  if (!code) {
    url.pathname = "/login";
    url.search = "?error=auth_callback";
    return NextResponse.redirect(url);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(toSet) {
        try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* route handler cookie writes are supported by Next */ }
      },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  const target = request.nextUrl.clone();
  if (error) {
    target.pathname = "/login";
    target.search = "?error=auth_callback";
  } else {
    target.pathname = next;
    target.search = "";
  }
  return NextResponse.redirect(target);
}
