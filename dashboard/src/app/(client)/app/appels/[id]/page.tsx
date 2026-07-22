import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/auth";
import { CallDetailClient } from "@/components/call-detail-client";
import { getAppelDetailClient } from "../data";

// Force le rendu dynamique explicitement — `getCurrentUser()` (Clerk `auth()`)
// devrait déjà suffire à empêcher la mise en cache, mais après le bug réel
// trouvé le 2026-07-22 sur les pages [id] admin qui n'avaient pas cette
// protection (voir docs/sprint-log.md), plus aucun doute laissé ici non plus.
export const dynamic = "force-dynamic";

// Visite directe ou actualisation de page : fiche appel en page complète (pas
// de drawer, voir docs/roadmap.md, tâche #67 — même principe que côté admin,
// docs/sprint5-conception.md, section 8). En navigation depuis /app/appels,
// la route interceptante app/@drawer/(.)appels/[id] prend le dessus et
// affiche cette même fiche en panneau latéral.
export default async function AppelDetailClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const appel = await getAppelDetailClient(user, id);
  if (!appel) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <Link
        href="/app/appels"
        className="mb-3.5 inline-flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-text"
      >
        ← Tous les appels
      </Link>

      <div className="mb-[18px]">
        <div className="text-lg font-extrabold text-text">{appel.etablissementNom}</div>
        <div className="mt-1 text-[12.5px] font-semibold text-text-secondary">
          {appel.resultat} · {appel.heureDecroche.slice(0, 5)}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface px-5 py-[18px] shadow-[var(--shadow-panel)]">
        <CallDetailClient appel={appel} />
      </div>
    </div>
  );
}
