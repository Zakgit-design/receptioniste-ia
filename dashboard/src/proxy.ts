import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

// Routes du Dashboard Client (voir docs/sprint6-conception.md, section 1) —
// tout le reste (hors /sign-in, /sign-up, /api) appartient au Dashboard
// Administrateur.
const isClientRoute = createRouteMatcher(["/app(.*)"]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }

  await auth.protect();

  // Répartition admin ↔ client par organisation active : un utilisateur avec
  // une organisation active (orgId) a forcément un rôle client (voir
  // docs/architecture.md, "Entreprise = Organisation Clerk"), jamais un admin
  // plateforme, qui n'appartient à aucune organisation. Défense en profondeur
  // seulement ici (redirection large route admin ↔ client) — la restriction
  // fine par rôle interne (proprietaire/administrateur/...) vit dans chaque
  // page, pas ici (voir (client)/equipe/page.tsx et parametres/page.tsx).
  // Les routes /api sont exclues de cette bascule (pas d'écran à rediriger).
  const { orgId } = await auth();

  if (!isClientRoute(request) && !isApiRoute(request) && orgId) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  if (isClientRoute(request) && !orgId) {
    return NextResponse.redirect(new URL("/", request.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
