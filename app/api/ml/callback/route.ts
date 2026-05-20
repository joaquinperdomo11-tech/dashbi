import { NextRequest, NextResponse } from "next/server";
import { exchangeMLCode, getMLUser } from "@/lib/ml";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const code     = req.nextUrl.searchParams.get("code");
  const tenantId = req.nextUrl.searchParams.get("state");
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code || !tenantId) return NextResponse.redirect(`${appUrl}/onboarding?error=missing_params`);

  try {
    const tokens = await exchangeMLCode(code);
    if (!tokens.access_token) return NextResponse.redirect(`${appUrl}/onboarding?error=token_failed`);

    const mlUser = await getMLUser(tokens.access_token);
    const supabase = createAdminClient();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabase.from("ml_tokens").upsert({
      tenant_id: tenantId, access_token: tokens.access_token,
      refresh_token: tokens.refresh_token, expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id" });

    await supabase.from("tenants").update({
      ml_user_id: String(mlUser.id), ml_site_id: mlUser.site_id || "MLU",
      updated_at: new Date().toISOString(),
    }).eq("id", tenantId);

    return NextResponse.redirect(`${appUrl}/dashboard?connected=true`);
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(`${appUrl}/onboarding?error=unknown`);
  }
}
