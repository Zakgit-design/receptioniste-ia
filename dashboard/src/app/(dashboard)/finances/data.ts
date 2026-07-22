// Écran Finances — branché sur les vraies données Postgres (2026-07-22) :
// marge brute plateforme (hero), coûts fixes de plateforme
// (`couts_fixes_plateforme`, vide tant qu'aucun coût n'y est enregistré —
// pas de coût fixe inventé), coûts variables réels agrégés depuis
// `appels.cout_detail` (jsonb renvoyé par Vapi), puis rentabilité par
// entreprise triée.
//
// La rentabilité par entreprise n'est jamais recalculée ici : elle vient de
// ../entreprises/data.ts (mêmes chiffres que l'onglet "Vue d'ensemble" du
// détail entreprise).
//
// **Limite honnête assumée :** les coûts Twilio (téléphonie/SMS) ne sont pas
// suivis pour l'instant — `appels.cout_detail` (Vapi) ne les inclut pas, et
// aucune requête à l'API Twilio n'est faite ici. Pas de coût Twilio inventé :
// simplement absent de la répartition, mentionné explicitement à l'écran.

import { prisma } from "@/lib/prisma";
import { getRentabiliteEntreprises, type RentabiliteEntrepriseAffichee } from "../entreprises/data";

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

interface RepartitionItem {
  type?: string;
  cost?: number;
  transcriber?: { provider?: string };
  model?: { provider?: string };
  voice?: { provider?: string };
}

/**
 * Agrège le coût réel du mois en cours par fournisseur, à partir de
 * `appels.cout_detail.repartition` (renvoyé tel quel par Vapi). Regroupé en
 * 3 catégories pour rester lisible et cohérent avec la palette existante
 * (voir globals.css, --cat-vapi/--cat-twilio/--cat-anthropic) : la voix/
 * plateforme Vapi, le modèle Anthropic (Claude), et le reste (transcription
 * Deepgram, analyse Google/OpenAI) — regroupé sous "Autres", pas de nouvelle
 * couleur inventée pour une répartition encore approximative.
 */
async function getCoutsVariablesParFournisseur(): Promise<CoutVariableFournisseur[]> {
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const appels = await prisma.appel.findMany({
    where: { debut: { gte: debutMois } },
    select: { coutDetail: true },
  });

  let vapi = 0;
  let anthropic = 0;
  let autres = 0;

  for (const appel of appels) {
    const detail = appel.coutDetail;
    if (typeof detail !== "object" || detail === null) continue;
    const repartition = (detail as { repartition?: unknown }).repartition;
    if (!Array.isArray(repartition)) continue;

    for (const itemBrut of repartition as RepartitionItem[]) {
      const cout = typeof itemBrut.cost === "number" ? itemBrut.cost : 0;
      if (itemBrut.type === "voice" || itemBrut.type === "vapi") {
        vapi += cout;
      } else if (itemBrut.type === "model" && itemBrut.model?.provider === "anthropic") {
        anthropic += cout;
      } else {
        autres += cout;
      }
    }
  }

  const arrondir = (montant: number) => Math.round(montant * 100) / 100;
  return [
    { fournisseur: "Vapi (voix + plateforme)", montantChf: arrondir(vapi) },
    { fournisseur: "Anthropic (Claude)", montantChf: arrondir(anthropic) },
    { fournisseur: "Autres (transcription, analyse)", montantChf: arrondir(autres) },
  ];
}

export async function getFinancesData(): Promise<FinancesData> {
  const [rentabiliteEntreprises, coutsVariablesParFournisseur, coutsFixesReels] = await Promise.all([
    getRentabiliteEntreprises(),
    getCoutsVariablesParFournisseur(),
    prisma.coutFixePlateforme.findMany({ orderBy: { fournisseur: "asc" } }),
  ]);

  const revenusEstimesChf = rentabiliteEntreprises.reduce(
    (total, entreprise) => total + entreprise.revenuChf,
    0
  );
  const coutVariableTotalChf = coutsVariablesParFournisseur.reduce(
    (total, cout) => total + cout.montantChf,
    0
  );
  const coutsFixes: CoutFixePlateforme[] = coutsFixesReels.map((cout) => ({
    fournisseur: cout.fournisseur,
    montantMensuelChf: Number(cout.montantMensuel),
  }));
  const coutFixeTotalChf = coutsFixes.reduce((total, cout) => total + cout.montantMensuelChf, 0);
  const coutsTotalChf = Math.round((coutVariableTotalChf + coutFixeTotalChf) * 100) / 100;

  return {
    margeBrutePlateformeChf: Math.round((revenusEstimesChf - coutsTotalChf) * 100) / 100,
    revenusEstimesChf,
    coutsTotalChf,
    coutsFixes,
    coutsVariablesParFournisseur,
    rentabiliteEntreprises,
  };
}
