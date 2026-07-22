import { PageHeader } from "@/components/page-header";
import { ActionCenter } from "@/components/action-center";
import { StatTiles } from "@/components/stat-tiles";
import { CallsChart } from "@/components/calls-chart";
import { RecentCalls } from "@/components/recent-calls";
import { getOverviewData } from "./data";

// Vue d'ensemble — ordre du contenu acté dans docs/sprint5-conception.md,
// section 3 : centre d'actions en premier (avant toute statistique), puis
// statistiques clés, puis graphique + derniers appels en dernier.
export default function OverviewPage() {
  const { miseAJourLe, actionsRequises, statistiques, serieAppels14Jours, derniersAppels } =
    getOverviewData();

  return (
    <div>
      <PageHeader
        title="Vue d'ensemble"
        subtitle={`État de la plateforme en direct — ${miseAJourLe}`}
      />

      <ActionCenter actions={actionsRequises} />

      <StatTiles statistiques={statistiques} />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.55fr_1fr]">
        <CallsChart serie={serieAppels14Jours} />
        <RecentCalls appels={derniersAppels} />
      </div>
    </div>
  );
}
