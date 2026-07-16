// Types et fonctions pures pour l'écran Rendez-vous du Dashboard Client —
// voir docs/roadmap.md, tâche #68. Même séparation que src/lib/appels-client.ts :
// isolé de `(client)/app/rendez-vous/data.ts` (qui importe Prisma) pour rester
// importable depuis le composant client "use client" (rendez-vous-table-client.tsx).

import type { ToneBadge } from "@/components/statut-badge";
import type { StatutRendezVous } from "@/generated/prisma/enums";
import type { EtablissementOption } from "@/lib/appels-client";

export type { EtablissementOption };

export interface RendezVousListeItemClient {
  id: string;
  debutTimestamp: number;
  date: string;
  heure: string;
  etablissementId: string;
  etablissementNom: string;
  serviceNom: string;
  clientLabel: string;
  statut: StatutRendezVous;
}

/** Libellé + couleur affichés pour le statut d'un rendez-vous. */
export function libelleEtToneStatutRendezVous(
  statut: StatutRendezVous
): { libelle: string; tone: ToneBadge } {
  switch (statut) {
    case "confirme":
      return { libelle: "Confirmé", tone: "good" };
    case "termine":
      return { libelle: "Terminé", tone: "neutral" };
    case "absent":
      return { libelle: "Absent", tone: "warn" };
    case "annule":
      return { libelle: "Annulé", tone: "critical" };
  }
}
