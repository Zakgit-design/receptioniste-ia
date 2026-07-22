// Types et fonctions pures pour l'écran Appels du Dashboard Administrateur.
// Isolé de `(dashboard)/appels/data.ts` (qui importe Prisma) pour rester
// importable depuis un composant client ("use client") : `appels-table.tsx`
// en a besoin, et un module qui importe Prisma ne peut pas être bundlé côté
// navigateur (dépendances Node natives, ex. `tls`) — même principe que
// src/lib/appels-client.ts côté Dashboard Client (bug de build trouvé le
// 2026-07-22 en branchant cet écran sur les vraies données).

import type { ToneBadge } from "@/components/statut-badge";
import type { AppelModel } from "@/generated/prisma/models";
import type { OutilAppelUtilise, ErreurAppel } from "@/lib/call-timeline";

export interface AppelListeItem
  extends Pick<AppelModel, "id" | "dureeSecondes" | "statut" | "smsEnvoye" | "rendezVousId"> {
  heure: string;
  entrepriseNom: string;
  etablissementNom: string;
  telephoneAppelantMasque: string;
  resultat: string;
  coutChf: number;
}

export interface AppelDetail
  extends Pick<
    AppelModel,
    "id" | "dureeSecondes" | "statut" | "smsEnvoye" | "rendezVousId" | "urlEnregistrement"
  > {
  entrepriseNom: string;
  etablissementNom: string;
  telephoneAppelantMasque: string;
  resultat: string;
  coutChf: number;
  heureDecroche: string;
  heureRaccroche: string | null;
  outilsUtilises: OutilAppelUtilise[];
  erreurs: ErreurAppel[] | null;
  resumeIA: string;
  transcription: { locuteur: "ia" | "client"; texte: string }[];
}

/** Libellé + couleur affichés pour un appel, à partir de son statut et de l'envoi du SMS. */
export function libelleEtToneAppel(appel: {
  statut: AppelModel["statut"];
  smsEnvoye: boolean;
  rendezVousId: string | null;
}): { libelle: string; tone: ToneBadge } {
  if (appel.statut === "echoue") return { libelle: "Échoué", tone: "critical" };
  if (appel.rendezVousId && !appel.smsEnvoye) return { libelle: "SMS échoué", tone: "warn" };
  return { libelle: "Terminé", tone: "good" };
}

/** Un appel "à traiter" : échoué, ou rendez-vous créé sans confirmation envoyée. */
export function appelATraiter(appel: {
  statut: AppelModel["statut"];
  smsEnvoye: boolean;
  rendezVousId: string | null;
}): boolean {
  return appel.statut === "echoue" || (appel.rendezVousId !== null && !appel.smsEnvoye);
}

/** Formate une durée en secondes au format m:ss (ex. 178 -> "2:58"). */
export function formatDureeAppel(dureeSecondes: number | null): string {
  if (dureeSecondes === null) return "—";
  const minutes = Math.floor(dureeSecondes / 60);
  const secondes = dureeSecondes % 60;
  return `${minutes}:${secondes.toString().padStart(2, "0")}`;
}

/** Résultat métier affiché à partir du statut/rendez-vous d'un appel. */
export function resultatAppel(appel: { statut: AppelModel["statut"]; rendezVousId: string | null }): string {
  if (appel.statut === "echoue") return "Échec";
  if (appel.statut === "transfere") return "Transféré";
  return appel.rendezVousId ? "Prise de RDV" : "Renseignement";
}

/** Masque un numéro pour la vue plateforme (pas besoin du numéro complet pour opérer) — garde indicatif + 2 premiers/derniers chiffres. */
export function masquerTelephone(numero: string): string {
  const chiffres = numero.replace(/\D/g, "");
  if (chiffres.length < 6) return numero;
  const debut = chiffres.slice(0, 4);
  const fin = chiffres.slice(-2);
  return `+${debut.slice(0, 2)} ${debut.slice(2)} •• •• ${fin}`;
}
