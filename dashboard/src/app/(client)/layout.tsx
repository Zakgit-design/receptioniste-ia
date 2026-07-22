import { NavRail } from "@/components/nav-rail";
import { TopBar } from "@/components/top-bar";
import { navGroupsClient } from "@/lib/nav-client";

// Coquille du Dashboard Client (Sprint 6) — même structure que
// `(dashboard)/layout.tsx` (rail de navigation + barre supérieure + zone de
// contenu), mais avec le jeu de navigation client (`src/lib/nav-client.ts`).
// Pas de slot `@drawer` ici : contrairement à l'admin, `app/` est un vrai
// segment d'URL sous `(client)` (pas un simple groupe de routes invisible),
// donc le slot `@drawer` du panneau latéral (fiche appel, tâche #67 de
// docs/roadmap.md) est branché un niveau plus bas, dans
// `(client)/app/layout.tsx`.
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <NavRail groups={navGroupsClient} subtitle="Client" />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar groups={navGroupsClient} subtitle="Client" />
        <main className="min-w-0 flex-1 overflow-x-auto px-4 py-5 pb-[60px] md:px-[30px] md:py-[26px]">
          {children}
        </main>
      </div>
    </div>
  );
}
