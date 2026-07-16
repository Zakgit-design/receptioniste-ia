import { cn } from "@/lib/utils";
import type { StatutEntreprise, StatutAbonnement } from "@/generated/prisma/enums";

// Badge générique (pastille + libellé) pour les statuts affichés dans les
// écrans Entreprises — voir la maquette (docs/sprint5-conception.md,
// section 9) : "good" (actif), "warn" (à surveiller), "critical" (incident),
// "neutral" (essai / information sans jugement de valeur).

export type ToneBadge = "good" | "warn" | "critical" | "neutral";

const toneClasses: Record<ToneBadge, string> = {
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  critical: "bg-critical-soft text-critical",
  neutral: "border border-border-strong bg-paper text-text-secondary",
};

const dotClasses: Record<ToneBadge, string> = {
  good: "bg-good",
  warn: "bg-warn",
  critical: "bg-critical",
  neutral: "bg-neutral-dot",
};

export function StatutBadge({
  tone,
  children,
}: {
  tone: ToneBadge;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
        toneClasses[tone]
      )}
    >
      <span className={cn("h-[5px] w-[5px] shrink-0 rounded-full", dotClasses[tone])} />
      {children}
    </span>
  );
}

/** Statut d'entreprise (`entreprises.statut`) -> tone de badge. */
export function toneForStatutEntreprise(statut: StatutEntreprise): ToneBadge {
  switch (statut) {
    case "actif":
      return "good";
    case "essai":
      return "neutral";
    case "suspendu":
      return "warn";
    case "resilie":
      return "critical";
  }
}

/** Statut d'abonnement (`abonnements.statut`) -> tone de badge et libellé français. */
export function toneForStatutAbonnement(statut: StatutAbonnement): ToneBadge {
  switch (statut) {
    case "actif":
      return "good";
    case "impaye":
      return "warn";
    case "resilie":
      return "critical";
  }
}

export const libelleStatutAbonnement: Record<StatutAbonnement, string> = {
  actif: "Actif",
  impaye: "Impayé",
  resilie: "Résilié",
};
