import "server-only";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import type { RoleUtilisateur } from "@/generated/prisma/enums";
import { roleUtilisateurFromClerkOrgRole, clerkOrgRoleFromRoleUtilisateur } from "./roles";
import type { Utilisateur, MembreOrganisation } from "./types";

// Couche d'abstraction unique pour l'authentification — voir
// docs/architecture.md, section "Authentification (Clerk, isolé derrière une
// couche remplaçable)". Seul ce dossier (src/auth/) importe le SDK Clerk
// (`@clerk/nextjs/server`) ; le reste du produit n'appelle que les fonctions
// exportées ci-dessous. Une future migration hors de Clerk se limite à
// réécrire ce fichier, jamais ses appelants.
//
// Important : `auth()`/`currentUser()` exigent que `clerkMiddleware()` soit
// configuré (voir `proxy.ts`, l'équivalent Next.js 16 de `middleware.ts`) —
// ce fichier n'existe pas encore dans ce projet (voir le rapport de tâche).
// Tant que le compte Clerk n'existe pas, ces fonctions ne sont appelées nulle
// part ailleurs dans le produit (voir isClerkConfigured, src/auth/config.ts).

export type { Utilisateur, MembreOrganisation } from "./types";
export { isClerkConfigured } from "./config";

/**
 * Utilisateur actuellement connecté, déduit de la session Clerk active.
 * Retourne `null` si personne n'est connecté.
 */
export async function getCurrentUser(): Promise<Utilisateur | null> {
  const user = await currentUser();
  if (!user) return null;

  const { orgId, orgRole } = await auth();
  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";
  const nom = [user.firstName, user.lastName].filter(Boolean).join(" ") || email;

  // Un utilisateur avec une organisation active a un rôle d'organisation
  // (proprietaire/employe). Un admin plateforme n'appartient à aucune
  // organisation : son rôle vient alors de ses métadonnées publiques Clerk
  // (à renseigner manuellement depuis le dashboard Clerk pour ces comptes).
  const role = orgRole
    ? roleUtilisateurFromClerkOrgRole(orgRole)
    : ((user.publicMetadata?.role as RoleUtilisateur | undefined) ?? null);

  return {
    clerkUserId: user.id,
    email,
    nom,
    role,
    entrepriseId: orgId ?? null,
  };
}

/** Rôle interne (`admin_plateforme`/`proprietaire`/`employe`) de l'utilisateur connecté. */
export async function getUserRole(): Promise<RoleUtilisateur | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

/**
 * Invite un utilisateur à rejoindre l'organisation Clerk d'une entreprise.
 * Modèle d'invitation directe retenu pour le MVP (voir
 * docs/sprint5-conception.md, section 2) : le Super Admin ou le propriétaire
 * invite, pas de demande d'accès autonome à valider.
 *
 * @param entrepriseId l'organizationId Clerk de l'entreprise (Entreprise.clerkOrganizationId)
 */
export async function inviteUser(
  email: string,
  entrepriseId: string,
  role: RoleUtilisateur
): Promise<void> {
  const client = await clerkClient();
  await client.organizations.createOrganizationInvitation({
    organizationId: entrepriseId,
    emailAddress: email,
    role: clerkOrgRoleFromRoleUtilisateur(role),
  });
}

/**
 * Membres actifs et invitations en attente de l'organisation Clerk d'une
 * entreprise (utilisé par l'onglet "Utilisateurs" du détail entreprise).
 *
 * @param entrepriseId l'organizationId Clerk de l'entreprise (Entreprise.clerkOrganizationId)
 */
export async function listOrganizationMembers(entrepriseId: string): Promise<MembreOrganisation[]> {
  const client = await clerkClient();

  const [memberships, invitations] = await Promise.all([
    client.organizations.getOrganizationMembershipList({ organizationId: entrepriseId }),
    client.organizations.getOrganizationInvitationList({
      organizationId: entrepriseId,
      status: ["pending"],
    }),
  ]);

  const membres: MembreOrganisation[] = memberships.data.map((membership) => ({
    clerkUserId: membership.publicUserData?.userId ?? "",
    email: membership.publicUserData?.identifier ?? "",
    nom:
      [membership.publicUserData?.firstName, membership.publicUserData?.lastName]
        .filter(Boolean)
        .join(" ") || (membership.publicUserData?.identifier ?? ""),
    role: roleUtilisateurFromClerkOrgRole(membership.role),
    statut: "actif",
  }));

  const invitesEnAttente: MembreOrganisation[] = invitations.data.map((invitation) => ({
    clerkUserId: "",
    email: invitation.emailAddress,
    nom: invitation.emailAddress,
    role: roleUtilisateurFromClerkOrgRole(invitation.role),
    statut: "invitation_en_attente",
  }));

  return [...membres, ...invitesEnAttente];
}
