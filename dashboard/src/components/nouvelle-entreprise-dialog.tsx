"use client";

import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEntreprise } from "@/app/(dashboard)/entreprises/actions";

// Bouton "+ Nouvelle entreprise" (docs/roadmap.md, Sprint 5, tâche 59) : ouvre
// un formulaire minimal (nom, secteur, statut, contact) qui crée la ligne via
// la server action `createEntreprise`. Se ferme automatiquement à la création.
export function NouvelleEntrepriseDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createEntreprise({ error: null, success: false }, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setOpen(false);
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
            Ajoute une nouvelle entreprise cliente sur la plateforme.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" name="nom" required placeholder="ex. Barber Concept" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="secteur">Secteur</Label>
            <Input id="secteur" name="secteur" required placeholder="ex. Coiffure / Barbier" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="statut">Statut</Label>
            <Select name="statut" defaultValue="essai">
              <SelectTrigger id="statut" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="essai">Essai</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
                <SelectItem value="resilie">Résilié</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="emailContact">Email de contact</Label>
            <Input
              id="emailContact"
              name="emailContact"
              type="email"
              placeholder="contact@entreprise.ch"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="telephoneContact">Téléphone de contact</Label>
            <Input
              id="telephoneContact"
              name="telephoneContact"
              placeholder="+41 22 000 00 00"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Création..." : "Créer l'entreprise"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
