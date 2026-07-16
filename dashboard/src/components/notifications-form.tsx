"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { mettreAJourNotifications } from "@/app/(client)/app/parametres/actions";

// Interrupteurs "Préférences de notification" de l'écran Paramètres
// (docs/roadmap.md, tâche #65) — deux booléens `entreprises.notifier_rdv_par_*`,
// persistés réellement à chaque bascule (pas de bouton "Enregistrer" séparé,
// comme le changement de rôle dans equipe-liste.tsx). Aucun moteur de
// notification n'existe encore pour les déclencher (voir
// docs/sprint6-conception.md, section 3) — le texte ci-dessous le dit
// explicitement, pas de fausse promesse.
export function NotificationsForm({
  notifierRdvParEmail,
  notifierRdvParSms,
}: {
  notifierRdvParEmail: boolean;
  notifierRdvParSms: boolean;
}) {
  const [email, setEmail] = useState(notifierRdvParEmail);
  const [sms, setSms] = useState(notifierRdvParSms);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function bascule(prochainEmail: boolean, prochainSms: boolean) {
    setEmail(prochainEmail);
    setSms(prochainSms);
    startTransition(async () => {
      const result = await mettreAJourNotifications(prochainEmail, prochainSms);
      setError(result.error);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-[15px] shadow-[var(--shadow-panel)]">
      <h3 className="mb-1 text-[13px] font-bold text-text">Préférences de notification</h3>
      <p className="mb-3 text-[11.5px] leading-relaxed text-text-muted">
        Ces préférences sont enregistrées, mais aucune notification n&apos;est encore envoyée
        aujourd&apos;hui — le moteur d&apos;envoi n&apos;existe pas encore dans le produit.
      </p>

      <div className="flex items-center justify-between border-b border-border py-2.5">
        <Label htmlFor="notif-email" className="font-semibold text-text">
          Notifier par email lors d&apos;un rendez-vous
        </Label>
        <Switch
          id="notif-email"
          checked={email}
          disabled={pending}
          onCheckedChange={(checked) => bascule(checked, sms)}
        />
      </div>

      <div className="flex items-center justify-between py-2.5">
        <Label htmlFor="notif-sms" className="font-semibold text-text">
          Notifier par SMS lors d&apos;un rendez-vous
        </Label>
        <Switch
          id="notif-sms"
          checked={sms}
          disabled={pending}
          onCheckedChange={(checked) => bascule(email, checked)}
        />
      </div>

      {error ? <p className="mt-2 text-xs font-semibold text-destructive">{error}</p> : null}
    </div>
  );
}
