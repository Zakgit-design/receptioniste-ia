import { getCurrentUser } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { RendezVousTableClient } from "@/components/rendez-vous-table-client";
import { getRendezVousListeClient } from "./data";

// Écran Rendez-vous du Dashboard Client — voir docs/roadmap.md, tâche #68.
// Comme Appels (#67) et Vue d'ensemble (#66), pas de garde de rôle
// spécifique : tous les rôles client voient les rendez-vous de leur périmètre
// (limité aux établissements assignés pour un responsable d'établissement,
// voir src/lib/scope-client.ts).
export default async function RendezVousClientPage() {
  const user = await getCurrentUser();
  const { etablissements, rendezVous } = await getRendezVousListeClient(user);

  return (
    <div>
      <PageHeader
        title="Rendez-vous"
        subtitle="Rendez-vous pris par vos assistants IA"
      />
      {rendezVous.length === 0 ? (
        <PlaceholderPanel
          title="Aucun rendez-vous pour l'instant"
          description="Les rendez-vous pris par vos assistants IA apparaîtront ici dès qu'un rendez-vous sera enregistré."
        />
      ) : (
        <RendezVousTableClient rendezVous={rendezVous} etablissements={etablissements} />
      )}
    </div>
  );
}
