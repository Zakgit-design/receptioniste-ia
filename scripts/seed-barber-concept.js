// Script ponctuel — tâche #71
//
// Crée les données réelles Barber Concept qui n'existaient pas encore en base :
// - les 6 établissements (Cornavin, Eaux-Vives, Jonction, Rive, Lausanne, Sion),
//   adresses tirées de src/prompts/system-prompt.md ("Salons Barber Concept")
// - l'unique agent IA réel (numéro Twilio + assistant Vapi partagés par les 6 salons)
//
// Important : `AgentIA.etablissementId` est une colonne obligatoire dans le schéma,
// mais Barber Concept partage un seul agent/numéro entre ses 6 salons. On lui
// assigne donc Cornavin (salon historique) de façon arbitraire — ce champ ne doit
// PAS être utilisé pour savoir quel salon un appel concerne. C'est le rôle de
// `Appel.etablissementId` (nullable, ajouté tâche #70), rempli au cas par cas
// selon le rendez-vous pris pendant l'appel.
//
// Ce script est idempotent-safe uniquement au sens où il vérifie l'état actuel
// avant d'écrire (voir vérifications ci-dessous) ; il n'est pas prévu pour être
// relancé plusieurs fois une fois les données en place.
//
// Usage : node scripts/seed-barber-concept.js

require('dotenv').config();
const { randomUUID } = require('crypto');
const { Pool } = require('pg');

const BARBER_CONCEPT_ID = '4116d8ed-bba1-444e-a1ce-32035e4fcf30';
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH;
const FUSEAU_HORAIRE = 'Europe/Zurich';

const ETABLISSEMENTS = [
  { nom: 'Cornavin', adresse: 'Rue de Chantepoulet 12, 1201 Genève' },
  { nom: 'Eaux-Vives', adresse: 'Rue des Eaux-Vives 74, 1207 Genève' },
  { nom: 'Jonction', adresse: 'Boulevard Carl-Vogt 45, 1205 Genève' },
  { nom: 'Rive', adresse: 'Cours de Rive 2, 1204 Genève' },
  { nom: 'Lausanne', adresse: 'Rue du Port-Franc 2, 1003 Lausanne' },
  { nom: 'Sion', adresse: 'Rue des Odyssées 7B, 1950 Sion' },
];

const VAPI_ASSISTANT_ID = 'c08b8b99-c4f0-4aa1-8d0e-d0a833839a29';
const NUMERO_TWILIO = '+41225391668';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL absent — vérifie ton .env');
  }
  if (!GOOGLE_CALENDAR_ID) {
    throw new Error('GOOGLE_CALENDAR_CREDENTIALS_PATH absent — vérifie ton .env');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const entreprise = await pool.query('SELECT id, nom FROM entreprises WHERE id = $1', [BARBER_CONCEPT_ID]);
    if (entreprise.rows.length === 0) {
      throw new Error(`Aucune entreprise trouvée avec l'id ${BARBER_CONCEPT_ID}`);
    }
    console.log(`Entreprise confirmée : ${entreprise.rows[0].nom} (${entreprise.rows[0].id})`);

    const existants = await pool.query('SELECT count(*) FROM etablissements WHERE entreprise_id = $1', [BARBER_CONCEPT_ID]);
    if (Number(existants.rows[0].count) > 0) {
      throw new Error('Des établissements existent déjà pour Barber Concept — arrêt pour éviter les doublons.');
    }
    const agentsExistants = await pool.query('SELECT count(*) FROM agents_ia WHERE entreprise_id = $1', [BARBER_CONCEPT_ID]);
    if (Number(agentsExistants.rows[0].count) > 0) {
      throw new Error('Un agent IA existe déjà pour Barber Concept — arrêt pour éviter les doublons.');
    }

    const idsParNom = {};
    for (const etab of ETABLISSEMENTS) {
      const res = await pool.query(
        `INSERT INTO etablissements (id, entreprise_id, nom, adresse, fuseau_horaire, google_calendar_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [randomUUID(), BARBER_CONCEPT_ID, etab.nom, etab.adresse, FUSEAU_HORAIRE, GOOGLE_CALENDAR_ID]
      );
      idsParNom[etab.nom] = res.rows[0].id;
      console.log(`Établissement créé : ${etab.nom} (${res.rows[0].id})`);
    }

    const configVoix = {
      voix: 'Elliot',
      langue: 'fr-FR',
      transcripteur: 'deepgram-nova-3',
    };

    const agent = await pool.query(
      `INSERT INTO agents_ia (id, entreprise_id, etablissement_id, vapi_assistant_id, numero_twilio, statut, config_voix)
       VALUES ($1, $2, $3, $4, $5, 'actif', $6)
       RETURNING id`,
      [randomUUID(), BARBER_CONCEPT_ID, idsParNom['Cornavin'], VAPI_ASSISTANT_ID, NUMERO_TWILIO, JSON.stringify(configVoix)]
    );
    console.log(`Agent IA créé : ${agent.rows[0].id} (rattaché à Cornavin — choix arbitraire, voir commentaire en tête de script)`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Erreur :', err.message);
  process.exit(1);
});
