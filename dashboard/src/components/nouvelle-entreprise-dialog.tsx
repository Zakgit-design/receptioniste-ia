"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEntreprise } from "@/app/(dashboard)/entreprises/actions";

// Bouton "+ Nouvelle entreprise" — Étape 1 de l'onboarding admin (voir
// docs/roadmap.md, Sprint 5 tâche 59 ; étendu Sprint A onboarding
// industrialisé, 2026-07-22). Crée toujours l'entreprise en statut
// `brouillon` (plus de sélecteur de statut ici) puis redirige vers son
// parcours d'onboarding — ne se contente plus de fermer la fenêtre.
export function NouvelleEntrepriseDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createEntreprise(
        { error: null, success: false, entrepriseId: null },
        formData
      );
      if (result.error || !result.entrepriseId) {
        setError(result.error ?? "Erreur inattendue.");
        return;
      }
      setError(null);
      setOpen(false);
      router.push(`/entreprises/${result.entrepriseId}/onboarding`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Nouvelle entreprise</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle entreprise</DialogTitle>
          <DialogDescription>
            Étape 1 sur 5 — les étapes suivantes (établissement, catalogue, accès) se
            configurent juste après.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="nom">Nom commercial</Label>
            <Input id="nom" name="nom" required placeholder="ex. Ms Savané" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="secteur">Secteur d&apos;activité</Label>
            <Input id="secteur" name="secteur" required placeholder="ex. Coiffure / Barbier" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="adresse">Adresse</Label>
            <Input id="adresse" name="adresse" placeholder="Rue de l'Exemple 1, Genève" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="langue">Langue</Label>
              <Input id="langue" name="langue" defaultValue="fr" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fuseauHoraire">Fuseau horaire</Label>
              <Input id="fuseauHoraire" name="fuseauHoraire" defaultValue="Europe/Zurich" />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="emailContact">Email principal</Label>
            <Input
              id="emailContact"
              name="emailContact"
              type="email"
              placeholder="contact@entreprise.ch"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="telephoneContact">Téléphone principal</Label>
            <Input
              id="telephoneContact"
              name="telephoneContact"
              placeholder="+41 22 000 00 00"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Création..." : "Créer et continuer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
