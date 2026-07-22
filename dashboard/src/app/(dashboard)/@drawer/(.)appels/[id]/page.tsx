import { notFound } from "next/navigation";
import { CallDrawer } from "@/components/call-drawer";
import { CallDetail } from "@/components/call-detail";
import { getAppelDetail } from "@/app/(dashboard)/appels/data";

// Force le rendu dynamique — sans ce flag, une page dynamique ([id] sans
// generateStaticParams) est mise en cache après sa première visite et
// resservie telle quelle indéfiniment (bug réel trouvé le 2026-07-22, voir
// docs/sprint-log.md).
export const dynamic = "force-dynamic";

// Intercepte la navigation en clic depuis /appels vers /appels/[id] pour
// afficher la fiche en panneau latéral (URL réelle, liste toujours visible
// derrière) — voir docs/sprint5-conception.md, section 8. Une visite directe
// ou une actualisation de page ignore cette interception et rend la page
// complète (appels/[id]/page.tsx).
export default async function AppelDrawerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appel = await getAppelDetail(id);
  if (!appel) {
    notFound();
  }

  return (
    <CallDrawer
      title={`${appel.entrepriseNom} — ${appel.etablissementNom}`}
      subtitle={`${appel.resultat} · ${appel.heureDecroche.slice(0, 5)}`}
    >
      <CallDetail appel={appel} />
    </CallDrawer>
  );
}
