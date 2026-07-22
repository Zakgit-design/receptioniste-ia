import Link from "next/link";
import { notFound } from "next/navigation";
import { CallDetail } from "@/components/call-detail";
import { getAppelDetail } from "../data";

// Force le rendu dynamique — sans ce flag, une page dynamique ([id] sans
// generateStaticParams) est mise en cache après sa première visite et
// resservie telle quelle indéfiniment (bug réel trouvé le 2026-07-22, voir
// docs/sprint-log.md).
export const dynamic = "force-dynamic";

// Visite directe ou actualisation de page : fiche appel en page complète (pas
// de drawer, voir docs/sprint5-conception.md, section 8 — en navigation
// depuis /appels, la route interceptante @drawer/(.)appels/[id] prend le
// dessus et affiche cette même fiche en panneau latéral).
export default async function AppelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appel = await getAppelDetail(id);
  if (!appel) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <Link
        href="/appels"
        className="mb-3.5 inline-flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-text"
      >
        ← Tous les appels
      </Link>

      <div className="mb-[18px]">
        <div className="text-lg font-extrabold text-text">
          {appel.entrepriseNom} — {appel.etablissementNom}
        </div>
        <div className="mt-1 text-[12.5px] font-semibold text-text-secondary">
          {appel.resultat} · {appel.heureDecroche.slice(0, 5)}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface px-5 py-[18px] shadow-[var(--shadow-panel)]">
        <CallDetail appel={appel} />
      </div>
    </div>
  );
}
