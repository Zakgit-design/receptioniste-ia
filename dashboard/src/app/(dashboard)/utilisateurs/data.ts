// Écran Utilisateurs — branché sur les vraies données Clerk (2026-07-22) :
// admins plateforme d'un côté, membres par entreprise (organisation Clerk)
// de l'autre. Modèle d'invitation directe uniquement (voir
// docs/sprint5-conception.md, section 2).
//
// Contrairement à une requête sur la seule table `utilisateurs` (Postgres,
// synchronisée par webhook — voir src/auth/webhook.ts), cet écran interroge
// directement l'API Clerk (comme l'écran "Équipe et accès" du Dashboard
// Client, voir (client)/app/equipe/data.ts) : les invitations en attente
// n'existent que côté Clerk tant qu'elles ne sont pas acceptées, et la table
// `utilisateurs` ne serait de toute façon peuplée qu'une fois le webhook de
// synchronisation configuré en production (voir docs/roadmap.md, tâche #78,
// toujours ouverte).

import { prisma } from "@/lib/prisma";
import { listOrganizationMembers, listAdminsPlateforme } from "@/auth";
import type { RoleUtilisateur } from "@/generated/prisma/enums";

export interface UtilisateurAffiche {
  nom: string;
  email: string;
  role: RoleUtilisateur;
  statut: "actif" | "invitation_en_attente";
}

export interface UtilisateursEntreprise {
  entrepriseId: string;
  entrepriseNom: string;
  membres: UtilisateurAffiche[];
}

export async function getAdminsPlateforme(): Promise<UtilisateurAffiche[]> {
  const admins = await listAdminsPlateforme();
  return admins.map((admin) => ({
    nom: admin.nom,
    email: admin.email,
    role: "admin_plateforme" as const,
    statut: "actif" as const,
  }));
}

/** Entreprises reliées à Clerk — pour le sélecteur du bouton "+ Inviter un utilisateur" (voir InviterUtilisateurDialog). */
export async function getEntreprisesInvitables(): Promise<{ clerkOrganizationId: string; nom: string }[]> {
  const entreprises = await prisma.entreprise.findMany({
    where: { clerkOrganizationId: { not: null } },
    select: { nom: true, clerkOrganizationId: true },
    orderBy: { nom: "asc" },
  });
  return entreprises.map((entreprise) => ({
    clerkOrganizationId: entreprise.clerkOrganizationId as string,
    nom: entreprise.nom,
  }));
}

export async function getUtilisateursParEntreprise(): Promise<UtilisateursEntreprise[]> {
  const entreprises = await prisma.entreprise.findMany({
    where: { clerkOrganizationId: { not: null } },
    select: { id: true, nom: true, clerkOrganizationId: true },
    orderBy: { nom: "asc" },
  });

  return Promise.all(
    entreprises.map(async (entreprise) => {
      const membres = entreprise.clerkOrganizationId
        ? await listOrganizationMembers(entreprise.clerkOrganizationId)
        : [];
      return {
        entrepriseId: entreprise.id,
        entrepriseNom: entreprise.nom,
        membres: membres.map((membre) => ({
          nom: membre.nom,
          email: membre.email,
          role: membre.role,
          statut: membre.statut,
        })),
      };
    })
  );
}
