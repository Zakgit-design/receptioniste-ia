import Link from "next/link";
import type { AppelRecent } from "@/app/(dashboard)/data";

// Clic sur une ligne : navigue vers /appels pour l'instant — le panneau de
// détail (drawer) est construit dans une tâche séparée (voir
// docs/sprint5-conception.md, section 8).

function couleurIndicateur(appel: AppelRecent): string {
  if (appel.statut === "echoue") return "bg-critical";
  if (!appel.smsEnvoye) return "bg-warn";
  return "bg-good";
}

function sousLibelle(appel: AppelRecent): string {
  const statutLabel = appel.smsEnvoye ? "terminé" : "SMS échoué";
  return `${appel.resultat} · ${statutLabel}`;
}

function formatDuree(dureeSecondes: number | null): string {
  // `dureeSecondes` est nul tant que l'appel n'est pas terminé (voir le
  // modèle Prisma `Appel`) — ne devrait pas arriver ici, "Derniers appels"
  // n'affiche que des appels terminés, mais on reste défensif.
  if (dureeSecondes === null) return "—";
  const minutes = Math.floor(dureeSecondes / 60);
  const secondes = dureeSecondes % 60;
  return `${minutes}:${secondes.toString().padStart(2, "0")}`;
}

export function RecentCalls({ appels }: { appels: AppelRecent[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-[13px]">
        <h3 className="text-[12.5px] font-bold text-text">Derniers appels</h3>
        <span className="text-[11px] font-semibold text-text-muted">
          cliquer pour le détail
        </span>
      </div>
      <div>
        {appels.map((appel) => (
          <Link
            key={appel.id}
            href="/appels"
            className="flex items-center gap-2.5 border-b border-border px-4 py-2.5 last:border-b-0 hover:bg-paper"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${couleurIndicateur(appel)}`}
            />
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-bold text-text">
                {appel.entrepriseNom}
                {appel.etablissementNom ? ` — ${appel.etablissementNom}` : ""}
              </div>
              <div className="text-[11px] font-semibold text-text-muted">
                {sousLibelle(appel)}
              </div>
            </div>
            <div className="font-mono text-[12.5px] font-semibold text-text-secondary">
              {formatDuree(appel.dureeSecondes)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
