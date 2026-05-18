"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [tenant, setTenant]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase.from("tenants").select("*").eq("user_id", user.id).single();
      if (!data) { router.push("/login"); return; }
      if (data.ml_user_id) { router.push("/dashboard"); return; }
      setTenant(data);
      setLoading(false);
    };
    load();
  }, [router]);

  const connectML = async () => {
    setConnecting(true);
    const res = await fetch(`/api/ml/auth-url?tenant_id=${tenant.id}`);
    const { url } = await res.json();
    window.location.href = url;
  };

  if (loading) return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:24,height:24,border:"2px solid var(--border)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
    </div>
  );

  const daysLeft = tenant ? Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{maxWidth:560,width:"100%"}}>
        {/* Progress */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:40,justifyContent:"center"}}>
          {["Cuenta creada","Conectar ML","Tu dashboard"].map((step,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:i===0?"var(--accent)":i===1?"var(--accent)":"var(--muted)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:600}}>
                  {i===0?"✓":i+1}
                </div>
                <span style={{fontSize:13,color:i<=1?"var(--text)":"var(--muted)",fontWeight:i===1?600:400}}>{step}</span>
              </div>
              {i < 2 && <div style={{width:32,height:1,background:"var(--border)"}} />}
            </div>
          ))}
        </div>

        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:40,boxShadow:"var(--shadow-md)"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{fontSize:48,marginBottom:16}}>🔗</div>
            <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:"var(--text)",marginBottom:8}}>
              Conectá tu MercadoLibre
            </h1>
            <p style={{color:"var(--sub)",fontSize:15,lineHeight:1.6}}>
              Autorizá a Dashbi para acceder a tus ventas, publicaciones y métricas. Solo lectura — nunca modificamos nada sin tu permiso.
            </p>
          </div>

          {/* What we access */}
          <div style={{background:"var(--bg)",borderRadius:12,padding:20,marginBottom:28,display:"flex",flexDirection:"column",gap:10}}>
            {[
              ["📊","Ventas e ingresos","Órdenes, precios, comisiones"],
              ["🏪","Publicaciones","Stock, estado, métricas"],
              ["📦","Envíos","Estado y seguimiento"],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:20}}>{icon}</span>
                <div>
                  <p style={{fontSize:14,fontWeight:500,color:"var(--text)"}}>{title}</p>
                  <p style={{fontSize:12,color:"var(--sub)"}}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={connectML} disabled={connecting}
            style={{width:"100%",background:"var(--accent)",color:"#fff",padding:"14px",borderRadius:12,fontSize:15,fontWeight:600,border:"none",cursor:"pointer",opacity:connecting?0.7:1,marginBottom:16}}>
            {connecting ? "Redirigiendo a MercadoLibre..." : "Conectar mi MercadoLibre →"}
          </button>

          <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
            <span style={{fontSize:12}}>🔒</span>
            <p style={{color:"var(--muted)",fontSize:12}}>Conexión segura · Podés desconectar cuando quieras</p>
          </div>

          {daysLeft > 0 && (
            <div style={{marginTop:20,padding:"10px 16px",background:"var(--accent-bg)",borderRadius:10,textAlign:"center"}}>
              <p style={{color:"var(--accent)",fontSize:13,fontWeight:500}}>
                🎉 Te quedan {daysLeft} días de prueba gratis
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
