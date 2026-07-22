// Données réelles de l'écran Appels du Dashboard Client — voir
// docs/roadmap.md, tâche #67, mis à jour tâche #73. Tout vient de Postgres,
// scopé sur l'entreprise et les établissements autorisés de l'utilisateur
// connecté.
//
// **Mise à jour tâche #73 :** l'établissement d'un appel se lit désormais
// directement sur `Appel.etablissementId` (nullable — "Non déterminé" si
// aucune réservation n'a eu lieu pendant l'appel), plus via
// `agentIA.etablissementId` (fixe, arbitraire depuis la tâche #71 — voir
// docs/architecture.md, section « Décision d'architecture — Branchement des
// appels réels »). Le scope "quels appels m'appartiennent" reste basé sur les
// agents de mon entreprise (`getAgentIdsEntreprise`, indépendant de
// l'établissement de l'agent) ; une restriction supplémentaire sur
// `etablissementId` n'est appliquée que pour un responsable d'établissement,
// qui ne doit voir ni les appels d'un autre établissement, ni les appels "non
// déterminés" (potentiellement d'un autre salon).
//
// Types et petites fonctions pures partagées avec les composants client
// (`appels-table-client.tsx`, `call-detail-client.tsx`) vivent dans
// src/lib/appels-client.ts, pas ici : ce fichier importe Prisma, un composant
// "use client" ne peut pas l'importer directement (voir ce fichier pour le
// détail).

import { prisma } from "@/lib/prisma";
import type { Utilisateur } from "@/auth";
import { getEtablissementIdsAutorises, getAgentIdsEntreprise } from "@/lib/scope-client";
import { parseOutilsUtilises, parseErreurs } from "@/lib/call-timeline";
import {
  resultatAppel,
  ETABLISSEMENT_NON_DETERMINE,
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
 * Établissements autorisés + agents de l'entreprise, pour scoper les
 * requêtes `Appel` ci-dessous. Deux notions différentes, volontairement
 * séparées (voir commentaire en tête de fichier) :
 * - `agentIds` : tous les agents de MON entreprise (isolation multi-tenant),
 *   indépendant de l'établissement arbitraire de l'agent.
 * - `restrictionEtablissement` : filtre Prisma supplémentaire sur
 *   `Appel.etablissementId`, appliqué uniquement pour un responsable
 *   d'établissement (qui ne doit voir ni un autre établissement, ni un appel
 *   "non déterminé").
 */
async function getScopeAppelsClient(user: Utilisateur | null) {
  const [etablissementIds, agentIds] = await Promise.all([
    getEtablissementIdsAutorises(user),
    getAgentIdsEntreprise(user),
  ]);

  const vide = {
    etablissements: [] as EtablissementOption[],
    agentIds: [] as string[],
    restrictionEtablissement: {},
  };
  if (etablissementIds.length === 0 || agentIds.length === 0) return vide;

  const etablissements = await prisma.etablissement.findMany({
    where: { id: { in: etablissementIds } },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true },
  });

  const restrictionEtablissement =
    user?.role === "responsable_etablissement" ? { etablissementId: { in: etablissementIds } } : {};

  return { etablissements, agentIds, restrictionEtablissement };
}

/**
 * Liste des appels visibles par l'utilisateur connecté, avec les
 * établissements autorisés (pour le filtre). Retourne des listes vides si
 * l'utilisateur n'a pas d'établissement autorisé ou aucun assistant configuré.
 */
export async function getAppelsListeClient(
  user: Utilisateur | null
): Promise<{ etablissements: EtablissementOption[]; appels: AppelListeItemClient[] }> {
  const { etablissements, agentIds, restrictionEtablissement } = await getScopeAppelsClient(user);
  if (agentIds.length === 0) return { etablissements, appels: [] };

  const appels = await prisma.appel.findMany({
    where: { agentIaId: { in: agentIds }, ...restrictionEtablissement },
    include: { etablissement: { select: { id: true, nom: true } } },
    orderBy: { debut: "desc" },
  });

  return {
    etablissements,
    appels: appels.map((appel) => ({
      id: appel.id,
      heure: appel.debut.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" }),
      debutTimestamp: appel.debut.getTime(),
      etablissementId: appel.etablissementId,
      etablissementNom: appel.etablissement?.nom ?? ETABLISSEMENT_NON_DETERMINE,
      telephoneAppelant: appel.telephoneAppelant,
      dureeSecondes: appel.dureeSecondes,
      statut: appel.statut,
      resultat: resultatAppel(appel),
      smsEnvoye: appel.smsEnvoye,
      rendezVousId: appel.rendezVousId,
    })),
  };
}

/**
 * Fiche détail d'un appel — retourne `null` si l'appel n'existe pas ou n'est
 * pas dans le périmètre de l'utilisateur connecté (aucune fuite inter-
 * établissement/entreprise possible : le filtre `agentIaId in agentIds`
 * — et, pour un responsable d'établissement, la restriction sur
 * `etablissementId` — font partie de la requête elle-même).
 */
export async function getAppelDetailClient(
  user: Utilisateur | null,
  id: string
): Promise<AppelDetailClient | null> {
  const { agentIds, restrictionEtablissement } = await getScopeAppelsClient(user);
  if (agentIds.length === 0) return null;

  const appel = await prisma.appel.findFirst({
    where: { id, agentIaId: { in: agentIds }, ...restrictionEtablissement },
    include: { conversation: true, etablissement: { select: { nom: true } } },
  });
  if (!appel) return null;

  return {
    id: appel.id,
    etablissementNom: appel.etablissement?.nom ?? ETABLISSEMENT_NON_DETERMINE,
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
