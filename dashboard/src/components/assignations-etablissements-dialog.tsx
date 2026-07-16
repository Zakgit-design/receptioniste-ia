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
import { mettreAJourAssignations } from "@/app/(client)/app/equipe/actions";
import type { EtablissementOption } from "@/app/(client)/app/equipe/data";

// Contrôle du périmètre d'un responsable d'établissement (voir
// docs/sprint6-conception.md, "Gestion des établissements assignés") : quels
// établissements de l'entreprise cette personne gère. Simple liste à cases à
// cocher — une entreprise a rarement plus de quelques établissements (Barber
// Concept : 4 salons), pas besoin de plus au MVP.
export function AssignationsEtablissementsDialog({
  clerkUserId,
  nom,
  etablissements,
  etablissementsAssignesIds,
}: {
  clerkUserId: string;
  nom: string;
  etablissements: EtablissementOption[];
  etablissementsAssignesIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<string[]>(etablissementsAssignesIds);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string, checked: boolean) {
    setSelection((current) =>
      checked ? [...current, id] : current.filter((etablissementId) => etablissementId !== id)
    );
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await mettreAJourAssignations(clerkUserId, selection);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setSelection(etablissementsAssignesIds);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Établissements ({etablissementsAssignesIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Établissements gérés par {nom}</DialogTitle>
          <DialogDescription>
            Cette personne ne verra que les établissements cochés ci-dessous.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {etablissements.length === 0 ? (
            <p className="text-sm text-text-muted">Aucun établissement pour l&apos;instant.</p>
          ) : (
            etablissements.map((etablissement) => (
              <label key={etablissement.id} className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={selection.includes(etablissement.id)}
                  onChange={(event) => toggle(etablissement.id, event.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                {etablissement.nom}
              </label>
            ))
          )}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button type="button" disabled={pending} onClick={handleSubmit}>
            {pending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
