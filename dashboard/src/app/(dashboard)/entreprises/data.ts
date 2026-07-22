// Écrans Entreprises (liste + détail) — branchés sur les vraies données
// Postgres (2026-07-22). Les 3 entreprises de démonstration utilisées
// jusqu'ici (voir historique git) ont été retirées : la plateforme n'affiche
// plus que les entreprises réellement créées via le dashboard.
//
// La santé n'est jamais stockée ici comme un statut figé : elle vient de la
// table `evenements_sante` (vraie requête Prisma, voir entreprises/page.tsx),
// et c'est `santeParEntreprise` (voir src/lib/health.ts) qui calcule le
// statut agrégé à partir de ces événements.

import { prisma } from "@/lib/prisma";
import type { EntrepriseModel, EtablissementModel } from "@/generated/prisma/models";

export type EntrepriseListeItem = Pick<
  EntrepriseModel,
  "id" | "nom" | "secteur" | "statut"
> & {
  statutLabel: string;
  planLabel: string;
  appelsSeptJours: number;
  coutMoisChf: number;
  /** Conservé pour compatibilité d'affichage (badge "Démo") — toujours `false` désormais. */
  estDemo: boolean;
};

const statutLabels: Record<EntrepriseModel["statut"], string> = {
  essai: "Essai",
  actif: "Actif",
  suspendu: "Suspendu",
  resilie: "Résilié",
};

const SEPT_JOURS_MS = 7 * 24 * 60 * 60 * 1000;

/** Coût total réel d'un appel — `Appel.coutDetail` (jsonb Vapi), voir architecture.md. */
function coutAppelChf(coutDetail: unknown): number {
  if (typeof coutDetail !== "object" || coutDetail === null) return 0;
  const total = (coutDetail as { total?: unknown }).total;
  return typeof total === "number" ? total : 0;
}

/** Ids des agents IA d'une entreprise — même principe que getAgentIdsEntreprise (scope-client.ts), sans filtrer par utilisateur ici (vue Admin = tout voir). */
async function getAgentIds(entrepriseId: string): Promise<string[]> {
  const agents = await prisma.agentIA.findMany({
    where: { entrepriseId },
    select: { id: true },
  });
  return agents.map((agent) => agent.id);
}

/** Appels des 7 derniers jours + coût réel du mois en cours, pour une entreprise. */
async function getActiviteEtCouts(
  agentIds: string[]
): Promise<{ appelsSeptJours: number; coutMoisChf: number }> {
  if (agentIds.length === 0) return { appelsSeptJours: 0, coutMoisChf: 0 };

  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const [appelsSeptJours, appelsDuMois] = await Promise.all([
    prisma.appel.count({
      where: { agentIaId: { in: agentIds }, debut: { gte: new Date(Date.now() - SEPT_JOURS_MS) } },
    }),
    prisma.appel.findMany({
      where: { agentIaId: { in: agentIds }, debut: { gte: debutMois } },
      select: { coutDetail: true },
    }),
  ]);

  const coutMoisChf = appelsDuMois.reduce((total, appel) => total + coutAppelChf(appel.coutDetail), 0);
  return { appelsSeptJours, coutMoisChf: Math.round(coutMoisChf * 100) / 100 };
}

async function versEntrepriseListeItem(entreprise: EntrepriseModel): Promise<EntrepriseListeItem> {
  const agentIds = await getAgentIds(entreprise.id);
  const { appelsSeptJours, coutMoisChf } = await getActiviteEtCouts(agentIds);
  return {
    id: entreprise.id,
    nom: entreprise.nom,
    secteur: entreprise.secteur,
    statut: entreprise.statut,
    statutLabel: statutLabels[entreprise.statut],
    planLabel: "Aucun abonnement",
    appelsSeptJours,
    coutMoisChf,
    estDemo: false,
  };
}

export async function getEntreprisesListe(): Promise<EntrepriseListeItem[]> {
  const entreprises = await prisma.entreprise.findMany({ orderBy: { createdAt: "desc" } });
  return Promise.all(entreprises.map(versEntrepriseListeItem));
}

export type EtablissementListeItem = Pick<
  EtablissementModel,
  "id" | "nom" | "adresse"
> & {
  numero: string;
  assistantNom: string;
  statutLabel: string;
};

export interface RentabiliteEntreprise {
  margeChf: number;
  note: string;
  revenuChf: number;
  coutVariableChf: number;
}

export interface ActiviteRecente {
  appelsSeptJours: number;
  deltaLabel: string;
}

export interface EntrepriseDetail {
  id: string;
  nom: string;
  secteur: string;
  statut: EntrepriseModel["statut"];
  statutLabel: string;
  planLabel: string;
  rentabilite: RentabiliteEntreprise;
  activite: ActiviteRecente;
  etablissements: EtablissementListeItem[];
  /** Conservé pour compatibilité d'affichage — toujours `false` désormais. */
  estDemo: boolean;
}

async function versEntrepriseDetail(
  entreprise: EntrepriseModel & {
    etablissements: (EtablissementModel & { agentsIA: { numeroTwilio: string | null; statut: string }[] })[];
  }
): Promise<EntrepriseDetail> {
  const agentIds = await getAgentIds(entreprise.id);
  const { appelsSeptJours, coutMoisChf } = await getActiviteEtCouts(agentIds);

  const abonnement = await prisma.abonnement.findUnique({ where: { entrepriseId: entreprise.id } });
  const revenuChf = abonnement ? Number(abonnement.prix) : 0;
  const margeChf = Math.round((revenuChf - coutMoisChf) * 100) / 100;

  return {
    id: entreprise.id,
    nom: entreprise.nom,
    secteur: entreprise.secteur,
    statut: entreprise.statut,
    statutLabel: statutLabels[entreprise.statut],
    planLabel: abonnement?.nomPlan ?? "Aucun abonnement",
    estDemo: false,
    rentabilite: {
      margeChf,
      note: abonnement
        ? `marge estimée sur ${entreprise.etablissements.length} établissement${entreprise.etablissements.length > 1 ? "s" : ""}`
        : "aucun abonnement actif — coût réel absorbé par la plateforme",
      revenuChf,
      coutVariableChf: coutMoisChf,
    },
    activite: {
      appelsSeptJours,
      deltaLabel: appelsSeptJours > 0 ? "7 derniers jours" : "aucun appel enregistré",
    },
    etablissements: entreprise.etablissements.map((etablissement) => {
      const agent = etablissement.agentsIA[0] ?? null;
      return {
        id: etablissement.id,
        nom: etablissement.nom,
        adresse: etablissement.adresse,
        numero: agent?.numeroTwilio ?? "Non configuré",
        assistantNom: agent ? "Réceptionniste IA" : "Aucun assistant configuré",
        statutLabel: agent?.statut === "actif" ? "Actif" : "Non configuré",
      };
    }),
  };
}

export async function getEntrepriseDetail(id: string): Promise<EntrepriseDetail | null> {
  const entreprise = await prisma.entreprise.findUnique({
    where: { id },
    include: { etablissements: { include: { agentsIA: { select: { numeroTwilio: true, statut: true } } } } },
  });
  return entreprise ? versEntrepriseDetail(entreprise) : null;
}

export interface RentabiliteEntrepriseAffichee {
  id: string;
  nom: string;
  planLabel: string;
  estEnEssai: boolean;
  revenuChf: number;
  coutVariableChf: number;
  margeChf: number;
}

/**
 * Rentabilité de chaque entreprise, triée du moins rentable au plus rentable
 * (voir docs/sprint5-conception.md, section 5 — "Finances"). Reprend
 * exactement le même calcul que l'onglet "Vue d'ensemble" du détail
 * entreprise (ci-dessus) — une seule source de vérité pour la rentabilité,
 * pas de chiffres recalculés séparément.
 */
export async function getRentabiliteEntreprises(): Promise<RentabiliteEntrepriseAffichee[]> {
  const entreprises = await prisma.entreprise.findMany({
    include: { etablissements: { include: { agentsIA: { select: { numeroTwilio: true, statut: true } } } } },
  });
  const details = await Promise.all(entreprises.map(versEntrepriseDetail));
  return details
    .map((entreprise) => ({
      id: entreprise.id,
      nom: entreprise.nom,
      planLabel: entreprise.planLabel,
      estEnEssai: entreprise.statut === "essai",
      revenuChf: entreprise.rentabilite.revenuChf,
      coutVariableChf: entreprise.rentabilite.coutVariableChf,
      margeChf: entreprise.rentabilite.margeChf,
    }))
    .sort((a, b) => a.margeChf - b.margeChf);
}
