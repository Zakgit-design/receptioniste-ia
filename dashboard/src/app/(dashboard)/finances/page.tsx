import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { getFinancesData } from "./data";

// Force le rendu dynamique : interroge Prisma directement, sans API
// dynamique pour le déclencher implicitement — même raison que /entreprises
// (voir docs/sprint-log.md, 2026-07-22).
export const dynamic = "force-dynamic";

// Écran Finances — voir docs/sprint5-conception.md, section 5 : ordre de
// lecture imposé (marge brute plateforme en hero, puis coûts fixes, puis
// coûts variables par fournisseur, puis rentabilité par entreprise triée du
// moins rentable au plus rentable). Toutes les données viennent de ./data.ts,
// qui réutilise les chiffres déjà établis dans ../entreprises/data.ts plutôt
// que d'en recalculer d'autres.
export default async function FinancesPage() {
  const finances = await getFinancesData();
  const margePositive = finances.margeBrutePlateformeChf >= 0;
  const coutVariableTotalChf = finances.coutsVariablesParFournisseur.reduce(
    (total, cout) => total + cout.montantChf,
    0
  );
  const uneEntrepriseEnEssai = finances.rentabiliteEntreprises.some(
    (entreprise) => entreprise.estEnEssai
  );

  const couleurParFournisseur: Record<string, string> = {
    "Vapi (voix + plateforme)": "var(--cat-vapi)",
    "Autres (transcription, analyse)": "var(--cat-twilio)",
    "Anthropic (Claude)": "var(--cat-anthropic)",
  };

  return (
    <div>
      <PageHeader
        title="Finances"
        subtitle="Rentabilité, coûts techniques et revenus estimés"
      />

      {/* 1. Marge brute plateforme — chiffre hero, avant tout tableau. */}
      <div className="mb-3.5 rounded-lg border border-border bg-surface px-5 py-[22px] shadow-[var(--shadow-panel)]">
        <div className="mb-2 text-[11.5px] font-bold tracking-[0.05em] text-text-muted uppercase">
          Marge brute plateforme — mois en cours
        </div>
        <div
          className={cn(
            "font-mono text-[36px] font-extrabold tracking-[-0.015em]",
            margePositive ? "text-good" : "text-critical"
          )}
        >
          {margePositive ? "+" : ""}
          {finances.margeBrutePlateformeChf} CHF
        </div>
        <div className="mt-1.5 text-xs font-semibold text-text-secondary">
          {finances.revenusEstimesChf} CHF de revenus estimés − {finances.coutsTotalChf} CHF de
          coûts (variables + fixes)
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
          <span className="text-signal">●</span> estimé — basé sur les plans déclarés, pas sur un
          paiement Stripe vérifié
        </div>
      </div>

      <div className="mb-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_1.4fr]">
        {/* 2. Coûts fixes de plateforme — non répartis par entreprise. */}
        <div className="rounded-lg border border-border bg-surface px-4 py-[15px] shadow-[var(--shadow-panel)]">
          <div className="mb-2.5 flex items-baseline justify-between">
            <h3 className="text-[13px] font-bold text-text">Coûts fixes de plateforme</h3>
            <span className="text-[11px] font-semibold text-text-muted">mensuel</span>
          </div>
          {finances.coutsFixes.length > 0 ? (
            finances.coutsFixes.map((cout) => (
              <div
                key={cout.fournisseur}
                className="flex justify-between text-xs font-semibold text-text"
              >
                <span>{cout.fournisseur}</span>
                <span className="font-mono">{cout.montantMensuelChf} CHF</span>
              </div>
            ))
          ) : (
            <div className="text-xs font-semibold text-text-muted">
              Aucun coût fixe enregistré pour l&apos;instant.
            </div>
          )}
          <div className="mt-2 text-[11px] leading-relaxed font-semibold text-text-muted">
            Non réparti par entreprise — un coût fixe attribué artificiellement à un client
            fausserait sa marge individuelle.
          </div>
        </div>

        {/* 3. Coûts variables par fournisseur — barres proportionnelles. */}
        <div className="rounded-lg border border-border bg-surface px-4 py-[15px] shadow-[var(--shadow-panel)]">
          <div className="mb-2.5 flex items-baseline justify-between">
            <h3 className="text-[13px] font-bold text-text">Coûts variables par fournisseur</h3>
            <span className="text-[11px] font-semibold text-text-muted">
              mois en cours, par usage
            </span>
          </div>
          {finances.coutsVariablesParFournisseur.map((cout) => (
            <div key={cout.fournisseur} className="mb-3 last:mb-0">
              <div className="mb-[5px] flex justify-between text-xs font-semibold text-text">
                <span>{cout.fournisseur}</span>
                <span className="font-mono">{cout.montantChf} CHF</span>
              </div>
              <div className="flex h-[7px] overflow-hidden rounded-full bg-paper">
                <div
                  className="h-full rounded-full"
                  style={{
                    width:
                      coutVariableTotalChf > 0
                        ? `${Math.round((cout.montantChf / coutVariableTotalChf) * 100)}%`
                        : "0%",
                    background: couleurParFournisseur[cout.fournisseur],
                  }}
                />
              </div>
            </div>
          ))}
          <div className="mt-1 text-[11px] leading-relaxed font-semibold text-text-muted">
            Coûts Twilio (téléphonie/SMS) non suivis pour l&apos;instant — pas inclus dans cette
            répartition.
          </div>
        </div>
      </div>

      {/* 4. Rentabilité par entreprise — triée du moins rentable au plus rentable. */}
      <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
        <div className="flex items-baseline justify-between border-b border-border px-4 py-[13px]">
          <h3 className="text-[13px] font-bold text-text">Rentabilité par entreprise</h3>
          <span className="text-[11px] font-semibold text-text-muted">
            triée : la moins rentable en premier
          </span>
        </div>
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-[9px] text-left text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase">
                Entreprise
              </th>
              <th className="px-4 py-[9px] text-left text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase">
                Revenu (plan)
              </th>
              <th className="px-4 py-[9px] text-left text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase">
                Coût variable
              </th>
              <th className="px-4 py-[9px] text-left text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase">
                Marge estimée
              </th>
            </tr>
          </thead>
          <tbody>
            {finances.rentabiliteEntreprises.map((entreprise) => {
              const marginePositive = entreprise.margeChf >= 0;
              return (
                <tr key={entreprise.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-[11px] font-bold whitespace-nowrap text-text">
                    {entreprise.nom}
                  </td>
                  <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
                    {entreprise.revenuChf} CHF{" "}
                    {entreprise.estEnEssai ? (
                      <span className="text-[11px] font-semibold text-text-muted">essai</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
                    {entreprise.coutVariableChf} CHF
                  </td>
                  <td
                    className={cn(
                      "px-4 py-[11px] font-mono font-bold whitespace-nowrap",
                      marginePositive ? "text-good" : "text-critical"
                    )}
                  >
                    {marginePositive ? "+" : ""}
                    {entreprise.margeChf} CHF
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {uneEntrepriseEnEssai ? (
        <div className="mt-2 text-[11px] font-semibold text-text-muted">
          Essai gratuit : coût réel absorbé par la plateforme tant qu&apos;aucun abonnement n&apos;est
          actif — c&apos;est normal et attendu pendant les 3 premiers jours.
        </div>
      ) : null}
    </div>
  );
}
