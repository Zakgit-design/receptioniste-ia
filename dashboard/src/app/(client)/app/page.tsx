import { getCurrentUser } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { StatTiles } from "@/components/stat-tiles";
import { AppelsAttentionClient } from "@/components/appels-attention-client";
import { ActiviteRecenteClient } from "@/components/activite-recente-client";
import { StatsEtablissementsClient } from "@/components/stats-etablissements-client";
import { getVueEnsembleClient } from "./data";

// Vue d'ensemble du Dashboard Client (/app) — voir docs/roadmap.md, tâche
// #66. Pas de graphique 14 jours (`CallsChart`, réutilisé côté admin) : tant
// que le branchement Vapi/Twilio -> table `appels` n'existe pas (voir
// docs/sprint6-conception.md, section 3), un graphique n'afficherait qu'une
// ligne plate à zéro sur 14 jours — aucune valeur ajoutée par rapport aux
// tuiles ci-dessous. À reconsidérer une fois de vrais appels enregistrés.
export default async function VueEnsembleClientPage() {
  const user = await getCurrentUser();
  const { statistiques, appelsAttention, activiteRecente, statistiquesEtablissements } =
    await getVueEnsembleClient(user);

  return (
    <div>
      <PageHeader title="Vue d'ensemble" subtitle="État de votre entreprise en direct" />

      <StatTiles statistiques={statistiques} />

      <AppelsAttentionClient appels={appelsAttention} />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <ActiviteRecenteClient appels={activiteRecente} />
        <StatsEtablissementsClient etablissements={statistiquesEtablissements} />
      </div>
    </div>
  );
}
