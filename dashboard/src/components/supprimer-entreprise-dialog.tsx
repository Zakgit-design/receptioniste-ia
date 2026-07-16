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
import { supprimerEntreprise } from "@/app/(dashboard)/entreprises/actions";

// Suppression d'une entreprise depuis sa fiche détail. Irréversible (voir
// ./actions.ts pour la suppression en cascade) : confirmation par saisie
// exacte du nom, à l'image des interfaces destructives usuelles (GitHub,
// Vercel...).
export function SupprimerEntrepriseDialog({ id, nom }: { id: string; nom: string }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const confirmationValide = confirmation.trim() === nom;

  function handleSubmit() {
    startTransition(async () => {
      const result = await supprimerEntreprise(id);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setConfirmation("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Supprimer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer {nom} ?</DialogTitle>
          <DialogDescription>
            Cette action supprime définitivement l&apos;entreprise et toutes ses données
            associées (établissements, agents, services, rendez-vous, appels). Impossible à
            annuler.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5">
          <Label htmlFor="confirmation">
            Tape <span className="font-bold">{nom}</span> pour confirmer
          </Label>
          <Input
            id="confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={!confirmationValide || pending}
            onClick={handleSubmit}
          >
            {pending ? "Suppression..." : "Supprimer définitivement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
