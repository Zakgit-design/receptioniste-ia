import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatutEntreprise } from "@/generated/prisma/enums";
import { listOrganizationMembers } from "@/auth";
import { OnboardingWizard } from "@/components/onboarding-wizard";

// Force le rendu dynamique — interroge Prisma directement, sans API
// dynamique pour le déclencher implicitement (même raison que /entreprises,
// voir docs/sprint-log.md, 2026-07-22).
export const dynamic = "force-dynamic";

// Page unique du parcours d'onboarding (Sprint A) — l'étape à afficher se
// déduit des données réelles (établissement(s)/service(s) déjà créés),
// jamais d'une table de suivi séparée. Garde de sécurité en tout premier :
// seule une entreprise en statut `brouillon` peut atteindre cette page — la
// logique de ce sprint ne touche donc jamais Barber Concept (statut `actif`
// depuis longtemps), même par une URL directe.
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
  if (entreprise.statut !== StatutEntreprise.brouillon) {
    redirect(`/entreprises/${id}`);
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
      }}
      etablissements={entreprise.etablissements.map((etablissement) => ({
        id: etablissement.id,
        nom: etablissement.nom,
        adresse: etablissement.adresse,
        joursFermeture: etablissement.joursFermeture,
        nbDisponibilites: etablissement.disponibilites.length,
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
