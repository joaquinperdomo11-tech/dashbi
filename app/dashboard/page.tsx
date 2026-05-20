"use client";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Order {
  id: number; fecha: string; producto: string; sku: string;
  cantidad: number; total: number; estado: string;
}

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("es-UY");
}

function getDayKey(fecha: string, tz = "America/Montevideo") {
  return new Date(fecha).toLocaleDateString("es-UY", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
}

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function DashboardPage() {
  const router = useRouter();
  const [tenant, setTenant]   = useState<any>(null);
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: t } = await supabase.from("tenants").select("*").eq("user_id", user.id).single();
      if (!t) { router.push("/login"); return; }
      setTenant(t);
      setLoading(false);

      if (t.ml_user_id) {
        setLoadingOrders(true);
        const res = await fetch("/api/data/orders");
        const data = await res.json();
        setOrders(data.orders || []);
        setLoadingOrders(false);
      }
    };
    load();
  }, [router]);

  // Ventas por día (últimos 30 días)
  const ventasPorDia = useMemo(() => {
    const map: Record<string, { fecha: string; ingresos: number; ordenes: number; unidades: number }> = {};
    orders.forEach(o => {
      const key = getDayKey(o.fecha);
      if (!map[key]) map[key] = { fecha: key, ingresos: 0, ordenes: 0, unidades: 0 };
      map[key].ingresos  += o.total;
      map[key].ordenes   += 1;
      map[key].unidades  += o.cantidad;
    });
    return Object.values(map).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [orders]);

  // Top productos
  const topProductos = useMemo(() => {
    const map: Record<string, { producto: string; total: number; unidades: number }> = {};
    orders.forEach(o => {
      const key = o.sku || o.producto;
      if (!map[key]) map[key] = { producto: o.producto, total: 0, unidades: 0 };
      map[key].total    += o.total;
      map[key].unidades += o.cantidad;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [orders]);

  const totalIngresos = orders.reduce((s, o) => s + o.total, 0);
  const totalOrdenes  = orders.length;
  const totalUnidades = orders.reduce((s, o) => s + o.cantidad, 0);
  const ticketProm    = totalOrdenes > 0 ? totalIngresos / totalOrdenes : 0;

  const maxIngresos = Math.max(...ventasPorDia.map(d => d.ingresos), 1);

  const daysLeft = tenant ? Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0;

  if (loading) return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:28,height:28,border:"3px solid var(--border)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",fontFamily:"'DM Sans',sans-serif"}}>
      {/* Header */}
      <div style={{background:"var(--card)",borderBottom:"1px solid var(--border)",padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,background:"var(--accent)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📦</div>
          <div>
            <p style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"var(--text)",lineHeight:1}}>Dashbi</p>
            <p style={{fontSize:11,color:"var(--sub)",marginTop:2}}>{tenant?.nombre}</p>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {daysLeft > 0 && tenant?.status === "trial" && (
            <span style={{background:"var(--accent-bg)",color:"var(--accent)",fontSize:12,padding:"4px 12px",borderRadius:100,fontWeight:500}}>
              ⏳ {daysLeft} días de prueba
            </span>
          )}
          <span style={{fontSize:12,color:"var(--sub)"}}>Últimos 30 días</span>
        </div>
      </div>

      <div style={{padding:32,maxWidth:1100,margin:"0 auto",display:"flex",flexDirection:"column",gap:24}}>

        {!tenant?.ml_user_id ? (
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:48,textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:16}}>🔗</div>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:24,color:"var(--text)",marginBottom:8}}>Conectá tu MercadoLibre</h2>
            <button onClick={() => router.push("/onboarding")}
              style={{background:"var(--accent)",color:"#fff",padding:"12px 24px",borderRadius:12,fontSize:14,fontWeight:500,border:"none",cursor:"pointer",marginTop:16}}>
              Conectar →
            </button>
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
              {[
                {label:"Ingresos", val: loadingOrders ? "..." : fmt(totalIngresos), icon:"💰", accent:true},
                {label:"Órdenes",  val: loadingOrders ? "..." : String(totalOrdenes),  icon:"🛒"},
                {label:"Unidades", val: loadingOrders ? "..." : String(totalUnidades), icon:"📦"},
                {label:"Ticket promedio", val: loadingOrders ? "..." : fmt(ticketProm), icon:"🎯"},
              ].map(card => (
                <div key={card.label} style={{
                  background:"var(--card)", border:`1px solid ${card.accent ? "var(--accent)" : "var(--border)"}`,
                  borderRadius:16, padding:20, boxShadow:"var(--shadow)"
                }}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <p style={{fontSize:11,color:"var(--sub)",textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:500}}>{card.label}</p>
                    <span style={{fontSize:20}}>{card.icon}</span>
                  </div>
                  <p style={{fontSize:28,fontWeight:700,color: card.accent ? "var(--accent)" : "var(--text)"}}>{card.val}</p>
                </div>
              ))}
            </div>

            {/* Chart ventas por día */}
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:24,boxShadow:"var(--shadow)"}}>
              <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"var(--text)",marginBottom:20}}>
                Ingresos por día — últimos 30 días
              </h3>
              {loadingOrders ? (
                <div style={{height:160,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--sub)",fontSize:14}}>
                  Cargando datos de MercadoLibre...
                </div>
              ) : ventasPorDia.length === 0 ? (
                <div style={{height:160,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--sub)",fontSize:14}}>
                  Sin ventas en los últimos 30 días
                </div>
              ) : (
                <div style={{display:"flex",alignItems:"flex-end",gap:4,height:160,paddingBottom:28,position:"relative"}}>
                  {ventasPorDia.map((d, i) => {
                    const h = Math.max(4, (d.ingresos / maxIngresos) * 130);
                    const parts = d.fecha.split("/");
                    const label = `${parts[0]}/${parts[1]}`;
                    return (
                      <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,position:"relative"}}
                        title={`${d.fecha}\n${fmt(d.ingresos)}\n${d.ordenes} órdenes`}>
                        <div style={{width:"100%",background:"var(--accent)",borderRadius:"4px 4px 0 0",height:h,opacity:0.85,transition:"opacity 0.2s",cursor:"pointer"}}
                          onMouseEnter={e => (e.currentTarget.style.opacity="1")}
                          onMouseLeave={e => (e.currentTarget.style.opacity="0.85")} />
                        {i % 3 === 0 && (
                          <p style={{fontSize:9,color:"var(--muted)",position:"absolute",bottom:-20,fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{label}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top productos + últimas órdenes */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:16}}>
              {/* Top productos */}
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:24,boxShadow:"var(--shadow)"}}>
                <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"var(--text)",marginBottom:16}}>Top productos</h3>
                {loadingOrders ? (
                  <p style={{color:"var(--sub)",fontSize:14}}>Cargando...</p>
                ) : topProductos.length === 0 ? (
                  <p style={{color:"var(--sub)",fontSize:14}}>Sin datos</p>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {topProductos.map((p, i) => (
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:14,fontWeight:700,color:"var(--muted)",width:16,fontFamily:"'DM Mono',monospace"}}>{i+1}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:12,color:"var(--text)",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.producto}</p>
                          <p style={{fontSize:11,color:"var(--sub)",fontFamily:"'DM Mono',monospace"}}>{p.unidades} u</p>
                        </div>
                        <p style={{fontSize:13,fontWeight:700,color:"var(--accent)",fontFamily:"'DM Mono',monospace",flexShrink:0}}>{fmt(p.total)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Últimas órdenes */}
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:24,boxShadow:"var(--shadow)"}}>
                <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"var(--text)",marginBottom:16}}>Últimas órdenes</h3>
                {loadingOrders ? (
                  <p style={{color:"var(--sub)",fontSize:14}}>Cargando...</p>
                ) : orders.length === 0 ? (
                  <p style={{color:"var(--sub)",fontSize:14}}>Sin órdenes recientes</p>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:0}}>
                    {orders.slice(0, 6).map((o, i) => {
                      const d = new Date(o.fecha);
                      const dateStr = `${d.getDate()} ${MESES[d.getMonth()]}`;
                      return (
                        <div key={o.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom: i < 5 ? "1px solid var(--border)" : "none"}}>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.producto}</p>
                            <p style={{fontSize:11,color:"var(--sub)",fontFamily:"'DM Mono',monospace"}}>{dateStr} · {o.cantidad} u</p>
                          </div>
                          <p style={{fontSize:13,fontWeight:700,color:"var(--text)",fontFamily:"'DM Mono',monospace",flexShrink:0}}>{fmt(o.total)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
