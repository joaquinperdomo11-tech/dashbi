"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "joaquinperdomo11@gmail.com"; // tu email

interface Tenant {
  id: string; nombre: string; email: string; status: string;
  trial_ends_at: string; subscription_ends_at: string | null;
  ml_user_id: string | null; created_at: string;
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-UY", { day:"numeric", month:"short", year:"numeric" });
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) { setLoading(false); return; }
      setIsAdmin(true);
      const res = await fetch("/api/admin/tenants");
      const data = await res.json();
      setTenants(data.tenants || []);
      setLoading(false);
    };
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch("/api/admin/tenants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setTenants(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    setUpdating(null);
  };

  const STATUS_COLORS: Record<string,string> = {
    trial: "#ca8a04", active: "#16a34a", inactive: "#dc2626"
  };

  if (loading) return <div style={{padding:40,color:"var(--sub)"}}>Cargando...</div>;
  if (!isAdmin) return <div style={{padding:40,color:"var(--red)"}}>Acceso denegado</div>;

  const stats = {
    total:    tenants.length,
    active:   tenants.filter(t => t.status === "active").length,
    trial:    tenants.filter(t => t.status === "trial").length,
    inactive: tenants.filter(t => t.status === "inactive").length,
  };

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",padding:40}}>
      <div style={{maxWidth:1000,margin:"0 auto"}}>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:32,color:"var(--text)",marginBottom:8}}>Panel Admin</h1>
        <p style={{color:"var(--sub)",fontSize:14,marginBottom:32}}>Gestión de clientes Dashbi</p>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:32}}>
          {[
            {label:"Total", val:stats.total, color:"var(--text)"},
            {label:"Activos", val:stats.active, color:"#16a34a"},
            {label:"Trial", val:stats.trial, color:"#ca8a04"},
            {label:"Inactivos", val:stats.inactive, color:"#dc2626"},
          ].map(s => (
            <div key={s.label} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:20}}>
              <p style={{fontSize:12,color:"var(--sub)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>{s.label}</p>
              <p style={{fontSize:32,fontWeight:700,color:s.color}}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:"var(--bg)",borderBottom:"1px solid var(--border)"}}>
                {["Cliente","Email","ML","Estado","Registro","Trial/Vence","Acciones"].map(h => (
                  <th key={h} style={{padding:"12px 16px",textAlign:"left",color:"var(--sub)",fontWeight:500,fontFamily:"'DM Mono',monospace",fontSize:11,textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} style={{borderBottom:"1px solid var(--border)"}}>
                  <td style={{padding:"12px 16px",fontWeight:500,color:"var(--text)"}}>{t.nombre}</td>
                  <td style={{padding:"12px 16px",color:"var(--sub)",fontFamily:"'DM Mono',monospace",fontSize:12}}>{t.email}</td>
                  <td style={{padding:"12px 16px",color:t.ml_user_id?"var(--green)":"var(--red)",fontSize:12}}>
                    {t.ml_user_id ? "✓ " + t.ml_user_id : "✗ No conectado"}
                  </td>
                  <td style={{padding:"12px 16px"}}>
                    <span style={{background:`${STATUS_COLORS[t.status]}18`,color:STATUS_COLORS[t.status],padding:"3px 10px",borderRadius:100,fontSize:12,fontWeight:500}}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{padding:"12px 16px",color:"var(--sub)",fontSize:12}}>{fmt(t.created_at)}</td>
                  <td style={{padding:"12px 16px",color:"var(--sub)",fontSize:12}}>
                    {t.status === "trial" ? fmt(t.trial_ends_at) : fmt(t.subscription_ends_at)}
                  </td>
                  <td style={{padding:"12px 16px"}}>
                    <div style={{display:"flex",gap:6}}>
                      {t.status !== "active" && (
                        <button onClick={() => updateStatus(t.id, "active")} disabled={updating === t.id}
                          style={{background:"#16a34a",color:"#fff",border:"none",padding:"5px 10px",borderRadius:8,fontSize:12,cursor:"pointer"}}>
                          Activar
                        </button>
                      )}
                      {t.status !== "inactive" && (
                        <button onClick={() => updateStatus(t.id, "inactive")} disabled={updating === t.id}
                          style={{background:"#dc2626",color:"#fff",border:"none",padding:"5px 10px",borderRadius:8,fontSize:12,cursor:"pointer"}}>
                          Suspender
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
