"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { StatutEntreprise } from "@/generated/prisma/enums";

// Server Actions du parcours d'onboarding (Sprint A, voir docs/sprint-log.md
// 2026-07-22). Chaque action est un ajout/une mise à jour explicite déclenché
// par un clic — rien ne s'exécute automatiquement au chargement de la page
// (voir page.tsx pour le calcul de l'étape courante à partir des données
// réelles). C'est ce qui garantit qu'un onboarding repris ne duplique jamais
// rien : revisiter la page ne relance aucune de ces actions par elle-même.

export interface OnboardingActionState {
  error: string | null;
}

const OK: OnboardingActionState = { error: null };

const JOURS_SEMAINE = [1, 2, 3, 4, 5, 6, 0]; // lundi -> dimanche (0 = dimanche, convention JS Date.getDay())

function parseHeure(valeur: FormDataEntryValue | null): Date | null {
  const str = typeof valeur === "string" ? valeur.trim() : "";
  if (!str) return null;
  // Colonne @db.Time() : seule l'heure est conservée, la date sert de porteur.
  return new Date(`1970-01-01T${str}:00Z`);
}

/**
 * Crée un établissement, avec son gabarit hebdomadaire (Disponibilite) et
 * ses jours de fermeture exceptionnels. Toujours un nouvel établissement (pas
 * de mise à jour ici) — en ajouter un deuxième est une vraie intention,
 * jamais un doublon accidentel puisque rien ne se soumet sans clic explicite.
 *
 * Utilisable pendant l'onboarding (`brouillon`) **et** après (entreprise déjà
 * `essai`/`actif`) — le fondateur doit pouvoir revenir modifier
 * établissements/horaires à tout moment, pas seulement pendant la
 * configuration initiale (voir docs/sprint-log.md, 2026-07-22).
 */
export async function creerEtablissement(
  entrepriseId: string,
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const nom = String(formData.get("nom") ?? "").trim();
  const adresse = String(formData.get("adresse") ?? "").trim();
  if (!nom || !adresse) {
    return { error: "Le nom et l'adresse sont obligatoires." };
  }

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: entrepriseId },
    select: { fuseauHoraire: true },
  });
  if (!entreprise) {
    return { error: "Entreprise introuvable." };
  }

  const joursFermetureBrut = String(formData.get("joursFermeture") ?? "").trim();
  const joursFermeture = joursFermetureBrut
    ? joursFermetureBrut.split(",").map((date) => date.trim()).filter(Boolean)
    : [];

  const disponibilites = JOURS_SEMAINE.map((jourSemaine) => {
    const heureDebut = parseHeure(formData.get(`heureDebut_${jourSemaine}`));
    const heureFin = parseHeure(formData.get(`heureFin_${jourSemaine}`));
    return heureDebut && heureFin ? { jourSemaine, heureDebut, heureFin } : null;
  }).filter((d): d is { jourSemaine: number; heureDebut: Date; heureFin: Date } => d !== null);

  await prisma.etablissement.create({
    data: {
      entrepriseId,
      nom,
      adresse,
      fuseauHoraire: entreprise.fuseauHoraire,
      joursFermeture,
      disponibilites: { create: disponibilites },
    },
  });

  revalidatePath(`/entreprises/${entrepriseId}/onboarding`);
  return OK;
}

/**
 * Modifie un établissement existant (nom, adresse, horaires, fermetures
 * exceptionnelles) — le fondateur doit pouvoir revenir ajuster ces réglages
 * à tout moment (voir docs/sprint-log.md, 2026-07-22), pas seulement à la
 * création. Remplace entièrement le gabarit `Disponibilite` existant plutôt
 * que de tenter un rapprochement jour par jour — plus simple et sans risque
 * d'incohérence, le volume (7 lignes max par établissement) ne justifie pas
 * plus complexe.
 */
export async function mettreAJourEtablissement(
  etablissementId: string,
  entrepriseId: string,
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const nom = String(formData.get("nom") ?? "").trim();
  const adresse = String(formData.get("adresse") ?? "").trim();
  if (!nom || !adresse) {
    return { error: "Le nom et l'adresse sont obligatoires." };
  }

  const joursFermetureBrut = String(formData.get("joursFermeture") ?? "").trim();
  const joursFermeture = joursFermetureBrut
    ? joursFermetureBrut.split(",").map((date) => date.trim()).filter(Boolean)
    : [];

  const disponibilites = JOURS_SEMAINE.map((jourSemaine) => {
    const heureDebut = parseHeure(formData.get(`heureDebut_${jourSemaine}`));
    const heureFin = parseHeure(formData.get(`heureFin_${jourSemaine}`));
    return heureDebut && heureFin ? { jourSemaine, heureDebut, heureFin } : null;
  }).filter((d): d is { jourSemaine: number; heureDebut: Date; heureFin: Date } => d !== null);

  await prisma.$transaction([
    prisma.disponibilite.deleteMany({ where: { etablissementId } }),
    prisma.etablissement.update({
      where: { id: etablissementId },
      data: {
        nom,
        adresse,
        joursFermeture,
        disponibilites: { create: disponibilites },
      },
    }),
  ]);

  revalidatePath(`/entreprises/${entrepriseId}/onboarding`);
  return OK;
}

/**
 * Crée un service pour une entreprise en cours d'onboarding — reste
 * entreprise-wide pour cette V1 (pas de relation service<->établissement,
 * limite déjà documentée depuis la tâche #73, voir docs/architecture.md).
 */
export async function creerService(
  entrepriseId: string,
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const nom = String(formData.get("nom") ?? "").trim();
  const dureeMinutesBrut = String(formData.get("dureeMinutes") ?? "").trim();
  const dureeMinutes = Number(dureeMinutesBrut);
  if (!nom || !dureeMinutesBrut || !Number.isInteger(dureeMinutes) || dureeMinutes <= 0) {
    return { error: "Le nom et une durée valide (en minutes) sont obligatoires." };
  }

  const prixBrut = String(formData.get("prix") ?? "").trim();
  const prix = prixBrut ? Number(prixBrut) : null;
  if (prixBrut && (Number.isNaN(prix) || (prix as number) < 0)) {
    return { error: "Le prix doit être un nombre positif, ou laissé vide." };
  }

  const description = String(formData.get("description") ?? "").trim();

  await prisma.service.create({
    data: {
      entrepriseId,
      nom,
      dureeMinutes,
      prix,
      description: description || null,
      actif: true,
    },
  });

  revalidatePath(`/entreprises/${entrepriseId}/onboarding`);
  return OK;
}

/** Active/désactive un service sans le supprimer (voir Étape 3, docs/sprint-log.md). */
export async function basculerServiceActif(
  serviceId: string,
  entrepriseId: string,
  actif: boolean
): Promise<OnboardingActionState> {
  await prisma.service.update({ where: { id: serviceId }, data: { actif } });
  revalidatePath(`/entreprises/${entrepriseId}/onboarding`);
  return OK;
}

/**
 * Termine l'onboarding : fait passer l'entreprise de `brouillon` à `essai`.
 * Vapi/Twilio/Calendar restent "non configurés" — voir Sprints B à E, hors
 * périmètre du Sprint A.
 */
export async function finaliserOnboarding(entrepriseId: string): Promise<OnboardingActionState> {
  const entreprise = await prisma.entreprise.findUnique({
    where: { id: entrepriseId },
    select: { statut: true },
  });
  if (!entreprise || entreprise.statut !== StatutEntreprise.brouillon) {
    return { error: "Entreprise introuvable ou déjà activée." };
  }

  await prisma.entreprise.update({
    where: { id: entrepriseId },
    data: { statut: StatutEntreprise.essai },
  });

  revalidatePath("/entreprises");
  revalidatePath(`/entreprises/${entrepriseId}`);
  return OK;
}
