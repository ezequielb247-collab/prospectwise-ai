import type { Metadata } from "next";
import "./globals.css";
import "./campaigns.css";
import "./intelligence.css";
import "./csv-import.css";
import "./messages.css";
import "./operations.css";

export const metadata: Metadata = {
  title: "ProspectWise AI — Prospecção inteligente",
  description: "Encontre, qualifique e organize oportunidades comerciais com segurança.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
