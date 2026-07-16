"use client";

import { useMemo, useState } from "react";
import { StatutBadge } from "@/components/statut-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  libelleEtToneStatutRendezVous,
  type EtablissementOption,
  type RendezVousListeItemClient,
} from "@/lib/rendez-vous-client";
import type { StatutRendezVous } from "@/generated/prisma/enums";

const thClass =
  "px-4 py-[9px] text-left text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase whitespace-nowrap";

type FiltreStatut = "tous" | StatutRendezVous;

const STATUT_OPTIONS: { value: FiltreStatut; label: string }[] = [
  { value: "tous", label: "Tous les statuts" },
  { value: "confirme", label: "Confirmé" },
  { value: "termine", label: "Terminé" },
  { value: "absent", label: "Absent" },
  { value: "annule", label: "Annulé" },
];

// Liste des rendez-vous du Dashboard Client, avec filtres simples
// (établissement, statut) — voir docs/roadmap.md, tâche #68. Filtrage en
// mémoire côté client, même principe que AppelsTableClient : volumes attendus
// faibles (rendez-vous d'une seule entreprise).
//
// Colonne "Collaborateur" : toujours "Non renseigné". Ce concept n'existe pas
// dans le modèle de données actuel (ni `RendezVous`, ni `Service`) — affiché
// honnêtement plutôt qu'inventé, voir docs/roadmap.md tâche #68 et le rapport
// associé.
export function RendezVousTableClient({
  rendezVous,
  etablissements,
}: {
  rendezVous: RendezVousListeItemClient[];
  etablissements: EtablissementOption[];
}) {
  const [etablissementId, setEtablissementId] = useState("tous");
  const [statut, setStatut] = useState<FiltreStatut>("tous");

  const visibles = useMemo(() => {
    return rendezVous.filter((rdv) => {
      if (etablissementId !== "tous" && rdv.etablissementId !== etablissementId) return false;
      if (statut !== "tous" && rdv.statut !== statut) return false;
      return true;
    });
  }, [rendezVous, etablissementId, statut]);

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

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border">
              <th className={thClass}>Date</th>
              <th className={thClass}>Heure</th>
              <th className={thClass}>Établissement</th>
              <th className={thClass}>Service</th>
              <th className={thClass}>Collaborateur</th>
              <th className={thClass}>Client</th>
              <th className={thClass}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-text-muted">
                  Aucun rendez-vous ne correspond à ces filtres.
                </td>
              </tr>
            ) : (
              visibles.map((rdv) => {
                const { libelle, tone } = libelleEtToneStatutRendezVous(rdv.statut);
                return (
                  <tr key={rdv.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
                      {rdv.date}
                    </td>
                    <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
                      {rdv.heure}
                    </td>
                    <td className="px-4 py-[11px] whitespace-nowrap text-text-secondary">
                      {rdv.etablissementNom}
                    </td>
                    <td className="px-4 py-[11px] whitespace-nowrap text-text-secondary">
                      {rdv.serviceNom}
                    </td>
                    <td className="px-4 py-[11px] whitespace-nowrap text-text-muted italic">
                      Non renseigné
                    </td>
                    <td className="px-4 py-[11px] whitespace-nowrap text-text-secondary">
                      {rdv.clientLabel}
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
