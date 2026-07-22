import Link from "next/link";
import { notFound } from "next/navigation";
import { StatutBadge, toneForStatutEntreprise } from "@/components/statut-badge";
import { Button } from "@/components/ui/button";
import { EntrepriseDetailTabs } from "@/components/entreprise-detail-tabs";
import { SupprimerEntrepriseDialog } from "@/components/supprimer-entreprise-dialog";
import { getEntrepriseDetail } from "../data";

// Force le rendu dynamique : sans ce flag, Next.js met en cache la sortie de
// cette page dynamique ([id] sans generateStaticParams) après sa première
// visite et la ressert telle quelle indéfiniment — un utilisateur voyait donc
// une version figée au moment du premier chargement, jamais les nouvelles
// données (bug réel trouvé le 2026-07-22 : l'onglet Utilisateurs affichait
// encore l'ancien texte de démonstration après son branchement sur Clerk).
// Même raison que /entreprises (voir docs/sprint-log.md, même date).
export const dynamic = "force-dynamic";

// Détail d'une entreprise — onglets dans docs/sprint5-conception.md, section 3.
// `id` inconnu en base -> 404 propre plutôt qu'un plantage.
export default async function EntrepriseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entreprise = await getEntrepriseDetail(id);
  if (!entreprise) {
    notFound();
  }

  const initiales = entreprise.nom
    .split(" ")
    .map((mot) => mot[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <Link
        href="/entreprises"
        className="mb-3.5 inline-flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-text"
      >
        ← Toutes les entreprises
      </Link>

      <div className="mb-[18px] flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-ink text-base font-extrabold text-paper">
          {initiales}
        </div>
        <div className="flex-1">
          <div className="text-lg font-extrabold text-text">{entreprise.nom}</div>
          <div className="mt-1 flex items-center gap-2.5">
            <span className="text-[11px] font-semibold text-text-secondary">
              {entreprise.secteur}
            </span>
            <StatutBadge tone={toneForStatutEntreprise(entreprise.statut)}>
              {entreprise.statutLabel}
            </StatutBadge>
            <StatutBadge tone="neutral">Plan {entreprise.planLabel}</StatutBadge>
            {entreprise.estDemo ? <StatutBadge tone="neutral">Démo</StatutBadge> : null}
          </div>
        </div>
        {entreprise.estDemo ? (
          <span className="text-xs font-semibold text-text-muted">
            Entreprise de démonstration — pas de suppression possible
          </span>
        ) : (
          <SupprimerEntrepriseDialog id={entreprise.id} nom={entreprise.nom} />
        )}
      </div>

      {entreprise.statut === "brouillon" ? (
        <div className="mb-3.5 flex items-center justify-between rounded-lg border border-signal bg-surface px-4 py-3">
          <span className="text-[12.5px] font-semibold text-text">
            Configuration pas encore terminée — établissement, catalogue, accès et ressources
            techniques (Vapi/Twilio/Calendrier) restent à finaliser.
          </span>
          <Button asChild size="sm">
            <Link href={`/entreprises/${entreprise.id}/onboarding`}>Continuer la configuration</Link>
          </Button>
        </div>
      ) : null}

      <EntrepriseDetailTabs entreprise={entreprise} />
    </div>
  );
}
