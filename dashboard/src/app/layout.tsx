import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { isClerkConfigured } from "@/auth/config";
import "./globals.css";

// Police d'interface (titres, texte courant) — remplace Geist par défaut.
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// Police pour les données chiffrées (montants, durées, identifiants) — remplace Geist Mono.
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Standard — Réceptionniste IA (Admin)",
  description: "Dashboard Administrateur de la plateforme Réceptionniste IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const contenu = (
    <html
      lang="fr"
      className={`${plusJakartaSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );

  // ClerkProvider n'est activé que si les clés Clerk sont présentes (voir
  // src/auth/config.ts) : tant que le compte Clerk n'existe pas (voir
  // docs/sprint-log.md), l'application tourne normalement, simplement sans
  // authentification active.
  return isClerkConfigured() ? (
    <ClerkProvider appearance={{ theme: shadcn }}>{contenu}</ClerkProvider>
  ) : (
    contenu
  );
}
