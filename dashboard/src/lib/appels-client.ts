// Types et fonctions pures pour l'écran Appels du Dashboard Client — voir
// docs/roadmap.md, tâche #67. Isolé de `(client)/app/appels/data.ts`
// (qui importe Prisma) pour rester importable depuis un composant client
// ("use client") : `appels-table-client.tsx` en a besoin, et un module qui
// importe Prisma ne peut pas être bundlé côté navigateur (dépendances
// Node natives, ex. `tls`).

import type { ToneBadge } from "@/components/statut-badge";
import type { StatutAppel } from "@/generated/prisma/enums";
import type { OutilAppelUtilise, ErreurAppel } from "@/lib/call-timeline";

export interface EtablissementOption {
  id: string;
  nom: string;
}

// Libellé affiché quand `Appel.etablissementId` est `null` — l'appel n'a pas
// abouti à une réservation permettant de déduire le salon concerné (Barber
// Concept partage un seul numéro/agenda pour ses 6 salons, voir
// docs/architecture.md). Même principe honnête que "Non renseigné" pour la
// colonne Collaborateur de l'écran Rendez-vous (tâche #68) : pas de salon
// inventé.
export const ETABLISSEMENT_NON_DETERMINE = "Non déterminé";

export interface AppelListeItemClient {
  id: string;
  heure: string;
  debutTimestamp: number;
  etablissementId: string | null;
  etablissementNom: string;
  telephoneAppelant: string;
  dureeSecondes: number | null;
  statut: StatutAppel;
  resultat: string;
  smsEnvoye: boolean;
  rendezVousId: string | null;
}

export interface LigneTranscriptionAppel {
  locuteur: "ia" | "client";
  texte: string;
}

export interface AppelDetailClient {
  id: string;
  etablissementNom: string;
  telephoneAppelant: string;
  dureeSecondes: number | null;
  statut: StatutAppel;
  resultat: string;
  smsEnvoye: boolean;
  rendezVousId: string | null;
  urlEnregistrement: string | null;
  heureDecroche: string;
  heureRaccroche: string | null;
  outilsUtilises: OutilAppelUtilise[];
  erreurs: ErreurAppel[] | null;
  resumeIA: string;
  transcription: LigneTranscriptionAppel[];
}

/** Libellé + couleur affichés pour un appel, à partir de son statut et de l'envoi du SMS. */
export function libelleEtToneAppelClient(appel: {
  statut: StatutAppel;
  smsEnvoye: boolean;
  rendezVousId: string | null;
}): { libelle: string; tone: ToneBadge } {
  if (appel.statut === "echoue") return { libelle: "Échoué", tone: "critical" };
  if (appel.statut === "transfere") return { libelle: "Transféré", tone: "warn" };
  if (appel.rendezVousId && !appel.smsEnvoye) return { libelle: "SMS échoué", tone: "warn" };
  return { libelle: "Terminé", tone: "good" };
}

/** Formate une durée en secondes au format m:ss (ex. 178 -> "2:58"). */
export function formatDureeAppelClient(dureeSecondes: number | null): string {
  if (dureeSecondes === null) return "—";
  const minutes = Math.floor(dureeSecondes / 60);
  const secondes = dureeSecondes % 60;
  return `${minutes}:${secondes.toString().padStart(2, "0")}`;
}

/** Résultat métier d'un appel (indépendant du statut technique affiché en badge). */
export function resultatAppel(appel: { statut: StatutAppel; rendezVousId: string | null }): string {
  if (appel.statut === "echoue") return "Échec";
  if (appel.statut === "transfere") return "Transféré";
  return appel.rendezVousId ? "Rendez-vous pris" : "Renseignement";
}
