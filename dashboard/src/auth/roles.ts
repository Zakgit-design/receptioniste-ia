import type { RoleUtilisateur } from "@/generated/prisma/enums";

// Mapping entre les rôles d'organisation Clerk et nos rôles internes (voir
// docs/architecture.md, modèle `utilisateurs.role`, et docs/sprint6-conception.md,
// section 0.2).
//
// Le Dashboard Client (Sprint 6) distingue 4 rôles côté organisation :
// propriétaire, administrateur, responsable d'établissement, membre. Ils
// correspondent à 4 rôles personnalisés Clerk (`org:proprietaire`,
// `org:administrateur`, `org:responsable_etablissement`, `org:membre`), à
// créer manuellement dans le dashboard Clerk (Organizations → Roles &
// Permissions) — action fondateur en attente au moment où ce fichier est
// écrit. Repli gracieux tant qu'ils n'existent pas encore : les 2 rôles
// natifs Clerk (`org:admin`/`org:member`, toujours présents par défaut sur
// toute organisation) continuent de mapper vers `proprietaire`/`membre`.
//
// `admin_plateforme` n'est jamais un rôle d'organisation Clerk — ces comptes
// n'appartiennent à aucune organisation (voir getCurrentUser dans
// src/auth/index.ts pour comment ce cas est détecté).
export function roleUtilisateurFromClerkOrgRole(clerkRole: string): RoleUtilisateur {
  switch (clerkRole) {
    case "org:proprietaire":
    case "org:admin":
      return "proprietaire";
    case "org:administrateur":
      return "administrateur";
    case "org:responsable_etablissement":
      return "responsable_etablissement";
    case "org:membre":
    case "org:member":
      return "membre";
    default:
      return "membre";
  }
}

export function clerkOrgRoleFromRoleUtilisateur(role: RoleUtilisateur): string {
  switch (role) {
    case "proprietaire":
      return "org:proprietaire";
    case "administrateur":
      return "org:administrateur";
    case "responsable_etablissement":
      return "org:responsable_etablissement";
    case "membre":
      return "org:membre";
    default:
      return "org:membre";
  }
}
