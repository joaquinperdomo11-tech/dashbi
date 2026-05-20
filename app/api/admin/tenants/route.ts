import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "joaquinperdomo11@gmail.com";

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email === ADMIN_EMAIL;
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const { data } = await admin.from("tenants").select("*").order("created_at", { ascending: false });
  return NextResponse.json({ tenants: data || [] });
}

export async function PATCH(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, status } = await req.json();
  const admin = createAdminClient();
  const update: any = { status, updated_at: new Date().toISOString() };
  if (status === "active") update.subscription_ends_at = new Date(Date.now() + 30 * 86400000).toISOString();
  await admin.from("tenants").update(update).eq("id", id);
  return NextResponse.json({ ok: true });
}
