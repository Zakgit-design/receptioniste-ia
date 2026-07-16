// Données de démonstration pour les écrans Entreprises (liste + détail) — voir
// docs/sprint5-conception.md, section 3. Mêmes 3 entreprises que la Vue
// d'ensemble et le centre d'actions (src/app/(dashboard)/data.ts), à remplacer
// par de vraies requêtes Prisma quand la base sera disponible.
//
// La santé n'est jamais stockée ici comme un statut figé : les événements de
// santé bruts vivent dans src/lib/demo-evenements-sante.ts (source commune
// avec la page Santé plateforme), et c'est `santeParEntreprise` (voir
// src/lib/health.ts) qui calcule le statut agrégé à partir de ces événements.

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
};

const statutLabels: Record<EntrepriseModel["statut"], string> = {
  essai: "Essai",
  actif: "Actif",
  suspendu: "Suspendu",
  resilie: "Résilié",
};

// Une entreprise réelle (créée via le formulaire "+ Nouvelle entreprise", voir
// ./actions.ts) n'a pas encore d'appels ni d'abonnement au moment de sa
// création : ces chiffres restent à 0 / "Aucun abonnement" jusqu'à ce que ces
// données soient branchées (hors périmètre de cette tâche).
function versEntrepriseListeItem(entreprise: EntrepriseModel): EntrepriseListeItem {
  return {
    id: entreprise.id,
    nom: entreprise.nom,
    secteur: entreprise.secteur,
    statut: entreprise.statut,
    statutLabel: statutLabels[entreprise.statut],
    planLabel: "Aucun abonnement",
    appelsSeptJours: 0,
    coutMoisChf: 0,
  };
}

function getEntreprisesDemo(): EntrepriseListeItem[] {
  return [
    {
      id: "entreprise-barber-concept",
      nom: "Barber Concept",
      secteur: "Coiffure / Barbier",
      statut: "actif",
      statutLabel: "Actif",
      planLabel: "Croissance",
      appelsSeptJours: 132,
      coutMoisChf: 184,
    },
    {
      id: "entreprise-cabinet-dentaire",
      nom: "Cabinet Dentaire Sourire",
      secteur: "Cabinet dentaire",
      statut: "actif",
      statutLabel: "Actif",
      planLabel: "Essentiel",
      appelsSeptJours: 28,
      coutMoisChf: 61,
    },
    {
      id: "entreprise-petit-bouchon",
      nom: "Le Petit Bouchon",
      secteur: "Restauration",
      statut: "essai",
      statutLabel: "Essai · 3j restants",
      planLabel: "Essai gratuit",
      appelsSeptJours: 19,
      coutMoisChf: 12,
    },
  ];
}

// Liste combinée : les 3 entreprises de démonstration ci-dessus (encore lues
// par la Vue d'ensemble, Finances et Santé plateforme — hors périmètre de
// cette tâche, voir docs/roadmap.md Sprint 5) + les vraies entreprises créées
// via le dashboard (table `entreprises`, voir ./actions.ts).
export async function getEntreprisesListe(): Promise<EntrepriseListeItem[]> {
  const entreprisesReelles = await prisma.entreprise.findMany({
    orderBy: { createdAt: "desc" },
  });
  return [...entreprisesReelles.map(versEntrepriseListeItem), ...getEntreprisesDemo()];
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
  /** Entreprise de démonstration (pas en base) — pas supprimable depuis l'interface. */
  estDemo: boolean;
}

const entreprisesDetail: Record<string, EntrepriseDetail> = {
  "entreprise-barber-concept": {
    id: "entreprise-barber-concept",
    nom: "Barber Concept",
    secteur: "Coiffure / Barbier",
    statut: "actif",
    statutLabel: "Actif",
    planLabel: "Croissance",
    estDemo: true,
    rentabilite: {
      margeChf: 142,
      note: "marge estimée sur 4 établissements",
      revenuChf: 326,
      coutVariableChf: 184,
    },
    activite: { appelsSeptJours: 132, deltaLabel: "+9% vs semaine précédente" },
    etablissements: [
      {
        id: "etab-cornavin",
        nom: "Cornavin",
        adresse: "Rue de Cornavin 8, Genève",
        numero: "+41 22 539 16 68",
        assistantNom: "Réceptionniste Barber Concept",
        statutLabel: "Actif",
      },
      {
        id: "etab-eaux-vives",
        nom: "Eaux-Vives",
        adresse: "Rue des Eaux-Vives 24, Genève",
        numero: "+41 22 700 12 34",
        assistantNom: "Réceptionniste Barber Concept",
        statutLabel: "Actif",
      },
      {
        id: "etab-jonction",
        nom: "Jonction",
        adresse: "Rue de la Jonction 15, Genève",
        numero: "+41 22 700 12 35",
        assistantNom: "Réceptionniste Barber Concept",
        statutLabel: "Actif",
      },
      {
        id: "etab-rive",
        nom: "Rive",
        adresse: "Rue du Rhône 62, Genève",
        numero: "+41 22 700 12 36",
        assistantNom: "Réceptionniste Barber Concept",
        statutLabel: "Actif",
      },
    ],
  },
  "entreprise-cabinet-dentaire": {
    id: "entreprise-cabinet-dentaire",
    nom: "Cabinet Dentaire Sourire",
    secteur: "Cabinet dentaire",
    statut: "actif",
    statutLabel: "Actif",
    planLabel: "Essentiel",
    estDemo: true,
    rentabilite: {
      margeChf: 28,
      note: "marge estimée sur 1 établissement",
      revenuChf: 89,
      coutVariableChf: 61,
    },
    activite: { appelsSeptJours: 28, deltaLabel: "+4% vs semaine précédente" },
    etablissements: [
      {
        id: "etab-dentaire-geneve",
        nom: "Genève",
        adresse: "Rue du Rhône 30, Genève",
        numero: "+41 22 700 20 10",
        assistantNom: "Réceptionniste Cabinet Dentaire Sourire",
        statutLabel: "Actif",
      },
    ],
  },
  "entreprise-petit-bouchon": {
    id: "entreprise-petit-bouchon",
    nom: "Le Petit Bouchon",
    secteur: "Restauration",
    statut: "essai",
    statutLabel: "Essai · 3j restants",
    planLabel: "Essai gratuit",
    estDemo: true,
    rentabilite: {
      margeChf: -67,
      note: "coût réel absorbé par la plateforme pendant l'essai gratuit",
      revenuChf: 0,
      coutVariableChf: 67,
    },
    activite: { appelsSeptJours: 19, deltaLabel: "en essai depuis 4 jours" },
    etablissements: [
      {
        id: "etab-bouchon-geneve",
        nom: "Genève",
        adresse: "Rue de la Corraterie 5, Genève",
        numero: "+41 22 700 30 10",
        assistantNom: "Réceptionniste Le Petit Bouchon",
        statutLabel: "Actif",
      },
      {
        id: "etab-bouchon-carouge",
        nom: "Carouge",
        adresse: "Rue Ancienne 12, Carouge",
        numero: "+41 22 700 30 11",
        assistantNom: "Réceptionniste Le Petit Bouchon",
        statutLabel: "Actif",
      },
    ],
  },
};

// Une vraie entreprise n'a pas encore de rentabilité/activité/établissements
// au moment de sa création : cet onglet affiche des valeurs neutres à 0 (voir
// versEntrepriseListeItem ci-dessus pour la même logique côté liste).
function versEntrepriseDetail(
  entreprise: EntrepriseModel & { etablissements: EtablissementModel[] }
): EntrepriseDetail {
  return {
    id: entreprise.id,
    nom: entreprise.nom,
    secteur: entreprise.secteur,
    statut: entreprise.statut,
    statutLabel: statutLabels[entreprise.statut],
    planLabel: "Aucun abonnement",
    estDemo: false,
    rentabilite: {
      margeChf: 0,
      note: "aucune donnée de facturation pour l'instant",
      revenuChf: 0,
      coutVariableChf: 0,
    },
    activite: { appelsSeptJours: 0, deltaLabel: "aucun appel enregistré" },
    etablissements: entreprise.etablissements.map((etablissement) => ({
      id: etablissement.id,
      nom: etablissement.nom,
      adresse: etablissement.adresse,
      numero: "Non configuré",
      assistantNom: "Aucun assistant configuré",
      statutLabel: "Actif",
    })),
  };
}

export async function getEntrepriseDetail(id: string): Promise<EntrepriseDetail | null> {
  const demo = entreprisesDetail[id];
  if (demo) return demo;

  const entreprise = await prisma.entreprise.findUnique({
    where: { id },
    include: { etablissements: true },
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
 * exactement les chiffres déjà affichés dans l'onglet "Vue d'ensemble" du
 * détail entreprise (ci-dessus), agrégés ici pour l'écran Finances : une
 * seule source de vérité pour la rentabilité, pas de chiffres recalculés.
 */
export function getRentabiliteEntreprises(): RentabiliteEntrepriseAffichee[] {
  return Object.values(entreprisesDetail)
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
