import type { ActiviteRecenteItem } from "@/app/(client)/app/data";

// "Activité récente" — Vue d'ensemble du Dashboard Client. Composant dédié
// plutôt que réutilisation de `RecentCalls` (Sprint 5) : ce dernier suppose
// plusieurs entreprises (`entrepriseNom` affiché) alors qu'ici une seule
// entreprise est concernée, seul l'établissement a du sens à afficher — voir
// docs/sprint6-conception.md, section 5 (même choix que pour l'écran
// Établissements, tâche #63). Pas de lien vers une fiche détail : l'écran
// Appels (tâche #67) n'existe pas encore.
function couleurIndicateur(appel: ActiviteRecenteItem): string {
  if (appel.statut === "echoue") return "bg-critical";
  if (!appel.smsEnvoye) return "bg-warn";
  return "bg-good";
}

function formatDuree(dureeSecondes: number | null): string {
  if (dureeSecondes === null) return "—";
  const minutes = Math.floor(dureeSecondes / 60);
  const secondes = dureeSecondes % 60;
  return `${minutes}:${secondes.toString().padStart(2, "0")}`;
}

export function ActiviteRecenteClient({ appels }: { appels: ActiviteRecenteItem[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-[13px]">
        <h3 className="text-[12.5px] font-bold text-text">Activité récente</h3>
      </div>
      {appels.length === 0 ? (
        <div className="px-4 py-4 text-[12.5px] text-text-secondary">
          Aucun appel pour l&apos;instant.
        </div>
      ) : (
        <div>
          {appels.map((appel) => (
            <div
              key={appel.id}
              className="flex items-center gap-2.5 border-b border-border px-4 py-2.5 last:border-b-0"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${couleurIndicateur(appel)}`} />
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-bold text-text">{appel.etablissementNom}</div>
                <div className="text-[11px] font-semibold text-text-muted">
                  {appel.resultat} · {appel.smsEnvoye ? "SMS envoyé" : "SMS non envoyé"}
                </div>
              </div>
              <div className="font-mono text-[12.5px] font-semibold text-text-secondary">
                {formatDuree(appel.dureeSecondes)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
