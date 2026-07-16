import { cn } from "@/lib/utils";
import type { StatutSante } from "@/lib/health";

// Pastille + libellé Santé — même statut ("ok" / "degrade" / "echec") que
// celui calculé par `santeParEntreprise` (voir src/lib/health.ts), seule
// source de vérité (docs/sprint5-conception.md, section 7). Ce composant ne
// fait qu'afficher un statut déjà calculé par l'appelant.

const configParStatut: Record<StatutSante, { libelle: string; couleurPoint: string }> = {
  ok: { libelle: "Opérationnel", couleurPoint: "bg-good" },
  degrade: { libelle: "Attention", couleurPoint: "bg-warn" },
  echec: { libelle: "Incident", couleurPoint: "bg-critical" },
};

export function SantePill({ statut }: { statut: StatutSante }) {
  const { libelle, couleurPoint } = configParStatut[statut];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-text">
      <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", couleurPoint)} />
      {libelle}
    </span>
  );
}
