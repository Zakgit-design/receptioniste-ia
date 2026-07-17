// Connexion Postgres (Supabase) du backend Express — même base que le dashboard
// (dashboard/), mais sans Prisma ici : requêtes SQL directes via `pg`, cohérent
// avec la simplicité déjà pratiquée dans ce backend (voir sms.js, customers.js).
//
// Les migrations restent la propriété exclusive de `dashboard/prisma/migrations` —
// ce module ne fait que lire/écrire dans le schéma existant, jamais le migrer.
//
// Utilise le pooler Supabase en mode transaction (port 6543), comme le runtime
// du dashboard (dashboard/src/lib/prisma.ts) — pas DIRECT_URL, réservé aux
// migrations Prisma.
//
// N'active la connexion que si DATABASE_URL est présent, pour ne jamais faire
// planter le serveur en développement local sans base configurée (même principe
// que PUBLIC_URL/keep-alive dans server.js).

require('dotenv').config();

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : null;

if (!DATABASE_URL) {
  console.log('[db] DATABASE_URL absent : connexion Postgres désactivée (attendu en local sans base configurée)');
}

module.exports = { pool };
