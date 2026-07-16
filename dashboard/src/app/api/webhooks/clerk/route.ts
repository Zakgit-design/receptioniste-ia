import type { NextRequest } from "next/server";
import { handleClerkWebhookRequest } from "@/auth/webhook";

// Reçoit les événements Clerk (utilisateur créé/mis à jour, invitation
// acceptée, changement de rôle) pour synchroniser la table `utilisateurs` —
// voir docs/architecture.md, section "Authentification". Toute la logique
// vit dans src/auth/webhook.ts : cette route ne fait qu'exposer l'URL
// attendue par Clerk (à configurer dans le dashboard Clerk une fois le
// compte créé : Webhooks > Add Endpoint > .../api/webhooks/clerk).
export async function POST(request: NextRequest) {
  return handleClerkWebhookRequest(request);
}
