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
import { inviterUtilisateur } from "@/app/(dashboard)/utilisateurs/actions";

const ROLES_ORGANISATION: RoleUtilisateur[] = [
  "proprietaire",
  "administrateur",
  "responsable_etablissement",
  "membre",
];

export interface EntrepriseOption {
  /** organizationId Clerk (pas Entreprise.id) — c'est ce que porte la valeur du champ "cible". */
  clerkOrganizationId: string;
  nom: string;
}

// Bouton "+ Inviter un utilisateur" de l'écran Utilisateurs (Dashboard
// Administrateur) — voir docs/sprint-log.md, 2026-07-22. Deux destinataires
// possibles, contrairement à InviterMembreDialog (Dashboard Client, qui
// n'invite que dans une seule organisation) : un admin plateforme (aucune
// organisation, voir auth/inviterAdminPlateforme) ou un membre d'une
// entreprise précise (même mécanisme que le Dashboard Client, avec un
// sélecteur d'entreprise en plus).
export function InviterUtilisateurDialog({ entreprises }: { entreprises: EntrepriseOption[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cible, setCible] = useState<string>("admin_plateforme");
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await inviterUtilisateur({ error: null }, formData);
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
        <Button>+ Inviter un utilisateur</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un utilisateur</DialogTitle>
          <DialogDescription>
            Un email d&apos;invitation Clerk est envoyé directement.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="prenom@exemple.ch" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cible">Destinataire</Label>
            <Select name="cible" value={cible} onValueChange={setCible}>
              <SelectTrigger id="cible" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin_plateforme">Admin plateforme</SelectItem>
                {entreprises.map((entreprise) => (
                  <SelectItem key={entreprise.clerkOrganizationId} value={entreprise.clerkOrganizationId}>
                    {entreprise.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {cible !== "admin_plateforme" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="role">Rôle</Label>
              <Select name="role" defaultValue="membre">
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
          ) : null}

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
