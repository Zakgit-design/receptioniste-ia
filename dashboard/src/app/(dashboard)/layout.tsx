import { NavRail } from "@/components/nav-rail";
import { TopBar } from "@/components/top-bar";
import { navGroups } from "@/lib/nav";
import { getActionsOuvertesCount } from "./data";

// Force le rendu dynamique : interroge Prisma directement (getActionsOuvertesCount)
// pour le badge de nav, sans API dynamique pour le déclencher implicitement —
// même raison que /entreprises (voir docs/sprint-log.md, 2026-07-22).
export const dynamic = "force-dynamic";

// Coquille partagée par tout le Dashboard Administrateur (hors /login, géré par Clerk
// plus tard) : rail de navigation à gauche + barre supérieure + zone de contenu.
//
// `drawer` est le slot parallèle @drawer (voir src/app/(dashboard)/@drawer) :
// vide (`default.tsx` rend `null`) sur la quasi-totalité des écrans, il
// n'affiche la fiche appel en panneau latéral que lorsque la navigation est
// interceptée depuis /appels (voir docs/sprint5-conception.md, section 8).
export default async function DashboardLayout({
  children,
  drawer,
}: {
  children: React.ReactNode;
  drawer: React.ReactNode;
}) {
  const actionsOuvertes = await getActionsOuvertesCount();

  return (
    <div className="flex min-h-screen">
      <NavRail groups={navGroups} actionsOuvertes={actionsOuvertes} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar groups={navGroups} subtitle="Admin" actionsOuvertes={actionsOuvertes} />
        <main className="min-w-0 flex-1 overflow-x-auto px-4 py-5 pb-[60px] md:px-[30px] md:py-[26px]">
          {children}
        </main>
      </div>
      {drawer}
    </div>
  );
}
