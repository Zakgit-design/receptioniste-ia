import type { RoleUtilisateur } from "@/generated/prisma/enums";

// Formes de données exposées par la couche d'abstraction (src/auth/) au
// reste du produit. Volontairement calquées sur le modèle Prisma
// `Utilisateur` (voir docs/architecture.md), jamais sur les objets bruts du
// SDK Clerk : le reste de l'app ne doit jamais avoir besoin de connaître la
// forme des types Clerk.

/** Utilisateur courant, déduit de la session Clerk active. */
export type Utilisateur = {
  clerkUserId: string;
  email: string;
  nom: string;
  /** `null` si le rôle n'a pas pu être déterminé (ex. aucune organisation active). */
  role: RoleUtilisateur | null;
  /** Notre `Entreprise.id` (pas l'organizationId Clerk) — `null` pour un admin plateforme. */
  entrepriseId: string | null;
};

/** Une ligne de `listOrganizationMembers` : membre actif ou invitation en attente. */
export type MembreOrganisation = {
  /** Vide pour une invitation encore en attente (personne n'a encore de compte). */
  clerkUserId: string;
  email: string;
  nom: string;
  role: RoleUtilisateur;
  statut: "actif" | "invitation_en_attente";
};
