import "server-only";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import type { RoleUtilisateur } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
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
  // (proprietaire/administrateur/responsable_etablissement/membre). Un admin
  // plateforme n'appartient à aucune organisation : son rôle vient alors de
  // ses métadonnées publiques Clerk (à renseigner manuellement depuis le
  // dashboard Clerk pour ces comptes).
  const role = orgRole
    ? roleUtilisateurFromClerkOrgRole(orgRole)
    : ((user.publicMetadata?.role as RoleUtilisateur | undefined) ?? null);

  // `entrepriseId` est notre `Entreprise.id` interne (uuid Postgres), jamais
  // l'organizationId Clerk — voir src/auth/types.ts. Résolu ici via
  // `clerkOrganizationId` (unique) pour que le reste du produit n'ait jamais
  // besoin de connaître l'id Clerk d'une organisation.
  const entreprise = orgId
    ? await prisma.entreprise.findUnique({
        where: { clerkOrganizationId: orgId },
        select: { id: true },
      })
    : null;

  return {
    clerkUserId: user.id,
    email,
    nom,
    role,
    entrepriseId: entreprise?.id ?? null,
  };
}

/** Rôle interne (`admin_plateforme`/`proprietaire`/`administrateur`/`responsable_etablissement`/`membre`) de l'utilisateur connecté. */
export async function getUserRole(): Promise<RoleUtilisateur | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

/**
 * Crée l'Organisation Clerk d'une nouvelle entreprise cliente (voir
 * docs/sprint6-conception.md, section 0.1 — une Entreprise = une Organisation
 * Clerk). `createdBy` est volontairement omis : ce paramètre est optionnel
 * dans l'API Clerk, et le renseigner avec l'admin plateforme qui crée
 * l'entreprise le rendrait automatiquement membre de l'organisation cliente —
 * un admin plateforme n'appartient à aucune organisation cliente.
 *
 * @returns l'id de l'organisation Clerk créée (à stocker dans `Entreprise.clerkOrganizationId`)
 */
export async function createOrganizationForEntreprise(nom: string): Promise<string> {
  const client = await clerkClient();
  const organization = await client.organizations.createOrganization({ name: nom });
  return organization.id;
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
    invitationId: null,
  }));

  const invitesEnAttente: MembreOrganisation[] = invitations.data.map((invitation) => ({
    clerkUserId: "",
    email: invitation.emailAddress,
    nom: invitation.emailAddress,
    role: roleUtilisateurFromClerkOrgRole(invitation.role),
    statut: "invitation_en_attente",
    invitationId: invitation.id,
  }));

  return [...membres, ...invitesEnAttente];
}

/**
 * Liste les administrateurs plateforme — utilisateurs Clerk sans
 * organisation, identifiés par `publicMetadata.role: "admin_plateforme"`
 * (renseigné manuellement depuis le dashboard Clerk, voir getCurrentUser
 * ci-dessus). Utilisé par l'écran Utilisateurs du Dashboard Administrateur.
 * Requête sur l'ensemble des utilisateurs Clerk (pas de notion
 * d'organisation ici) — acceptable au volume actuel de la plateforme.
 */
export async function listAdminsPlateforme(): Promise<{ clerkUserId: string; nom: string; email: string }[]> {
  const client = await clerkClient();
  const { data: utilisateurs } = await client.users.getUserList({ limit: 500 });

  return utilisateurs
    .filter((utilisateur) => utilisateur.publicMetadata?.role === "admin_plateforme")
    .map((utilisateur) => ({
      clerkUserId: utilisateur.id,
      nom:
        [utilisateur.firstName, utilisateur.lastName].filter(Boolean).join(" ") ||
        (utilisateur.primaryEmailAddress?.emailAddress ?? ""),
      email: utilisateur.primaryEmailAddress?.emailAddress ?? "",
    }));
}

/**
 * Change le rôle d'organisation Clerk d'un membre déjà actif (écran Équipe et
 * accès, docs/roadmap.md tâche #64). N'écrit jamais directement dans
 * `utilisateurs` — c'est le webhook `organizationMembership.updated` (voir
 * src/auth/webhook.ts) qui synchronise la table, comme pour tout le reste
 * (voir docs/architecture.md, section Authentification).
 *
 * @param organizationId l'organizationId Clerk de l'entreprise
 */
export async function changerRoleMembre(
  organizationId: string,
  clerkUserId: string,
  role: RoleUtilisateur
): Promise<void> {
  const client = await clerkClient();
  await client.organizations.updateOrganizationMembership({
    organizationId,
    userId: clerkUserId,
    role: clerkOrgRoleFromRoleUtilisateur(role),
  });
}

/**
 * Retire un membre actif de l'organisation Clerk d'une entreprise. Déclenche
 * l'événement `organizationMembership.deleted`, qui supprime la ligne
 * correspondante dans `utilisateurs` (voir src/auth/webhook.ts) — jamais fait
 * directement ici.
 *
 * @param organizationId l'organizationId Clerk de l'entreprise
 */
export async function retirerMembre(organizationId: string, clerkUserId: string): Promise<void> {
  const client = await clerkClient();
  await client.organizations.deleteOrganizationMembership({
    organizationId,
    userId: clerkUserId,
  });
}

/**
 * Révoque une invitation encore en attente (pas un membre actif — voir
 * `retirerMembre` pour ce cas). `requestingUserId` est optionnel côté SDK
 * Clerk ; on transmet l'utilisateur qui révoque pour la traçabilité.
 *
 * @param organizationId l'organizationId Clerk de l'entreprise
 */
export async function revoquerInvitation(
  organizationId: string,
  invitationId: string,
  requestingUserId?: string
): Promise<void> {
  const client = await clerkClient();
  await client.organizations.revokeOrganizationInvitation({
    organizationId,
    invitationId,
    requestingUserId,
  });
}
