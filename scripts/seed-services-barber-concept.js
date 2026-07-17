// Script ponctuel — tâche #73
//
// Crée les prestations de base réelles de Barber Concept (table `services`),
// qui n'existaient pas encore en base alors que `RendezVous.serviceId` est une
// colonne obligatoire. Même préalable découvert et même méthode qu'à la tâche
// #71 (script ponctuel, commité car il documente une donnée réelle
// reproductible) — voir docs/sprint-log.md, tâche #71.
//
// Tarifs et durées tirés de src/prompts/system-prompt.md, section
// « Tarifs et durées » (prix identiques dans les six salons).
//
// Simplification assumée, à garder en tête pour la suite (pas corrigée ici,
// hors périmètre de cette tâche) : le prompt vocal prévoit aussi des tarifs
// étudiants (remise sur plusieurs prestations) et des prestations spécifiques
// à un seul salon (« Coupe Henok » / « Coupe & Barbe Henok » au salon Rive
// uniquement, prestations Twist/Locks/Braids au salon Eaux-Vives uniquement,
// voir system-prompt.md « Prestations spécifiques par salon »). Le modèle
// `Service` actuel n'a qu'un prix unique par service, sans variation par salon
// ou par profil client — seules les 15 prestations de base ci-dessous sont
// donc semées. Une réservation réelle pour une prestation spécifique à un
// salon ne trouvera pas de correspondance ici (voir src/call-webhook.js,
// tâche #73, qui journalise un avertissement plutôt que de deviner).
//
// Usage : node scripts/seed-services-barber-concept.js

require('dotenv').config();
const { randomUUID } = require('crypto');
const { Pool } = require('pg');

const BARBER_CONCEPT_ID = '4116d8ed-bba1-444e-a1ce-32035e4fcf30';

const SERVICES = [
  { nom: 'Coupe étudiante', prix: 30, dureeMinutes: 30 },
  { nom: 'Coupe classique', prix: 35, dureeMinutes: 30 },
  { nom: 'Coupe et barbe avec traçage', prix: 40, dureeMinutes: 40 },
  { nom: 'Transformation', prix: 50, dureeMinutes: 60 },
  { nom: 'Coupe et barbe traditionnelle', prix: 55, dureeMinutes: 60 },
  { nom: 'Barbe avec serviette chaude', prix: 25, dureeMinutes: 30 },
  { nom: 'Barbe et épilation à la cire', prix: 35, dureeMinutes: 40 },
  { nom: 'Shampoing', prix: 5, dureeMinutes: 5 },
  { nom: 'Défrisage', prix: 30, dureeMinutes: 20 },
  { nom: 'Coloration cheveux courts', prix: 80, dureeMinutes: 60 },
  { nom: 'Permanente', prix: 80, dureeMinutes: 45 },
  { nom: 'Coloration cheveux mi-longs', prix: 90, dureeMinutes: 75 },
  { nom: 'Coloration cheveux longs', prix: 100, dureeMinutes: 90 },
  { nom: 'Design', prix: 15, dureeMinutes: 15 },
  { nom: 'Masque noir', prix: 15, dureeMinutes: 15 },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL absent — vérifie ton .env');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const entreprise = await pool.query('SELECT id, nom FROM entreprises WHERE id = $1', [BARBER_CONCEPT_ID]);
    if (entreprise.rows.length === 0) {
      throw new Error(`Aucune entreprise trouvée avec l'id ${BARBER_CONCEPT_ID}`);
    }
    console.log(`Entreprise confirmée : ${entreprise.rows[0].nom} (${entreprise.rows[0].id})`);

    const existants = await pool.query('SELECT count(*) FROM services WHERE entreprise_id = $1', [BARBER_CONCEPT_ID]);
    if (Number(existants.rows[0].count) > 0) {
      throw new Error('Des services existent déjà pour Barber Concept — arrêt pour éviter les doublons.');
    }

    for (const service of SERVICES) {
      const res = await pool.query(
        `INSERT INTO services (id, entreprise_id, nom, duree_minutes, prix)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [randomUUID(), BARBER_CONCEPT_ID, service.nom, service.dureeMinutes, service.prix]
      );
      console.log(`Service créé : ${service.nom} (${res.rows[0].id})`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Erreur :', err.message);
  process.exit(1);
});
