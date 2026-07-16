import type { StatistiqueEtablissement } from "@/app/(client)/app/data";

const thClass =
  "px-4 py-[9px] text-left text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase whitespace-nowrap";

// "Statistiques par établissement" — Vue d'ensemble du Dashboard Client.
export function StatsEtablissementsClient({
  etablissements,
}: {
  etablissements: StatistiqueEtablissement[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
      <div className="border-b border-border px-4 py-[13px]">
        <h3 className="text-[12.5px] font-bold text-text">Statistiques par établissement</h3>
      </div>
      {etablissements.length === 0 ? (
        <div className="px-4 py-4 text-[12.5px] text-text-secondary">
          Aucun établissement pour l&apos;instant.
        </div>
      ) : (
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border">
              <th className={thClass}>Établissement</th>
              <th className={thClass}>Appels aujourd&apos;hui</th>
              <th className={thClass}>RDV créés aujourd&apos;hui</th>
            </tr>
          </thead>
          <tbody>
            {etablissements.map((etablissement) => (
              <tr key={etablissement.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-[11px] font-bold text-text whitespace-nowrap">
                  {etablissement.nom}
                </td>
                <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
                  {etablissement.appelsAujourdhui}
                </td>
                <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
                  {etablissement.rendezVousAujourdhui}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
