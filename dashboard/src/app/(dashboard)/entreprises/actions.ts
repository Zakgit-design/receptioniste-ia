"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatutEntreprise } from "@/generated/prisma/enums";

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

  await prisma.entreprise.create({
    data: {
      nom,
      secteur,
      statut,
      emailContact: emailContact || null,
      telephoneContact: telephoneContact || null,
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
