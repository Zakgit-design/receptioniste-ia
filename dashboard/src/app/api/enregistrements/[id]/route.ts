import { NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { getAgentIdsEntreprise, getEtablissementIdsAutorises } from "@/lib/scope-client";
import { prisma } from "@/lib/prisma";

// Proxie l'enregistrement d'un appel vers une URL Vapi temporaire et signée.
//
// `Appel.urlEnregistrement` (stockée par le webhook, src/call-webhook.js)
// pointe vers le bucket privé Vapi ("hipaa-recordings") — testé le
// 2026-07-22 : renvoie une erreur d'autorisation en accès direct, donc
// inutilisable comme `<audio src>`. L'API Vapi expose en revanche
// `artifact.presignedMonoUrl`, une URL signée temporaire (valable ~1h,
// `presignedUrlsExpiresAt`) — à redemander à chaque lecture plutôt qu'à
// stocker une fois pour toutes.
//
// Portée actuelle : Dashboard Client uniquement (mêmes fonctions de scope
// que getAppelDetailClient, `(client)/app/appels/data.ts`). L'écran Appels du
// Dashboard Administrateur reste sur des données de démonstration (voir
// docs/sprint-log.md, Sprint 5/6bis) — cette route ne le concerne pas encore.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const [etablissementIds, agentIds] = await Promise.all([
    getEtablissementIdsAutorises(user),
    getAgentIdsEntreprise(user),
  ]);
  if (agentIds.length === 0) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Même restriction que getScopeAppelsClient : un responsable d'établissement
  // ne doit pas pouvoir écouter l'enregistrement d'un autre établissement.
  const restrictionEtablissement =
    user?.role === "responsable_etablissement" ? { etablissementId: { in: etablissementIds } } : {};

  const appel = await prisma.appel.findFirst({
    where: { id, agentIaId: { in: agentIds }, ...restrictionEtablissement },
    select: { vapiCallId: true },
  });
  if (!appel?.vapiCallId) {
    return NextResponse.json({ error: "Enregistrement introuvable" }, { status: 404 });
  }

  const vapiResponse = await fetch(`https://api.vapi.ai/call/${appel.vapiCallId}`, {
    headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` },
  });
  if (!vapiResponse.ok) {
    return NextResponse.json({ error: "Échec de récupération auprès de Vapi" }, { status: 502 });
  }

  const data = await vapiResponse.json();
  const presignedUrl: string | undefined = data.artifact?.presignedMonoUrl;
  if (!presignedUrl) {
    return NextResponse.json({ error: "Aucun enregistrement disponible" }, { status: 404 });
  }

  return NextResponse.redirect(presignedUrl);
}
