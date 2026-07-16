"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer } from "recharts";
import type { PointAppelsQuotidien } from "@/app/(dashboard)/data";

// Graphique 14 jours — Recharts, choix acté dans docs/sprint5-conception.md
// (section 1), suffisant pour ce besoin sans sur-ingénierie.
export function CallsChart({ serie }: { serie: PointAppelsQuotidien[] }) {
  const premierJour = serie[0];
  const dernierJour = serie[serie.length - 1];

  return (
    <div className="rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-[13px]">
        <h3 className="text-[12.5px] font-bold text-text">
          Appels — 14 derniers jours
        </h3>
        <span className="text-[11px] font-semibold text-text-muted">
          total plateforme
        </span>
      </div>
      <div className="px-4 py-4">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart
            data={serie}
            margin={{ top: 10, right: 4, left: 4, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <Area
              type="monotone"
              dataKey="nombreAppels"
              stroke="var(--text-secondary)"
              strokeWidth={2}
              fill="var(--text-muted)"
              fillOpacity={0.12}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-0.5 flex justify-between text-[11px] font-semibold text-text-muted">
          <span>{premierJour.jour}</span>
          <span className="font-mono font-bold text-signal">
            {dernierJour.jour} · {dernierJour.nombreAppels}
          </span>
        </div>
      </div>
    </div>
  );
}
