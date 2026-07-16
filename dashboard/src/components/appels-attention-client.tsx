import type { AppelAttention } from "@/app/(client)/app/data";

// "Appels nécessitant une attention" — Vue d'ensemble du Dashboard Client.
// Filtre simple sur `appels.statut = echoue` (pas de nouvelle table, pas le
// centre d'actions plateforme) — voir docs/sprint6-conception.md, section 5.
export function AppelsAttentionClient({ appels }: { appels: AppelAttention[] }) {
  return (
    <div className="mb-4 rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-[13px]">
        <h3 className="text-[12.5px] font-bold text-text">Appels nécessitant une attention</h3>
        <span className="text-[11px] font-semibold text-text-muted">appels échoués</span>
      </div>
      {appels.length === 0 ? (
        <div className="px-4 py-4 text-[12.5px] text-text-secondary">
          Aucun appel n&apos;a besoin d&apos;attention pour l&apos;instant.
        </div>
      ) : (
        <div>
          {appels.map((appel) => (
            <div
              key={appel.id}
              className="flex items-center gap-2.5 border-b border-border px-4 py-2.5 last:border-b-0"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-critical" />
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-bold text-text">{appel.etablissementNom}</div>
                <div className="text-[11px] font-semibold text-text-muted">
                  Appel échoué · {appel.telephoneAppelant}
                </div>
              </div>
              <div className="font-mono text-[11.5px] font-semibold text-text-secondary">
                {appel.quandLabel}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
