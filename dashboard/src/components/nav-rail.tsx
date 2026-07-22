"use client";

import { useState } from "react";
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
  Menu,
  type LucideIcon,
} from "lucide-react";
import type { NavGroup, NavIconName } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { getOverviewData } from "@/app/(dashboard)/data";
import { UserButton } from "@/auth/ui";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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

// Marque "Standard" (logo + nom) — extrait pour être identique en tête de la
// sidebar desktop et du menu mobile, jamais dupliqué visuellement.
function BrandMark({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-center gap-[9px] px-1.5">
      <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[4px] bg-ink text-paper">
        <Phone className="h-[13px] w-[13px]" strokeWidth={2.5} />
      </div>
      <div>
        <div className="text-sm font-bold tracking-[-0.01em] text-text">Standard</div>
        <div className="text-[10.5px] font-semibold tracking-[0.06em] text-text-muted uppercase">
          Réceptionniste IA · {subtitle}
        </div>
      </div>
    </div>
  );
}

// Liste de navigation (groupes + items) — partagée entre la sidebar desktop
// et le menu mobile pour ne jamais coder deux fois le même comportement
// (item actif, badge du centre d'actions...). `onNavigate` ferme le menu
// mobile après un clic ; `undefined` sur desktop (rien à fermer).
function NavList({
  groups,
  actionsOuvertes,
  onNavigate,
}: {
  groups: NavGroup[];
  actionsOuvertes: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
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
                  onClick={onNavigate}
                  className={cn(
                    "flex w-full items-center gap-[9px] rounded-[4px] px-2.5 py-[7px] text-[13px] font-semibold text-text-secondary transition-colors",
                    isActive ? "bg-ink text-paper" : "hover:bg-paper hover:text-text"
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
  );
}

function useActionsOuvertes() {
  // Compteur du centre d'actions, visible depuis tout écran (voir
  // docs/sprint5-conception.md, section 2) — même source de données que la
  // Vue d'ensemble, à remplacer par une vraie requête quand la base sera prête.
  return getOverviewData().actionsRequises.filter((item) => item.statut === "nouveau").length;
}

// Rail de navigation desktop — inchangé visuellement, seulement caché sous
// 768px (voir MobileNav ci-dessous pour l'équivalent mobile). Partagé par le
// Dashboard Administrateur et le Dashboard Client (voir
// docs/sprint6-conception.md) : chaque layout passe son propre jeu de
// navigation (`src/lib/nav.ts` / `src/lib/nav-client.ts`).
export function NavRail({
  groups,
  subtitle = "Admin",
}: {
  groups: NavGroup[];
  subtitle?: string;
}) {
  const actionsOuvertes = useActionsOuvertes();

  return (
    <aside className="hidden w-[232px] shrink-0 flex-col gap-[22px] border-r border-border bg-surface px-3 py-[18px] md:flex">
      <BrandMark subtitle={subtitle} />
      <NavList groups={groups} actionsOuvertes={actionsOuvertes} />
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

// Équivalent mobile du rail de navigation : bouton hamburger dans la barre
// supérieure (voir top-bar.tsx) ouvrant un panneau coulissant avec la même
// liste de navigation. Un seul composant, réutilisé par les deux dashboards
// via TopBar — jamais dupliqué entre Admin et Client.
export function MobileNav({
  groups,
  subtitle = "Admin",
}: {
  groups: NavGroup[];
  subtitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const actionsOuvertes = useActionsOuvertes();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 md:hidden"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-[22px] px-3 py-[18px]">
        <SheetTitle>Menu de navigation</SheetTitle>
        <BrandMark subtitle={subtitle} />
        <NavList
          groups={groups}
          actionsOuvertes={actionsOuvertes}
          onNavigate={() => setOpen(false)}
        />
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
      </SheetContent>
    </Sheet>
  );
}
