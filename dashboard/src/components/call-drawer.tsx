"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Panneau latéral (drawer) de la fiche appel — voir docs/sprint5-conception.md,
// section 8. Rendu uniquement par la route interceptante
// @drawer/(.)appels/[id] : fermer le drawer revient simplement à la page
// précédente (`/appels`, qui reste montée derrière), pas de navigation vers
// une autre route.
export function CallDrawer({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") router.back();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ink/30"
        onClick={() => router.back()}
        aria-hidden="true"
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-border bg-surface shadow-xl">
        <div className="flex items-start justify-between gap-2.5 border-b border-border px-[18px] py-4">
          <div>
            <div className="text-[15px] font-extrabold text-text">{title}</div>
            <div className="mt-[3px] text-[11.5px] font-semibold text-text-muted">{subtitle}</div>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Fermer"
            className="p-0.5 text-[15px] text-text-muted hover:text-text"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-[18px] py-[18px]">{children}</div>
      </aside>
    </>
  );
}
