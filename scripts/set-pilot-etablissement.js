// Script ponctuel — Sprint 7, tâche #76
//
// Change l'établissement pilote de l'unique agent IA Barber Concept, de
// Cornavin (choix par défaut proposé, car déjà configuré depuis le Sprint
// 6bis) vers Jonction (choix confirmé par le fondateur le 2026-07-22).
//
// N'affecte que la colonne `agents_ia.etablissement_id` — le numéro Twilio et
// l'assistant Vapi restent strictement les mêmes, aucun appel à l'API Vapi
// n'est nécessaire pour ce changement (voir docs/roadmap.md, Sprint 7).
//
// Usage : node scripts/set-pilot-etablissement.js

require('dotenv').config();
const { Pool } = require('pg');

const NOUVEL_ETABLISSEMENT_NOM = 'Jonction';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const { rows: etabs } = await pool.query(
    'SELECT id, nom FROM etablissements WHERE nom = $1',
    [NOUVEL_ETABLISSEMENT_NOM]
  );
  if (etabs.length !== 1) {
    throw new Error(`Établissement "${NOUVEL_ETABLISSEMENT_NOM}" introuvable ou ambigu`);
  }
  const nouvelEtablissementId = etabs[0].id;

  const { rows: avant } = await pool.query(
    `SELECT a.id, a.etablissement_id, e.nom AS etablissement_nom, a.numero_twilio, a.vapi_assistant_id
     FROM agents_ia a JOIN etablissements e ON e.id = a.etablissement_id`
  );
  console.log('Avant :', avant);

  if (avant.length !== 1) {
    throw new Error(`Attendu exactement 1 ligne agents_ia, trouvé ${avant.length}`);
  }

  await pool.query(
    'UPDATE agents_ia SET etablissement_id = $1 WHERE id = $2',
    [nouvelEtablissementId, avant[0].id]
  );

  const { rows: apres } = await pool.query(
    `SELECT a.id, a.etablissement_id, e.nom AS etablissement_nom, a.numero_twilio, a.vapi_assistant_id
     FROM agents_ia a JOIN etablissements e ON e.id = a.etablissement_id`
  );
  console.log('Après :', apres);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
