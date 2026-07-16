import { NavRail } from "@/components/nav-rail";
import { TopBar } from "@/components/top-bar";
import { navGroups } from "@/lib/nav";

// Coquille partagée par tout le Dashboard Administrateur (hors /login, géré par Clerk
// plus tard) : rail de navigation à gauche + barre supérieure + zone de contenu.
//
// `drawer` est le slot parallèle @drawer (voir src/app/(dashboard)/@drawer) :
// vide (`default.tsx` rend `null`) sur la quasi-totalité des écrans, il
// n'affiche la fiche appel en panneau latéral que lorsque la navigation est
// interceptée depuis /appels (voir docs/sprint5-conception.md, section 8).
export default function DashboardLayout({
  children,
  drawer,
}: {
  children: React.ReactNode;
  drawer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <NavRail groups={navGroups} />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-x-auto px-[30px] py-[26px] pb-[60px]">
          {children}
        </main>
      </div>
      {drawer}
    </div>
  );
}
