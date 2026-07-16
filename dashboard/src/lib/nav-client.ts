import type { NavGroup } from "./nav";

// Arborescence de navigation du Dashboard Client — voir
// docs/sprint6-conception.md, section 1. Un seul groupe suffit (contrairement
// à l'admin, qui en a 3) : 6 écrans, tous au même niveau.
export const navGroupsClient: NavGroup[] = [
  {
    label: "Mon entreprise",
    items: [
      { href: "/app", label: "Vue d'ensemble", icon: "LayoutDashboard" },
      { href: "/app/appels", label: "Appels", icon: "Phone" },
      { href: "/app/rendez-vous", label: "Rendez-vous", icon: "CalendarClock" },
      { href: "/app/etablissements", label: "Établissements", icon: "Building2" },
      { href: "/app/equipe", label: "Équipe et accès", icon: "Users" },
      { href: "/app/parametres", label: "Paramètres", icon: "Settings" },
    ],
  },
];
