"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, inviteUser, inviterAdminPlateforme } from "@/auth";
import type { RoleUtilisateur } from "@/generated/prisma/enums";

// Server Action du bouton "+ Inviter un utilisateur" (écran Utilisateurs,
// Dashboard Administrateur). Défense en profondeur (même principe que
// (client)/app/equipe/actions.ts) : la page n'est déjà accessible qu'aux
// comptes sans organisation active (voir proxy.ts), mais cette action
// revérifie elle-même que l'appelant est bien admin_plateforme — jamais
// supposé depuis la seule navigation.

export interface InviterUtilisateurState {
  error: string | null;
}

const ROLES_ORGANISATION: RoleUtilisateur[] = [
  "proprietaire",
  "administrateur",
  "responsable_etablissement",
  "membre",
];

export async function inviterUtilisateur(
  _prevState: InviterUtilisateurState,
  formData: FormData
): Promise<InviterUtilisateurState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin_plateforme") {
    return { error: "Action réservée aux administrateurs plateforme." };
  }

  const email = formData.get("email");
  const cible = formData.get("cible");
  if (typeof email !== "string" || !email) {
    return { error: "Email requis." };
  }
  if (typeof cible !== "string" || !cible) {
    return { error: "Destinataire requis." };
  }

  try {
    if (cible === "admin_plateforme") {
      await inviterAdminPlateforme(email);
    } else {
      const role = formData.get("role");
      if (typeof role !== "string" || !ROLES_ORGANISATION.includes(role as RoleUtilisateur)) {
        return { error: "Rôle invalide." };
      }
      // `cible` porte ici l'organizationId Clerk de l'entreprise choisie
      // (voir InviterUtilisateurDialog — jamais l'id interne Entreprise.id).
      await inviteUser(email, cible, role as RoleUtilisateur);
    }
  } catch {
    return { error: "Échec de l'envoi de l'invitation — vérifie l'adresse email." };
  }

  revalidatePath("/utilisateurs");
  return { error: null };
}
