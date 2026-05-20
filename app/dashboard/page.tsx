"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase.from("tenants").select("*").eq("user_id", user.id).single();
      setTenant(data);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:24,height:24,border:"2px solid var(--border)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
    </div>
  );

  const daysLeft = tenant ? Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",padding:40}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32,flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:32,color:"var(--text)"}}>
              Hola, {tenant?.nombre || "!"} 👋
            </h1>
            <p style={{color:"var(--sub)",fontSize:14,marginTop:4}}>
              {tenant?.ml_user_id
                ? `MercadoLibre ID: ${tenant.ml_user_id}`
                : "MercadoLibre no conectado"}
            </p>
          </div>
          {daysLeft > 0 && tenant?.status === "trial" && (
            <div style={{background:"var(--accent-bg)",border:"1px solid var(--accent)",borderRadius:10,padding:"8px 16px"}}>
              <p style={{color:"var(--accent)",fontSize:13,fontWeight:500}}>⏳ {daysLeft} días de prueba</p>
            </div>
          )}
        </div>

        {!tenant?.ml_user_id ? (
          // No ML connected
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:40,textAlign:"center",boxShadow:"var(--shadow-md)"}}>
            <div style={{fontSize:48,marginBottom:16}}>🔗</div>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:24,color:"var(--text)",marginBottom:8}}>
              Conectá tu MercadoLibre
            </h2>
            <p style={{color:"var(--sub)",fontSize:15,lineHeight:1.6,marginBottom:28}}>
              Para ver tus ventas y métricas necesitás conectar tu cuenta de MercadoLibre.
            </p>
            <button onClick={() => router.push("/onboarding")}
              style={{background:"var(--accent)",color:"#fff",padding:"13px 28px",borderRadius:12,fontSize:15,fontWeight:500,border:"none",cursor:"pointer"}}>
              Conectar MercadoLibre →
            </button>
          </div>
        ) : (
          // ML connected - dashboard placeholder
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:40,textAlign:"center",boxShadow:"var(--shadow-md)"}}>
            <div style={{fontSize:48,marginBottom:16}}>🚀</div>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:24,color:"var(--text)",marginBottom:8}}>
              Dashboard en construcción
            </h2>
            <p style={{color:"var(--sub)",fontSize:15,lineHeight:1.6}}>
              Tu cuenta está conectada. Estamos construyendo el dashboard completo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
