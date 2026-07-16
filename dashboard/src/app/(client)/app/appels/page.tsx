import { getCurrentUser } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { AppelsTableClient } from "@/components/appels-table-client";
import { getAppelsListeClient } from "./data";

// Écran Appels du Dashboard Client — voir docs/roadmap.md, tâche #67. Comme
// Vue d'ensemble (#66), pas de garde de rôle spécifique : tous les rôles
// client voient les appels de leur périmètre (limité aux établissements
// assignés pour un responsable d'établissement, voir src/lib/scope-client.ts).
export default async function AppelsClientPage() {
  const user = await getCurrentUser();
  const { etablissements, appels } = await getAppelsListeClient(user);

  return (
    <div>
      <PageHeader
        title="Appels"
        subtitle="Historique des appels reçus par votre entreprise"
      />
      {appels.length === 0 ? (
        <PlaceholderPanel
          title="Aucun appel enregistré pour l'instant"
          description="Les appels reçus par vos assistants IA apparaîtront ici dès qu'un appel sera enregistré."
        />
      ) : (
        <AppelsTableClient appels={appels} etablissements={etablissements} />
      )}
    </div>
  );
}
