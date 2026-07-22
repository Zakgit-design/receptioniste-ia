import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatutBadge, type ToneBadge } from "@/components/statut-badge";
import { santeParService, type StatutSante } from "@/lib/health";
import { getEvenementsSante } from "@/lib/demo-evenements-sante";

// Page Santé plateforme — voir docs/sprint5-conception.md, section 7 : les 7
// services critiques, agrégés à partir des mêmes `evenements_sante` que la
// colonne Santé de la liste Entreprises (agrégation par service ici, pas par
// entreprise — voir src/lib/health.ts). Réservée au Super Admin : simple
// mention dans le sous-titre, la vraie restriction d'accès (Clerk) est une
// tâche séparée.

const services: { id: string; nom: string }[] = [
  { id: "render", nom: "Render (backend)" },
  { id: "twilio", nom: "Twilio" },
  { id: "vapi", nom: "Vapi" },
  { id: "anthropic", nom: "Anthropic" },
  { id: "google_calendar", nom: "Google Calendar" },
  { id: "base_de_donnees", nom: "Base de données" },
  { id: "webhooks", nom: "Webhooks" },
];

const libelleParStatut: Record<StatutSante, string> = {
  ok: "Fonctionnel",
  degrade: "Dégradé",
  echec: "Incident",
};

const toneParStatut: Record<StatutSante, ToneBadge> = {
  ok: "good",
  degrade: "warn",
  echec: "critical",
};

export default function SantePlateformePage() {
  const evenements = getEvenementsSante();
  const statutParService = santeParService(evenements);

  const rows = services.map((service) => {
    const statut = statutParService.get(service.id) ?? "ok";
    const evenementsProblematiques = evenements.filter(
      (evenement) => evenement.service === service.id && evenement.statut !== "ok"
    );
    const entreprisesImpactees = new Set(
      evenementsProblematiques
        .map((evenement) => evenement.entrepriseId)
        .filter((entrepriseId): entrepriseId is string => entrepriseId !== null)
    );
    const detail = evenementsProblematiques.find((evenement) => evenement.detail)?.detail;

    return {
      ...service,
      statut,
      nbEntreprisesImpactees: entreprisesImpactees.size,
      verificationLabel: detail ?? "dernière vérification il y a 40s",
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
