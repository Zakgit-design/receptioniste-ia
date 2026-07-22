"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatutBadge } from "@/components/statut-badge";
import { InviterMembreEntrepriseDialog } from "@/components/inviter-membre-entreprise-dialog";
import type { MembreOrganisation } from "@/auth";
import type { StatutEntreprise } from "@/generated/prisma/enums";
import {
  creerEtablissement,
  mettreAJourEtablissement,
  creerService,
  basculerServiceActif,
  finaliserOnboarding,
  type OnboardingActionState,
} from "@/app/(dashboard)/entreprises/[id]/onboarding/actions";

// Parcours d'onboarding + écran de modification permanent (Sprint A, étendu
// 2026-07-22) — voir docs/sprint-log.md. Toutes les sections sont affichées
// sur une seule page (pas de routes séparées par étape) : plus simple à
// reprendre (rien de caché, tout l'état déjà saisi reste visible) et permet
// la navigation libre entre sections exigée par le fondateur. Reste
// accessible après la fin de l'onboarding (statut != brouillon) — ajouter un
// établissement/service ou modifier les horaires existants doit rester
// possible à tout moment, pas seulement pendant la configuration initiale.

interface DisponibiliteAffichee {
  jourSemaine: number;
  heureDebut: string; // HH:MM
  heureFin: string; // HH:MM
}

interface EtablissementAffiche {
  id: string;
  nom: string;
  adresse: string;
  joursFermeture: string[];
  disponibilites: DisponibiliteAffichee[];
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

/** Formulaire établissement — réutilisé pour la création et la modification. */
function EtablissementForm({
  entrepriseId,
  existant,
  onSubmitted,
}: {
  entrepriseId: string;
  existant?: EtablissementAffiche;
  onSubmitted?: () => void;
}) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const horairesInitiaux = Object.fromEntries(
    JOURS.map((jour) => {
      const dispo = existant?.disponibilites.find((d) => d.jourSemaine === jour.valeur);
      return [jour.valeur, { debut: dispo?.heureDebut ?? "", fin: dispo?.heureFin ?? "" }];
    })
  ) as Record<number, { debut: string; fin: string }>;

  const [horaires, setHoraires] = useState(horairesInitiaux);
  // "Ouvert" (quels jours) et "24h/24" (durée d'ouverture ce jour-là) sont deux
  // réglages indépendants — un établissement peut être ouvert 24h/24 mais
  // fermé le dimanche, ou ouvert tous les jours avec des horaires normaux.
  const [ouverts, setOuverts] = useState<Record<number, boolean>>(
    Object.fromEntries(JOURS.map((jour) => [jour.valeur, horairesInitiaux[jour.valeur].debut !== ""])) as Record<
      number,
      boolean
    >
  );

  function majJour(jourValeur: number, champ: "debut" | "fin", valeur: string) {
    setHoraires((precedent) => ({ ...precedent, [jourValeur]: { ...precedent[jourValeur], [champ]: valeur } }));
  }

  function toggleJourOuvert(jourValeur: number, ouvert: boolean) {
    setOuverts((precedent) => ({ ...precedent, [jourValeur]: ouvert }));
    // En ouvrant un jour qui n'avait jamais d'horaire, propose un défaut raisonnable plutôt que de laisser vide.
    if (ouvert && !horaires[jourValeur].debut) {
      setHoraires((precedent) => ({ ...precedent, [jourValeur]: { debut: "09:00", fin: "18:00" } }));
    }
  }

  /** Raccourci "7j/7" : ouvre tous les jours, sans toucher à la durée d'ouverture de chacun. */
  function toutOuvrir() {
    setOuverts(Object.fromEntries(JOURS.map((jour) => [jour.valeur, true])) as Record<number, boolean>);
    setHoraires((precedent) =>
      Object.fromEntries(
        JOURS.map((jour) => [
          jour.valeur,
          precedent[jour.valeur].debut ? precedent[jour.valeur] : { debut: "09:00", fin: "18:00" },
        ])
      ) as Record<number, { debut: string; fin: string }>
    );
  }

  /** Raccourci "24h/24" : étend les jours déjà ouverts à la journée complète — ne touche jamais un jour fermé. */
  function remplir2424SurJoursOuverts() {
    setHoraires((precedent) =>
      Object.fromEntries(
        JOURS.map((jour) => [
          jour.valeur,
          ouverts[jour.valeur] ? { debut: "00:00", fin: "23:59" } : precedent[jour.valeur],
        ])
      ) as Record<number, { debut: string; fin: string }>
    );
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result: OnboardingActionState = existant
        ? await mettreAJourEtablissement(existant.id, entrepriseId, { error: null }, formData)
        : await creerEtablissement(entrepriseId, { error: null }, formData);
      setErreur(result.error);
      if (!result.error) onSubmitted?.();
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="grid gap-1">
          <Label htmlFor={`etab-nom-${existant?.id ?? "nouveau"}`}>Nom de l&apos;établissement</Label>
          <Input
            id={`etab-nom-${existant?.id ?? "nouveau"}`}
            name="nom"
            required
            defaultValue={existant?.nom}
            placeholder="ex. Genève Centre"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`etab-adresse-${existant?.id ?? "nouveau"}`}>Adresse</Label>
          <Input
            id={`etab-adresse-${existant?.id ?? "nouveau"}`}
            name="adresse"
            required
            defaultValue={existant?.adresse}
            placeholder="Rue de l'Exemple 1"
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <Label className="mb-0">Horaires</Label>
          <Button type="button" variant="outline" size="xs" onClick={toutOuvrir}>
            Ouvrir tous les jours (7j/7)
          </Button>
          <Button type="button" variant="outline" size="xs" onClick={remplir2424SurJoursOuverts}>
            24h/24 sur les jours ouverts
          </Button>
        </div>
        <p className="mb-1.5 text-[11px] font-semibold text-text-muted">
          Les deux réglages sont indépendants — un établissement peut être ouvert 24h/24 mais fermé
          le dimanche, par exemple.
        </p>
        <div className="grid gap-1.5">
          {JOURS.map((jour) => (
            <div key={jour.valeur} className="flex items-center gap-2 text-[12px]">
              <label className="flex w-24 shrink-0 items-center gap-1.5 font-semibold text-text-secondary">
                <input
                  type="checkbox"
                  checked={ouverts[jour.valeur]}
                  onChange={(event) => toggleJourOuvert(jour.valeur, event.target.checked)}
                />
                {jour.label}
              </label>
              <Input
                type="time"
                name={`heureDebut_${jour.valeur}`}
                className="w-32"
                value={horaires[jour.valeur].debut}
                onChange={(event) => majJour(jour.valeur, "debut", event.target.value)}
                disabled={!ouverts[jour.valeur]}
              />
              <span className="text-text-muted">à</span>
              <Input
                type="time"
                name={`heureFin_${jour.valeur}`}
                className="w-32"
                value={horaires[jour.valeur].fin}
                onChange={(event) => majJour(jour.valeur, "fin", event.target.value)}
                disabled={!ouverts[jour.valeur]}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-1">
        <Label htmlFor={`etab-fermetures-${existant?.id ?? "nouveau"}`}>
          Jours de fermeture exceptionnelle (dates ISO séparées par des virgules)
        </Label>
        <Input
          id={`etab-fermetures-${existant?.id ?? "nouveau"}`}
          name="joursFermeture"
          defaultValue={existant?.joursFermeture.join(", ")}
          placeholder="2026-12-25, 2026-01-01"
        />
      </div>

      {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}

      <Button type="submit" size="sm" disabled={pending} className="w-fit">
        {pending
          ? "Enregistrement..."
          : existant
            ? "Enregistrer les modifications"
            : "+ Ajouter cet établissement"}
      </Button>
    </form>
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
    statut: StatutEntreprise;
  };
  etablissements: EtablissementAffiche[];
  services: ServiceAffiche[];
  membres: MembreOrganisation[];
}) {
  const router = useRouter();
  const enBrouillon = entreprise.statut === "brouillon";
  const [etablissementEnEdition, setEtablissementEnEdition] = useState<string | null>(null);
  const [ajoutEtablissementOuvert, setAjoutEtablissementOuvert] = useState(etablissements.length === 0);
  const [erreurService, setErreurService] = useState<string | null>(null);
  const [erreurFinalisation, setErreurFinalisation] = useState<string | null>(null);
  const [pendingService, startService] = useTransition();
  const [pendingFinalisation, startFinalisation] = useTransition();

  const aEtablissement = etablissements.length > 0;
  const aService = services.length > 0;

  // Étape "en avant" — seulement pertinente pendant le brouillon (pré-activation).
  const etapeCourante = !enBrouillon ? 5 : !aEtablissement ? 2 : !aService ? 3 : 4;

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
      <div className="mb-[18px] flex items-center justify-between">
        <div>
          <div className="text-lg font-extrabold text-text">
            {enBrouillon ? `Configurer ${entreprise.nom}` : `Établissements, catalogue et accès — ${entreprise.nom}`}
          </div>
          <div className="mt-1 text-[12.5px] font-semibold text-text-secondary">
            {enBrouillon
              ? `Étape ${etapeCourante} sur 5 — quitter et revenir reprend exactement là où tu en étais.`
              : "Modifiable à tout moment — les changements sont enregistrés immédiatement."}
          </div>
        </div>
        {!enBrouillon ? (
          <Link
            href={`/entreprises/${entreprise.id}`}
            className="text-xs font-bold text-text-secondary hover:text-text"
          >
            ← Retour à la fiche
          </Link>
        ) : null}
      </div>

      {enBrouillon ? (
        <Section numero={1} titre={`Entreprise — ${entreprise.nom}`} active={false} fait>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px] text-text-secondary">
            <div>Secteur : {entreprise.secteur}</div>
            <div>Langue : {entreprise.langue}</div>
            <div>Adresse : {entreprise.adresse ?? "—"}</div>
            <div>Fuseau : {entreprise.fuseauHoraire}</div>
          </div>
        </Section>
      ) : null}

      {/* Établissement(s). */}
      <Section numero={2} titre="Établissements" active={etapeCourante === 2} fait={aEtablissement}>
        {etablissements.length > 0 ? (
          <div className="mb-3 flex flex-col gap-2">
            {etablissements.map((etab) => (
              <div key={etab.id} className="rounded-md border border-border bg-paper px-3 py-2 text-[12.5px]">
                {etablissementEnEdition === etab.id ? (
                  <div>
                    <EtablissementForm
                      entrepriseId={entreprise.id}
                      existant={etab}
                      onSubmitted={() => setEtablissementEnEdition(null)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1.5"
                      onClick={() => setEtablissementEnEdition(null)}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-text">{etab.nom}</span>
                      <span className="ml-2 text-text-muted">{etab.adresse}</span>
                      <span className="ml-2 text-text-muted">
                        · {etab.disponibilites.length} jour{etab.disponibilites.length !== 1 ? "s" : ""} horaire
                        renseigné{etab.disponibilites.length !== 1 ? "s" : ""}
                        {etab.joursFermeture.length > 0
                          ? ` · ${etab.joursFermeture.length} fermeture(s) exceptionnelle(s)`
                          : ""}
                      </span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEtablissementEnEdition(etab.id)}>
                      Modifier
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {ajoutEtablissementOuvert ? (
          <EtablissementForm entrepriseId={entreprise.id} onSubmitted={() => {}} />
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setAjoutEtablissementOuvert(true)}>
            + Ajouter un autre établissement
          </Button>
        )}
      </Section>

      {/* Catalogue de services. */}
      <Section numero={3} titre="Catalogue de services" active={etapeCourante === 3} fait={aService}>
        <p className="mb-2.5 text-[11.5px] font-semibold text-text-muted">
          Limite connue (V1) : les services sont partagés par toute l&apos;entreprise, pas encore
          spécifiques à un établissement précis — comme pour Barber Concept aujourd&apos;hui. Aucune
          limite en revanche sur le nombre de services que tu peux ajouter.
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

      {/* Propriétaire et accès. */}
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

      {/* Résumé — seulement pendant le brouillon ; une fois actif, rien à "finaliser". */}
      {enBrouillon ? (
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
            enregistrée. Tu pourras toujours revenir modifier établissements et catalogue après coup.
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
      ) : null}
    </div>
  );
}
