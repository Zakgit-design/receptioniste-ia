"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mettreAJourCoordonnees } from "@/app/(client)/app/parametres/actions";
import type { ParametresClient } from "@/app/(client)/app/parametres/data";

// Formulaire "Coordonnées" de l'écran Paramètres (docs/roadmap.md, tâche
// #65) — nom, secteur, email et téléphone de contact de l'entreprise. Même
// façon de soumettre qu'InviterMembreDialog (Sprint 6, tâche #64) :
// `useTransition` + appel direct de la Server Action, pas de rechargement de
// page.
export function CoordonneesForm({ entreprise }: { entreprise: ParametresClient["entreprise"] }) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await mettreAJourCoordonnees({ error: null }, formData);
      setError(result.error);
      setSaved(!result.error);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-[15px] shadow-[var(--shadow-panel)]">
      <h3 className="mb-3 text-[13px] font-bold text-text">Coordonnées</h3>

      <form
        action={handleSubmit}
        onChange={() => setSaved(false)}
        className="grid grid-cols-2 gap-3.5"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="nom">Nom de l&apos;entreprise</Label>
          <Input id="nom" name="nom" defaultValue={entreprise.nom} required />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="secteur">Secteur</Label>
          <Input id="secteur" name="secteur" defaultValue={entreprise.secteur} required />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="emailContact">Email de contact</Label>
          <Input
            id="emailContact"
            name="emailContact"
            type="email"
            defaultValue={entreprise.emailContact}
            placeholder="contact@exemple.ch"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="telephoneContact">Téléphone de contact</Label>
          <Input
            id="telephoneContact"
            name="telephoneContact"
            type="tel"
            defaultValue={entreprise.telephoneContact}
            placeholder="+41 22 000 00 00"
          />
        </div>

        <div className="col-span-2 flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement..." : "Enregistrer"}
          </Button>
          {saved ? <span className="text-xs font-semibold text-good">Enregistré.</span> : null}
          {error ? <span className="text-xs font-semibold text-destructive">{error}</span> : null}
        </div>
      </form>
    </div>
  );
}
