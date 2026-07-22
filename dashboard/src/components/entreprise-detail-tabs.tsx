"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { EtablissementsTable } from "@/components/etablissements-table";
import { StatutBadge } from "@/components/statut-badge";
import { InviterMembreEntrepriseDialog } from "@/components/inviter-membre-entreprise-dialog";
import { libelleRoleUtilisateur } from "@/auth/roles";
import type { EntrepriseDetail } from "@/app/(dashboard)/entreprises/data";

const thClass =
  "px-4 py-[9px] text-left text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase whitespace-nowrap";

// Arborescence des onglets — docs/sprint5-conception.md, section 3 : "Vue
// d'ensemble" actif par défaut, "Établissements" développé dans cette tâche,
// "Utilisateurs" branché sur Clerk le 2026-07-22 (voir docs/sprint-log.md).
// Les 3 onglets restants demeurent des panneaux "à concevoir en détail à
// l'implémentation" (hors périmètre ici).
export function EntrepriseDetailTabs({ entreprise }: { entreprise: EntrepriseDetail }) {
  const { id, nom, rentabilite, activite, etablissements, membres, clerkOrganizationId } = entreprise;
  const margePositive = rentabilite.margeChf >= 0;

  return (
    <Tabs defaultValue="vue-ensemble">
      <TabsList>
        <TabsTrigger value="vue-ensemble">Vue d&apos;ensemble</TabsTrigger>
        <TabsTrigger value="etablissements">Établissements</TabsTrigger>
        <TabsTrigger value="assistants">Numéros &amp; assistants</TabsTrigger>
        <TabsTrigger value="calendriers">Calendriers</TabsTrigger>
        <TabsTrigger value="appels">Appels</TabsTrigger>
        <TabsTrigger value="abonnement">Abonnement</TabsTrigger>
        <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
      </TabsList>

      <TabsContent value="vue-ensemble">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface px-4 py-[15px] shadow-[var(--shadow-panel)]">
            <div className="mb-2.5 flex items-center gap-[7px]">
              <span
                className={cn("h-1.5 w-1.5 rounded-full", margePositive ? "bg-good" : "bg-critical")}
              />
              <span className="text-[11px] font-bold tracking-[0.05em] text-text-muted uppercase">
                Rentabilité (mois en cours)
              </span>
            </div>
            <div
              className={cn(
                "font-mono text-[25px] font-bold tracking-[-0.01em]",
                margePositive ? "text-text" : "text-critical"
              )}
            >
              {margePositive ? "+" : ""}
              {rentabilite.margeChf} CHF
            </div>
            <div className="mt-1 text-[11.5px] font-semibold text-text-secondary">
              {rentabilite.note}
            </div>
            <div className="mt-2.5 text-[11px] font-semibold text-text-muted">
              revenu du plan estimé {rentabilite.revenuChf} CHF − coût variable{" "}
              {rentabilite.coutVariableChf} CHF
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
              <span className="text-signal">●</span> estimé — basé sur le plan déclaré
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface px-4 py-[15px] shadow-[var(--shadow-panel)]">
            <div className="mb-2.5 flex items-center gap-[7px]">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              <span className="text-[11px] font-bold tracking-[0.05em] text-text-muted uppercase">
                Appels (7j)
              </span>
            </div>
            <div className="font-mono text-[25px] font-bold tracking-[-0.01em] text-text">
              {activite.appelsSeptJours}
            </div>
            <div className="mt-1 text-[11.5px] font-semibold text-good">
              {activite.deltaLabel}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="etablissements">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11.5px] font-semibold text-text-muted">
            Établissements, horaires et catalogue de services
          </span>
          <Button asChild size="sm" variant="outline">
            <Link href={`/entreprises/${id}/onboarding`}>Modifier établissements &amp; catalogue</Link>
          </Button>
        </div>
        <EtablissementsTable etablissements={etablissements} />
      </TabsContent>

      <TabsContent value="assistants">
        <PlaceholderPanel
          title="Numéros & assistants"
          description="Configuration Twilio/Vapi par établissement (voix, prompt, outils attachés) — écran détaillé au moment de l'implémentation."
        />
      </TabsContent>

      <TabsContent value="calendriers">
        <PlaceholderPanel
          title="Calendriers"
          description="Connexion Google Calendar par établissement, statut de synchronisation."
        />
      </TabsContent>

      <TabsContent value="appels">
        <PlaceholderPanel
          title={`Appels de ${nom}`}
          description="Même table que la vue globale « Appels », filtrée sur cette entreprise."
        />
      </TabsContent>

      <TabsContent value="abonnement">
        <PlaceholderPanel
          title="Abonnement & factures"
          description="Plan, cycle de facturation, historique des factures."
        />
      </TabsContent>

      <TabsContent value="utilisateurs">
        {clerkOrganizationId ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11.5px] font-semibold text-text-muted">
                Organisation Clerk « {nom} »
              </span>
              <InviterMembreEntrepriseDialog entrepriseId={id} />
            </div>
            {membres.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className={thClass}>Nom</th>
                      <th className={thClass}>Email</th>
                      <th className={thClass}>Rôle</th>
                      <th className={thClass}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membres.map((membre) => (
                      <tr key={membre.email} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-[11px] font-bold whitespace-nowrap text-text">
                          {membre.nom}
                        </td>
                        <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
                          {membre.email}
                        </td>
                        <td className="px-4 py-[11px] whitespace-nowrap text-text-secondary">
                          {libelleRoleUtilisateur[membre.role]}
                        </td>
                        <td className="px-4 py-[11px] whitespace-nowrap">
                          <StatutBadge tone={membre.statut === "actif" ? "good" : "neutral"}>
                            {membre.statut === "actif" ? "Actif" : "Invitation en attente"}
                          </StatutBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <PlaceholderPanel
                title="Aucun utilisateur pour l'instant"
                description={`Personne n'a encore accès au Dashboard Client de ${nom} — invite quelqu'un ci-dessus pour lui donner accès.`}
              />
            )}
          </div>
        ) : (
          <PlaceholderPanel
            title="Organisation Clerk manquante"
            description={`${nom} n'est pas encore reliée à une organisation Clerk — impossible d'inviter un utilisateur pour l'instant.`}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
