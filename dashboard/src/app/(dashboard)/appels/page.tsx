import { PageHeader } from "@/components/page-header";
import { AppelsTable } from "@/components/appels-table";
import { getAppelsListe } from "./data";

// Force le rendu dynamique : cette page interroge Prisma directement, sans
// API dynamique (auth/cookies) pour le déclencher implicitement — même
// raison que /entreprises (voir docs/sprint-log.md, 2026-07-22).
export const dynamic = "force-dynamic";

export default async function AppelsPage() {
  const appels = await getAppelsListe();

  return (
    <div>
      <PageHeader
        title="Appels"
        subtitle="Historique consolidé, toutes entreprises"
      />
      <AppelsTable appels={appels} />
    </div>
  );
}
