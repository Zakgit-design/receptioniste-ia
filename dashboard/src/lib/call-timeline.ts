// Construction de la frise chronologique d'un appel (fiche appel, voir
// docs/sprint5-conception.md, section 8). La frise doit refléter les champs
// réellement modélisés sur `Appel` (`rendez_vous_id`, `sms_envoye`,
// `outils_utilises`, `erreurs` — voir docs/architecture.md), pas du texte en
// dur déconnecté du modèle. Logique pure, pas d'accès base de données :
// l'appelant fournit les champs de l'appel.

export type ToneEtapeTimeline = "good" | "warn" | "critical";

export interface EtapeTimeline {
  label: string;
  horodatage: string;
  tone: ToneEtapeTimeline;
}

// Un outil déclenché par l'agent Vapi pendant l'appel (`appels.outils_utilises`,
// jsonb) — ex. vérification d'agenda, création de rendez-vous.
export interface OutilAppelUtilise {
  label: string;
  horodatage: string;
}

// Une erreur technique survenue pendant l'appel (`appels.erreurs`, jsonb).
export interface ErreurAppel {
  label: string;
  horodatage: string;
}

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === "object" && valeur !== null;
}

/**
 * Parse défensif de `appels.outils_utilises` (jsonb, forme non garantie) —
 * partagé entre le Dashboard Admin et le Dashboard Client (mêmes colonnes
 * réelles, même logique de lecture).
 */
export function parseOutilsUtilises(json: unknown): OutilAppelUtilise[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (item): item is OutilAppelUtilise =>
      estObjet(item) && typeof item.label === "string" && typeof item.horodatage === "string"
  );
}

/** Parse défensif de `appels.erreurs` (jsonb, forme non garantie). */
export function parseErreurs(json: unknown): ErreurAppel[] | null {
  if (!Array.isArray(json)) return null;
  const erreurs = json.filter(
    (item): item is ErreurAppel =>
      estObjet(item) && typeof item.label === "string" && typeof item.horodatage === "string"
  );
  return erreurs.length > 0 ? erreurs : null;
}

export interface DonneesTimelineAppel {
  heureDecroche: string;
  heureRaccroche: string | null;
  statutAppel: "termine" | "echoue" | "transfere";
  rendezVousId: string | null;
  smsEnvoye: boolean;
  smsHorodatage: string | null;
  outilsUtilises: OutilAppelUtilise[];
  erreurs: ErreurAppel[] | null;
}

/**
 * Construit la frise chronologique d'un appel à partir des champs du modèle
 * `Appel`. Ordre reflété : décroché -> outils déclenchés par l'agent (agenda,
 * rendez-vous...) -> confirmation SMS (seulement si un rendez-vous a été pris
 * — sinon rien à confirmer, ex. un simple renseignement) -> erreurs
 * techniques éventuelles -> raccroché.
 */
export function construireTimelineAppel(appel: DonneesTimelineAppel): EtapeTimeline[] {
  const etapes: EtapeTimeline[] = [
    { label: "Appel décroché", horodatage: appel.heureDecroche, tone: "good" },
  ];

  for (const outil of appel.outilsUtilises) {
    etapes.push({ label: outil.label, horodatage: outil.horodatage, tone: "good" });
  }

  if (appel.rendezVousId) {
    etapes.push({
      label: appel.smsEnvoye
        ? "SMS de confirmation envoyé"
        : "SMS de confirmation en échec",
      horodatage: appel.smsHorodatage ?? appel.heureRaccroche ?? appel.heureDecroche,
      tone: appel.smsEnvoye ? "good" : "warn",
    });
  }

  for (const erreur of appel.erreurs ?? []) {
    etapes.push({ label: erreur.label, horodatage: erreur.horodatage, tone: "critical" });
  }

  if (appel.heureRaccroche) {
    etapes.push({
      label: "Appel raccroché",
      horodatage: appel.heureRaccroche,
      tone: appel.statutAppel === "echoue" ? "critical" : "good",
    });
  }

  return etapes;
}
