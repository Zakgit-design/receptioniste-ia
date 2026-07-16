import { PageHeader } from "@/components/page-header";
import { AppelsTable } from "@/components/appels-table";
import { getAppelsListe } from "./data";

export default function AppelsPage() {
  const appels = getAppelsListe();

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
