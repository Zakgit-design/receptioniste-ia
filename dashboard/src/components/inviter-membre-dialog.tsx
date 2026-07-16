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
import { rolesAssignablesPar } from "@/lib/equipe-permissions";
import { inviterMembre } from "@/app/(client)/app/equipe/actions";

// Bouton "+ Inviter" de l'écran Équipe et accès (docs/roadmap.md, tâche #64).
// Les rôles proposés dépendent du rôle de l'utilisateur connecté (voir
// docs/sprint6-conception.md, section 2) : un propriétaire voit les 4 rôles,
// un administrateur seulement membre/responsable d'établissement. Ce n'est
// qu'un confort d'affichage — la Server Action `inviterMembre` revérifie la
// même règle (défense en profondeur).
export function InviterMembreDialog({ roleActeur }: { roleActeur: RoleUtilisateur }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rolesDisponibles = rolesAssignablesPar(roleActeur);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await inviterMembre({ error: null }, formData);
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
        <Button>+ Inviter</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
          <DialogDescription>
            Un email d&apos;invitation est envoyé pour rejoindre votre organisation.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="prenom@exemple.ch" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="role">Rôle</Label>
            <Select name="role" defaultValue={rolesDisponibles[0]}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rolesDisponibles.map((role) => (
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
