// Données de démonstration pour l'écran Appels (liste + fiche détail) — voir
// docs/sprint5-conception.md, section 8. Mêmes 3 entreprises que la Vue
// d'ensemble et les écrans Entreprises (voir ../entreprises/data.ts), à
// remplacer par de vraies requêtes Prisma quand la base sera disponible.
//
// Les champs directement issus du modèle `Appel` (voir docs/architecture.md)
// utilisent les types Prisma générés ; `outilsUtilises` et `erreurs` (jsonb
// générique dans le schéma) sont retypés ici en tableaux structurés, sur le
// même principe que `actionRecommandee` dans ../data.ts.

import type { AppelModel } from "@/generated/prisma/models";
import type { ToneBadge } from "@/components/statut-badge";
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

const appelsDetail: Record<string, AppelDetail> = {
  "appel-1": {
    id: "appel-1",
    dureeSecondes: 178,
    statut: "termine",
    smsEnvoye: true,
    rendezVousId: "rdv-1",
    urlEnregistrement: "https://storage.exemple.com/enregistrements/appel-1.mp3",
    entrepriseNom: "Barber Concept",
    etablissementNom: "Jonction",
    telephoneAppelantMasque: "+41 79 •• •• 68",
    resultat: "Prise de RDV",
    coutChf: 0.52,
    heureDecroche: "11:38:02",
    heureRaccroche: "11:41:00",
    outilsUtilises: [
      { label: "Vérification agenda — créneau 15h30 disponible", horodatage: "11:38:24" },
      { label: "Rendez-vous créé dans Google Calendar", horodatage: "11:39:47" },
    ],
    erreurs: null,
    resumeIA:
      "Client régulier, coupe classique demandée pour le salon Jonction. Créneau de 15h30 proposé et accepté après un premier essai à 14h refusé (indisponible).",
    transcription: [
      { locuteur: "ia", texte: "Barber Concept Jonction bonjour, comment puis-je vous aider ?" },
      { locuteur: "client", texte: "Bonjour, je voudrais une coupe classique demain si possible." },
      {
        locuteur: "ia",
        texte: "Je vérifie... 14h est pris, en revanche j'ai 15h30 de disponible, ça vous conviendrait ?",
      },
      { locuteur: "client", texte: "Oui parfait." },
    ],
  },
  "appel-2": {
    id: "appel-2",
    dureeSecondes: 134,
    statut: "termine",
    smsEnvoye: false,
    rendezVousId: null,
    // Au-delà de la fenêtre de rétention (7 jours, voir src/retention.js à la
    // racine du repo) : l'enregistrement a déjà été supprimé.
    urlEnregistrement: null,
    entrepriseNom: "Cabinet Dentaire Sourire",
    etablissementNom: "Genève",
    telephoneAppelantMasque: "+41 78 •• •• 12",
    resultat: "Renseignement",
    coutChf: 0.41,
    heureDecroche: "10:52:00",
    heureRaccroche: "10:54:14",
    outilsUtilises: [
      { label: "Consultation des horaires d'ouverture", horodatage: "10:52:40" },
    ],
    erreurs: null,
    resumeIA:
      "Question sur les horaires d'ouverture du cabinet le samedi. Aucun rendez-vous demandé pendant cet appel.",
    transcription: [
      { locuteur: "ia", texte: "Cabinet Dentaire Sourire bonjour, comment puis-je vous aider ?" },
      { locuteur: "client", texte: "Bonjour, êtes-vous ouverts le samedi ?" },
      { locuteur: "ia", texte: "Non, le cabinet est ouvert du lundi au vendredi, 8h à 18h." },
      { locuteur: "client", texte: "D'accord, merci beaucoup." },
    ],
  },
  "appel-3": {
    id: "appel-3",
    dureeSecondes: 107,
    statut: "termine",
    smsEnvoye: false,
    rendezVousId: "rdv-3",
    urlEnregistrement: "https://storage.exemple.com/enregistrements/appel-3.mp3",
    entrepriseNom: "Le Petit Bouchon",
    etablissementNom: "Carouge",
    telephoneAppelantMasque: "+41 76 •• •• 44",
    resultat: "Réservation table",
    coutChf: 0.33,
    heureDecroche: "10:20:00",
    heureRaccroche: "10:21:47",
    outilsUtilises: [
      { label: "Table de 4 réservée pour ce soir 20h", horodatage: "10:21:05" },
    ],
    erreurs: [{ label: "Erreur technique — délai Twilio dépassé lors de l'envoi du SMS", horodatage: "10:21:40" }],
    resumeIA:
      "Réservation d'une table de 4 personnes ce soir à 20h. La confirmation par SMS n'a pas pu être envoyée (délai backend dépassé).",
    transcription: [
      { locuteur: "ia", texte: "Le Petit Bouchon bonjour, comment puis-je vous aider ?" },
      { locuteur: "client", texte: "Bonjour, une table pour 4 ce soir à 20h, c'est possible ?" },
      { locuteur: "ia", texte: "Oui tout à fait, c'est noté pour 4 personnes à 20h." },
      { locuteur: "client", texte: "Parfait, merci." },
    ],
  },
  "appel-4": {
    id: "appel-4",
    dureeSecondes: 182,
    statut: "termine",
    smsEnvoye: true,
    rendezVousId: "rdv-4",
    urlEnregistrement: "https://storage.exemple.com/enregistrements/appel-4.mp3",
    entrepriseNom: "Barber Concept",
    etablissementNom: "Rive",
    telephoneAppelantMasque: "+41 79 •• •• 03",
    resultat: "Prise de RDV",
    coutChf: 0.58,
    heureDecroche: "09:58:00",
    heureRaccroche: "10:01:02",
    outilsUtilises: [
      { label: "Vérification agenda — créneau 12h15 disponible", horodatage: "09:58:31" },
      { label: "Rendez-vous créé dans Google Calendar", horodatage: "09:59:50" },
    ],
    erreurs: null,
    resumeIA: "Coupe et barbe pour un nouveau client, créneau de 12h15 accepté au salon Rive.",
    transcription: [
      { locuteur: "ia", texte: "Barber Concept Rive bonjour, comment puis-je vous aider ?" },
      { locuteur: "client", texte: "Bonjour, je cherche un créneau pour coupe et barbe aujourd'hui." },
      { locuteur: "ia", texte: "J'ai un créneau à 12h15, ça vous convient ?" },
      { locuteur: "client", texte: "Oui, très bien." },
    ],
  },
  "appel-5": {
    id: "appel-5",
    dureeSecondes: 38,
    statut: "echoue",
    smsEnvoye: false,
    rendezVousId: null,
    urlEnregistrement: "https://storage.exemple.com/enregistrements/appel-5.mp3",
    entrepriseNom: "Barber Concept",
    etablissementNom: "Cornavin",
    telephoneAppelantMasque: "+41 22 •• •• 91",
    resultat: "Demande transfert",
    coutChf: 0.09,
    heureDecroche: "09:41:00",
    heureRaccroche: "09:41:38",
    outilsUtilises: [],
    erreurs: [
      {
        label: "Erreur technique — demande de transfert vers un humain, fonctionnalité non disponible (Sprint 8)",
        horodatage: "09:41:32",
      },
    ],
    resumeIA:
      "Le client a demandé à parler à un humain directement. Le transfert d'appel n'est pas encore disponible (voir docs/roadmap.md, Sprint 8) : l'appel s'est terminé en échec.",
    transcription: [
      { locuteur: "ia", texte: "Barber Concept Cornavin bonjour, comment puis-je vous aider ?" },
      { locuteur: "client", texte: "Je veux parler à quelqu'un, pas à un robot." },
      { locuteur: "ia", texte: "Je suis désolé, je ne peux pas encore vous transférer à un membre de l'équipe." },
    ],
  },
  "appel-6": {
    id: "appel-6",
    dureeSecondes: 269,
    statut: "termine",
    smsEnvoye: true,
    rendezVousId: "rdv-6",
    urlEnregistrement: "https://storage.exemple.com/enregistrements/appel-6.mp3",
    entrepriseNom: "Cabinet Dentaire Sourire",
    etablissementNom: "Genève",
    telephoneAppelantMasque: "+41 79 •• •• 77",
    resultat: "Prise de RDV",
    coutChf: 0.71,
    heureDecroche: "09:14:00",
    heureRaccroche: "09:18:29",
    outilsUtilises: [
      { label: "Vérification agenda — créneau jeudi 9h disponible", horodatage: "09:14:52" },
      { label: "Rendez-vous créé dans Google Calendar", horodatage: "09:17:40" },
    ],
    erreurs: null,
    resumeIA: "Détartrage demandé, créneau du jeudi 9h accepté après vérification de la disponibilité du praticien.",
    transcription: [
      { locuteur: "ia", texte: "Cabinet Dentaire Sourire bonjour, comment puis-je vous aider ?" },
      { locuteur: "client", texte: "Bonjour, je voudrais prendre rendez-vous pour un détartrage." },
      { locuteur: "ia", texte: "J'ai un créneau jeudi à 9h, cela vous convient ?" },
      { locuteur: "client", texte: "Oui, ça me va très bien." },
    ],
  },
};

// Ordre d'affichage de la liste : du plus récent au plus ancien, comme la
// maquette (docs/sprint5-conception.md).
const ordreListe = ["appel-1", "appel-2", "appel-3", "appel-4", "appel-5", "appel-6"];

export function getAppelsListe(): AppelListeItem[] {
  return ordreListe.map((id) => {
    const detail = appelsDetail[id];
    return {
      id: detail.id,
      heure: detail.heureDecroche.slice(0, 5),
      entrepriseNom: detail.entrepriseNom,
      etablissementNom: detail.etablissementNom,
      telephoneAppelantMasque: detail.telephoneAppelantMasque,
      dureeSecondes: detail.dureeSecondes,
      resultat: detail.resultat,
      statut: detail.statut,
      smsEnvoye: detail.smsEnvoye,
      rendezVousId: detail.rendezVousId,
      coutChf: detail.coutChf,
    };
  });
}

export function getAppelDetail(id: string): AppelDetail | null {
  return appelsDetail[id] ?? null;
}
