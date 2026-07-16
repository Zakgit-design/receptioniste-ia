import { test } from "node:test";
import assert from "node:assert/strict";
import { rolesAssignablesPar, peutGererRole } from "./equipe-permissions.ts";

test("un propriétaire peut attribuer les 4 rôles", () => {
  assert.deepEqual(rolesAssignablesPar("proprietaire"), [
    "proprietaire",
    "administrateur",
    "responsable_etablissement",
    "membre",
  ]);
});

test("un administrateur ne peut attribuer que membre/responsable d'établissement", () => {
  assert.deepEqual(rolesAssignablesPar("administrateur"), [
    "responsable_etablissement",
    "membre",
  ]);
});

test("un responsable d'établissement ou un membre ne peut rien attribuer", () => {
  assert.deepEqual(rolesAssignablesPar("responsable_etablissement"), []);
  assert.deepEqual(rolesAssignablesPar("membre"), []);
  assert.deepEqual(rolesAssignablesPar(null), []);
});

test("un propriétaire peut gérer n'importe qui, y compris un autre propriétaire", () => {
  assert.equal(peutGererRole("proprietaire", "proprietaire"), true);
  assert.equal(peutGererRole("proprietaire", "administrateur"), true);
  assert.equal(peutGererRole("proprietaire", "membre"), true);
});

test("un administrateur peut gérer tout le monde sauf le propriétaire", () => {
  assert.equal(peutGererRole("administrateur", "proprietaire"), false);
  assert.equal(peutGererRole("administrateur", "administrateur"), true);
  assert.equal(peutGererRole("administrateur", "responsable_etablissement"), true);
  assert.equal(peutGererRole("administrateur", "membre"), true);
});

test("un responsable d'établissement ou un membre ne peut gérer personne", () => {
  assert.equal(peutGererRole("responsable_etablissement", "membre"), false);
  assert.equal(peutGererRole("membre", "membre"), false);
});
