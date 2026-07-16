import { test } from "node:test";
import assert from "node:assert/strict";
import {
  proposerCreationAction,
  resoudreActionsAutomatiquement,
  marquerTraite,
  marquerIgnore,
  evaluerAlerteSante,
  evaluerAlerteEssaiExpire,
  type ActionRequise,
  type NouvelleActionRequise,
} from "./actions-center.ts";

function actionExemple(overrides: Partial<ActionRequise> = {}): ActionRequise {
  return {
    id: "action-1",
    type: "technique",
    gravite: "critique",
    titre: "vapi en dégradation répétée",
    description: "...",
    entrepriseId: null,
    actionRecommandee: null,
    cle: "sante:vapi:plateforme",
    statut: "nouveau",
    resoluLe: null,
    createdAt: new Date("2026-07-01"),
    ...overrides,
  };
}

function candidatExemple(overrides: Partial<NouvelleActionRequise> = {}): NouvelleActionRequise {
  return {
    type: "technique",
    gravite: "critique",
    titre: "vapi en dégradation répétée",
    description: "...",
    entrepriseId: null,
    actionRecommandee: null,
    cle: "sante:vapi:plateforme",
    ...overrides,
  };
}

test("pas de doublon créé si un item équivalent est déjà nouveau", () => {
  const existantes = [actionExemple()];
  const resultat = proposerCreationAction(existantes, candidatExemple());
  assert.equal(resultat, null);
});

test("un item est créé si aucun item équivalent n'est ouvert", () => {
  const existantes = [actionExemple({ statut: "traite" })];
  const resultat = proposerCreationAction(existantes, candidatExemple());
  assert.notEqual(resultat, null);
  assert.equal(resultat?.cle, "sante:vapi:plateforme");
});

test("un item avec une cle différente n'est pas considéré comme un doublon", () => {
  const existantes = [actionExemple({ cle: "sante:twilio:plateforme" })];
  const resultat = proposerCreationAction(existantes, candidatExemple());
  assert.notEqual(resultat, null);
});

test("résolution automatique quand la cause disparaît", () => {
  const maintenant = new Date("2026-07-16T12:00:00Z");
  const existantes = [actionExemple(), actionExemple({ id: "action-2", cle: "autre-cause" })];

  const resolues = resoudreActionsAutomatiquement(
    existantes,
    (action) => action.cle === "sante:vapi:plateforme",
    maintenant
  );

  assert.equal(resolues.length, 1);
  assert.equal(resolues[0].id, "action-1");
  assert.equal(resolues[0].statut, "resolu_automatiquement");
  assert.equal(resolues[0].resoluLe, maintenant);
});

test("un item déjà traité/ignoré n'est jamais re-résolu automatiquement", () => {
  const maintenant = new Date();
  const existantes = [actionExemple({ statut: "traite" })];

  const resolues = resoudreActionsAutomatiquement(existantes, () => true, maintenant);
  assert.equal(resolues.length, 0);
});

test("marquerTraite et marquerIgnore changent uniquement le statut", () => {
  const action = actionExemple();
  assert.equal(marquerTraite(action).statut, "traite");
  assert.equal(marquerIgnore(action).statut, "ignore");
});

test("evaluerAlerteSante ne propose rien pour un incident isolé", () => {
  const resultat = evaluerAlerteSante("vapi", null, [{ statut: "ok" }, { statut: "echec" }]);
  assert.equal(resultat, null);
});

test("evaluerAlerteSante propose un item technique pour une dégradation répétée", () => {
  const resultat = evaluerAlerteSante("vapi", "e1", [
    { statut: "echec" },
    { statut: "echec" },
    { statut: "degrade" },
  ]);
  assert.notEqual(resultat, null);
  assert.equal(resultat?.type, "technique");
  assert.equal(resultat?.cle, "sante:vapi:e1");
});

test("evaluerAlerteEssaiExpire ne propose rien hors essai ou sans échéance", () => {
  const maintenant = new Date("2026-07-16");
  assert.equal(
    evaluerAlerteEssaiExpire({ id: "e1", statut: "actif", emailContact: null }, new Date("2026-07-17"), maintenant),
    null
  );
  assert.equal(
    evaluerAlerteEssaiExpire({ id: "e1", statut: "essai", emailContact: null }, null, maintenant),
    null
  );
});

test("evaluerAlerteEssaiExpire propose un item business à J-3", () => {
  const maintenant = new Date("2026-07-16T00:00:00Z");
  const finPeriode = new Date("2026-07-18T00:00:00Z");
  const resultat = evaluerAlerteEssaiExpire(
    { id: "e1", statut: "essai", emailContact: "contact@exemple.ch" },
    finPeriode,
    maintenant
  );

  assert.notEqual(resultat, null);
  assert.equal(resultat?.type, "business");
  assert.equal(resultat?.actionRecommandee?.lien, "mailto:contact@exemple.ch");
});

test("evaluerAlerteEssaiExpire ne propose rien si l'échéance est trop lointaine", () => {
  const maintenant = new Date("2026-07-16T00:00:00Z");
  const finPeriode = new Date("2026-08-01T00:00:00Z");
  assert.equal(
    evaluerAlerteEssaiExpire({ id: "e1", statut: "essai", emailContact: null }, finPeriode, maintenant),
    null
  );
});
