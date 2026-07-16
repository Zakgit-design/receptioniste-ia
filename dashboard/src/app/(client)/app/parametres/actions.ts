"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/auth";

// Server Actions de l'écran Paramètres (docs/roadmap.md, tâche #65).
//
// Défense en profondeur (docs/sprint6-conception.md, section 2) : la garde de
// la page (page.tsx, propriétaire/administrateur seulement) ne suffit pas —
// un appel direct à une de ces actions doit être bloqué ici aussi. Chaque
// action revérifie donc elle-même le rôle de l'appelant, même pattern que
// src/app/(client)/app/equipe/actions.ts.

export interface ParametresActionState {
  error: string | null;
}

const OK: ParametresActionState = { error: null };

/** `Entreprise.id` de l'appelant si propriétaire/administrateur, sinon `null`. */
async function entrepriseIdAutorise(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user || !user.entrepriseId) return null;
  if (user.role !== "proprietaire" && user.role !== "administrateur") return null;
  return user.entrepriseId;
}

export async function mettreAJourCoordonnees(
  _previousState: ParametresActionState,
  formData: FormData
): Promise<ParametresActionState> {
  const entrepriseId = await entrepriseIdAutorise();
  if (!entrepriseId) return { error: "Action non autorisée." };

  const nom = String(formData.get("nom") ?? "").trim();
  const secteur = String(formData.get("secteur") ?? "").trim();
  const emailContact = String(formData.get("emailContact") ?? "").trim();
  const telephoneContact = String(formData.get("telephoneContact") ?? "").trim();

  if (!nom || !secteur) {
    return { error: "Le nom et le secteur sont obligatoires." };
  }

  await prisma.entreprise.update({
    where: { id: entrepriseId },
    data: {
      nom,
      secteur,
      emailContact: emailContact || null,
      telephoneContact: telephoneContact || null,
    },
  });

  revalidatePath("/app/parametres");
  return OK;
}

/**
 * Remplace les deux préférences de notification en une fois (le client
 * envoie toujours l'état complet souhaité, pas un booléen isolé — plus simple
 * que deux actions séparées pour deux interrupteurs qui vivent sur la même
 * ligne `entreprises`).
 */
export async function mettreAJourNotifications(
  notifierRdvParEmail: boolean,
  notifierRdvParSms: boolean
): Promise<ParametresActionState> {
  const entrepriseId = await entrepriseIdAutorise();
  if (!entrepriseId) return { error: "Action non autorisée." };

  await prisma.entreprise.update({
    where: { id: entrepriseId },
    data: { notifierRdvParEmail, notifierRdvParSms },
  });

  revalidatePath("/app/parametres");
  return OK;
}
