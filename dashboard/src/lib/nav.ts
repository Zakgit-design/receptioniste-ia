// Icônes disponibles pour un item de navigation, référencées par nom plutôt
// que par composant : `NavGroup`/`navGroups` doivent rester des données
// simples (sérialisables), car elles voyagent d'un layout Server Component
// (ex. `(dashboard)/layout.tsx`) vers `NavRail` (Client Component) — passer
// directement un composant lucide-react (une fonction) échouerait au build
// ("Functions cannot be passed directly to Client Components"). `NavRail`
// résout le nom vers le composant réel.
export type NavIconName =
  | "LayoutDashboard"
  | "Building2"
  | "Phone"
  | "Wallet"
  | "Activity"
  | "Users"
  | "CalendarClock"
  | "Settings";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
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
      { href: "/", label: "Vue d'ensemble", icon: "LayoutDashboard" },
      { href: "/entreprises", label: "Entreprises", icon: "Building2" },
      { href: "/appels", label: "Appels", icon: "Phone" },
      { href: "/finances", label: "Finances", icon: "Wallet" },
    ],
  },
  {
    label: "Système",
    items: [
      { href: "/sante-plateforme", label: "Santé plateforme", icon: "Activity" },
    ],
  },
  {
    label: "Compte",
    items: [{ href: "/utilisateurs", label: "Utilisateurs", icon: "Users" }],
  },
];
