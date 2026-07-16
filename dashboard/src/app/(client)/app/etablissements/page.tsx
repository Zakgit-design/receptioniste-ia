import { getCurrentUser } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { EtablissementsListeClient } from "@/components/etablissements-liste-client";
import { getEtablissementsClient } from "./data";

// Écran Établissements du Dashboard Client — lecture seule, voir
// docs/roadmap.md, tâche #63. Accessible à tous les rôles client (pas de
// garde de rôle ici) ; le scope par établissements assignés pour un
// `responsable_etablissement` vit dans src/lib/scope-client.ts.
export default async function EtablissementsClientPage() {
  const user = await getCurrentUser();
  const etablissements = await getEtablissementsClient(user);

  return (
    <div>
      <PageHeader
        title="Établissements"
        subtitle="Vos établissements, statistiques et intégrations"
      />
      {etablissements.length === 0 ? (
        <PlaceholderPanel
          title="Aucun établissement pour l'instant"
          description="Vos établissements apparaîtront ici une fois créés depuis le Dashboard Administrateur."
        />
      ) : (
        <EtablissementsListeClient etablissements={etablissements} />
      )}
    </div>
  );
}
