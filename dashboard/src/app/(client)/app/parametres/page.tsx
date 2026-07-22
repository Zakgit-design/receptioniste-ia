import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { StatutBadge } from "@/components/statut-badge";
import { toneForStatutAbonnement, libelleStatutAbonnement } from "@/components/statut-badge";
import { CoordonneesForm } from "@/components/coordonnees-form";
import { NotificationsForm } from "@/components/notifications-form";
import { getParametresClient } from "./data";

// Écran Paramètres du Dashboard Client — voir docs/roadmap.md, tâche #65, et
// docs/sprint6-conception.md, section 1 (contenu) et section 2 (permissions).
// Réservé aux rôles propriétaire/administrateur — responsable d'établissement
// et membre sont redirigés vers la vue d'ensemble.
//
// Défense en profondeur : cette garde de page ne suffit pas seule (un appel
// direct à une Server Action doit être bloqué aussi) — voir ./actions.ts, qui
// revérifie systématiquement le rôle de l'appelant.
export default async function ParametresClientPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "proprietaire" && user.role !== "administrateur")) {
    redirect("/app");
  }

  const parametres = await getParametresClient(user);
  if (!parametres) {
    return (
      <PlaceholderPanel
        title="Entreprise introuvable"
        description="Impossible de charger les paramètres de votre entreprise."
      />
    );
  }

  const { entreprise, abonnement } = parametres;

  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Coordonnées, préférences de notification, abonnement actuel"
      />

      <div className="grid gap-3.5">
        <CoordonneesForm entreprise={entreprise} />

        <NotificationsForm
          notifierRdvParEmail={entreprise.notifierRdvParEmail}
          notifierRdvParSms={entreprise.notifierRdvParSms}
        />

        <div className="rounded-lg border border-border bg-surface px-4 py-[15px] shadow-[var(--shadow-panel)]">
          <h3 className="mb-3 text-[13px] font-bold text-text">Abonnement actuel</h3>
          {abonnement ? (
            <div className="grid grid-cols-1 gap-x-3.5 gap-y-2 text-xs sm:grid-cols-2">
              <div>
                <div className="text-text-muted">Plan</div>
                <div className="font-semibold text-text">{abonnement.nomPlan}</div>
              </div>
              <div>
                <div className="text-text-muted">Prix</div>
                <div className="font-mono font-semibold text-text">
                  {abonnement.prixChf} CHF / {abonnement.cycleFacturation}
                </div>
              </div>
              <div>
                <div className="text-text-muted">Statut</div>
                <StatutBadge tone={toneForStatutAbonnement(abonnement.statut)}>
                  {libelleStatutAbonnement[abonnement.statut]}
                </StatutBadge>
              </div>
              <div>
                <div className="text-text-muted">Fin de la période en cours</div>
                <div className="font-semibold text-text">
                  {abonnement.finPeriodeCouranteLabel ?? "Non renseignée"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs font-semibold text-text-muted">
              Aucun abonnement actif. Contactez votre interlocuteur pour mettre en place un plan
              payant.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
