import type { StatistiqueTuile } from "@/app/(dashboard)/data";

const couleurVersPoint: Record<StatistiqueTuile["couleurPoint"], string> = {
  good: "bg-good",
  signal: "bg-signal",
};

export function StatTiles({
  statistiques,
}: {
  statistiques: StatistiqueTuile[];
}) {
  return (
    <div className="mb-[18px] grid grid-cols-3 gap-3.5">
      {statistiques.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border bg-surface px-4 py-[15px] shadow-[var(--shadow-panel)]"
        >
          <div className="mb-2.5 flex items-center gap-[7px]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${couleurVersPoint[stat.couleurPoint]}`}
            />
            <span className="text-[11px] font-bold tracking-[0.05em] text-text-muted uppercase">
              {stat.label}
            </span>
          </div>
          <div className="font-mono text-[25px] font-bold tracking-[-0.01em] text-text">
            {stat.valeur}
          </div>
          <div className="mt-1 text-[11.5px] font-semibold text-good">
            {stat.delta}
          </div>
        </div>
      ))}
    </div>
  );
}
