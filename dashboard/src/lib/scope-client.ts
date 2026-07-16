import { prisma } from "@/lib/prisma";
import type { Utilisateur } from "@/auth";

// Fonction de scope du Dashboard Client — réutilisée par tous les écrans
// scopés par établissement (Établissements, Appels, Rendez-vous, Vue
// d'ensemble). Voir docs/sprint6-conception.md, section 4 ("règle absolue") :
// prend toujours l'utilisateur courant en entrée (jamais un id transmis par
// le client), et dérive elle-même l'isolation multi-tenant.
//
// Contrat : retourne la liste des `Etablissement.id` que l'utilisateur a le
// droit de voir, réutilisable directement dans une clause Prisma
// `where: { id: { in: [...] } }` (écran Établissements) ou
// `where: { etablissementId: { in: [...] } }` (Appels, Rendez-vous, Vue
// d'ensemble). Retourne `[]` si l'utilisateur n'est pas connecté ou n'a pas
// d'entreprise (ex. admin plateforme arrivé ici par erreur — normalement déjà
// bloqué par proxy.ts).
export async function getEtablissementIdsAutorises(
  user: Utilisateur | null
): Promise<string[]> {
  if (!user || !user.entrepriseId) return [];

  // Un responsable d'établissement ne voit que ses établissements assignés
  // (table `assignations_etablissement`). Filtre supplémentaire par
  // entreprise pour la défense en profondeur, même si une assignation ne
  // devrait jamais pointer vers un établissement d'une autre entreprise.
  if (user.role === "responsable_etablissement") {
    const assignations = await prisma.assignationEtablissement.findMany({
      where: {
        utilisateur: { clerkUserId: user.clerkUserId },
        etablissement: { entrepriseId: user.entrepriseId },
      },
      select: { etablissementId: true },
    });
    return assignations.map((assignation) => assignation.etablissementId);
  }

  // Propriétaire, administrateur, membre : tout le périmètre de l'entreprise.
  const etablissements = await prisma.etablissement.findMany({
    where: { entrepriseId: user.entrepriseId },
    select: { id: true },
  });
  return etablissements.map((etablissement) => etablissement.id);
}
