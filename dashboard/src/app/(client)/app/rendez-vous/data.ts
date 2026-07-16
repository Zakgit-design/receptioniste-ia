// Données réelles de l'écran Rendez-vous du Dashboard Client — voir
// docs/roadmap.md, tâche #68. Comme les écrans précédents du sprint, aucune
// donnée de démonstration : tout vient de Postgres, scopé sur les
// établissements autorisés de l'utilisateur connecté (voir
// src/lib/scope-client.ts). Barber Concept n'a aujourd'hui aucun rendez-vous
// réel en base — cette fonction retourne alors une liste vide, affichée
// honnêtement par la page.
//
// Pas de champ "collaborateur / barber" : ce concept n'existe nulle part dans
// le modèle de données actuel (ni `RendezVous`, ni `Service`) ni dans le
// backend vocal. La page affiche "Non renseigné" pour cette colonne plutôt que
// d'inventer une donnée — voir le rapport de la tâche #68.

import { prisma } from "@/lib/prisma";
import type { Utilisateur } from "@/auth";
import { getEtablissementIdsAutorises } from "@/lib/scope-client";
import type { EtablissementOption, RendezVousListeItemClient } from "@/lib/rendez-vous-client";

export type { EtablissementOption, RendezVousListeItemClient } from "@/lib/rendez-vous-client";
export { libelleEtToneStatutRendezVous } from "@/lib/rendez-vous-client";

/**
 * Liste des rendez-vous visibles par l'utilisateur connecté, avec les
 * établissements autorisés (pour le filtre). Retourne des listes vides si
 * l'utilisateur n'a aucun établissement autorisé.
 */
export async function getRendezVousListeClient(
  user: Utilisateur | null
): Promise<{ etablissements: EtablissementOption[]; rendezVous: RendezVousListeItemClient[] }> {
  const etablissementIds = await getEtablissementIdsAutorises(user);
  if (etablissementIds.length === 0) return { etablissements: [], rendezVous: [] };

  const etablissements = await prisma.etablissement.findMany({
    where: { id: { in: etablissementIds } },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true },
  });

  const rendezVous = await prisma.rendezVous.findMany({
    where: { etablissementId: { in: etablissementIds } },
    include: { etablissement: true, service: true, clientFinal: true },
    orderBy: { debut: "desc" },
  });

  return {
    etablissements,
    rendezVous: rendezVous.map((rdv) => ({
      id: rdv.id,
      debutTimestamp: rdv.debut.getTime(),
      date: rdv.debut.toLocaleDateString("fr-CH"),
      heure: rdv.debut.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" }),
      etablissementId: rdv.etablissementId,
      etablissementNom: rdv.etablissement.nom,
      serviceNom: rdv.service.nom,
      clientLabel: rdv.clientFinal.nom ?? rdv.clientFinal.telephone,
      statut: rdv.statut,
    })),
  };
}
