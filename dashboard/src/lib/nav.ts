import {
  LayoutDashboard,
  Building2,
  Phone,
  Wallet,
  Activity,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

// Arborescence de navigation du Dashboard Administrateur — voir
// docs/sprint5-conception.md, section 3.
export const navGroups: NavGroup[] = [
  {
    label: "Plateforme",
    items: [
      { href: "/", label: "Vue d'ensemble", icon: LayoutDashboard },
      { href: "/entreprises", label: "Entreprises", icon: Building2 },
      { href: "/appels", label: "Appels", icon: Phone },
      { href: "/finances", label: "Finances", icon: Wallet },
    ],
  },
  {
    label: "Système",
    items: [
      { href: "/sante-plateforme", label: "Santé plateforme", icon: Activity },
    ],
  },
  {
    label: "Compte",
    items: [{ href: "/utilisateurs", label: "Utilisateurs", icon: Users }],
  },
];
