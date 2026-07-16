// Données réelles de l'écran Paramètres du Dashboard Client — voir
// docs/roadmap.md, tâche #65. Aucune donnée de démonstration (voir
// docs/sprint6-conception.md, section 3) : tout vient de Postgres, scopé sur
// l'entreprise réelle de l'utilisateur connecté.

import { prisma } from "@/lib/prisma";
import type { Utilisateur } from "@/auth";
import type { StatutAbonnement } from "@/generated/prisma/enums";

export interface AbonnementActuel {
  nomPlan: string;
  prixChf: number;
  cycleFacturation: string;
  statut: StatutAbonnement;
  finPeriodeCouranteLabel: string | null;
}

export interface ParametresClient {
  entreprise: {
    nom: string;
    secteur: string;
    emailContact: string;
    telephoneContact: string;
    notifierRdvParEmail: boolean;
    notifierRdvParSms: boolean;
  };
  /** `null` si l'entreprise n'a aucun abonnement en base (ex. Barber Concept aujourd'hui) — affiché honnêtement, pas simulé. */
  abonnement: AbonnementActuel | null;
}

/**
 * Paramètres de l'entreprise de l'utilisateur connecté. Retourne `null` si
 * l'utilisateur n'a pas d'entreprise (ne devrait pas arriver ici, la page
 * bloque déjà cet accès en amont).
 */
export async function getParametresClient(
  user: Utilisateur | null
): Promise<ParametresClient | null> {
  if (!user || !user.entrepriseId) return null;

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: user.entrepriseId },
    include: { abonnement: true },
  });
  if (!entreprise) return null;

  return {
    entreprise: {
      nom: entreprise.nom,
      secteur: entreprise.secteur,
      emailContact: entreprise.emailContact ?? "",
      telephoneContact: entreprise.telephoneContact ?? "",
      notifierRdvParEmail: entreprise.notifierRdvParEmail,
      notifierRdvParSms: entreprise.notifierRdvParSms,
    },
    abonnement: entreprise.abonnement
      ? {
          nomPlan: entreprise.abonnement.nomPlan,
          prixChf: Number(entreprise.abonnement.prix),
          cycleFacturation: entreprise.abonnement.cycleFacturation,
          statut: entreprise.abonnement.statut,
          finPeriodeCouranteLabel: entreprise.abonnement.finPeriodeCourante
            ? entreprise.abonnement.finPeriodeCourante.toLocaleDateString("fr-CH")
            : null,
        }
      : null,
  };
}
