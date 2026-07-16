import { redirect } from "next/navigation";
import { getUserRole } from "@/auth";
import { PlaceholderPanel } from "@/components/placeholder-panel";

// Écran Équipe et accès du Dashboard Client — placeholder, voir docs/roadmap.md,
// tâche #64. Réservé aux rôles propriétaire/administrateur (voir
// docs/sprint6-conception.md, section 2) — responsable d'établissement et
// membre sont redirigés vers la vue d'ensemble.
export default async function EquipeClientPage() {
  const role = await getUserRole();
  if (role !== "proprietaire" && role !== "administrateur") {
    redirect("/app");
  }

  return (
    <PlaceholderPanel description="Membres de l'organisation, invitations, rôles. Arrive dans une prochaine tâche." />
  );
}
