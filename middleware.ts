import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;

  // Rutas siempre públicas
  const publicRoutes = ["/", "/login", "/register", "/api/", "/onboarding", "/inactive"];
  if (publicRoutes.some(r => pathname.startsWith(r))) return res;

  // No logueado → login
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  // Solo verificar suscripción en /dashboard
  if (pathname.startsWith("/dashboard")) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("status, trial_ends_at, ml_user_id")
      .eq("user_id", user.id)
      .single();

    if (!tenant) return NextResponse.redirect(new URL("/onboarding", req.url));

    const now = new Date();
    const isTrial  = tenant.status === "trial" && new Date(tenant.trial_ends_at) > now;
    const isActive = tenant.status === "active";
    if (!isTrial && !isActive) return NextResponse.redirect(new URL("/inactive", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
