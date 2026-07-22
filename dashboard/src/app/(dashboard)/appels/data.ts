// Écran Appels (liste + fiche détail) du Dashboard Administrateur — branché
// sur les vraies données Postgres (2026-07-22), tous clients confondus (vue
// plateforme, pas de scope par entreprise contrairement au Dashboard Client
// — voir src/lib/scope-client.ts et (client)/app/appels/data.ts).
//
// Types et petites fonctions pures partagées avec le composant client
// (`appels-table.tsx`, `call-detail.tsx`) vivent dans src/lib/appels-admin.ts,
// pas ici : ce fichier importe Prisma, un composant "use client" ne peut pas
// l'importer directement.

import { prisma } from "@/lib/prisma";
import { parseOutilsUtilises, parseErreurs } from "@/lib/call-timeline";
import { ETABLISSEMENT_NON_DETERMINE } from "@/lib/appels-client";
import { resultatAppel, masquerTelephone, type AppelListeItem, type AppelDetail } from "@/lib/appels-admin";

export type { AppelListeItem, AppelDetail } from "@/lib/appels-admin";
export { libelleEtToneAppel, appelATraiter, formatDureeAppel } from "@/lib/appels-admin";

function coutAppelChf(coutDetail: unknown): number {
  if (typeof coutDetail !== "object" || coutDetail === null) return 0;
  const total = (coutDetail as { total?: unknown }).total;
  return Math.round((typeof total === "number" ? total : 0) * 100) / 100;
}

export async function getAppelsListe(): Promise<AppelListeItem[]> {
  const appels = await prisma.appel.findMany({
    orderBy: { debut: "desc" },
    include: {
      agentIA: { include: { entreprise: { select: { nom: true } } } },
      etablissement: { select: { nom: true } },
    },
  });

  return appels.map((appel) => ({
    id: appel.id,
    heure: appel.debut.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" }),
    entrepriseNom: appel.agentIA.entreprise.nom,
    etablissementNom: appel.etablissement?.nom ?? ETABLISSEMENT_NON_DETERMINE,
    telephoneAppelantMasque: masquerTelephone(appel.telephoneAppelant),
    dureeSecondes: appel.dureeSecondes,
    resultat: resultatAppel(appel),
    statut: appel.statut,
    smsEnvoye: appel.smsEnvoye,
    rendezVousId: appel.rendezVousId,
    coutChf: coutAppelChf(appel.coutDetail),
  }));
}

export async function getAppelDetail(id: string): Promise<AppelDetail | null> {
  const appel = await prisma.appel.findUnique({
    where: { id },
    include: {
      agentIA: { include: { entreprise: { select: { nom: true } } } },
      etablissement: { select: { nom: true } },
      conversation: true,
    },
  });
  if (!appel) return null;

  const formatHeure = (date: Date) =>
    date.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const transcript = appel.conversation?.transcript;
  const transcription = Array.isArray(transcript)
    ? transcript.filter(
        (ligne): ligne is { locuteur: "ia" | "client"; texte: string } =>
          typeof ligne === "object" &&
          ligne !== null &&
          (ligne as { locuteur?: unknown }).locuteur !== undefined &&
          typeof (ligne as { texte?: unknown }).texte === "string"
      )
    : [];

  return {
    id: appel.id,
    dureeSecondes: appel.dureeSecondes,
    statut: appel.statut,
    smsEnvoye: appel.smsEnvoye,
    rendezVousId: appel.rendezVousId,
    urlEnregistrement: appel.urlEnregistrement,
    entrepriseNom: appel.agentIA.entreprise.nom,
    etablissementNom: appel.etablissement?.nom ?? ETABLISSEMENT_NON_DETERMINE,
    telephoneAppelantMasque: masquerTelephone(appel.telephoneAppelant),
    resultat: resultatAppel(appel),
    coutChf: coutAppelChf(appel.coutDetail),
    heureDecroche: formatHeure(appel.debut),
    heureRaccroche: appel.fin ? formatHeure(appel.fin) : null,
    outilsUtilises: parseOutilsUtilises(appel.outilsUtilises),
    erreurs: parseErreurs(appel.erreurs),
    resumeIA: appel.conversation?.resume ?? "Aucun résumé disponible pour cet appel.",
    transcription,
  };
}
