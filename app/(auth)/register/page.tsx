"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [nombre, setNombre]     = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !data.user) {
      setError(signUpError?.message || "Error al crear cuenta");
      setLoading(false);
      return;
    }
    // Create tenant
    const { error: tenantError } = await supabase.from("tenants").insert({
      user_id: data.user.id,
      nombre,
      email,
      status: "trial",
    });
    if (tenantError) {
      setError("Error al crear perfil");
      setLoading(false);
      return;
    }
    router.push("/onboarding");
  };

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:40,width:"100%",maxWidth:400,boxShadow:"var(--shadow-md)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:36,marginBottom:12}}>📦</div>
          <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:"var(--text)",marginBottom:8}}>Crear cuenta</h1>
          <p style={{color:"var(--sub)",fontSize:14}}>15 días gratis, sin tarjeta</p>
        </div>
        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <input placeholder="Tu nombre o empresa" value={nombre} onChange={e => setNombre(e.target.value)} required
            style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 16px",fontSize:14,color:"var(--text)",outline:"none",fontFamily:"'DM Mono',monospace"}} />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 16px",fontSize:14,color:"var(--text)",outline:"none",fontFamily:"'DM Mono',monospace"}} />
          <input type="password" placeholder="Contraseña (mín. 8 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
            style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 16px",fontSize:14,color:"var(--text)",outline:"none",fontFamily:"'DM Mono',monospace"}} />
          {error && <p style={{color:"var(--red)",fontSize:13,fontFamily:"'DM Mono',monospace"}}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{background:"var(--accent)",color:"#fff",padding:"13px",borderRadius:12,fontSize:15,fontWeight:500,border:"none",cursor:"pointer",opacity:loading?0.6:1}}>
            {loading ? "Creando cuenta..." : "Crear cuenta gratis →"}
          </button>
        </form>
        <p style={{textAlign:"center",marginTop:20,color:"var(--sub)",fontSize:14}}>
          ¿Ya tenés cuenta? <Link href="/login" style={{color:"var(--accent)"}}>Entrá acá</Link>
        </p>
      </div>
    </div>
  );
}
