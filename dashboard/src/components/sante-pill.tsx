import { cn } from "@/lib/utils";
import type { StatutSante } from "@/lib/health";

// Pastille + libellé Santé — même statut ("ok" / "degrade" / "echec") que
// celui calculé par `santeParEntreprise` (voir src/lib/health.ts), seule
// source de vérité (docs/sprint5-conception.md, section 7). Ce composant ne
// fait qu'afficher un statut déjà calculé par l'appelant.
//
// `aucune_donnee` (2026-07-22) : aucun événement de santé enregistré pour
// cette entreprise — distinct de "ok", qui affirmerait à tort une
// vérification qui n'existe pas encore (voir sante-plateforme/page.tsx pour
// le même principe côté plateforme).
export type StatutSanteAffiche = StatutSante | "aucune_donnee";

const configParStatut: Record<StatutSanteAffiche, { libelle: string; couleurPoint: string }> = {
  ok: { libelle: "Opérationnel", couleurPoint: "bg-good" },
  degrade: { libelle: "Attention", couleurPoint: "bg-warn" },
  echec: { libelle: "Incident", couleurPoint: "bg-critical" },
  aucune_donnee: { libelle: "Aucune donnée", couleurPoint: "bg-text-muted" },
};

export function SantePill({ statut }: { statut: StatutSanteAffiche }) {
  const { libelle, couleurPoint } = configParStatut[statut];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-text">
      <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", couleurPoint)} />
      {libelle}
    </span>
  );
}
