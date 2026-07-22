"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { StatutBadge } from "@/components/statut-badge";
import {
  appelATraiter,
  formatDureeAppel,
  libelleEtToneAppel,
  type AppelListeItem,
} from "@/lib/appels-admin";

const thClass =
  "px-4 py-[9px] text-left text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase whitespace-nowrap";

// Filtre "Tous" actif par défaut, "Échecs / à traiter" en second choix — voir
// docs/sprint5-conception.md, section 8 (l'inverse de la table Entreprises,
// qui ouvre sur "Nécessite une attention" : ici l'historique complet est la
// vue de référence, les échecs un sous-ensemble à surveiller).
export function AppelsTable({ appels }: { appels: AppelListeItem[] }) {
  const router = useRouter();
  const [filtre, setFiltre] = useState<"echecs" | "toutes">("toutes");

  const nbEchecs = appels.filter(appelATraiter).length;
  const visibles = filtre === "echecs" ? appels.filter(appelATraiter) : appels;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltre("echecs")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[6px] text-xs font-bold",
            filtre === "echecs"
              ? "border-ink bg-ink text-paper"
              : "border-border-strong bg-surface text-text-secondary hover:text-text"
          )}
        >
          ⚠ Échecs / à traiter <span className="opacity-70">({nbEchecs})</span>
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
          Tous <span className="opacity-70">({appels.length})</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border">
              <th className={thClass}>Heure</th>
              <th className={thClass}>Entreprise</th>
              <th className={thClass}>Établissement</th>
              <th className={thClass}>Appelant</th>
              <th className={thClass}>Durée</th>
              <th className={thClass}>Résultat</th>
              <th className={thClass}>Statut</th>
              <th className={thClass}>Coût</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((appel) => {
              const { libelle, tone } = libelleEtToneAppel(appel);
              return (
                <tr
                  key={appel.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/appels/${appel.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") router.push(`/appels/${appel.id}`);
                  }}
                  className="cursor-pointer border-b border-border last:border-b-0 hover:bg-paper focus-visible:bg-paper focus-visible:outline-none"
                >
                  <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
                    {appel.heure}
                  </td>
                  <td className="px-4 py-[11px] font-bold text-text whitespace-nowrap">
                    {appel.entrepriseNom}
                  </td>
                  <td className="px-4 py-[11px] whitespace-nowrap text-text-secondary">
                    {appel.etablissementNom}
                  </td>
                  <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
                    {appel.telephoneAppelantMasque}
                  </td>
                  <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
                    {formatDureeAppel(appel.dureeSecondes)}
                  </td>
                  <td className="px-4 py-[11px] whitespace-nowrap text-text-secondary">
                    {appel.resultat}
                  </td>
                  <td className="px-4 py-[11px] whitespace-nowrap">
                    <StatutBadge tone={tone}>{libelle}</StatutBadge>
                  </td>
                  <td className="px-4 py-[11px] font-mono whitespace-nowrap">
                    {appel.coutChf.toFixed(2)} CHF
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
