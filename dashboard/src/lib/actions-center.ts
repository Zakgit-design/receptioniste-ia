// Logique du centre d'actions (table `actions_requises`), voir
// docs/sprint5-conception.md section 2 pour la conception complète.
//
// Fonctions pures : elles reçoivent l'état actuel (actions déjà en base,
// signal déclencheur) et renvoient une décision (créer / résoudre / ignorer)
// — jamais d'accès base de données ici. C'est à l'appelant (un job planifié,
// une route API...) d'aller lire/écrire en base autour de ces fonctions.

import { estDegradeDeManiereRepetee, type StatutSante } from "./health.ts";

export type TypeActionRequise = "technique" | "business" | "securite";
export type GraviteActionRequise = "critique" | "a_surveiller";
export type StatutActionRequise =
  | "nouveau"
  | "traite"
  | "ignore"
  | "resolu_automatiquement";

export interface ActionRecommandee {
  libelle: string;
  lien: string;
}

export interface ActionRequise {
  id: string;
  type: TypeActionRequise;
  gravite: GraviteActionRequise;
  titre: string;
  description: string;
  entrepriseId: string | null;
  actionRecommandee: ActionRecommandee | null;
  /**
   * Clé de dédoublonnage stable identifiant "la même cause" d'un item à
   * l'autre (ex. `sante:vapi:entreprise-1`, `essai-expire:entreprise-1`).
   * N'existe pas dans le schéma `actions_requises` (voir docs/architecture.md) :
   * elle se dérive à la volée du type + de l'entreprise + de la description,
   * uniquement pour les besoins du dédoublonnage ci-dessous.
   */
  cle: string;
  statut: StatutActionRequise;
  resoluLe: Date | null;
  createdAt: Date;
}

export type NouvelleActionRequise = Omit<
  ActionRequise,
  "id" | "statut" | "resoluLe" | "createdAt"
>;

/**
 * Cherche un item déjà "nouveau" pour la même cause (même `cle`). Sert à ne
 * jamais créer de doublon tant qu'un item équivalent est encore ouvert.
 */
export function trouverActionOuverteEquivalente(
  actionsExistantes: ActionRequise[],
  cle: string
): ActionRequise | undefined {
  return actionsExistantes.find(
    (action) => action.statut === "nouveau" && action.cle === cle
  );
}

/**
 * Décide s'il faut créer un nouvel item du centre d'actions. Renvoie `null`
 * si un item équivalent est déjà "nouveau" (pas de doublon), sinon les
 * champs prêts à insérer.
 */
export function proposerCreationAction(
  actionsExistantes: ActionRequise[],
  candidate: NouvelleActionRequise
): NouvelleActionRequise | null {
  if (trouverActionOuverteEquivalente(actionsExistantes, candidate.cle)) {
    return null;
  }
  return candidate;
}

/**
 * Passe en "résolu automatiquement" les items "nouveau" dont la cause a
 * disparu d'elle-même (ex. un service redevenu sain). `causeEstResolue`
 * est fourni par l'appelant : lui seul sait comment vérifier la cause d'un
 * item donné. Renvoie uniquement les items modifiés (à écrire en base).
 */
export function resoudreActionsAutomatiquement(
  actionsExistantes: ActionRequise[],
  causeEstResolue: (action: ActionRequise) => boolean,
  maintenant: Date
): ActionRequise[] {
  return actionsExistantes
    .filter((action) => action.statut === "nouveau" && causeEstResolue(action))
    .map((action) => ({
      ...action,
      statut: "resolu_automatiquement" as const,
      resoluLe: maintenant,
    }));
}

/** Marque un item comme traité par le Super Admin. */
export function marquerTraite(action: ActionRequise): ActionRequise {
  return { ...action, statut: "traite" };
}

/** Marque un item comme ignoré explicitement par le Super Admin. */
export function marquerIgnore(action: ActionRequise): ActionRequise {
  return { ...action, statut: "ignore" };
}

// --- Déclencheurs (sources listées dans docs/sprint5-conception.md) ---

/**
 * Déclencheur "santé dégradée de manière répétée" : construit le candidat
 * d'item technique à proposer, à partir des derniers événements de santé
 * d'un service pour une entreprise donnée (ou plateforme si `entrepriseId`
 * est `null`). Retourne `null` si ce n'est pas (ou plus) répété.
 */
export function evaluerAlerteSante(
  service: string,
  entrepriseId: string | null,
  evenementsRecents: { statut: StatutSante }[]
): NouvelleActionRequise | null {
  if (!estDegradeDeManiereRepetee(evenementsRecents)) return null;

  return {
    type: "technique",
    gravite: "critique",
    titre: `${service} en dégradation répétée`,
    description: `Les derniers événements de santé pour ${service} sont dégradés ou en échec.`,
    entrepriseId,
    actionRecommandee: {
      libelle: "Vérifier la page Santé plateforme",
      lien: "/sante-plateforme",
    },
    cle: `sante:${service}:${entrepriseId ?? "plateforme"}`,
  };
}

/**
 * Déclencheur "essai proche de l'expiration" : une entreprise en statut
 * `essai` dont l'abonnement arrive à échéance dans `seuilJours` jours ou
 * moins. Nécessite `entreprises.email_contact`/`telephone_contact` (voir
 * docs/architecture.md) pour que l'action recommandée soit actionnable.
 */
export function evaluerAlerteEssaiExpire(
  entreprise: { id: string; statut: string; emailContact: string | null },
  finPeriodeCourante: Date | null,
  maintenant: Date,
  seuilJours = 3
): NouvelleActionRequise | null {
  if (entreprise.statut !== "essai" || !finPeriodeCourante) return null;

  const joursRestants = Math.ceil(
    (finPeriodeCourante.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (joursRestants > seuilJours) return null;

  return {
    type: "business",
    gravite: "a_surveiller",
    titre: "Essai proche de l'expiration",
    description: `L'essai de cette entreprise se termine dans ${joursRestants} jour(s).`,
    entrepriseId: entreprise.id,
    actionRecommandee: entreprise.emailContact
      ? { libelle: "Contacter l'entreprise", lien: `mailto:${entreprise.emailContact}` }
      : { libelle: "Renseigner un contact pour cette entreprise", lien: `/entreprises/${entreprise.id}` },
    cle: `essai-expire:${entreprise.id}`,
  };
}
