"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatutBadge } from "@/components/statut-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  libelleEtToneAppelClient,
  formatDureeAppelClient,
  type AppelListeItemClient,
  type EtablissementOption,
} from "@/lib/appels-client";
import type { StatutAppel } from "@/generated/prisma/enums";

const thClass =
  "px-4 py-[9px] text-left text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase whitespace-nowrap";

type FiltrePeriode = "tout" | "aujourdhui" | "7j" | "30j";
type FiltreResultat = "tous" | "Rendez-vous pris" | "Renseignement" | "Échec" | "Transféré";
type FiltreStatut = "tous" | StatutAppel;

const PERIODE_OPTIONS: { value: FiltrePeriode; label: string }[] = [
  { value: "tout", label: "Toute période" },
  { value: "aujourdhui", label: "Aujourd'hui" },
  { value: "7j", label: "7 derniers jours" },
  { value: "30j", label: "30 derniers jours" },
];

const RESULTAT_OPTIONS: { value: FiltreResultat; label: string }[] = [
  { value: "tous", label: "Tous les résultats" },
  { value: "Rendez-vous pris", label: "Rendez-vous pris" },
  { value: "Renseignement", label: "Renseignement" },
  { value: "Échec", label: "Échec" },
  { value: "Transféré", label: "Transféré" },
];

const STATUT_OPTIONS: { value: FiltreStatut; label: string }[] = [
  { value: "tous", label: "Tous les statuts" },
  { value: "termine", label: "Terminé" },
  { value: "echoue", label: "Échoué" },
  { value: "transfere", label: "Transféré" },
];

/** Début (timestamp) de la période sélectionnée, 0 pour "tout". */
function debutPeriode(periode: FiltrePeriode): number {
  if (periode === "tout") return 0;
  if (periode === "aujourdhui") {
    const debut = new Date();
    debut.setHours(0, 0, 0, 0);
    return debut.getTime();
  }
  const jours = periode === "7j" ? 7 : 30;
  return Date.now() - jours * 24 * 60 * 60 * 1000;
}

// Liste des appels du Dashboard Client, avec barre de filtres (établissement,
// période, résultat, statut) — voir docs/roadmap.md, tâche #67. Filtrage en
// mémoire côté client : les volumes attendus (appels d'une seule entreprise)
// restent faibles, pas besoin de reporter les filtres en requêtes serveur
// (même principe que le toggle "Échecs / à traiter" côté admin, voir
// appels-table.tsx). Cliquer une ligne ouvre la fiche détail dans le drawer
// intercepté (voir app/@drawer/(.)appels/[id]).
export function AppelsTableClient({
  appels,
  etablissements,
}: {
  appels: AppelListeItemClient[];
  etablissements: EtablissementOption[];
}) {
  const router = useRouter();
  const [etablissementId, setEtablissementId] = useState("tous");
  const [periode, setPeriode] = useState<FiltrePeriode>("tout");
  const [resultat, setResultat] = useState<FiltreResultat>("tous");
  const [statut, setStatut] = useState<FiltreStatut>("tous");

  const visibles = useMemo(() => {
    const depuis = debutPeriode(periode);
    return appels.filter((appel) => {
      if (etablissementId !== "tous" && appel.etablissementId !== etablissementId) return false;
      if (appel.debutTimestamp < depuis) return false;
      if (resultat !== "tous" && appel.resultat !== resultat) return false;
      if (statut !== "tous" && appel.statut !== statut) return false;
      return true;
    });
  }, [appels, etablissementId, periode, resultat, statut]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select value={etablissementId} onValueChange={setEtablissementId}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les établissements</SelectItem>
            {etablissements.map((etablissement) => (
              <SelectItem key={etablissement.id} value={etablissement.id}>
                {etablissement.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={periode} onValueChange={(valeur) => setPeriode(valeur as FiltrePeriode)}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={resultat} onValueChange={(valeur) => setResultat(valeur as FiltreResultat)}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESULTAT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statut} onValueChange={(valeur) => setStatut(valeur as FiltreStatut)}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border">
              <th className={thClass}>Heure</th>
              <th className={thClass}>Établissement</th>
              <th className={thClass}>Appelant</th>
              <th className={thClass}>Durée</th>
              <th className={thClass}>Résultat</th>
              <th className={thClass}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-text-muted">
                  Aucun appel ne correspond à ces filtres.
                </td>
              </tr>
            ) : (
              visibles.map((appel) => {
                const { libelle, tone } = libelleEtToneAppelClient(appel);
                return (
                  <tr
                    key={appel.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/app/appels/${appel.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") router.push(`/app/appels/${appel.id}`);
                    }}
                    className="cursor-pointer border-b border-border last:border-b-0 hover:bg-paper focus-visible:bg-paper focus-visible:outline-none"
                  >
                    <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
                      {appel.heure}
                    </td>
                    <td className="px-4 py-[11px] whitespace-nowrap text-text-secondary">
                      {appel.etablissementNom}
                    </td>
                    <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
                      {appel.telephoneAppelant}
                    </td>
                    <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
                      {formatDureeAppelClient(appel.dureeSecondes)}
                    </td>
                    <td className="px-4 py-[11px] whitespace-nowrap text-text-secondary">
                      {appel.resultat}
                    </td>
                    <td className="px-4 py-[11px] whitespace-nowrap">
                      <StatutBadge tone={tone}>{libelle}</StatutBadge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
