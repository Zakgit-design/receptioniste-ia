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
import type { RoleUtilisateur } from "@/generated/prisma/enums";
import { libelleRoleUtilisateur } from "@/auth/roles";
import { inviterMembreEntreprise } from "@/app/(dashboard)/entreprises/actions";

const ROLES_ORGANISATION: RoleUtilisateur[] = [
  "proprietaire",
  "administrateur",
  "responsable_etablissement",
  "membre",
];

// Bouton "+ Inviter" de l'onglet Utilisateurs d'une fiche entreprise
// (Dashboard Administrateur) — voir docs/sprint-log.md, 2026-07-22. Contexte
// déjà fixé par la page (cette entreprise précise) : contrairement à
// InviterUtilisateurDialog (écran global Utilisateurs), pas de sélecteur
// d'entreprise ici, juste email + rôle.
export function InviterMembreEntrepriseDialog({ entrepriseId }: { entrepriseId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await inviterMembreEntreprise(entrepriseId, { error: null }, formData);
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
        <Button size="sm">+ Inviter</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
          <DialogDescription>
            Un email d&apos;invitation Clerk est envoyé directement pour rejoindre cette
            entreprise.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="prenom@exemple.ch" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="role">Rôle</Label>
            <Select name="role" defaultValue="proprietaire">
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES_ORGANISATION.map((role) => (
                  <SelectItem key={role} value={role}>
                    {libelleRoleUtilisateur[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Envoi..." : "Envoyer l'invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
