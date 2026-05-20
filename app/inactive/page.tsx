import Link from "next/link";

export default function InactivePage() {
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:40,maxWidth:400,width:"100%",textAlign:"center",boxShadow:"var(--shadow-md)"}}>
        <div style={{fontSize:48,marginBottom:16}}>⏸️</div>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:"var(--text)",marginBottom:12}}>
          Suscripción inactiva
        </h1>
        <p style={{color:"var(--sub)",fontSize:15,lineHeight:1.6,marginBottom:28}}>
          Tu período de prueba venció o tu suscripción está inactiva. Contactanos para reactivar tu acceso.
        </p>
        <a href="mailto:hola@dashbi.app"
          style={{display:"block",background:"var(--accent)",color:"#fff",padding:"13px",borderRadius:12,fontSize:15,fontWeight:500,textDecoration:"none",marginBottom:12}}>
          Contactar →
        </a>
        <Link href="/login" style={{color:"var(--sub)",fontSize:14}}>Volver al inicio</Link>
      </div>
    </div>
  );
}
