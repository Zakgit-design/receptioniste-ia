// Jeu de données de démonstration pour `evenements_sante` (voir
// docs/architecture.md et docs/sprint5-conception.md, section 7) — une seule
// source de vérité, partagée par :
// - la colonne Santé de la liste Entreprises (src/app/(dashboard)/entreprises/page.tsx)
// - le centre d'actions de la Vue d'ensemble (src/app/(dashboard)/data.ts)
// - la page Santé plateforme (src/app/(dashboard)/sante-plateforme/page.tsx)
//
// À remplacer par de vraies requêtes Prisma (table `evenements_sante`) quand
// la base PostgreSQL sera disponible. Les deux écrans agrègent la même liste
// différemment (par entreprise vs par service, voir src/lib/health.ts) — ce
// module ne fait qu'exposer les événements bruts, jamais un statut déjà
// calculé.

import type { EvenementSanteInput } from "@/lib/health";

// `detail` reprend, simplifié en texte pour la démo, le champ jsonb
// `evenements_sante.detail` du schéma — uniquement pour l'affichage (ex. page
// Santé plateforme), jamais pour l'agrégation de statut (voir `health.ts`).
export interface EvenementSanteDemo extends EvenementSanteInput {
  detail?: string;
}

const maintenant = new Date();

export function getEvenementsSante(): EvenementSanteDemo[] {
  return [
    // Render, Vapi, Anthropic, base de données, webhooks : aucun souci en
    // démo — un événement plateforme globale (entrepriseId null) par service.
    { service: "render", entrepriseId: null, statut: "ok", createdAt: maintenant },
    { service: "vapi", entrepriseId: null, statut: "ok", createdAt: maintenant },
    { service: "anthropic", entrepriseId: null, statut: "ok", createdAt: maintenant },
    { service: "base_de_donnees", entrepriseId: null, statut: "ok", createdAt: maintenant },
    { service: "webhooks", entrepriseId: null, statut: "ok", createdAt: maintenant },

    // Twilio : ok pour Barber Concept, échecs répétés pour Le Petit Bouchon
    // (même cause que le centre d'actions, voir action-1 dans
    // src/app/(dashboard)/data.ts).
    { service: "twilio", entrepriseId: "entreprise-barber-concept", statut: "ok", createdAt: maintenant },
    {
      service: "twilio",
      entrepriseId: "entreprise-petit-bouchon",
      statut: "echec",
      createdAt: maintenant,
      detail: "3 échecs consécutifs d'envoi de SMS, délai backend dépassé",
    },
    { service: "twilio", entrepriseId: "entreprise-petit-bouchon", statut: "echec", createdAt: maintenant },
    { service: "twilio", entrepriseId: "entreprise-petit-bouchon", statut: "echec", createdAt: maintenant },

    // Google Calendar : ok pour Barber Concept, dégradé pour Cabinet Dentaire
    // Sourire (même cause que le centre d'actions, voir action-3 dans
    // src/app/(dashboard)/data.ts).
    { service: "google_calendar", entrepriseId: "entreprise-barber-concept", statut: "ok", createdAt: maintenant },
    {
      service: "google_calendar",
      entrepriseId: "entreprise-cabinet-dentaire",
      statut: "degrade",
      createdAt: maintenant,
      detail: "1 échec d'autorisation détecté",
    },
  ];
}
