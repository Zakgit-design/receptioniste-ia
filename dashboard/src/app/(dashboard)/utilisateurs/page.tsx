import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatutBadge, type ToneBadge } from "@/components/statut-badge";
import type { RoleUtilisateur } from "@/generated/prisma/enums";
import type { UtilisateurAffiche } from "./data";
import { getAdminsPlateforme, getUtilisateursParEntreprise } from "./data";

// Écran Utilisateurs — voir docs/architecture.md (modèle `utilisateurs`) et
// docs/sprint5-conception.md, section 2 : admins plateforme d'un côté,
// membres par entreprise (organisation Clerk) de l'autre. Modèle
// d'invitation directe uniquement — pas de demande d'accès autonome au MVP,
// donc pas de file d'attente à valider, juste un statut "invitation en
// attente" tant que la personne n'a pas encore accepté.
//
// "+ Inviter un utilisateur" est un bouton visuel, pas encore fonctionnel :
// il appellera src/auth/inviteUser une fois qu'un compte Clerk réel existe
// (voir contrainte de cette tâche) — même situation que "+ Nouvelle
// entreprise" sur l'écran Entreprises.

const libelleRole: Record<RoleUtilisateur, string> = {
  admin_plateforme: "Admin plateforme",
  proprietaire: "Propriétaire",
  employe: "Employé",
};

const thClass =
  "px-4 py-[9px] text-left text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase whitespace-nowrap";

function ligneUtilisateur(utilisateur: UtilisateurAffiche) {
  const tone: ToneBadge = utilisateur.statut === "actif" ? "good" : "neutral";
  const statutLabel = utilisateur.statut === "actif" ? "Actif" : "Invitation en attente";

  return (
    <tr key={utilisateur.email} className="border-b border-border last:border-b-0">
      <td className="px-4 py-[11px] font-bold whitespace-nowrap text-text">{utilisateur.nom}</td>
      <td className="px-4 py-[11px] font-mono whitespace-nowrap text-text-secondary">
        {utilisateur.email}
      </td>
      <td className="px-4 py-[11px] whitespace-nowrap text-text-secondary">
        {libelleRole[utilisateur.role]}
      </td>
      <td className="px-4 py-[11px] whitespace-nowrap">
        <StatutBadge tone={tone}>{statutLabel}</StatutBadge>
      </td>
    </tr>
  );
}

export default function UtilisateursPage() {
  const adminsPlateforme = getAdminsPlateforme();
  const utilisateursParEntreprise = getUtilisateursParEntreprise();

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle="Accès plateforme et accès par entreprise (Clerk)"
        action={<Button>+ Inviter un utilisateur</Button>}
      />

      <div className="mb-3.5 overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
        <div className="border-b border-border px-4 py-[13px]">
          <h3 className="text-[13px] font-bold text-text">Admins plateforme</h3>
        </div>
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border">
              <th className={thClass}>Nom</th>
              <th className={thClass}>Email</th>
              <th className={thClass}>Rôle</th>
              <th className={thClass}>Statut</th>
            </tr>
          </thead>
          <tbody>{adminsPlateforme.map(ligneUtilisateur)}</tbody>
        </table>
      </div>

      {utilisateursParEntreprise.map((entreprise) => (
        <div
          key={entreprise.entrepriseId}
          className="mb-3.5 overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]"
        >
          <div className="border-b border-border px-4 py-[13px]">
            <h3 className="text-[13px] font-bold text-text">{entreprise.entrepriseNom}</h3>
          </div>
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-border">
                <th className={thClass}>Nom</th>
                <th className={thClass}>Email</th>
                <th className={thClass}>Rôle</th>
                <th className={thClass}>Statut</th>
              </tr>
            </thead>
            <tbody>{entreprise.membres.map(ligneUtilisateur)}</tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
