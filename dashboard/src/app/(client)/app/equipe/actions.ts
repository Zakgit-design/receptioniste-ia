"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { RoleUtilisateur } from "@/generated/prisma/enums";
import {
  getCurrentUser,
  inviteUser,
  listOrganizationMembers,
  changerRoleMembre,
  retirerMembre,
  revoquerInvitation,
} from "@/auth";
import { peutGererRole, rolesAssignablesPar } from "@/lib/equipe-permissions";

// Server Actions de l'écran Équipe et accès (docs/roadmap.md, tâche #64).
//
// Défense en profondeur (docs/sprint6-conception.md, section 2) : la garde de
// la page (page.tsx, propriétaire/administrateur seulement) ne suffit pas —
// un appel direct à une de ces actions doit être bloqué ici aussi. Chaque
// action revérifie donc elle-même le rôle de l'appelant ET la règle exacte du
// tableau de permissions, jamais seulement la première.

export interface EquipeActionState {
  error: string | null;
}

const OK: EquipeActionState = { error: null };

/** Contexte commun : l'appelant est propriétaire/administrateur d'une entreprise reliée à Clerk. */
async function contexteEquipe() {
  const user = await getCurrentUser();
  if (!user || !user.entrepriseId) return null;
  if (user.role !== "proprietaire" && user.role !== "administrateur") return null;

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: user.entrepriseId },
    select: { clerkOrganizationId: true },
  });
  if (!entreprise?.clerkOrganizationId) return null;

  // `entrepriseId` extrait à part (plutôt que relu via `user.entrepriseId`
  // plus loin) pour que TypeScript retienne qu'il n'est plus `null` ici.
  return { user, entrepriseId: user.entrepriseId, organizationId: entreprise.clerkOrganizationId };
}

export async function inviterMembre(
  _previousState: EquipeActionState,
  formData: FormData
): Promise<EquipeActionState> {
  const ctx = await contexteEquipe();
  if (!ctx) return { error: "Action non autorisée." };

  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "") as RoleUtilisateur;

  if (!email) return { error: "L'email est obligatoire." };
  if (!rolesAssignablesPar(ctx.user.role).includes(role)) {
    return { error: "Vous n'avez pas le droit d'inviter ce rôle." };
  }

  await inviteUser(email, ctx.organizationId, role);
  revalidatePath("/app/equipe");
  return OK;
}

export async function changerRole(
  clerkUserId: string,
  nouveauRole: RoleUtilisateur
): Promise<EquipeActionState> {
  const ctx = await contexteEquipe();
  if (!ctx) return { error: "Action non autorisée." };
  if (clerkUserId === ctx.user.clerkUserId) {
    return { error: "Vous ne pouvez pas changer votre propre rôle." };
  }

  const cible = (await listOrganizationMembers(ctx.organizationId)).find(
    (membre) => membre.statut === "actif" && membre.clerkUserId === clerkUserId
  );
  if (!cible) return { error: "Membre introuvable." };

  const peutAttribuerNouveauRole = rolesAssignablesPar(ctx.user.role).includes(nouveauRole);
  if (!peutGererRole(ctx.user.role, cible.role) || !peutAttribuerNouveauRole) {
    return { error: "Vous n'avez pas le droit d'attribuer ce rôle." };
  }

  await changerRoleMembre(ctx.organizationId, clerkUserId, nouveauRole);
  revalidatePath("/app/equipe");
  return OK;
}

export async function retirer(clerkUserId: string): Promise<EquipeActionState> {
  const ctx = await contexteEquipe();
  if (!ctx) return { error: "Action non autorisée." };
  if (clerkUserId === ctx.user.clerkUserId) {
    return { error: "Vous ne pouvez pas vous retirer vous-même." };
  }

  const cible = (await listOrganizationMembers(ctx.organizationId)).find(
    (membre) => membre.statut === "actif" && membre.clerkUserId === clerkUserId
  );
  if (!cible) return { error: "Membre introuvable." };
  if (!peutGererRole(ctx.user.role, cible.role)) {
    return { error: "Vous n'avez pas le droit de retirer ce membre." };
  }

  await retirerMembre(ctx.organizationId, clerkUserId);
  revalidatePath("/app/equipe");
  return OK;
}

export async function annulerInvitation(invitationId: string): Promise<EquipeActionState> {
  const ctx = await contexteEquipe();
  if (!ctx) return { error: "Action non autorisée." };

  const invitation = (await listOrganizationMembers(ctx.organizationId)).find(
    (membre) => membre.statut === "invitation_en_attente" && membre.invitationId === invitationId
  );
  if (!invitation) return { error: "Invitation introuvable." };
  if (!peutGererRole(ctx.user.role, invitation.role)) {
    return { error: "Vous n'avez pas le droit d'annuler cette invitation." };
  }

  await revoquerInvitation(ctx.organizationId, invitationId, ctx.user.clerkUserId);
  revalidatePath("/app/equipe");
  return OK;
}

/**
 * Remplace l'ensemble des établissements assignés à un responsable
 * d'établissement (docs/sprint6-conception.md, section "Gestion des
 * établissements assignés"). Supprime puis recrée dans une transaction —
 * façon la plus simple d'implémenter "remplacer l'ensemble".
 */
export async function mettreAJourAssignations(
  clerkUserId: string,
  etablissementIds: string[]
): Promise<EquipeActionState> {
  const ctx = await contexteEquipe();
  if (!ctx) return { error: "Action non autorisée." };

  const utilisateur = await prisma.utilisateur.findUnique({ where: { clerkUserId } });
  if (!utilisateur || utilisateur.entrepriseId !== ctx.entrepriseId) {
    return { error: "Utilisateur introuvable." };
  }
  if (utilisateur.role !== "responsable_etablissement") {
    return { error: "Cette action ne concerne que les responsables d'établissement." };
  }

  // Défense en profondeur (docs/sprint6-conception.md, section 4) : ne
  // retient que les établissements qui appartiennent réellement à
  // l'entreprise de l'acteur, jamais les ids tels que transmis par le client.
  const etablissementsValides = await prisma.etablissement.findMany({
    where: { id: { in: etablissementIds }, entrepriseId: ctx.entrepriseId },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.assignationEtablissement.deleteMany({ where: { utilisateurId: utilisateur.id } }),
    prisma.assignationEtablissement.createMany({
      data: etablissementsValides.map((etablissement) => ({
        utilisateurId: utilisateur.id,
        etablissementId: etablissement.id,
      })),
    }),
  ]);

  revalidatePath("/app/equipe");
  return OK;
}
