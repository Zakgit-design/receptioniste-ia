import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listOrganizationMembers } from "@/auth";
import { OnboardingWizard } from "@/components/onboarding-wizard";

// Force le rendu dynamique — interroge Prisma directement, sans API
// dynamique pour le déclencher implicitement (même raison que /entreprises,
// voir docs/sprint-log.md, 2026-07-22).
export const dynamic = "force-dynamic";

// Page établissement(s)/catalogue/accès d'une entreprise — sert à la fois de
// parcours guidé pendant l'onboarding (statut `brouillon`) et d'écran de
// modification permanent une fois l'entreprise active (voir docs/sprint-log.md,
// 2026-07-22 : le fondateur doit pouvoir revenir modifier horaires/catalogue
// à tout moment, pas seulement pendant la configuration initiale — plus de
// redirection une fois `brouillon` dépassé). L'étape "en avant" (cadre
// signal) ne s'affiche que pendant le brouillon ; une fois actif, c'est un
// simple écran de gestion sans notion d'étape.
export default async function OnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const entreprise = await prisma.entreprise.findUnique({
    where: { id },
    include: {
      etablissements: { orderBy: { createdAt: "asc" }, include: { disponibilites: true } },
      services: { orderBy: { nom: "asc" } },
    },
  });
  if (!entreprise) {
    notFound();
  }

  const membres = entreprise.clerkOrganizationId
    ? await listOrganizationMembers(entreprise.clerkOrganizationId)
    : [];

  return (
    <OnboardingWizard
      entreprise={{
        id: entreprise.id,
        nom: entreprise.nom,
        secteur: entreprise.secteur,
        adresse: entreprise.adresse,
        langue: entreprise.langue,
        fuseauHoraire: entreprise.fuseauHoraire,
        emailContact: entreprise.emailContact,
        telephoneContact: entreprise.telephoneContact,
        clerkOrganizationId: entreprise.clerkOrganizationId,
        statut: entreprise.statut,
      }}
      etablissements={entreprise.etablissements.map((etablissement) => ({
        id: etablissement.id,
        nom: etablissement.nom,
        adresse: etablissement.adresse,
        joursFermeture: etablissement.joursFermeture,
        // Format HH:MM (UTC — colonne @db.Time(), voir actions.ts) pour préremplir le formulaire de modification.
        disponibilites: etablissement.disponibilites.map((d) => ({
          jourSemaine: d.jourSemaine,
          heureDebut: d.heureDebut.toISOString().slice(11, 16),
          heureFin: d.heureFin.toISOString().slice(11, 16),
        })),
      }))}
      services={entreprise.services.map((service) => ({
        id: service.id,
        nom: service.nom,
        dureeMinutes: service.dureeMinutes,
        prix: service.prix ? Number(service.prix) : null,
        description: service.description,
        actif: service.actif,
      }))}
      membres={membres}
    />
  );
}
