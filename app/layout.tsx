import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./campaigns.css";
import "./intelligence.css";
import "./csv-import.css";
import "./messages.css";
import "./operations.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProspectWise AI — Prospecção inteligente",
  description: "Encontre, qualifique e organize oportunidades comerciais com segurança.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={`${geist.variable} ${mono.variable}`}>{children}</body></html>;
}
