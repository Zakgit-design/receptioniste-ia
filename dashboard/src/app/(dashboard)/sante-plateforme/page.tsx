import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatutBadge, type ToneBadge } from "@/components/statut-badge";
import { santeParService, type StatutSante } from "@/lib/health";
import { prisma } from "@/lib/prisma";

// Force le rendu dynamique : interroge Prisma directement, sans API
// dynamique pour le déclencher implicitement — même raison que /entreprises
// (voir docs/sprint-log.md, 2026-07-22).
export const dynamic = "force-dynamic";

// Page Santé plateforme — voir docs/sprint5-conception.md, section 7 : les 7
// services critiques, agrégés à partir des mêmes `evenements_sante` que la
// colonne Santé de la liste Entreprises (agrégation par service ici, pas par
// entreprise — voir src/lib/health.ts). Réservée au Super Admin : simple
// mention dans le sous-titre, la vraie restriction d'accès (Clerk) est une
// tâche séparée.
//
// **Limite honnête assumée (2026-07-22) :** aucun mécanisme n'écrit encore
// dans `evenements_sante` (aucune vérification automatique de service
// branchée — voir docs/roadmap.md, ancien Sprint 11, différé). Un service
// sans le moindre événement enregistré affiche donc "Aucune donnée", jamais
// "Fonctionnel" par défaut — inventer un statut "ok" serait mentir sur une
// surveillance qui n'existe pas encore.

const services: { id: string; nom: string }[] = [
  { id: "render", nom: "Render (backend)" },
  { id: "twilio", nom: "Twilio" },
  { id: "vapi", nom: "Vapi" },
  { id: "anthropic", nom: "Anthropic" },
  { id: "google_calendar", nom: "Google Calendar" },
  { id: "base_de_donnees", nom: "Base de données" },
  { id: "webhooks", nom: "Webhooks" },
];

type StatutAffiche = StatutSante | "aucune_donnee";

const libelleParStatut: Record<StatutAffiche, string> = {
  ok: "Fonctionnel",
  degrade: "Dégradé",
  echec: "Incident",
  aucune_donnee: "Aucune donnée",
};

const toneParStatut: Record<StatutAffiche, ToneBadge> = {
  ok: "good",
  degrade: "warn",
  echec: "critical",
  aucune_donnee: "neutral",
};

/** "il y a X min" — fonction module (pas dans le corps du composant), même règle de pureté que metaLabelDepuis ((dashboard)/data.ts). */
function depuisMinutes(date: Date): number {
  return Math.round((Date.now() - date.getTime()) / 60000);
}

export default async function SantePlateformePage() {
  const evenements = await prisma.evenementSante.findMany({ orderBy: { createdAt: "desc" } });
  const statutParService = santeParService(evenements);

  const rows = services.map((service) => {
    const statut: StatutAffiche = statutParService.get(service.id) ?? "aucune_donnee";
    const evenementsProblematiques = evenements.filter(
      (evenement) => evenement.service === service.id && evenement.statut !== "ok"
    );
    const entreprisesImpactees = new Set(
      evenementsProblematiques
        .map((evenement) => evenement.entrepriseId)
        .filter((entrepriseId): entrepriseId is string => entrepriseId !== null)
    );
    const dernierEvenement = evenements.find((evenement) => evenement.service === service.id);

    return {
      ...service,
      statut,
      nbEntreprisesImpactees: entreprisesImpactees.size,
      verificationLabel: dernierEvenement
        ? `dernière vérification il y a ${depuisMinutes(dernierEvenement.createdAt)} min`
        : "aucune vérification automatique branchée",
    };
  });

  return (
    <div>
      <PageHeader
        title="Santé plateforme"
        subtitle="État en temps réel des services critiques — réservé au Super Admin"
      />
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border px-4 py-[13px] last:border-b-0"
          >
            <StatutBadge tone={toneParStatut[row.statut]}>
              {libelleParStatut[row.statut]}
            </StatutBadge>
            <span className="flex-1 text-[13px] font-bold text-text">{row.nom}</span>
            <span className="text-[11px] font-semibold text-text-muted">
              {row.verificationLabel}
            </span>
            {row.nbEntreprisesImpactees > 0 ? (
              <Link
                href="/entreprises"
                className="shrink-0 text-[11.5px] font-bold whitespace-nowrap text-signal hover:underline"
              >
                Voir les entreprises impactées ({row.nbEntreprisesImpactees})
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
