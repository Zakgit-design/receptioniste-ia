import { redirect } from "next/navigation";
import { getUserRole } from "@/auth";
import { PlaceholderPanel } from "@/components/placeholder-panel";

// Écran Paramètres du Dashboard Client — placeholder, voir docs/roadmap.md,
// tâche #65. Réservé aux rôles propriétaire/administrateur (voir
// docs/sprint6-conception.md, section 2) — responsable d'établissement et
// membre sont redirigés vers la vue d'ensemble.
export default async function ParametresClientPage() {
  const role = await getUserRole();
  if (role !== "proprietaire" && role !== "administrateur") {
    redirect("/app");
  }

  return (
    <PlaceholderPanel description="Coordonnées, préférences de notification, abonnement actuel. Arrive dans une prochaine tâche." />
  );
}
