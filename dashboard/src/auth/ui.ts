// Ré-export des composants d'interface Clerk prêts à l'emploi (avatar,
// menu de compte, déconnexion...). Contrairement à `src/auth/index.ts`
// (logique métier — utilisateur courant, rôle, invitations), ces
// composants sont de simples widgets visuels fournis par Clerk — mais la
// règle reste la même : c'est le seul fichier en dehors de `src/auth/` qui
// devrait avoir besoin d'importer directement depuis `@clerk/nextjs`, pour
// qu'une future migration hors de Clerk reste circonscrite à ce dossier.
export { UserButton, useClerk, useUser } from "@clerk/nextjs";
