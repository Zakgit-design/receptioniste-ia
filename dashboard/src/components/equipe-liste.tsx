"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { StatutBadge } from "@/components/statut-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { RoleUtilisateur } from "@/generated/prisma/enums";
import type { MembreOrganisation } from "@/auth";
import { libelleRoleUtilisateur } from "@/auth/roles";
import { peutGererRole, rolesAssignablesPar } from "@/lib/equipe-permissions";
import { changerRole, retirer, annulerInvitation } from "@/app/(client)/app/equipe/actions";
import type { EtablissementOption } from "@/app/(client)/app/equipe/data";
import { AssignationsEtablissementsDialog } from "@/components/assignations-etablissements-dialog";

const thClass =
  "px-4 py-[9px] text-left text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase whitespace-nowrap";

// Liste de l'écran Équipe et accès (docs/roadmap.md, tâche #64) — membres
// actifs et invitations en attente d'une même organisation Clerk, avec les
// actions autorisées par docs/sprint6-conception.md, section 2. Chaque action
// n'est qu'un raccourci d'UI : la vérification qui compte vit dans les Server
// Actions (src/app/(client)/app/equipe/actions.ts), rappelées ici en
// commentaire pour éviter toute confusion sur qui protège quoi.
export function EquipeListe({
  membres,
  etablissements,
  assignationsParClerkUserId,
  roleActeur,
  clerkUserIdActeur,
}: {
  membres: MembreOrganisation[];
  etablissements: EtablissementOption[];
  assignationsParClerkUserId: Record<string, string[]>;
  roleActeur: RoleUtilisateur;
  clerkUserIdActeur: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-border">
            <th className={thClass}>Nom</th>
            <th className={thClass}>Email</th>
            <th className={thClass}>Rôle</th>
            <th className={thClass}>Statut</th>
            <th className={thClass}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {membres.map((membre) => (
            <MembreRow
              key={membre.statut === "actif" ? membre.clerkUserId : `invitation-${membre.invitationId}`}
              membre={membre}
              etablissements={etablissements}
              etablissementsAssignes={assignationsParClerkUserId[membre.clerkUserId] ?? []}
              roleActeur={roleActeur}
              estSoiMeme={membre.statut === "actif" && membre.clerkUserId === clerkUserIdActeur}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MembreRow({
  membre,
  etablissements,
  etablissementsAssignes,
  roleActeur,
  estSoiMeme,
}: {
  membre: MembreOrganisation;
  etablissements: EtablissementOption[];
  etablissementsAssignes: string[];
  roleActeur: RoleUtilisateur;
  estSoiMeme: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Garde-fou "bon sens" (docs/sprint6-conception.md) : on ne peut pas se
  // retirer soi-même, ni changer son propre rôle, depuis cet écran.
  const peutGerer = membre.statut === "actif" && !estSoiMeme && peutGererRole(roleActeur, membre.role);
  const optionsRole = Array.from(new Set([membre.role, ...rolesAssignablesPar(roleActeur)]));

  function handleChangerRole(nouveauRole: string) {
    startTransition(async () => {
      const result = await changerRole(membre.clerkUserId, nouveauRole as RoleUtilisateur);
      setError(result.error);
    });
  }

  function handleRetirer() {
    startTransition(async () => {
      const result = await retirer(membre.clerkUserId);
      setError(result.error);
    });
  }

  function handleAnnulerInvitation() {
    startTransition(async () => {
      const result = await annulerInvitation(membre.invitationId as string);
      setError(result.error);
    });
  }

  const peutAnnulerInvitation =
    membre.statut === "invitation_en_attente" && peutGererRole(roleActeur, membre.role);

  return (
    <tr className="border-b border-border align-top last:border-b-0">
      <td className="px-4 py-[11px] font-bold whitespace-nowrap text-text">{membre.nom}</td>
      <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
        {membre.email}
      </td>
      <td className="px-4 py-[11px] whitespace-nowrap">
        {peutGerer ? (
          <Select defaultValue={membre.role} onValueChange={handleChangerRole} disabled={pending}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {optionsRole.map((role) => (
                <SelectItem key={role} value={role}>
                  {libelleRoleUtilisateur[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-text-secondary">{libelleRoleUtilisateur[membre.role]}</span>
        )}
      </td>
      <td className="px-4 py-[11px] whitespace-nowrap">
        <StatutBadge tone={membre.statut === "actif" ? "good" : "neutral"}>
          {membre.statut === "actif" ? "Actif" : "Invitation en attente"}
        </StatutBadge>
      </td>
      <td className="px-4 py-[11px]">
        <div className="flex flex-wrap items-center gap-2">
          {membre.statut === "actif" && membre.role === "responsable_etablissement" ? (
            <AssignationsEtablissementsDialog
              clerkUserId={membre.clerkUserId}
              nom={membre.nom}
              etablissements={etablissements}
              etablissementsAssignesIds={etablissementsAssignes}
            />
          ) : null}

          {peutGerer ? (
            <RetirerMembreDialog nom={membre.nom} pending={pending} onConfirm={handleRetirer} />
          ) : null}

          {peutAnnulerInvitation ? (
            <Button variant="outline" size="sm" disabled={pending} onClick={handleAnnulerInvitation}>
              Annuler l&apos;invitation
            </Button>
          ) : null}

          {estSoiMeme ? <span className="text-text-muted">Vous</span> : null}
          {membre.statut === "actif" && !estSoiMeme && !peutGerer ? (
            <span className="text-text-muted">—</span>
          ) : null}
        </div>
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </td>
    </tr>
  );
}

function RetirerMembreDialog({
  nom,
  pending,
  onConfirm,
}: {
  nom: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Retirer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirer {nom} ?</DialogTitle>
          <DialogDescription>
            Cette personne perd immédiatement l&apos;accès à votre organisation. Elle pourra être
            réinvitée plus tard si besoin.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {pending ? "Retrait..." : "Retirer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
