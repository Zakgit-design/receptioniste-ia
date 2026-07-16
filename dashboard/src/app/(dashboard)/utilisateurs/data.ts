// Données de démonstration pour l'écran Utilisateurs — voir
// docs/architecture.md (modèle `utilisateurs`) et docs/sprint5-conception.md,
// section 2 (modèle d'invitation directe : un Super Admin/propriétaire
// invite, pas de demande d'accès autonome au MVP).
//
// À remplacer par de vraies requêtes (table `utilisateurs`, synchronisée par
// le webhook Clerk — voir src/auth/webhook.ts) une fois la base disponible.
// Mêmes 3 entreprises que partout ailleurs dans le dashboard (voir
// ../entreprises/data.ts) : Barber Concept, Cabinet Dentaire Sourire, Le
// Petit Bouchon.

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

export function getAdminsPlateforme(): UtilisateurAffiche[] {
  return [
    {
      nom: "Zakaria — Fondateur",
      email: "zakaria@receptionniste-ia.ch",
      role: "admin_plateforme",
      statut: "actif",
    },
  ];
}

export function getUtilisateursParEntreprise(): UtilisateursEntreprise[] {
  return [
    {
      entrepriseId: "entreprise-barber-concept",
      entrepriseNom: "Barber Concept",
      membres: [
        {
          nom: "Julien Dupont",
          email: "julien.dupont@barberconcept.ch",
          role: "proprietaire",
          statut: "actif",
        },
        {
          nom: "Amélie Rossi",
          email: "amelie.rossi@barberconcept.ch",
          role: "employe",
          statut: "actif",
        },
        {
          nom: "Karim Haddad",
          email: "karim.haddad@barberconcept.ch",
          role: "employe",
          statut: "invitation_en_attente",
        },
      ],
    },
    {
      entrepriseId: "entreprise-cabinet-dentaire",
      entrepriseNom: "Cabinet Dentaire Sourire",
      membres: [
        {
          nom: "Dr Sophie Meier",
          email: "sophie.meier@cabinet-sourire.ch",
          role: "proprietaire",
          statut: "actif",
        },
      ],
    },
    {
      entrepriseId: "entreprise-petit-bouchon",
      entrepriseNom: "Le Petit Bouchon",
      membres: [
        {
          nom: "Marc Bovier",
          email: "marc.bovier@lepetitbouchon.ch",
          role: "proprietaire",
          statut: "actif",
        },
      ],
    },
  ];
}
