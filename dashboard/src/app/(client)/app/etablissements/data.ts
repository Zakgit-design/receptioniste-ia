// Données réelles de l'écran Établissements du Dashboard Client — voir
// docs/roadmap.md, tâche #63. Contrairement au Sprint 5, aucune donnée de
// démonstration : tout vient de Postgres, scopé sur l'entreprise réelle de
// l'utilisateur connecté (voir src/lib/scope-client.ts).

import { prisma } from "@/lib/prisma";
import type { Utilisateur } from "@/auth";
import { getEtablissementIdsAutorises } from "@/lib/scope-client";
import type { ToneBadge } from "@/components/statut-badge";
import type { StatutIntegration } from "@/generated/prisma/enums";

export interface EtablissementClientItem {
  id: string;
  nom: string;
  adresse: string;
  numero: string;
  assistantLabel: string;
  appelsSeptJours: number;
  integrationLabel: string;
  integrationTone: ToneBadge;
}

const SEPT_JOURS_MS = 7 * 24 * 60 * 60 * 1000;

// L'intégration Google Calendar (`integrations.type = "google_calendar"`) vit
// au niveau de l'entreprise, pas de l'établissement (voir docs/architecture.md,
// table `integrations`) : une seule connexion Google partagée. Un
// établissement l'affiche comme "non configuré" tant qu'il n'a pas son propre
// `google_calendar_id`, sinon il reflète le statut de la connexion de son
// entreprise.
function statutIntegrationCalendrier(
  googleCalendarId: string | null,
  statutIntegration: StatutIntegration | undefined
): { label: string; tone: ToneBadge } {
  if (!googleCalendarId) {
    return { label: "Google Calendar — non configuré", tone: "neutral" };
  }
  switch (statutIntegration) {
    case "connecte":
      return { label: "Google Calendar — connecté", tone: "good" };
    case "erreur":
      return { label: "Google Calendar — erreur", tone: "critical" };
    default:
      return { label: "Google Calendar — déconnecté", tone: "warn" };
  }
}

/**
 * Établissements visibles par l'utilisateur connecté (voir
 * src/lib/scope-client.ts pour la règle de scope par rôle), avec leurs
 * statistiques propres. Retourne `[]` si l'utilisateur n'a pas d'entreprise.
 */
export async function getEtablissementsClient(
  user: Utilisateur | null
): Promise<EtablissementClientItem[]> {
  const etablissementIds = await getEtablissementIdsAutorises(user);
  if (etablissementIds.length === 0) return [];

  const [etablissements, integrationCalendrier] = await Promise.all([
    prisma.etablissement.findMany({
      where: { id: { in: etablissementIds } },
      include: { agentsIA: true },
      orderBy: { nom: "asc" },
    }),
    prisma.integration.findFirst({
      where: { entrepriseId: user!.entrepriseId!, type: "google_calendar" },
    }),
  ]);

  const depuis = new Date(Date.now() - SEPT_JOURS_MS);

  return Promise.all(
    etablissements.map(async (etablissement) => {
      // Un établissement a au plus un assistant actif au MVP ; le premier
      // suffit pour le numéro/l'état de l'assistant (voir modèle `AgentIA`,
      // docs/architecture.md). Le compte d'appels, lui, se lit directement sur
      // `Appel.etablissementId` depuis la tâche #73 — pas via l'agent, qui
      // reste rattaché arbitrairement à un seul salon (Cornavin) tant que
      // Barber Concept partage un seul numéro pour ses 6 salons.
      const agent = etablissement.agentsIA[0] ?? null;
      const appelsSeptJours = await prisma.appel.count({
        where: { etablissementId: etablissement.id, debut: { gte: depuis } },
      });
      const integration = statutIntegrationCalendrier(
        etablissement.googleCalendarId,
        integrationCalendrier?.statut
      );

      return {
        id: etablissement.id,
        nom: etablissement.nom,
        adresse: etablissement.adresse,
        numero: agent?.numeroTwilio ?? "Non configuré",
        assistantLabel: agent
          ? agent.statut === "actif"
            ? "Assistant actif"
            : "Assistant inactif"
          : "Aucun assistant configuré",
        appelsSeptJours,
        integrationLabel: integration.label,
        integrationTone: integration.tone,
      };
    })
  );
}
