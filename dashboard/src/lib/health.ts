// Calcul du statut de santé agrégé, à partir d'événements `evenements_sante`.
//
// Une seule source de vérité (voir docs/architecture.md et
// docs/sprint5-conception.md section 7) : la même liste d'événements sert à
// afficher la colonne Santé d'une entreprise (agrégation par entreprise) et
// la page Santé plateforme (agrégation par service). Ce fichier ne contient
// que la logique pure d'agrégation — pas d'accès base de données : c'est à
// l'appelant de fournir les événements pertinents (ex. la dernière heure).

export type StatutSante = "ok" | "degrade" | "echec";

export interface EvenementSanteInput {
  service: string;
  entrepriseId: string | null;
  statut: StatutSante;
  createdAt: Date;
}

/**
 * Agrège une liste d'événements de santé en un seul statut : le pire statut
 * observé l'emporte (un seul événement en échec fait basculer tout le
 * groupe en échec, même si les autres événements sont "ok").
 */
export function agregerStatut(evenements: { statut: StatutSante }[]): StatutSante {
  if (evenements.some((e) => e.statut === "echec")) return "echec";
  if (evenements.some((e) => e.statut === "degrade")) return "degrade";
  return "ok";
}

/**
 * Statut agrégé par entreprise (pour la colonne Santé de la liste
 * Entreprises). Les événements plateforme globale (entrepriseId null) sont
 * ignorés ici : ils ne concernent aucune entreprise en particulier.
 */
export function santeParEntreprise(
  evenements: EvenementSanteInput[]
): Map<string, StatutSante> {
  const parEntreprise = new Map<string, EvenementSanteInput[]>();
  for (const evenement of evenements) {
    if (!evenement.entrepriseId) continue;
    const liste = parEntreprise.get(evenement.entrepriseId) ?? [];
    liste.push(evenement);
    parEntreprise.set(evenement.entrepriseId, liste);
  }

  const resultat = new Map<string, StatutSante>();
  for (const [entrepriseId, liste] of parEntreprise) {
    resultat.set(entrepriseId, agregerStatut(liste));
  }
  return resultat;
}

/**
 * Statut agrégé par service technique (pour la page Santé plateforme),
 * tous clients confondus.
 */
export function santeParService(
  evenements: EvenementSanteInput[]
): Map<string, StatutSante> {
  const parService = new Map<string, EvenementSanteInput[]>();
  for (const evenement of evenements) {
    const liste = parService.get(evenement.service) ?? [];
    liste.push(evenement);
    parService.set(evenement.service, liste);
  }

  const resultat = new Map<string, StatutSante>();
  for (const [service, liste] of parService) {
    resultat.set(service, agregerStatut(liste));
  }
  return resultat;
}

/**
 * Détecte une dégradation répétée : les `seuil` événements les plus récents
 * (déjà triés du plus récent au plus ancien par l'appelant) sont tous
 * dégradés ou en échec. Sert de déclencheur pour créer une action requise
 * technique (voir actions-center.ts) — un seul événement isolé ne doit pas
 * déclencher une alerte.
 */
export function estDegradeDeManiereRepetee(
  evenementsRecents: { statut: StatutSante }[],
  seuil = 3
): boolean {
  if (evenementsRecents.length < seuil) return false;
  return evenementsRecents
    .slice(0, seuil)
    .every((e) => e.statut === "degrade" || e.statut === "echec");
}
