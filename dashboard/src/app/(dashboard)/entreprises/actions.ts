"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatutEntreprise, type RoleUtilisateur } from "@/generated/prisma/enums";
import { createOrganizationForEntreprise, isClerkConfigured, getCurrentUser, inviteUser } from "@/auth";

// Server action pour le formulaire "+ Nouvelle entreprise" (voir
// docs/roadmap.md, Sprint 5, tâche 59). Champs minimaux du modèle
// `Entreprise` (prisma/schema.prisma) : pas d'établissements/agents/services
// ici, hors périmètre de cette tâche.

export interface CreateEntrepriseState {
  error: string | null;
  success: boolean;
}

const statutsValides = Object.values(StatutEntreprise);

export async function createEntreprise(
  _previousState: CreateEntrepriseState,
  formData: FormData
): Promise<CreateEntrepriseState> {
  const nom = String(formData.get("nom") ?? "").trim();
  const secteur = String(formData.get("secteur") ?? "").trim();
  const statutBrut = String(formData.get("statut") ?? StatutEntreprise.essai);
  const emailContact = String(formData.get("emailContact") ?? "").trim();
  const telephoneContact = String(formData.get("telephoneContact") ?? "").trim();

  if (!nom || !secteur) {
    return { error: "Le nom et le secteur sont obligatoires.", success: false };
  }

  const statut = statutsValides.includes(statutBrut as StatutEntreprise)
    ? (statutBrut as StatutEntreprise)
    : StatutEntreprise.essai;

  // Une Entreprise = une Organisation Clerk (voir docs/architecture.md,
  // section Authentification, et docs/sprint6-conception.md, section 0.1) —
  // créée ici pour que le Dashboard Client puisse ensuite y inviter des
  // utilisateurs. Ne bloque jamais la création si Clerk n'est pas configuré
  // (cas dev sans clés).
  const clerkOrganizationId = isClerkConfigured()
    ? await createOrganizationForEntreprise(nom)
    : null;

  await prisma.entreprise.create({
    data: {
      nom,
      secteur,
      statut,
      emailContact: emailContact || null,
      telephoneContact: telephoneContact || null,
      clerkOrganizationId,
    },
  });

  revalidatePath("/entreprises");
  return { error: null, success: true };
}

export interface DeleteEntrepriseState {
  error: string | null;
}

// Les entreprises de démonstration (voir ./data.ts, ids non-UUID du type
// "entreprise-barber-concept") ne sont pas en base : rien à supprimer, on le
// signale plutôt que de laisser Prisma échouer silencieusement.
//
// Suppression en cascade manuelle (pas de ON DELETE CASCADE dans le schéma,
// voir prisma/migrations/0001_init : tout est RESTRICT par défaut) — l'ordre
// respecte les contraintes de clé étrangère (enfants avant parents). Les
// tables en ON DELETE SET NULL (utilisateurs, notifications,
// evenements_sante, actions_requises) n'ont pas besoin d'être vidées ici.
export async function supprimerEntreprise(
  id: string
): Promise<DeleteEntrepriseState> {
  const entreprise = await prisma.entreprise.findUnique({ where: { id } });
  if (!entreprise) {
    return {
      error:
        "Cette entreprise n'existe pas en base (entreprise de démonstration, non supprimable).",
    };
  }

  await prisma.$transaction([
    prisma.conversation.deleteMany({ where: { appel: { agentIA: { entrepriseId: id } } } }),
    prisma.appel.deleteMany({ where: { agentIA: { entrepriseId: id } } }),
    prisma.rendezVous.deleteMany({ where: { etablissement: { entrepriseId: id } } }),
    prisma.disponibilite.deleteMany({ where: { etablissement: { entrepriseId: id } } }),
    prisma.agentIA.deleteMany({ where: { entrepriseId: id } }),
    prisma.service.deleteMany({ where: { entrepriseId: id } }),
    prisma.clientFinal.deleteMany({ where: { entrepriseId: id } }),
    prisma.etablissement.deleteMany({ where: { entrepriseId: id } }),
    prisma.facture.deleteMany({ where: { abonnement: { entrepriseId: id } } }),
    prisma.abonnement.deleteMany({ where: { entrepriseId: id } }),
    prisma.integration.deleteMany({ where: { entrepriseId: id } }),
    prisma.entreprise.delete({ where: { id } }),
  ]);

  revalidatePath("/entreprises");
  redirect("/entreprises");
}

export interface InviterMembreEntrepriseState {
  error: string | null;
}

const ROLES_ORGANISATION: RoleUtilisateur[] = [
  "proprietaire",
  "administrateur",
  "responsable_etablissement",
  "membre",
];

/**
 * Invite un membre dans l'organisation Clerk d'une entreprise précise, depuis
 * l'onglet "Utilisateurs" de sa fiche détail (Dashboard Administrateur) — ex.
 * donner à Ms Savané l'accès à son propre Dashboard Client une fois créée.
 * Défense en profondeur : revérifie que l'appelant est admin_plateforme,
 * jamais supposé depuis la seule navigation (même principe que
 * (dashboard)/utilisateurs/actions.ts).
 */
export async function inviterMembreEntreprise(
  entrepriseId: string,
  _prevState: InviterMembreEntrepriseState,
  formData: FormData
): Promise<InviterMembreEntrepriseState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin_plateforme") {
    return { error: "Action réservée aux administrateurs plateforme." };
  }

  const email = formData.get("email");
  const role = formData.get("role");
  if (typeof email !== "string" || !email) {
    return { error: "Email requis." };
  }
  if (typeof role !== "string" || !ROLES_ORGANISATION.includes(role as RoleUtilisateur)) {
    return { error: "Rôle invalide." };
  }

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: entrepriseId },
    select: { clerkOrganizationId: true },
  });
  if (!entreprise?.clerkOrganizationId) {
    return { error: "Cette entreprise n'est pas encore reliée à une organisation Clerk." };
  }

  try {
    await inviteUser(email, entreprise.clerkOrganizationId, role as RoleUtilisateur);
  } catch {
    return { error: "Échec de l'envoi de l'invitation — vérifie l'adresse email." };
  }

  revalidatePath(`/entreprises/${entrepriseId}`);
  return { error: null };
}
