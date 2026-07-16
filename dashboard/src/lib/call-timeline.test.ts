import { test } from "node:test";
import assert from "node:assert/strict";
import { construireTimelineAppel } from "./call-timeline.ts";

test("un appel avec RDV et SMS envoyé produit décroché -> outils -> SMS -> raccroché", () => {
  const etapes = construireTimelineAppel({
    heureDecroche: "11:38:02",
    heureRaccroche: "11:41:00",
    statutAppel: "termine",
    rendezVousId: "rdv-1",
    smsEnvoye: true,
    smsHorodatage: "11:40:01",
    outilsUtilises: [
      { label: "Vérification agenda — créneau 15h30 disponible", horodatage: "11:38:24" },
      { label: "Rendez-vous créé dans Google Calendar", horodatage: "11:39:47" },
    ],
    erreurs: null,
  });

  assert.deepEqual(
    etapes.map((e) => e.label),
    [
      "Appel décroché",
      "Vérification agenda — créneau 15h30 disponible",
      "Rendez-vous créé dans Google Calendar",
      "SMS de confirmation envoyé",
      "Appel raccroché",
    ]
  );
  assert.equal(etapes.at(-1)?.tone, "good");
});

test("aucun rendez-vous créé -> pas d'étape SMS, même si smsEnvoye est faux", () => {
  const etapes = construireTimelineAppel({
    heureDecroche: "10:52:00",
    heureRaccroche: "10:54:14",
    statutAppel: "termine",
    rendezVousId: null,
    smsEnvoye: false,
    smsHorodatage: null,
    outilsUtilises: [],
    erreurs: null,
  });

  assert.ok(!etapes.some((e) => e.label.includes("SMS")));
});

test("SMS non envoyé alors qu'un rendez-vous existe -> étape d'avertissement", () => {
  const etapes = construireTimelineAppel({
    heureDecroche: "10:20:00",
    heureRaccroche: "10:21:47",
    statutAppel: "termine",
    rendezVousId: "rdv-2",
    smsEnvoye: false,
    smsHorodatage: "10:21:40",
    outilsUtilises: [],
    erreurs: null,
  });

  const etapeSms = etapes.find((e) => e.label.includes("SMS"));
  assert.equal(etapeSms?.label, "SMS de confirmation en échec");
  assert.equal(etapeSms?.tone, "warn");
});

test("une erreur technique s'ajoute en étape critique", () => {
  const etapes = construireTimelineAppel({
    heureDecroche: "09:41:00",
    heureRaccroche: "09:41:38",
    statutAppel: "echoue",
    rendezVousId: null,
    smsEnvoye: false,
    smsHorodatage: null,
    outilsUtilises: [],
    erreurs: [{ label: "Erreur technique — connexion Vapi interrompue", horodatage: "09:41:35" }],
  });

  const etapeErreur = etapes.find((e) => e.label.startsWith("Erreur technique"));
  assert.equal(etapeErreur?.tone, "critical");
  assert.equal(etapes.at(-1)?.tone, "critical");
});
