// Un seul endroit qui sait si Clerk est configuré dans cet environnement.
//
// Tant que le compte Clerk n'existe pas (action fondateur en attente, voir
// docs/sprint-log.md), ces variables sont absentes de l'environnement — le
// reste de l'application (pages, layout racine) doit continuer à fonctionner
// normalement dans ce cas, simplement sans authentification active. Toute
// activation de code Clerk (ClerkProvider, appels au SDK) doit être
// conditionnée par cette fonction plutôt que de supposer les clés présentes.
export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
}
