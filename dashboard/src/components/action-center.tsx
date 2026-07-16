import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ActionRequiseAffichee } from "@/app/(dashboard)/data";

// Section héro de la Vue d'ensemble — voir docs/sprint5-conception.md,
// section 2. Purement d'affichage : "Ignorer" ne fait rien pour l'instant,
// la vraie logique (marquerIgnore, voir src/lib/actions-center.ts) arrivera
// avec les routes API, une fois la base de données branchée.

const graviteVersCouleur: Record<ActionRequiseAffichee["gravite"], string> = {
  critique: "bg-critical",
  a_surveiller: "bg-warn",
};

const typeVersLibelle: Record<ActionRequiseAffichee["type"], string> = {
  technique: "technique",
  business: "business",
  securite: "sécurité",
};

export function ActionCenter({
  actions,
}: {
  actions: ActionRequiseAffichee[];
}) {
  return (
    <div className="mb-[22px] rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-[13px]">
        <div className="flex items-center gap-2 text-[13px] font-extrabold text-text">
          Centre d&apos;actions
          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-critical px-[5px] text-[10.5px] font-extrabold text-white">
            {actions.length}
          </span>
        </div>
        <span className="text-[11.5px] font-semibold text-text-muted">
          ce qui nécessite ton intervention aujourd&apos;hui
        </span>
      </div>

      {actions.length === 0 ? (
        <div className="px-4 py-7 text-center text-[12.5px] font-semibold text-text-muted">
          Rien ne nécessite ton intervention pour l&apos;instant.
        </div>
      ) : (
        <div>
          {actions.map((action) => (
            <div
              key={action.id}
              className="flex items-start gap-3 border-b border-border px-4 py-[13px] last:border-b-0"
            >
              <span
                className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${graviteVersCouleur[action.gravite]}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold text-text">
                    {action.titre}
                  </span>
                  <span className="rounded border border-border-strong bg-paper px-1.5 py-0.5 text-[10px] font-bold tracking-[0.05em] text-text-muted uppercase">
                    {typeVersLibelle[action.type]}
                  </span>
                </div>
                <div className="mt-[3px] text-xs leading-[1.45] font-medium text-text-secondary">
                  {action.description}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-text-muted">
                  {action.metaLabel}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {action.actionRecommandee ? (
                  <Button
                    asChild
                    size="sm"
                    className="bg-ink text-paper hover:bg-ink/90"
                  >
                    <Link href={action.actionRecommandee.lien}>
                      {action.actionRecommandee.libelle}
                    </Link>
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-text-muted hover:text-text-secondary"
                >
                  Ignorer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
