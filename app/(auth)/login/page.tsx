"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }
    // Check if tenant has ML connected
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: tenant } = await supabase
        .from("tenants").select("ml_user_id").eq("user_id", user.id).single();
      if (!tenant?.ml_user_id) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:40,width:"100%",maxWidth:400,boxShadow:"var(--shadow-md)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:36,marginBottom:12}}>📦</div>
          <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:"var(--text)",marginBottom:8}}>Bienvenido</h1>
          <p style={{color:"var(--sub)",fontSize:14}}>Ingresá a tu dashboard</p>
        </div>
        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 16px",fontSize:14,color:"var(--text)",outline:"none",fontFamily:"'DM Mono',monospace"}} />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required
            style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 16px",fontSize:14,color:"var(--text)",outline:"none",fontFamily:"'DM Mono',monospace"}} />
          {error && <p style={{color:"var(--red)",fontSize:13,fontFamily:"'DM Mono',monospace"}}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{background:"var(--accent)",color:"#fff",padding:"13px",borderRadius:12,fontSize:15,fontWeight:500,border:"none",cursor:"pointer",opacity:loading?0.6:1}}>
            {loading ? "Ingresando..." : "Entrar →"}
          </button>
        </form>
        <p style={{textAlign:"center",marginTop:20,color:"var(--sub)",fontSize:14}}>
          ¿No tenés cuenta? <Link href="/register" style={{color:"var(--accent)"}}>Registrate gratis</Link>
        </p>
      </div>
    </div>
  );
}
