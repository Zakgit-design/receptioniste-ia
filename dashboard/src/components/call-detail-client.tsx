import { cn } from "@/lib/utils";
import { StatutBadge } from "@/components/statut-badge";
import { construireTimelineAppel, type ToneEtapeTimeline } from "@/lib/call-timeline";
import {
  libelleEtToneAppelClient,
  formatDureeAppelClient,
  type AppelDetailClient,
} from "@/lib/appels-client";

const dotToneClass: Record<ToneEtapeTimeline, string> = {
  good: "bg-good",
  warn: "bg-warn",
  critical: "bg-critical",
};

const sectionTitleClass =
  "mt-5 mb-2 text-[11px] font-bold tracking-[0.05em] text-text-muted uppercase";

// Fiche détail d'un appel — Dashboard Client, voir docs/roadmap.md, tâche #67.
// Composant dédié plutôt que réutilisation directe de `CallDetail` (Sprint 5,
// dashboard admin) : ce dernier affiche "Entreprise" et un "Coût" par appel
// qui n'ont pas de sens ici (une seule entreprise ; le coût par appel n'est
// pas encore modélisé simplement, voir `appels.cout_detail` dans
// docs/architecture.md) — même décision que pour Établissements (#63) et Vue
// d'ensemble (#66). La frise chronologique (`construireTimelineAppel`,
// src/lib/call-timeline.ts) reste partagée sans modification : logique pure,
// indépendante de l'entreprise/coût.
export function CallDetailClient({ appel }: { appel: AppelDetailClient }) {
  const { libelle, tone } = libelleEtToneAppelClient(appel);
  const etapes = construireTimelineAppel({
    heureDecroche: appel.heureDecroche,
    heureRaccroche: appel.heureRaccroche,
    statutAppel: appel.statut,
    rendezVousId: appel.rendezVousId,
    smsEnvoye: appel.smsEnvoye,
    smsHorodatage: appel.heureRaccroche,
    outilsUtilises: appel.outilsUtilises,
    erreurs: appel.erreurs,
  });

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <div className="text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase">
            Établissement
          </div>
          <div className="mt-0.5 text-[12.5px] font-bold text-text">{appel.etablissementNom}</div>
        </div>
        <div>
          <div className="text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase">
            Numéro appelant
          </div>
          <div className="mt-0.5 font-mono text-[12.5px] font-bold text-text">
            {appel.telephoneAppelant}
          </div>
        </div>
        <div>
          <div className="text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase">
            Durée
          </div>
          <div className="mt-0.5 font-mono text-[12.5px] font-bold text-text">
            {formatDureeAppelClient(appel.dureeSecondes)}
          </div>
        </div>
        <div>
          <div className="text-[10.5px] font-bold tracking-[0.05em] text-text-muted uppercase">
            Statut
          </div>
          <div className="mt-0.5">
            <StatutBadge tone={tone}>{libelle}</StatutBadge>
          </div>
        </div>
      </div>

      <div className={sectionTitleClass}>Déroulé de l&apos;appel</div>
      <div>
        {etapes.map((etape, index) => (
          <div key={index} className="flex gap-2.5 pb-4 last:pb-0">
            <span
              className={cn("mt-1 h-[9px] w-[9px] shrink-0 rounded-full", dotToneClass[etape.tone])}
            />
            <div>
              <div className="text-[12.5px] font-bold text-text">{etape.label}</div>
              <div className="mt-0.5 font-mono text-[10.5px] font-semibold text-text-muted">
                {etape.horodatage}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={sectionTitleClass}>Résumé généré par l&apos;IA</div>
      <p className="text-[12.5px] leading-relaxed font-medium text-text-secondary">
        {appel.resumeIA}
      </p>

      <div className={sectionTitleClass}>Enregistrement audio</div>
      {appel.urlEnregistrement ? (
        <audio controls src={appel.urlEnregistrement} className="h-9 w-full" />
      ) : (
        <div className="rounded-md border border-border bg-paper px-3.5 py-2.5 text-[12px] font-semibold text-text-muted">
          Audio non disponible pour cet appel.
        </div>
      )}

      <div className={sectionTitleClass}>Transcription</div>
      {appel.transcription.length === 0 ? (
        <div className="rounded-md border border-border bg-paper px-3.5 py-2.5 text-[12px] font-semibold text-text-muted">
          Transcription non disponible pour cet appel.
        </div>
      ) : (
        <div className="max-h-[220px] overflow-y-auto rounded-md border border-border bg-paper px-3.5 py-3 text-[12px] leading-relaxed">
          {appel.transcription.map((ligne, index) => (
            <div key={index} className="mb-2 last:mb-0">
              <span
                className={cn(
                  "mr-1.5 font-bold",
                  ligne.locuteur === "ia" ? "text-signal" : "text-text"
                )}
              >
                {ligne.locuteur === "ia" ? "IA —" : "Client —"}
              </span>
              {ligne.texte}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
