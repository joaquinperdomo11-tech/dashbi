import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tenant } = await supabase.from("tenants").select("*").eq("user_id", user.id).single();
  const { data: tokens } = await supabase.from("ml_tokens").select("updated_at").eq("tenant_id", tenant?.id).single();

  const daysLeft = tenant ? Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",padding:40}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32}}>
          <div>
            <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:32,color:"var(--text)"}}>
              Hola, {tenant?.nombre} 👋
            </h1>
            <p style={{color:"var(--sub)",fontSize:14,marginTop:4}}>
              MercadoLibre ID: {tenant?.ml_user_id} · Último sync: {tokens?.updated_at ? new Date(tokens.updated_at).toLocaleTimeString("es-UY") : "Pendiente"}
            </p>
          </div>
          {daysLeft > 0 && tenant?.status === "trial" && (
            <div style={{background:"var(--accent-bg)",border:"1px solid var(--accent)",borderRadius:10,padding:"8px 16px"}}>
              <p style={{color:"var(--accent)",fontSize:13,fontWeight:500}}>⏳ {daysLeft} días de prueba</p>
            </div>
          )}
        </div>

        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:40,textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:16}}>🚀</div>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:24,color:"var(--text)",marginBottom:8}}>
            Dashboard en construcción
          </h2>
          <p style={{color:"var(--sub)",fontSize:15,lineHeight:1.6}}>
            Tu cuenta de MercadoLibre está conectada. Estamos sincronizando tus datos — 
            en unos minutos verás todas tus métricas acá.
          </p>
        </div>
      </div>
    </div>
  );
}
