// Vue d'ensemble — branchée sur les vraies données Postgres (2026-07-22),
// tous clients confondus (vue plateforme).
//
// Les types réutilisent les modèles Prisma générés pour les champs qui
// correspondent à une vraie table (`ActionRequiseModel`, `AppelModel`).

import { prisma } from "@/lib/prisma";
import type { ActionRequiseModel, AppelModel } from "@/generated/prisma/models";
import type { ActionRecommandee } from "@/lib/actions-center";

export type ActionRequiseAffichee = Omit<
  ActionRequiseModel,
  "actionRecommandee"
> & {
  actionRecommandee: ActionRecommandee | null;
  metaLabel: string;
};

export interface StatistiqueTuile {
  label: string;
  valeur: string;
  delta: string;
  couleurPoint: "good" | "signal";
}

export type AppelRecent = Pick<
  AppelModel,
  "id" | "dureeSecondes" | "statut" | "smsEnvoye"
> & {
  entrepriseNom: string;
  etablissementNom: string | null;
  resultat: string;
};

export interface PointAppelsQuotidien {
  jour: string;
  nombreAppels: number;
}

export interface OverviewData {
  miseAJourLe: string;
  actionsRequises: ActionRequiseAffichee[];
  statistiques: StatistiqueTuile[];
  serieAppels14Jours: PointAppelsQuotidien[];
  derniersAppels: AppelRecent[];
}

/** "il y a 12 min" / "il y a 3h" / "hier" — relatif à maintenant. */
function metaLabelDepuis(date: Date): string {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 24) return `il y a ${heures}h`;
  const jours = Math.round(heures / 24);
  return `il y a ${jours}j`;
}

/** Nombre d'actions requises ouvertes (statut "nouveau") — badge de nav (voir nav-rail.tsx), calculé côté serveur pour rester utilisable depuis un layout. */
export async function getActionsOuvertesCount(): Promise<number> {
  return prisma.actionRequise.count({ where: { statut: "nouveau" } });
}

export async function getOverviewData(): Promise<OverviewData> {
  const debutAujourdhui = new Date();
  debutAujourdhui.setHours(0, 0, 0, 0);
  const il7Jours = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const il14Jours = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  il14Jours.setHours(0, 0, 0, 0);

  const [actions, entreprisesActives, appelsAujourdhui, rdvConfirmes7j, appels14Jours, derniersAppelsBruts] =
    await Promise.all([
      prisma.actionRequise.findMany({ where: { statut: "nouveau" }, orderBy: { createdAt: "desc" } }),
      prisma.entreprise.count({ where: { statut: "actif" } }),
      prisma.appel.count({ where: { debut: { gte: debutAujourdhui } } }),
      prisma.rendezVous.count({ where: { statut: "confirme", createdAt: { gte: il7Jours } } }),
      prisma.appel.findMany({ where: { debut: { gte: il14Jours } }, select: { debut: true } }),
      prisma.appel.findMany({
        orderBy: { debut: "desc" },
        take: 8,
        include: { agentIA: { include: { entreprise: { select: { nom: true } } } }, etablissement: { select: { nom: true } } },
      }),
    ]);

  // Série 14 jours : un point par jour, même les jours sans appel (0).
  const compteParJour = new Map<string, number>();
  for (const appel of appels14Jours) {
    const cle = appel.debut.toLocaleDateString("fr-CH", { day: "2-digit", month: "2-digit" });
    compteParJour.set(cle, (compteParJour.get(cle) ?? 0) + 1);
  }
  const serieAppels14Jours: PointAppelsQuotidien[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const cle = date.toLocaleDateString("fr-CH", { day: "2-digit", month: "2-digit" });
    serieAppels14Jours.push({
      jour: date.toLocaleDateString("fr-CH", { day: "numeric", month: "short" }),
      nombreAppels: compteParJour.get(cle) ?? 0,
    });
  }

  return {
    miseAJourLe: new Date().toLocaleString("fr-CH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }),
    actionsRequises: actions.map((action) => ({
      ...action,
      actionRecommandee: action.actionRecommandee as ActionRecommandee | null,
      metaLabel: metaLabelDepuis(action.createdAt),
    })),
    statistiques: [
      {
        label: "Entreprises actives",
        valeur: String(entreprisesActives),
        delta: "plateforme",
        couleurPoint: "good",
      },
      {
        label: "Appels aujourd'hui",
        valeur: String(appelsAujourdhui),
        delta: "toutes entreprises",
        couleurPoint: "signal",
      },
      {
        label: "RDV confirmés (7j)",
        valeur: String(rdvConfirmes7j),
        delta: "toutes entreprises",
        couleurPoint: "good",
      },
    ],
    serieAppels14Jours,
    derniersAppels: derniersAppelsBruts.map((appel) => ({
      id: appel.id,
      entrepriseNom: appel.agentIA.entreprise.nom,
      etablissementNom: appel.etablissement?.nom ?? null,
      resultat: appel.statut === "echoue" ? "Échec" : appel.rendezVousId ? "Prise de RDV" : "Renseignement",
      statut: appel.statut,
      smsEnvoye: appel.smsEnvoye,
      dureeSecondes: appel.dureeSecondes,
    })),
  };
}
