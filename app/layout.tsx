import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashbi — Dashboard para MercadoLibre",
  description: "Controlá tu negocio en MercadoLibre en tiempo real",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
