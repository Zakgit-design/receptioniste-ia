import Link from "next/link";
import { Search } from "lucide-react";

export function TopBar() {
  return (
    <div className="flex h-14 items-center justify-between gap-4 border-b border-border px-[22px]">
      {/* Recherche non fonctionnelle pour l'instant — écran de recherche à construire plus tard. */}
      <div className="flex max-w-[360px] flex-1 items-center gap-2 rounded-[4px] border border-border bg-paper px-2.5 py-1.5 text-text-muted">
        <Search className="h-3.5 w-3.5" />
        <span className="text-[12.5px]">
          Rechercher une entreprise, un numéro, un appel…
        </span>
      </div>

      <div className="flex items-center gap-3.5">
        <Link
          href="/sante-plateforme"
          className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-2 py-[3px] text-[10.5px] font-bold tracking-[0.04em] text-good"
        >
          ● Tous systèmes opérationnels
        </Link>
      </div>
    </div>
  );
}
