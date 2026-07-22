"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SantePill } from "@/components/sante-pill";
import { StatutBadge, toneForStatutEntreprise } from "@/components/statut-badge";
import type { EntrepriseListeItem } from "@/app/(dashboard)/entreprises/data";
import type { StatutSante } from "@/lib/health";

export type EntrepriseListeRow = EntrepriseListeItem & { sante: StatutSante };

const thClass =
  "px-4 py-[9px] text-left text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase whitespace-nowrap";

// Filtre "Nécessite une attention" actif par défaut, "Toutes" en second choix
// — voir docs/sprint5-conception.md, section 3. Composant client simple (pas
// de routing/état serveur) : la liste de démonstration tient entièrement en
// mémoire.
export function EntreprisesTable({ entreprises }: { entreprises: EntrepriseListeRow[] }) {
  const router = useRouter();
  const [filtre, setFiltre] = useState<"attention" | "toutes">("attention");

  const nbAttention = entreprises.filter((entreprise) => entreprise.sante !== "ok").length;
  const visibles =
    filtre === "attention"
      ? entreprises.filter((entreprise) => entreprise.sante !== "ok")
      : entreprises;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltre("attention")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[6px] text-xs font-bold",
            filtre === "attention"
              ? "border-ink bg-ink text-paper"
              : "border-border-strong bg-surface text-text-secondary hover:text-text"
          )}
        >
          ⚠ Nécessite une attention <span className="opacity-70">({nbAttention})</span>
        </button>
        <button
          type="button"
          onClick={() => setFiltre("toutes")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[6px] text-xs font-bold",
            filtre === "toutes"
              ? "border-ink bg-ink text-paper"
              : "border-border-strong bg-surface text-text-secondary hover:text-text"
          )}
        >
          Toutes <span className="opacity-70">({entreprises.length})</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border">
              <th className={thClass}>Entreprise</th>
              <th className={thClass}>Santé</th>
              <th className={thClass}>Secteur</th>
              <th className={thClass}>Statut</th>
              <th className={thClass}>Plan</th>
              <th className={thClass}>Appels (7j)</th>
              <th className={thClass}>Coût (mois)</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((entreprise) => (
              <tr
                key={entreprise.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/entreprises/${entreprise.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") router.push(`/entreprises/${entreprise.id}`);
                }}
                className="cursor-pointer border-b border-border last:border-b-0 hover:bg-paper focus-visible:bg-paper focus-visible:outline-none"
              >
                <td className="px-4 py-[11px] font-bold text-text whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5">
                    {entreprise.nom}
                    {entreprise.estDemo ? <StatutBadge tone="neutral">Démo</StatutBadge> : null}
                  </span>
                </td>
                <td className="px-4 py-[11px] whitespace-nowrap">
                  <SantePill statut={entreprise.sante} />
                </td>
                <td className="px-4 py-[11px] text-[11px] font-semibold text-text-secondary whitespace-nowrap">
                  {entreprise.secteur}
                </td>
                <td className="px-4 py-[11px] whitespace-nowrap">
                  <StatutBadge tone={toneForStatutEntreprise(entreprise.statut)}>
                    {entreprise.statutLabel}
                  </StatutBadge>
                </td>
                <td className="px-4 py-[11px] whitespace-nowrap text-text-secondary">
                  {entreprise.planLabel}
                </td>
                <td className="px-4 py-[11px] whitespace-nowrap font-mono">
                  {entreprise.appelsSeptJours}
                </td>
                <td className="px-4 py-[11px] whitespace-nowrap font-mono">
                  {entreprise.coutMoisChf} CHF
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
