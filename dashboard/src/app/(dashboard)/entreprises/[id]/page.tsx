import Link from "next/link";
import { notFound } from "next/navigation";
import { StatutBadge, toneForStatutEntreprise } from "@/components/statut-badge";
import { EntrepriseDetailTabs } from "@/components/entreprise-detail-tabs";
import { SupprimerEntrepriseDialog } from "@/components/supprimer-entreprise-dialog";
import { getEntrepriseDetail } from "../data";

// Détail d'une entreprise — onglets dans docs/sprint5-conception.md, section
// 3. `getEntrepriseDetail` cherche d'abord parmi les entreprises de
// démonstration, puis en base (voir ../data.ts). `id` inconnu des deux -> 404
// propre plutôt qu'un plantage.
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
          </div>
        </div>
        {!entreprise.estDemo ? (
          <SupprimerEntrepriseDialog id={entreprise.id} nom={entreprise.nom} />
        ) : null}
      </div>

      <EntrepriseDetailTabs entreprise={entreprise} />
    </div>
  );
}
