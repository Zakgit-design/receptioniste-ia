import { test } from "node:test";
import assert from "node:assert/strict";
import {
  agregerStatut,
  santeParEntreprise,
  santeParService,
  estDegradeDeManiereRepetee,
} from "./health.ts";

test("un seul événement en échec fait basculer le statut agrégé", () => {
  const statut = agregerStatut([
    { statut: "ok" },
    { statut: "ok" },
    { statut: "echec" },
  ]);
  assert.equal(statut, "echec");
});

test("un événement dégradé sans échec donne un statut dégradé", () => {
  const statut = agregerStatut([{ statut: "ok" }, { statut: "degrade" }]);
  assert.equal(statut, "degrade");
});

test("aucun événement problématique donne un statut ok", () => {
  const statut = agregerStatut([{ statut: "ok" }, { statut: "ok" }]);
  assert.equal(statut, "ok");
});

test("santeParEntreprise agrège par entreprise et ignore les événements plateforme globale", () => {
  const maintenant = new Date();
  const resultat = santeParEntreprise([
    { service: "vapi", entrepriseId: "e1", statut: "ok", createdAt: maintenant },
    { service: "twilio", entrepriseId: "e1", statut: "echec", createdAt: maintenant },
    { service: "render", entrepriseId: "e2", statut: "ok", createdAt: maintenant },
    { service: "render", entrepriseId: null, statut: "echec", createdAt: maintenant },
  ]);

  assert.equal(resultat.get("e1"), "echec");
  assert.equal(resultat.get("e2"), "ok");
  assert.equal(resultat.size, 2);
});

test("santeParService agrège tous clients confondus", () => {
  const maintenant = new Date();
  const resultat = santeParService([
    { service: "vapi", entrepriseId: "e1", statut: "ok", createdAt: maintenant },
    { service: "vapi", entrepriseId: "e2", statut: "degrade", createdAt: maintenant },
  ]);

  assert.equal(resultat.get("vapi"), "degrade");
});

test("estDegradeDeManiereRepetee détecte une série de dégradations, pas un incident isolé", () => {
  assert.equal(
    estDegradeDeManiereRepetee([{ statut: "echec" }, { statut: "degrade" }, { statut: "echec" }]),
    true
  );
  assert.equal(
    estDegradeDeManiereRepetee([{ statut: "ok" }, { statut: "degrade" }, { statut: "echec" }]),
    false
  );
  assert.equal(estDegradeDeManiereRepetee([{ statut: "echec" }]), false);
});
