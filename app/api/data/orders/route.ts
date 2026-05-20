import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshMLToken } from "@/lib/ml";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants").select("id, ml_user_id").eq("user_id", user.id).single();
  if (!tenant?.ml_user_id) return NextResponse.json({ error: "ML not connected" }, { status: 400 });

  const { data: tokenRow } = await admin
    .from("ml_tokens").select("*").eq("tenant_id", tenant.id).single();
  if (!tokenRow) return NextResponse.json({ error: "No token" }, { status: 400 });

  let accessToken = tokenRow.access_token;
  if (new Date(tokenRow.expires_at) < new Date()) {
    const refreshed = await refreshMLToken(tokenRow.refresh_token);
    if (refreshed.access_token) {
      accessToken = refreshed.access_token;
      await admin.from("ml_tokens").update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("tenant_id", tenant.id);
    }
  }

  const hace30 = new Date();
  hace30.setDate(hace30.getDate() - 30);
  const desde = hace30.toISOString().split(".")[0] + ".000-00:00";

  try {
    const res = await fetch(
      `https://api.mercadolibre.com/orders/search?seller=${tenant.ml_user_id}&limit=50&sort=date_desc&order.date_created.from=${desde}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();
    const orders = (data.results || [])
      .filter((o: any) => o.status !== "cancelled")
      .map((o: any) => {
        const item = o.order_items?.[0];
        return {
          id: o.id,
          fecha: o.date_created,
          producto: item?.item?.title || "",
          sku: item?.item?.seller_sku || "",
          cantidad: item?.quantity || 1,
          total: o.total_amount || 0,
          estado: o.status,
        };
      });
    return NextResponse.json({ orders });
  } catch (e) {
    return NextResponse.json({ error: "ML API error" }, { status: 500 });
  }
}
