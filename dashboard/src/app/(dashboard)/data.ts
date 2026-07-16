// Données de démonstration pour la Vue d'ensemble — voir
// docs/sprint5-conception.md, section 3. À remplacer par de vraies requêtes
// Prisma quand la base PostgreSQL sera disponible (voir docs/sprint-log.md).
//
// Les types réutilisent les modèles Prisma générés pour les champs qui
// correspondent à une vraie table (`ActionRequiseModel`, `AppelModel`), pour
// que brancher la vraie base plus tard soit un remplacement direct de cette
// fonction, pas une réécriture des types.

import type { ActionRequiseModel, AppelModel } from "@/generated/prisma/models";
import type { ActionRecommandee } from "@/lib/actions-center";

// Le champ JSON générique `actionRecommandee` du modèle Prisma est retypé en
// `ActionRecommandee` (voir src/lib/actions-center.ts) plutôt que `Json | null`.
// `metaLabel` (ex. "il y a 12 min", "expire le 19 juillet") n'existe pas dans
// le schéma : il sera calculé à l'affichage à partir de `createdAt` (ou de la
// date de fin d'essai de l'entreprise) une fois la vraie base branchée.
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

// "Derniers appels" affiche des informations jointes (nom de l'entreprise et
// de l'établissement via l'agent IA, résultat de l'appel) qui n'existent pas
// telles quelles sur le modèle `Appel` — seuls les champs directement issus
// du modèle sont repris depuis `AppelModel`.
export type AppelRecent = Pick<
  AppelModel,
  "id" | "dureeSecondes" | "statut" | "smsEnvoye"
> & {
  entrepriseNom: string;
  // null pour une entreprise à établissement unique (rien à préciser en plus
  // du nom de l'entreprise) — ex. Le Petit Bouchon, Cabinet Dentaire Sourire.
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

export function getOverviewData(): OverviewData {
  return {
    miseAJourLe: "mardi 16 juillet, 11:42",
    actionsRequises: [
      {
        id: "action-1",
        type: "technique",
        gravite: "critique",
        titre: "SMS de confirmation en échec — Le Petit Bouchon",
        description: "3 échecs consécutifs, délai backend dépassé.",
        entrepriseId: "entreprise-petit-bouchon",
        actionRecommandee: { libelle: "Vérifier Twilio", lien: "/sante-plateforme" },
        metaLabel: "il y a 12 min",
        statut: "nouveau",
        resoluLe: null,
        createdAt: new Date(),
      },
      {
        id: "action-2",
        type: "business",
        gravite: "a_surveiller",
        titre: "Essai gratuit expire dans 3 jours — Le Petit Bouchon",
        description: "Aucun moyen de paiement enregistré pour l'instant.",
        entrepriseId: "entreprise-petit-bouchon",
        actionRecommandee: {
          libelle: "Contacter le client",
          lien: "/entreprises/entreprise-petit-bouchon",
        },
        metaLabel: "expire le 19 juillet",
        statut: "nouveau",
        resoluLe: null,
        createdAt: new Date(),
      },
      {
        id: "action-3",
        type: "technique",
        gravite: "a_surveiller",
        titre: "Google Calendar déconnecté — Cabinet Dentaire Sourire",
        description:
          "Le jeton d'autorisation a expiré, les disponibilités ne se mettent plus à jour.",
        entrepriseId: "entreprise-cabinet-dentaire",
        actionRecommandee: {
          libelle: "Reconnecter",
          lien: "/entreprises/entreprise-cabinet-dentaire",
        },
        metaLabel: "depuis 09:02",
        statut: "nouveau",
        resoluLe: null,
        createdAt: new Date(),
      },
    ],
    statistiques: [
      {
        label: "Entreprises actives",
        valeur: "3",
        delta: "+1 en essai",
        couleurPoint: "good",
      },
      {
        label: "Appels aujourd'hui",
        valeur: "47",
        delta: "+12% vs hier",
        couleurPoint: "signal",
      },
      {
        label: "RDV confirmés (7j)",
        valeur: "189",
        delta: "86% des appels RDV",
        couleurPoint: "good",
      },
    ],
    serieAppels14Jours: [
      { jour: "3 juil.", nombreAppels: 28 },
      { jour: "4 juil.", nombreAppels: 31 },
      { jour: "5 juil.", nombreAppels: 29 },
      { jour: "6 juil.", nombreAppels: 36 },
      { jour: "7 juil.", nombreAppels: 34 },
      { jour: "8 juil.", nombreAppels: 39 },
      { jour: "9 juil.", nombreAppels: 38 },
      { jour: "10 juil.", nombreAppels: 44 },
      { jour: "11 juil.", nombreAppels: 42 },
      { jour: "12 juil.", nombreAppels: 48 },
      { jour: "13 juil.", nombreAppels: 46 },
      { jour: "14 juil.", nombreAppels: 53 },
      { jour: "15 juil.", nombreAppels: 54 },
      { jour: "16 juil.", nombreAppels: 61 },
    ],
    derniersAppels: [
      {
        id: "call-1",
        entrepriseNom: "Barber Concept",
        etablissementNom: "Jonction",
        resultat: "prise de RDV",
        statut: "termine",
        smsEnvoye: true,
        dureeSecondes: 178,
      },
      {
        id: "call-2",
        entrepriseNom: "Le Petit Bouchon",
        etablissementNom: null,
        resultat: "réservation table",
        statut: "termine",
        smsEnvoye: false,
        dureeSecondes: 107,
      },
      {
        id: "call-3",
        entrepriseNom: "Cabinet Dentaire Sourire",
        etablissementNom: null,
        resultat: "renseignement",
        statut: "termine",
        smsEnvoye: true,
        dureeSecondes: 269,
      },
    ],
  };
}
