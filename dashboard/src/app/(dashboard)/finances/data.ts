// Données de démonstration pour l'écran Finances — voir
// docs/sprint5-conception.md, section 5 : marge brute plateforme (hero),
// coûts fixes de plateforme (`couts_fixes_plateforme`, docs/architecture.md),
// coûts variables par fournisseur, puis rentabilité par entreprise triée.
//
// La rentabilité par entreprise n'est jamais recalculée ici : elle vient de
// ../entreprises/data.ts (mêmes chiffres que l'onglet "Vue d'ensemble" du
// détail entreprise). Seuls les coûts fixes et la répartition par fournisseur
// sont propres à cet écran.

import {
  getRentabiliteEntreprises,
  type RentabiliteEntrepriseAffichee,
} from "../entreprises/data";

export interface CoutFixePlateforme {
  fournisseur: string;
  montantMensuelChf: number;
}

export interface CoutVariableFournisseur {
  fournisseur: string;
  montantChf: number;
}

export interface FinancesData {
  margeBrutePlateformeChf: number;
  revenusEstimesChf: number;
  coutsTotalChf: number;
  coutsFixes: CoutFixePlateforme[];
  coutsVariablesParFournisseur: CoutVariableFournisseur[];
  rentabiliteEntreprises: RentabiliteEntrepriseAffichee[];
}

// Un seul coût fixe pour l'instant : Render (voir docs/architecture.md,
// décision d'architecture Hébergement). Volontairement non réparti par
// entreprise (voir docs/sprint5-conception.md, section 5).
const coutsFixesPlateforme: CoutFixePlateforme[] = [
  { fournisseur: "Render (hébergement)", montantMensuelChf: 25 },
];

// Répartition par fournisseur du coût variable total du mois (cohérente avec
// la somme des `coutVariableChf` des 3 entreprises dans ../entreprises/data.ts,
// soit 312 CHF) — le détail par fournisseur vient de `appels.cout_detail`
// (docs/architecture.md), pas encore branché ici en tant que vraie requête.
const coutsVariablesParFournisseur: CoutVariableFournisseur[] = [
  { fournisseur: "Vapi (voix)", montantChf: 168 },
  { fournisseur: "Twilio (tél. + SMS)", montantChf: 96 },
  { fournisseur: "Anthropic (Claude)", montantChf: 48 },
];

export function getFinancesData(): FinancesData {
  const rentabiliteEntreprises = getRentabiliteEntreprises();
  const revenusEstimesChf = rentabiliteEntreprises.reduce(
    (total, entreprise) => total + entreprise.revenuChf,
    0
  );
  const coutVariableTotalChf = coutsVariablesParFournisseur.reduce(
    (total, cout) => total + cout.montantChf,
    0
  );
  const coutFixeTotalChf = coutsFixesPlateforme.reduce(
    (total, cout) => total + cout.montantMensuelChf,
    0
  );
  const coutsTotalChf = coutVariableTotalChf + coutFixeTotalChf;

  return {
    margeBrutePlateformeChf: revenusEstimesChf - coutsTotalChf,
    revenusEstimesChf,
    coutsTotalChf,
    coutsFixes: coutsFixesPlateforme,
    coutsVariablesParFournisseur,
    rentabiliteEntreprises,
  };
}
