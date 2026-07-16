// Données réelles de l'écran Équipe et accès du Dashboard Client — voir
// docs/roadmap.md, tâche #64. Aucune donnée de démonstration (voir
// docs/sprint6-conception.md, section 3) : tout vient de Clerk (membres,
// invitations) et de Postgres (établissements assignés).

import { prisma } from "@/lib/prisma";
import { listOrganizationMembers } from "@/auth";
import type { Utilisateur, MembreOrganisation } from "@/auth";

export interface EtablissementOption {
  id: string;
  nom: string;
}

export interface EquipeClient {
  organizationId: string;
  membres: MembreOrganisation[];
  etablissements: EtablissementOption[];
  /** `Etablissement.id[]` assignés à chaque responsable d'établissement, par `clerkUserId`. */
  assignationsParClerkUserId: Record<string, string[]>;
}

/**
 * Équipe de l'entreprise de l'utilisateur connecté. Retourne `null` si
 * l'entreprise n'est pas (encore) reliée à une organisation Clerk (voir
 * docs/sprint6-conception.md, section 0.1) — cas qui ne devrait plus se
 * produire pour une entreprise créée après le backfill, mais reste possible
 * en théorie.
 */
export async function getEquipeClient(user: Utilisateur | null): Promise<EquipeClient | null> {
  if (!user || !user.entrepriseId) return null;

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: user.entrepriseId },
    select: { clerkOrganizationId: true },
  });
  if (!entreprise?.clerkOrganizationId) return null;

  const [membres, etablissements] = await Promise.all([
    listOrganizationMembers(entreprise.clerkOrganizationId),
    prisma.etablissement.findMany({
      where: { entrepriseId: user.entrepriseId },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  const responsablesActifs = membres
    .filter((membre) => membre.statut === "actif" && membre.role === "responsable_etablissement")
    .map((membre) => membre.clerkUserId);

  const assignations =
    responsablesActifs.length === 0
      ? []
      : await prisma.assignationEtablissement.findMany({
          where: { utilisateur: { clerkUserId: { in: responsablesActifs } } },
          select: { etablissementId: true, utilisateur: { select: { clerkUserId: true } } },
        });

  const assignationsParClerkUserId: Record<string, string[]> = {};
  for (const assignation of assignations) {
    const clerkUserId = assignation.utilisateur.clerkUserId;
    (assignationsParClerkUserId[clerkUserId] ??= []).push(assignation.etablissementId);
  }

  return {
    organizationId: entreprise.clerkOrganizationId,
    membres,
    etablissements,
    assignationsParClerkUserId,
  };
}
