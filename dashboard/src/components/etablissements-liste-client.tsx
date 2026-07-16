import { StatutBadge } from "@/components/statut-badge";
import type { EtablissementClientItem } from "@/app/(client)/app/etablissements/data";

const labelClass =
  "text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase";

// Écran Établissements du Dashboard Client : une carte par établissement,
// plus riche que le tableau admin (src/components/etablissements-table.tsx)
// puisqu'elle affiche en plus les statistiques d'appels et l'état des
// intégrations — voir le rapport de la tâche #63 pour le choix de créer un
// composant dédié plutôt que d'étendre le tableau admin.
export function EtablissementsListeClient({
  etablissements,
}: {
  etablissements: EtablissementClientItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      {etablissements.map((etablissement) => (
        <div
          key={etablissement.id}
          className="rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-panel)]"
        >
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[13.5px] font-bold text-text">{etablissement.nom}</div>
              <div className="mt-0.5 text-[12px] text-text-secondary">{etablissement.adresse}</div>
            </div>
            <StatutBadge tone={etablissement.integrationTone}>
              {etablissement.integrationLabel}
            </StatutBadge>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
            <div>
              <div className={labelClass}>Numéro</div>
              <div className="mt-1 font-mono text-[12.5px] text-text-secondary">
                {etablissement.numero}
              </div>
            </div>
            <div>
              <div className={labelClass}>Assistant IA</div>
              <div className="mt-1 text-[12.5px] text-text-secondary">
                {etablissement.assistantLabel}
              </div>
            </div>
            <div>
              <div className={labelClass}>Appels (7 derniers jours)</div>
              <div className="mt-1 font-mono text-[15px] font-bold text-text">
                {etablissement.appelsSeptJours}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
