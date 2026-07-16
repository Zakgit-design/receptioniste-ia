"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Phone,
  LayoutDashboard,
  Building2,
  Wallet,
  Activity,
  Users,
  CalendarClock,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { NavGroup, NavIconName } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { getOverviewData } from "@/app/(dashboard)/data";
import { UserButton } from "@/auth/ui";

// Résout un nom d'icône (donnée sérialisable, voir src/lib/nav.ts) vers son
// composant lucide-react réel — ne vit que dans ce composant client.
const icons: Record<NavIconName, LucideIcon> = {
  LayoutDashboard,
  Building2,
  Phone,
  Wallet,
  Activity,
  Users,
  CalendarClock,
  Settings,
};

// Rail de navigation partagé par le Dashboard Administrateur et le Dashboard
// Client (voir docs/sprint6-conception.md) : chaque layout passe son propre
// jeu de navigation (`src/lib/nav.ts` / `src/lib/nav-client.ts`), le composant
// ne connaît que la forme générique `NavGroup`.
export function NavRail({
  groups,
  subtitle = "Admin",
}: {
  groups: NavGroup[];
  subtitle?: string;
}) {
  const pathname = usePathname();
  // Compteur du centre d'actions, visible depuis tout écran (voir
  // docs/sprint5-conception.md, section 2) — même source de données que la
  // Vue d'ensemble, à remplacer par une vraie requête quand la base sera prête.
  const actionsOuvertes = getOverviewData().actionsRequises.filter(
    (item) => item.statut === "nouveau"
  ).length;

  return (
    <aside className="flex w-[232px] shrink-0 flex-col gap-[22px] border-r border-border bg-surface px-3 py-[18px]">
      <div className="flex items-center gap-[9px] px-1.5">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[4px] bg-ink text-paper">
          <Phone className="h-[13px] w-[13px]" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-sm font-bold tracking-[-0.01em] text-text">
            Standard
          </div>
          <div className="text-[10.5px] font-semibold tracking-[0.06em] text-text-muted uppercase">
            Réceptionniste IA · {subtitle}
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-[18px]">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="mb-1.5 px-2.5 text-[10.5px] font-bold tracking-[0.07em] text-text-muted uppercase">
              {group.label}
            </div>
            <div className="flex flex-col gap-px">
              {group.items.map((item) => {
                // Item "racine" (`exact: true`) actif seulement sur la page exacte,
                // les autres sur leurs sous-routes aussi (voir src/lib/nav.ts).
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = icons[item.icon];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex w-full items-center gap-[9px] rounded-[4px] px-2.5 py-[7px] text-[13px] font-semibold text-text-secondary transition-colors",
                      isActive
                        ? "bg-ink text-paper"
                        : "hover:bg-paper hover:text-text"
                    )}
                  >
                    <Icon className="h-[15px] w-[15px] shrink-0 opacity-85" />
                    {item.label}
                    {item.href === "/" && actionsOuvertes > 0 && (
                      <span className="ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-critical px-[5px] text-[10.5px] font-extrabold text-white">
                        {actionsOuvertes}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2 border-t border-border pt-3 pl-1.5">
        <UserButton
          showName
          appearance={{
            elements: {
              rootBox: "w-full",
              userButtonBox: "flex-row-reverse gap-2 w-full",
              userButtonOuterIdentifier: "text-[12.5px] font-bold text-text pl-0",
              avatarBox: "h-[26px] w-[26px]",
            },
          }}
        />
      </div>
    </aside>
  );
}
