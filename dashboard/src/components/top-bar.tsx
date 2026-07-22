import Link from "next/link";
import { Phone, Search } from "lucide-react";
import type { NavGroup } from "@/lib/nav";
import { MobileNav } from "@/components/nav-rail";

// `groups`/`subtitle` alimentent uniquement le menu mobile (voir
// nav-rail.tsx) : sous 768px, le rail de navigation desktop est caché, la
// marque "Standard" doit donc rester visible ici pour que la page ne perde
// jamais son identité, et un bouton hamburger remplace l'accès à la nav.
export function TopBar({ groups, subtitle = "Admin" }: { groups: NavGroup[]; subtitle?: string }) {
  return (
    <div className="flex h-14 items-center justify-between gap-2.5 border-b border-border px-3 md:gap-4 md:px-[22px]">
      <div className="flex items-center gap-2 md:hidden">
        <MobileNav groups={groups} subtitle={subtitle} />
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[4px] bg-ink text-paper">
          <Phone className="h-[13px] w-[13px]" strokeWidth={2.5} />
        </div>
      </div>

      {/* Recherche non fonctionnelle pour l'instant — écran de recherche à construire plus tard.
          Masquée sous md : ne mérite pas la place qu'elle prendrait sur mobile. */}
      <div className="hidden max-w-[360px] flex-1 items-center gap-2 rounded-[4px] border border-border bg-paper px-2.5 py-1.5 text-text-muted md:flex">
        <Search className="h-3.5 w-3.5" />
        <span className="text-[12.5px]">
          Rechercher une entreprise, un numéro, un appel…
        </span>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3.5 md:flex-none">
        <Link
          href="/sante-plateforme"
          className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-2 py-[3px] text-[10.5px] font-bold tracking-[0.04em] text-good"
        >
          <span className="md:hidden">●</span>
          <span className="hidden md:inline">● Tous systèmes opérationnels</span>
        </Link>
      </div>
    </div>
  );
}
