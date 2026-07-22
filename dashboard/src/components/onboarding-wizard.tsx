"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatutBadge } from "@/components/statut-badge";
import { InviterMembreEntrepriseDialog } from "@/components/inviter-membre-entreprise-dialog";
import type { MembreOrganisation } from "@/auth";
import {
  creerEtablissement,
  creerService,
  basculerServiceActif,
  finaliserOnboarding,
  type OnboardingActionState,
} from "@/app/(dashboard)/entreprises/[id]/onboarding/actions";

// Parcours d'onboarding (Sprint A) — voir docs/sprint-log.md, 2026-07-22.
// Toutes les étapes sont affichées sur une seule page (pas de routes
// séparées par étape) : plus simple à reprendre (rien de caché, tout l'état
// déjà saisi reste visible) et permet la navigation libre entre étapes
// exigée par le fondateur. L'étape "courante" (mise en avant visuellement)
// se déduit des données reçues du serveur, jamais d'un état local qui
// pourrait se désynchroniser.

interface EtablissementAffiche {
  id: string;
  nom: string;
  adresse: string;
  joursFermeture: string[];
  nbDisponibilites: number;
}

interface ServiceAffiche {
  id: string;
  nom: string;
  dureeMinutes: number;
  prix: number | null;
  description: string | null;
  actif: boolean;
}

const JOURS = [
  { valeur: 1, label: "Lundi" },
  { valeur: 2, label: "Mardi" },
  { valeur: 3, label: "Mercredi" },
  { valeur: 4, label: "Jeudi" },
  { valeur: 5, label: "Vendredi" },
  { valeur: 6, label: "Samedi" },
  { valeur: 0, label: "Dimanche" },
];

function Section({
  numero,
  titre,
  active,
  fait,
  children,
}: {
  numero: number;
  titre: string;
  active: boolean;
  fait: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mb-3.5 rounded-lg border bg-surface px-4 py-[18px] shadow-[var(--shadow-panel)] ${
        active ? "border-signal" : "border-border"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10.5px] font-extrabold ${
            fait ? "bg-good text-white" : active ? "bg-signal text-white" : "bg-paper text-text-muted"
          }`}
        >
          {fait ? "✓" : numero}
        </span>
        <h3 className="text-[13.5px] font-bold text-text">{titre}</h3>
      </div>
      {children}
    </div>
  );
}

export function OnboardingWizard({
  entreprise,
  etablissements,
  services,
  membres,
}: {
  entreprise: {
    id: string;
    nom: string;
    secteur: string;
    adresse: string | null;
    langue: string;
    fuseauHoraire: string;
    emailContact: string | null;
    telephoneContact: string | null;
    clerkOrganizationId: string | null;
  };
  etablissements: EtablissementAffiche[];
  services: ServiceAffiche[];
  membres: MembreOrganisation[];
}) {
  const router = useRouter();
  const [erreurEtablissement, setErreurEtablissement] = useState<string | null>(null);
  const [erreurService, setErreurService] = useState<string | null>(null);
  const [erreurFinalisation, setErreurFinalisation] = useState<string | null>(null);
  const [pendingEtablissement, startEtablissement] = useTransition();
  const [pendingService, startService] = useTransition();
  const [pendingFinalisation, startFinalisation] = useTransition();

  const aEtablissement = etablissements.length > 0;
  const aService = services.length > 0;

  // Étape courante affichée en avant — déduite des données, pas d'un état séparé.
  const etapeCourante = !aEtablissement ? 2 : !aService ? 3 : 4;

  function handleEtablissement(formData: FormData) {
    startEtablissement(async () => {
      const result: OnboardingActionState = await creerEtablissement(
        entreprise.id,
        { error: null },
        formData
      );
      setErreurEtablissement(result.error);
    });
  }

  function handleService(formData: FormData) {
    startService(async () => {
      const result: OnboardingActionState = await creerService(entreprise.id, { error: null }, formData);
      setErreurService(result.error);
    });
  }

  function handleToggleService(serviceId: string, actif: boolean) {
    startService(async () => {
      await basculerServiceActif(serviceId, entreprise.id, actif);
    });
  }

  function handleFinaliser() {
    startFinalisation(async () => {
      const result = await finaliserOnboarding(entreprise.id);
      if (result.error) {
        setErreurFinalisation(result.error);
        return;
      }
      router.push(`/entreprises/${entreprise.id}`);
    });
  }

  return (
    <div className="mx-auto max-w-[720px]">
      <div className="mb-[18px]">
        <div className="text-lg font-extrabold text-text">Configurer {entreprise.nom}</div>
        <div className="mt-1 text-[12.5px] font-semibold text-text-secondary">
          Étape {etapeCourante} sur 5 — quitter et revenir reprend exactement là où tu en étais.
        </div>
      </div>

      {/* Étape 1 : toujours faite pour arriver sur cette page (entreprise en brouillon). */}
      <Section numero={1} titre={`Entreprise — ${entreprise.nom}`} active={false} fait>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px] text-text-secondary">
          <div>Secteur : {entreprise.secteur}</div>
          <div>Langue : {entreprise.langue}</div>
          <div>Adresse : {entreprise.adresse ?? "—"}</div>
          <div>Fuseau : {entreprise.fuseauHoraire}</div>
        </div>
      </Section>

      {/* Étape 2 : Établissement(s). */}
      <Section numero={2} titre="Établissement" active={etapeCourante === 2} fait={aEtablissement}>
        {etablissements.length > 0 ? (
          <div className="mb-3 flex flex-col gap-2">
            {etablissements.map((etab) => (
              <div key={etab.id} className="rounded-md border border-border bg-paper px-3 py-2 text-[12.5px]">
                <span className="font-bold text-text">{etab.nom}</span>
                <span className="ml-2 text-text-muted">{etab.adresse}</span>
                <span className="ml-2 text-text-muted">
                  · {etab.nbDisponibilites} jour{etab.nbDisponibilites !== 1 ? "s" : ""} horaire renseigné
                  {etab.nbDisponibilites !== 1 ? "s" : ""}
                  {etab.joursFermeture.length > 0
                    ? ` · ${etab.joursFermeture.length} fermeture(s) exceptionnelle(s)`
                    : ""}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <form action={handleEtablissement} className="grid gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="grid gap-1">
              <Label htmlFor="etab-nom">Nom de l&apos;établissement</Label>
              <Input id="etab-nom" name="nom" required placeholder="ex. Genève Centre" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="etab-adresse">Adresse</Label>
              <Input id="etab-adresse" name="adresse" required placeholder="Rue de l'Exemple 1" />
            </div>
          </div>

          <div>
            <Label>Horaires (laisser vide un jour = fermé ce jour-là)</Label>
            <div className="mt-1.5 grid gap-1.5">
              {JOURS.map((jour) => (
                <div key={jour.valeur} className="flex items-center gap-2 text-[12px]">
                  <span className="w-20 shrink-0 font-semibold text-text-secondary">{jour.label}</span>
                  <Input type="time" name={`heureDebut_${jour.valeur}`} className="w-32" />
                  <span className="text-text-muted">à</span>
                  <Input type="time" name={`heureFin_${jour.valeur}`} className="w-32" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="etab-fermetures">
              Jours de fermeture exceptionnelle (dates ISO séparées par des virgules)
            </Label>
            <Input id="etab-fermetures" name="joursFermeture" placeholder="2026-12-25, 2026-01-01" />
          </div>

          {erreurEtablissement ? (
            <p className="text-sm text-destructive">{erreurEtablissement}</p>
          ) : null}

          <Button type="submit" size="sm" disabled={pendingEtablissement} className="w-fit">
            {pendingEtablissement ? "Ajout..." : "+ Ajouter cet établissement"}
          </Button>
        </form>
      </Section>

      {/* Étape 3 : Catalogue de services. */}
      <Section numero={3} titre="Catalogue de services" active={etapeCourante === 3} fait={aService}>
        <p className="mb-2.5 text-[11.5px] font-semibold text-text-muted">
          Limite connue (V1) : les services sont partagés par toute l&apos;entreprise, pas encore
          spécifiques à un établissement précis — comme pour Barber Concept aujourd&apos;hui.
        </p>

        {services.length > 0 ? (
          <div className="mb-3 flex flex-col gap-1.5">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between rounded-md border border-border bg-paper px-3 py-2 text-[12.5px]"
              >
                <div>
                  <span className={`font-bold ${service.actif ? "text-text" : "text-text-muted line-through"}`}>
                    {service.nom}
                  </span>
                  <span className="ml-2 text-text-muted">
                    {service.dureeMinutes} min{service.prix !== null ? ` · ${service.prix} CHF` : ""}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleService(service.id, !service.actif)}
                >
                  {service.actif ? "Désactiver" : "Réactiver"}
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        <form action={handleService} className="grid grid-cols-4 gap-2.5">
          <div className="col-span-2 grid gap-1">
            <Label htmlFor="service-nom">Nom</Label>
            <Input id="service-nom" name="nom" required placeholder="ex. Coupe classique" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="service-duree">Durée (min)</Label>
            <Input id="service-duree" name="dureeMinutes" type="number" min="1" required />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="service-prix">Prix (facultatif)</Label>
            <Input id="service-prix" name="prix" type="number" min="0" step="0.05" />
          </div>
          <div className="col-span-4 grid gap-1">
            <Label htmlFor="service-description">Description (facultatif)</Label>
            <Input id="service-description" name="description" />
          </div>

          {erreurService ? <p className="col-span-4 text-sm text-destructive">{erreurService}</p> : null}

          <Button type="submit" size="sm" disabled={pendingService} className="col-span-4 w-fit">
            {pendingService ? "Ajout..." : "+ Ajouter ce service"}
          </Button>
        </form>
      </Section>

      {/* Étape 4 : Propriétaire et accès. */}
      <Section numero={4} titre="Propriétaire et accès" active={etapeCourante === 4} fait={membres.length > 0}>
        {entreprise.clerkOrganizationId ? (
          <>
            {membres.length > 0 ? (
              <div className="mb-2.5 flex flex-col gap-1.5">
                {membres.map((membre) => (
                  <div key={membre.email} className="flex items-center gap-2 text-[12.5px]">
                    <span className="font-bold text-text">{membre.nom}</span>
                    <span className="text-text-muted">{membre.email}</span>
                    <StatutBadge tone={membre.statut === "actif" ? "good" : "neutral"}>
                      {membre.statut === "actif" ? "Actif" : "Invitation en attente"}
                    </StatutBadge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-2.5 text-[12.5px] text-text-muted">
                Personne n&apos;a encore été invité — tu peux inviter maintenant ou différer et continuer.
              </p>
            )}
            <InviterMembreEntrepriseDialog entrepriseId={entreprise.id} />
          </>
        ) : (
          <p className="text-[12.5px] text-text-muted">
            Aucune organisation Clerk reliée à cette entreprise — invitation impossible.
          </p>
        )}
      </Section>

      {/* Étape 5 : Résumé. */}
      <Section numero={5} titre="Résumé et activation" active={etapeCourante >= 4} fait={false}>
        <div className="mb-3 grid gap-1.5 text-[12.5px]">
          <div className="flex items-center gap-2">
            <StatutBadge tone={aEtablissement ? "good" : "warn"}>
              {aEtablissement ? `${etablissements.length} établissement(s)` : "Aucun établissement"}
            </StatutBadge>
            <StatutBadge tone={aService ? "good" : "warn"}>
              {aService ? `${services.length} service(s)` : "Aucun service"}
            </StatutBadge>
            <StatutBadge tone={membres.length > 0 ? "good" : "neutral"}>
              {membres.length > 0 ? "Accès configuré" : "Accès non configuré"}
            </StatutBadge>
          </div>
          <div className="flex items-center gap-2">
            <StatutBadge tone="neutral">Assistant IA : non configuré</StatutBadge>
            <StatutBadge tone="neutral">Numéro Twilio : non configuré</StatutBadge>
            <StatutBadge tone="neutral">Calendrier : non configuré</StatutBadge>
          </div>
        </div>
        <p className="mb-3 text-[11.5px] font-semibold text-text-muted">
          Vapi, Twilio et le calendrier se configurent dans une étape séparée, une fois cette base
          enregistrée.
        </p>

        {erreurFinalisation ? <p className="mb-2 text-sm text-destructive">{erreurFinalisation}</p> : null}

        <Button
          type="button"
          disabled={!aEtablissement || !aService || pendingFinalisation}
          onClick={handleFinaliser}
        >
          {pendingFinalisation ? "Enregistrement..." : "Enregistrer et continuer plus tard"}
        </Button>
        {(!aEtablissement || !aService) && (
          <p className="mt-1.5 text-[11px] font-semibold text-text-muted">
            Au moins un établissement et un service sont nécessaires avant d&apos;enregistrer.
          </p>
        )}
      </Section>
    </div>
  );
}
