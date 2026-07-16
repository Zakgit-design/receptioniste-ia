import { StatutBadge } from "@/components/statut-badge";
import type { EtablissementListeItem } from "@/app/(dashboard)/entreprises/data";

const thClass =
  "px-4 py-[9px] text-left text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase whitespace-nowrap";

export function EtablissementsTable({
  etablissements,
}: {
  etablissements: EtablissementListeItem[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-border">
            <th className={thClass}>Établissement</th>
            <th className={thClass}>Adresse</th>
            <th className={thClass}>Numéro</th>
            <th className={thClass}>Assistant IA</th>
            <th className={thClass}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {etablissements.map((etablissement) => (
            <tr key={etablissement.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-[11px] font-bold text-text whitespace-nowrap">
                {etablissement.nom}
              </td>
              <td className="px-4 py-[11px] whitespace-nowrap text-text-secondary">
                {etablissement.adresse}
              </td>
              <td className="px-4 py-[11px] whitespace-nowrap font-mono text-text-secondary">
                {etablissement.numero}
              </td>
              <td className="px-4 py-[11px] whitespace-nowrap text-text-secondary">
                {etablissement.assistantNom}
              </td>
              <td className="px-4 py-[11px] whitespace-nowrap">
                <StatutBadge tone="good">{etablissement.statutLabel}</StatutBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
