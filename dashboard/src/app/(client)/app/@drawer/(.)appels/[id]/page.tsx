import { notFound } from "next/navigation";
import { getCurrentUser } from "@/auth";
import { CallDrawer } from "@/components/call-drawer";
import { CallDetailClient } from "@/components/call-detail-client";
import { getAppelDetailClient } from "@/app/(client)/app/appels/data";

// Intercepte la navigation en clic depuis /app/appels vers /app/appels/[id]
// pour afficher la fiche en panneau latéral (URL réelle, liste toujours
// visible derrière) — voir docs/roadmap.md, tâche #67, et
// (client)/app/layout.tsx pour le détail du branchement du slot. Une visite
// directe ou une actualisation de page ignore cette interception et rend la
// page complète (app/appels/[id]/page.tsx).
export default async function AppelDrawerClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const appel = await getAppelDetailClient(user, id);
  if (!appel) {
    notFound();
  }

  return (
    <CallDrawer
      title={appel.etablissementNom}
      subtitle={`${appel.resultat} · ${appel.heureDecroche.slice(0, 5)}`}
    >
      <CallDetailClient appel={appel} />
    </CallDrawer>
  );
}
