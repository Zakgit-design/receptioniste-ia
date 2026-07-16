import type { RoleUtilisateur } from "@/generated/prisma/enums";

// Règles de permission de l'écran Équipe et accès (/app/equipe) — voir
// docs/roadmap.md, tâche #64, et docs/sprint6-conception.md, section 2
// (tableau exact des permissions par rôle). Fonctions pures, sans dépendance
// à Clerk/Prisma, réutilisées à la fois par les Server Actions
// (`src/app/(client)/app/equipe/actions.ts` — c'est la seule vérification qui
// compte, défense en profondeur) et par l'UI (afficher les bonnes options).
//
// Extension au-delà du tableau (pas écrite dans le tableau, mais nécessaire
// pour rester cohérent avec lui) : un administrateur ne peut pas non plus
// PROMOUVOIR quelqu'un au rôle administrateur ou propriétaire via un
// changement de rôle. Le tableau dit seulement "administrateur : change le
// rôle de n'importe qui sauf le propriétaire" — sans cette restriction sur le
// rôle *cible*, la règle "administrateur ne peut pas inviter un
// administrateur" serait contournable en invitant un membre puis en changeant
// aussitôt son rôle en administrateur.

/** Rôles qu'un rôle donné peut attribuer — à l'invitation comme au changement de rôle. */
export function rolesAssignablesPar(role: RoleUtilisateur | null): RoleUtilisateur[] {
  if (role === "proprietaire") {
    return ["proprietaire", "administrateur", "responsable_etablissement", "membre"];
  }
  if (role === "administrateur") {
    return ["responsable_etablissement", "membre"];
  }
  return [];
}

/**
 * Un `roleActeur` peut-il retirer un membre, changer son rôle, ou révoquer
 * son invitation, sachant que son rôle actuel est `roleCible` ? Voir
 * docs/sprint6-conception.md, section 2 : propriétaire — tous ;
 * administrateur — tous sauf le propriétaire ; responsable
 * d'établissement/membre — jamais (déjà bloqués par la garde de page, cette
 * fonction n'est appelée que pour propriétaire/administrateur).
 */
export function peutGererRole(
  roleActeur: RoleUtilisateur | null,
  roleCible: RoleUtilisateur
): boolean {
  if (roleActeur === "proprietaire") return true;
  if (roleActeur === "administrateur") return roleCible !== "proprietaire";
  return false;
}
