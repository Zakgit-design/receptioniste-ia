import "server-only";
import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/prisma";
import type { RoleUtilisateur } from "@/generated/prisma/enums";
import { roleUtilisateurFromClerkOrgRole } from "./roles";

// Synchronisation de la table `utilisateurs` à partir des webhooks Clerk —
// voir docs/architecture.md, section "Authentification". C'est la SEULE
// façon dont `utilisateurs` est écrite : jamais depuis le reste du produit.
//
// Important (voir rapport de tâche) : cette logique n'a pas pu être testée
// en conditions réelles — il n'existe ni compte Clerk ni base PostgreSQL
// dans cet environnement. Les événements et champs utilisés ci-dessous sont
// documentés par le SDK (@clerk/backend), mais le comportement réel (ordre
// d'arrivée des événements, contenu exact des payloads) reste à valider dès
// que Clerk + la base seront branchés.
//
// Les fonctions ci-dessous prennent des formes de données minimales (pas les
// types exacts du SDK) : seuls les champs utilisés sont déclarés, ce qui
// évite de dépendre de types internes de `@clerk/backend` non garantis
// stables d'une version à l'autre.

type UtilisateurClerkJSON = {
  id: string;
  email_addresses: { id: string; email_address: string }[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  public_metadata?: Record<string, unknown>;
};

type ContexteEntreprise = {
  clerkUserId: string;
  email: string;
  nom: string;
  clerkOrganizationId: string;
  clerkRole: string;
};

function emailPrincipal(user: UtilisateurClerkJSON): string | null {
  const correspondance = user.email_addresses.find(
    (adresse) => adresse.id === user.primary_email_address_id
  );
  return correspondance?.email_address ?? user.email_addresses[0]?.email_address ?? null;
}

function nomComplet(prenom: string | null, nomFamille: string | null, repli: string): string {
  return [prenom, nomFamille].filter(Boolean).join(" ") || repli;
}

/** Notre `Entreprise.id` correspondant à une organisation Clerk, ou `null` si inconnue. */
async function entrepriseIdDepuisOrganisationClerk(
  clerkOrganizationId: string
): Promise<string | null> {
  const entreprise = await prisma.entreprise.findUnique({
    where: { clerkOrganizationId },
    select: { id: true },
  });
  return entreprise?.id ?? null;
}

/**
 * `user.created` / `user.updated` : met à jour l'identité (email, nom) d'un
 * utilisateur déjà connu. Ne crée une nouvelle ligne que pour un admin
 * plateforme (repéré via `public_metadata.role`, à renseigner manuellement
 * depuis le dashboard Clerk pour ces comptes) : un utilisateur normal
 * n'appartient à aucune entreprise avant d'avoir rejoint une organisation —
 * ce sont `organizationMembership.updated`/`organizationInvitation.accepted`
 * (ci-dessous) qui créent alors sa ligne, avec le rôle et l'entreprise.
 */
async function synchroniserUtilisateur(data: UtilisateurClerkJSON): Promise<void> {
  const email = emailPrincipal(data);
  if (!email) return;

  const nom = nomComplet(data.first_name, data.last_name, email);
  const estAdminPlateforme = data.public_metadata?.role === "admin_plateforme";

  const existant = await prisma.utilisateur.findUnique({ where: { clerkUserId: data.id } });

  if (existant) {
    await prisma.utilisateur.update({
      where: { clerkUserId: data.id },
      data: {
        email,
        nom,
        ...(estAdminPlateforme
          ? { role: "admin_plateforme" as RoleUtilisateur, entrepriseId: null }
          : {}),
      },
    });
    return;
  }

  if (estAdminPlateforme) {
    await prisma.utilisateur.create({
      data: { clerkUserId: data.id, email, nom, role: "admin_plateforme", entrepriseId: null },
    });
  }
}

/**
 * `organizationInvitation.accepted` / `organizationMembership.updated`
 * (changement de rôle) : crée ou met à jour la ligne d'un utilisateur avec
 * son rôle et son entreprise, une fois qu'on connaît son organisation Clerk.
 */
async function synchroniserAppartenanceEntreprise(params: ContexteEntreprise): Promise<void> {
  if (!params.clerkUserId || !params.email) return;

  const entrepriseId = await entrepriseIdDepuisOrganisationClerk(params.clerkOrganizationId);
  if (!entrepriseId) return; // organisation Clerk pas (encore) reliée à une entreprise chez nous

  const role = roleUtilisateurFromClerkOrgRole(params.clerkRole);

  await prisma.utilisateur.upsert({
    where: { clerkUserId: params.clerkUserId },
    update: { email: params.email, nom: params.nom, role, entrepriseId },
    create: { clerkUserId: params.clerkUserId, email: params.email, nom: params.nom, role, entrepriseId },
  });
}

function depuisInvitationAcceptee(data: {
  user_id: string;
  email_address: string;
  organization_id: string;
  role: string;
}): ContexteEntreprise {
  return {
    clerkUserId: data.user_id,
    email: data.email_address,
    nom: data.email_address, // le nom réel arrive via un événement user.updated séparé
    clerkOrganizationId: data.organization_id,
    clerkRole: data.role,
  };
}

/**
 * `organizationMembership.deleted` : un membre a été retiré d'une
 * organisation Clerk (voir `retirerMembre`, src/auth/index.ts) — supprime sa
 * ligne dans `utilisateurs`. Les assignations d'établissement
 * (`assignations_etablissement`, contrainte `ON DELETE RESTRICT`, voir
 * migration 20260716183055_sprint6_roles_client) doivent être supprimées
 * d'abord, dans la même transaction, sans quoi la suppression échouerait.
 */
async function supprimerAppartenanceEntreprise(clerkUserId: string): Promise<void> {
  if (!clerkUserId) return;

  const utilisateur = await prisma.utilisateur.findUnique({ where: { clerkUserId } });
  if (!utilisateur) return; // déjà absent (ex. webhook rejoué) — rien à faire

  await prisma.$transaction([
    prisma.assignationEtablissement.deleteMany({ where: { utilisateurId: utilisateur.id } }),
    prisma.utilisateur.delete({ where: { clerkUserId } }),
  ]);
}

function depuisMembership(data: {
  role: string;
  organization: { id: string };
  public_user_data?: {
    user_id: string;
    identifier: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}): ContexteEntreprise {
  const utilisateur = data.public_user_data;
  return {
    clerkUserId: utilisateur?.user_id ?? "",
    email: utilisateur?.identifier ?? "",
    nom: nomComplet(
      utilisateur?.first_name ?? null,
      utilisateur?.last_name ?? null,
      utilisateur?.identifier ?? ""
    ),
    clerkOrganizationId: data.organization.id,
    clerkRole: data.role,
  };
}

/**
 * Point d'entrée appelé par la route `app/api/webhooks/clerk/route.ts`.
 * Vérifie la signature Svix puis synchronise `utilisateurs` selon le type
 * d'événement — voir la note en tête de fichier sur ce qui n'a pas pu être
 * testé.
 */
export async function handleClerkWebhookRequest(request: NextRequest): Promise<Response> {
  let event;
  try {
    event = await verifyWebhook(request);
  } catch (error) {
    console.error("Webhook Clerk : signature invalide ou secret manquant", error);
    return new Response("Signature de webhook invalide", { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated":
      await synchroniserUtilisateur(event.data);
      break;
    case "organizationInvitation.accepted":
      await synchroniserAppartenanceEntreprise(depuisInvitationAcceptee(event.data));
      break;
    case "organizationMembership.updated":
      await synchroniserAppartenanceEntreprise(depuisMembership(event.data));
      break;
    case "organizationMembership.deleted":
      await supprimerAppartenanceEntreprise(depuisMembership(event.data).clerkUserId);
      break;
    default:
      // Les autres types d'événements ne concernent pas la synchronisation
      // de `utilisateurs` (voir docs/architecture.md) — ignorés
      // volontairement plutôt que traités à moitié.
      break;
  }

  return new Response("OK", { status: 200 });
}
