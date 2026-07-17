// Données réelles de la Vue d'ensemble du Dashboard Client — voir
// docs/roadmap.md, tâche #66, mis à jour tâche #73. Tout vient de Postgres,
// scopé sur l'entreprise et les établissements autorisés de l'utilisateur
// connecté (voir src/lib/scope-client.ts).
//
// **Mise à jour tâche #73 :** la répartition par établissement lit désormais
// `Appel.etablissementId` directement (nullable — "non déterminé" si aucune
// réservation n'a eu lieu), plus via l'établissement (arbitraire) de
// l'agent — même correctif que `appels/data.ts`, voir ce fichier pour le
// détail du scope entreprise vs établissement.

import { prisma } from "@/lib/prisma";
import type { Utilisateur } from "@/auth";
import { getEtablissementIdsAutorises, getAgentIdsEntreprise } from "@/lib/scope-client";
import { ETABLISSEMENT_NON_DETERMINE } from "@/lib/appels-client";
import type { StatutAppel } from "@/generated/prisma/enums";

export interface StatistiqueTuile {
  label: string;
  valeur: string;
  delta: string;
  couleurPoint: "good" | "signal";
}

export interface AppelAttention {
  id: string;
  etablissementNom: string;
  telephoneAppelant: string;
  quandLabel: string;
}

export interface ActiviteRecenteItem {
  id: string;
  etablissementNom: string;
  resultat: string;
  statut: StatutAppel;
  smsEnvoye: boolean;
  dureeSecondes: number | null;
}

export interface StatistiqueEtablissement {
  id: string;
  nom: string;
  appelsAujourdhui: number;
  rendezVousAujourdhui: number;
}

export interface VueEnsembleClient {
  statistiques: StatistiqueTuile[];
  appelsAttention: AppelAttention[];
  activiteRecente: ActiviteRecenteItem[];
  statistiquesEtablissements: StatistiqueEtablissement[];
}

const LIMITE_ATTENTION = 5;
const LIMITE_ACTIVITE_RECENTE = 8;

/** Minuit (heure du serveur), aujourd'hui si `decalageJours` vaut 0, hier si -1, etc. */
function debutJour(decalageJours = 0): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + decalageJours);
  return date;
}

function resultatAppel(appel: { statut: StatutAppel; rendezVousId: string | null }): string {
  if (appel.statut === "echoue") return "Échec";
  if (appel.statut === "transfere") return "Transféré";
  return appel.rendezVousId ? "Rendez-vous pris" : "Renseignement";
}

/** Delta "vs hier" honnête (pas de tendance inventée) pour une tuile de stat. */
function deltaVsHier(
  aujourdhui: number,
  hier: number,
  sensSouhaite: "hausse" | "baisse"
): { texte: string; couleurPoint: "good" | "signal" } {
  const diff = aujourdhui - hier;
  const texte = diff === 0 ? "= hier" : `${diff > 0 ? "+" : ""}${diff} vs hier`;
  const positif = sensSouhaite === "hausse" ? diff >= 0 : diff <= 0;
  return { texte, couleurPoint: positif ? "good" : "signal" };
}

const statistiquesVides: StatistiqueTuile[] = [
  { label: "Appels aujourd'hui", valeur: "0", delta: "= hier", couleurPoint: "good" },
  { label: "Appels manqués", valeur: "0", delta: "= hier", couleurPoint: "good" },
  { label: "Rendez-vous créés", valeur: "0", delta: "= hier", couleurPoint: "good" },
  { label: "Taux de conversion", valeur: "—", delta: "Aucun appel aujourd'hui", couleurPoint: "good" },
];

/**
 * Vue d'ensemble de l'entreprise de l'utilisateur connecté. Retourne des
 * zéros et des listes vides si l'utilisateur n'a pas d'établissement
 * autorisé (aucune entreprise, ou aucun établissement assigné pour un
 * responsable d'établissement).
 */
export async function getVueEnsembleClient(user: Utilisateur | null): Promise<VueEnsembleClient> {
  const [etablissementIds, agentIds] = await Promise.all([
    getEtablissementIdsAutorises(user),
    getAgentIdsEntreprise(user),
  ]);

  const vide: VueEnsembleClient = {
    statistiques: statistiquesVides,
    appelsAttention: [],
    activiteRecente: [],
    statistiquesEtablissements: [],
  };
  if (etablissementIds.length === 0) return vide;

  const etablissements = await prisma.etablissement.findMany({
    where: { id: { in: etablissementIds } },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true },
  });

  // Aucun agent sur l'entreprise : pas d'appel possible, seule la répartition
  // par établissement (à zéro) a du sens.
  if (agentIds.length === 0) {
    return {
      ...vide,
      statistiquesEtablissements: etablissements.map((etablissement) => ({
        id: etablissement.id,
        nom: etablissement.nom,
        appelsAujourdhui: 0,
        rendezVousAujourdhui: 0,
      })),
    };
  }

  // Restriction supplémentaire sur `Appel.etablissementId`, uniquement pour un
  // responsable d'établissement (voir docs/architecture.md, tâche #70/#73, et
  // le commentaire équivalent dans ./appels/data.ts).
  const restrictionEtablissement =
    user?.role === "responsable_etablissement" ? { etablissementId: { in: etablissementIds } } : {};

  const debutAujourdhui = debutJour(0);
  const debutHier = debutJour(-1);

  const [
    appelsAujourdhui,
    appelsHier,
    echouesAujourdhui,
    echouesHier,
    rendezVousAujourdhui,
    rendezVousHier,
    appelsAttentionBruts,
    activiteRecenteBrute,
  ] = await Promise.all([
    prisma.appel.count({
      where: { agentIaId: { in: agentIds }, ...restrictionEtablissement, debut: { gte: debutAujourdhui } },
    }),
    prisma.appel.count({
      where: {
        agentIaId: { in: agentIds },
        ...restrictionEtablissement,
        debut: { gte: debutHier, lt: debutAujourdhui },
      },
    }),
    prisma.appel.count({
      where: {
        agentIaId: { in: agentIds },
        ...restrictionEtablissement,
        statut: "echoue",
        debut: { gte: debutAujourdhui },
      },
    }),
    prisma.appel.count({
      where: {
        agentIaId: { in: agentIds },
        ...restrictionEtablissement,
        statut: "echoue",
        debut: { gte: debutHier, lt: debutAujourdhui },
      },
    }),
    prisma.rendezVous.count({
      where: { etablissementId: { in: etablissementIds }, createdAt: { gte: debutAujourdhui } },
    }),
    prisma.rendezVous.count({
      where: {
        etablissementId: { in: etablissementIds },
        createdAt: { gte: debutHier, lt: debutAujourdhui },
      },
    }),
    prisma.appel.findMany({
      where: { agentIaId: { in: agentIds }, ...restrictionEtablissement, statut: "echoue" },
      include: { etablissement: { select: { nom: true } } },
      orderBy: { debut: "desc" },
      take: LIMITE_ATTENTION,
    }),
    prisma.appel.findMany({
      where: { agentIaId: { in: agentIds }, ...restrictionEtablissement },
      include: { etablissement: { select: { nom: true } } },
      orderBy: { debut: "desc" },
      take: LIMITE_ACTIVITE_RECENTE,
    }),
  ]);

  const tauxConversion =
    appelsAujourdhui > 0 ? Math.round((rendezVousAujourdhui / appelsAujourdhui) * 100) : null;

  const deltaAppels = deltaVsHier(appelsAujourdhui, appelsHier, "hausse");
  const deltaEchoues = deltaVsHier(echouesAujourdhui, echouesHier, "baisse");
  const deltaRdv = deltaVsHier(rendezVousAujourdhui, rendezVousHier, "hausse");

  const statistiques: StatistiqueTuile[] = [
    {
      label: "Appels aujourd'hui",
      valeur: String(appelsAujourdhui),
      delta: deltaAppels.texte,
      couleurPoint: deltaAppels.couleurPoint,
    },
    {
      label: "Appels manqués",
      valeur: String(echouesAujourdhui),
      delta: deltaEchoues.texte,
      couleurPoint: deltaEchoues.couleurPoint,
    },
    {
      label: "Rendez-vous créés",
      valeur: String(rendezVousAujourdhui),
      delta: deltaRdv.texte,
      couleurPoint: deltaRdv.couleurPoint,
    },
    {
      label: "Taux de conversion",
      valeur: tauxConversion === null ? "—" : `${tauxConversion}%`,
      delta:
        appelsAujourdhui === 0
          ? "Aucun appel aujourd'hui"
          : `${rendezVousAujourdhui} RDV / ${appelsAujourdhui} appels`,
      couleurPoint: "good",
    },
  ];

  const appelsAttention: AppelAttention[] = appelsAttentionBruts.map((appel) => ({
    id: appel.id,
    etablissementNom: appel.etablissement?.nom ?? ETABLISSEMENT_NON_DETERMINE,
    telephoneAppelant: appel.telephoneAppelant,
    quandLabel: appel.debut.toLocaleString("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  const activiteRecente: ActiviteRecenteItem[] = activiteRecenteBrute.map((appel) => ({
    id: appel.id,
    etablissementNom: appel.etablissement?.nom ?? ETABLISSEMENT_NON_DETERMINE,
    resultat: resultatAppel(appel),
    statut: appel.statut,
    smsEnvoye: appel.smsEnvoye,
    dureeSecondes: appel.dureeSecondes,
  }));

  // Répartition par établissement — désormais via `Appel.etablissementId`
  // directement (tâche #73), plus via l'agent (arbitraire, un seul agent
  // partagé pour les 6 salons Barber Concept, voir docs/architecture.md).
  const statistiquesEtablissements: StatistiqueEtablissement[] = await Promise.all(
    etablissements.map(async (etablissement) => {
      const [appelsEtablissement, rendezVousEtablissement] = await Promise.all([
        prisma.appel.count({
          where: {
            agentIaId: { in: agentIds },
            etablissementId: etablissement.id,
            debut: { gte: debutAujourdhui },
          },
        }),
        prisma.rendezVous.count({
          where: { etablissementId: etablissement.id, createdAt: { gte: debutAujourdhui } },
        }),
      ]);
      return {
        id: etablissement.id,
        nom: etablissement.nom,
        appelsAujourdhui: appelsEtablissement,
        rendezVousAujourdhui: rendezVousEtablissement,
      };
    })
  );

  return { statistiques, appelsAttention, activiteRecente, statistiquesEtablissements };
}
