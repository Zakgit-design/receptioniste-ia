// Données réelles de l'écran Appels du Dashboard Client — voir
// docs/roadmap.md, tâche #67. Comme les tâches #63/#66, aucune donnée de
// démonstration : tout vient de Postgres, scopé sur les établissements
// autorisés de l'utilisateur connecté (voir src/lib/scope-client.ts).
// Barber Concept n'a aujourd'hui aucun appel réel en base (branchement
// Vapi/Twilio différé, voir docs/sprint6-conception.md, section 3) — ces
// fonctions retournent alors des listes vides, affichées honnêtement par la
// page.
//
// Types et petites fonctions pures partagées avec les composants client
// (`appels-table-client.tsx`, `call-detail-client.tsx`) vivent dans
// src/lib/appels-client.ts, pas ici : ce fichier importe Prisma, un composant
// "use client" ne peut pas l'importer directement (voir ce fichier pour le
// détail).

import { prisma } from "@/lib/prisma";
import type { Utilisateur } from "@/auth";
import { getEtablissementIdsAutorises } from "@/lib/scope-client";
import type { OutilAppelUtilise, ErreurAppel } from "@/lib/call-timeline";
import {
  resultatAppel,
  type EtablissementOption,
  type AppelListeItemClient,
  type AppelDetailClient,
  type LigneTranscriptionAppel,
} from "@/lib/appels-client";

export type {
  EtablissementOption,
  AppelListeItemClient,
  AppelDetailClient,
  LigneTranscriptionAppel,
} from "@/lib/appels-client";
export { libelleEtToneAppelClient, formatDureeAppelClient } from "@/lib/appels-client";

function formatHeure(date: Date): string {
  return date.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === "object" && valeur !== null;
}

/** Parse défensif de `appels.outils_utilises` (jsonb, forme non garantie). */
function parseOutilsUtilises(json: unknown): OutilAppelUtilise[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (item): item is OutilAppelUtilise =>
      estObjet(item) && typeof item.label === "string" && typeof item.horodatage === "string"
  );
}

/** Parse défensif de `appels.erreurs` (jsonb, forme non garantie). */
function parseErreurs(json: unknown): ErreurAppel[] | null {
  if (!Array.isArray(json)) return null;
  const erreurs = json.filter(
    (item): item is ErreurAppel =>
      estObjet(item) && typeof item.label === "string" && typeof item.horodatage === "string"
  );
  return erreurs.length > 0 ? erreurs : null;
}

/** Parse défensif de `conversations.transcript` (jsonb, forme non garantie). */
function parseTranscription(json: unknown): LigneTranscriptionAppel[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (item): item is LigneTranscriptionAppel =>
      estObjet(item) &&
      (item.locuteur === "ia" || item.locuteur === "client") &&
      typeof item.texte === "string"
  );
}

/**
 * Établissements autorisés + agents IA associés, pour scoper les requêtes
 * `Appel` ci-dessous (un appel est rattaché à un `AgentIA`, pas directement à
 * un établissement — voir docs/architecture.md).
 */
async function getEtablissementsEtAgents(user: Utilisateur | null) {
  const etablissementIds = await getEtablissementIdsAutorises(user);
  if (etablissementIds.length === 0) {
    return {
      etablissements: [] as EtablissementOption[],
      agentIds: [] as string[],
      etablissementParAgent: new Map<string, EtablissementOption>(),
    };
  }

  const etablissements = await prisma.etablissement.findMany({
    where: { id: { in: etablissementIds } },
    include: { agentsIA: { select: { id: true } } },
    orderBy: { nom: "asc" },
  });

  const etablissementParAgent = new Map<string, EtablissementOption>();
  for (const etablissement of etablissements) {
    for (const agent of etablissement.agentsIA) {
      etablissementParAgent.set(agent.id, { id: etablissement.id, nom: etablissement.nom });
    }
  }

  return {
    etablissements: etablissements.map((etablissement) => ({ id: etablissement.id, nom: etablissement.nom })),
    agentIds: [...etablissementParAgent.keys()],
    etablissementParAgent,
  };
}

/**
 * Liste des appels visibles par l'utilisateur connecté, avec les
 * établissements autorisés (pour le filtre). Retourne des listes vides si
 * l'utilisateur n'a pas d'établissement autorisé ou aucun assistant configuré.
 */
export async function getAppelsListeClient(
  user: Utilisateur | null
): Promise<{ etablissements: EtablissementOption[]; appels: AppelListeItemClient[] }> {
  const { etablissements, agentIds, etablissementParAgent } = await getEtablissementsEtAgents(user);
  if (agentIds.length === 0) return { etablissements, appels: [] };

  const appels = await prisma.appel.findMany({
    where: { agentIaId: { in: agentIds } },
    orderBy: { debut: "desc" },
  });

  return {
    etablissements,
    appels: appels.map((appel) => {
      const etablissement = etablissementParAgent.get(appel.agentIaId);
      return {
        id: appel.id,
        heure: appel.debut.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" }),
        debutTimestamp: appel.debut.getTime(),
        etablissementId: etablissement?.id ?? "",
        etablissementNom: etablissement?.nom ?? "—",
        telephoneAppelant: appel.telephoneAppelant,
        dureeSecondes: appel.dureeSecondes,
        statut: appel.statut,
        resultat: resultatAppel(appel),
        smsEnvoye: appel.smsEnvoye,
        rendezVousId: appel.rendezVousId,
      };
    }),
  };
}

/**
 * Fiche détail d'un appel — retourne `null` si l'appel n'existe pas ou n'est
 * pas dans le périmètre de l'utilisateur connecté (aucune fuite inter-
 * établissement/entreprise possible : le filtre `agentIaId in agentIds` fait
 * partie de la requête elle-même).
 */
export async function getAppelDetailClient(
  user: Utilisateur | null,
  id: string
): Promise<AppelDetailClient | null> {
  const { agentIds, etablissementParAgent } = await getEtablissementsEtAgents(user);
  if (agentIds.length === 0) return null;

  const appel = await prisma.appel.findFirst({
    where: { id, agentIaId: { in: agentIds } },
    include: { conversation: true },
  });
  if (!appel) return null;

  const etablissement = etablissementParAgent.get(appel.agentIaId);

  return {
    id: appel.id,
    etablissementNom: etablissement?.nom ?? "—",
    telephoneAppelant: appel.telephoneAppelant,
    dureeSecondes: appel.dureeSecondes,
    statut: appel.statut,
    resultat: resultatAppel(appel),
    smsEnvoye: appel.smsEnvoye,
    rendezVousId: appel.rendezVousId,
    urlEnregistrement: appel.urlEnregistrement,
    heureDecroche: formatHeure(appel.debut),
    heureRaccroche: appel.fin ? formatHeure(appel.fin) : null,
    outilsUtilises: parseOutilsUtilises(appel.outilsUtilises),
    erreurs: parseErreurs(appel.erreurs),
    resumeIA: appel.conversation?.resume ?? "Aucun résumé disponible pour cet appel.",
    transcription: parseTranscription(appel.conversation?.transcript),
  };
}
