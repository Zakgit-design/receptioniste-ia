import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { EquipeListe } from "@/components/equipe-liste";
import { InviterMembreDialog } from "@/components/inviter-membre-dialog";
import { getEquipeClient } from "./data";

// Écran Équipe et accès du Dashboard Client — voir docs/roadmap.md, tâche
// #64, et docs/sprint6-conception.md, section 2 (tableau exact des
// permissions). Réservé aux rôles propriétaire/administrateur — responsable
// d'établissement et membre sont redirigés vers la vue d'ensemble.
//
// Défense en profondeur : cette garde de page ne suffit pas seule (un appel
// direct à une Server Action doit être bloqué aussi) — voir ./actions.ts, qui
// revérifie systématiquement le rôle de l'appelant.
export default async function EquipeClientPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "proprietaire" && user.role !== "administrateur")) {
    redirect("/app");
  }

  const equipe = await getEquipeClient(user);
  if (!equipe) {
    return (
      <PlaceholderPanel
        title="Organisation non configurée"
        description="Cette entreprise n'est pas encore reliée à une organisation Clerk — impossible d'afficher son équipe."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Équipe et accès"
        subtitle="Membres de l'organisation, invitations, rôles"
        action={<InviterMembreDialog roleActeur={user.role} />}
      />
      {equipe.membres.length === 0 ? (
        <PlaceholderPanel description="Aucun membre pour l'instant. Invitez la première personne de votre équipe." />
      ) : (
        <EquipeListe
          membres={equipe.membres}
          etablissements={equipe.etablissements}
          assignationsParClerkUserId={equipe.assignationsParClerkUserId}
          roleActeur={user.role}
          clerkUserIdActeur={user.clerkUserId}
        />
      )}
    </div>
  );
}
