import { PageHeader } from "@/components/page-header";
import { NouvelleEntrepriseDialog } from "@/components/nouvelle-entreprise-dialog";
import { EntreprisesTable } from "@/components/entreprises-table";
import { santeParEntreprise, type StatutSante } from "@/lib/health";
import { getEvenementsSante } from "@/lib/demo-evenements-sante";
import { getEntreprisesListe } from "./data";

// Force le rendu dynamique : cette page interroge Prisma (`getEntreprisesListe`)
// et ne lit aucune API dynamique (auth/cookies) qui forcerait ce comportement
// implicitement — sans ce flag, Next.js la pré-rend en statique et exécute
// donc une vraie requête base de données au moment du build, pas à chaque
// visite. Deux problèmes que ça évite : le build dépend alors d'un accès
// réseau à Supabase (a fait échouer le déploiement Vercel avec P1001), et la
// page afficherait des entreprises figées au dernier build plutôt que la
// liste réelle à jour.
export const dynamic = "force-dynamic";

// Ordre d'affichage : les problèmes remontent en premier (incident, puis
// attention, puis opérationnel) — pas d'ordre alphabétique. Voir
// docs/sprint5-conception.md, section 3.
const rangSante: Record<StatutSante, number> = { echec: 0, degrade: 1, ok: 2 };

export default async function EntreprisesPage() {
  const entreprises = await getEntreprisesListe();
  const santeParId = santeParEntreprise(getEvenementsSante());

  const rows = entreprises
    .map((entreprise) => ({
      ...entreprise,
      sante: santeParId.get(entreprise.id) ?? ("ok" as const),
    }))
    .sort((a, b) => rangSante[a.sante] - rangSante[b.sante]);

  return (
    <div>
      <PageHeader
        title="Entreprises"
        subtitle={`${entreprises.length} entreprises clientes sur la plateforme`}
        action={<NouvelleEntrepriseDialog />}
      />
      <EntreprisesTable entreprises={rows} />
    </div>
  );
}
