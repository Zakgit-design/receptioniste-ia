import type { RoleUtilisateur } from "@/generated/prisma/enums";

// Mapping entre les rôles d'organisation Clerk ("org:admin" / "org:member",
// les deux rôles par défaut d'une Organization Clerk) et nos rôles internes
// (voir docs/architecture.md, modèle `utilisateurs.role`).
//
// Décision retenue pour le MVP : le propriétaire d'une entreprise cliente
// est admin de son organisation Clerk, un employé en est simple membre.
// `admin_plateforme` n'est jamais un rôle d'organisation Clerk — ces comptes
// n'appartiennent à aucune organisation (voir getCurrentUser dans
// src/auth/index.ts pour comment ce cas est détecté).
export function roleUtilisateurFromClerkOrgRole(clerkRole: string): RoleUtilisateur {
  return clerkRole === "org:admin" ? "proprietaire" : "employe";
}

export function clerkOrgRoleFromRoleUtilisateur(role: RoleUtilisateur): string {
  return role === "proprietaire" ? "org:admin" : "org:member";
}
