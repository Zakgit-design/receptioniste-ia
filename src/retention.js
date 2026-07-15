// Script de rétention des enregistrements d'appels.
// Vapi n'offre pas de suppression automatique après N jours au niveau de l'assistant
// (voir docs/sprint-log.md) : ce script fait donc la suppression lui-même, à lancer
// manuellement pour l'instant (ou plus tard via une tâche planifiée, une fois le
// backend hébergé).
//
// Usage : node src/retention.js [--dry-run]
// Sans --dry-run, les appels plus vieux que RETENTION_DAYS sont supprimés (recording,
// transcript, tout l'artefact) via l'API Vapi. Action irréversible.

require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const ASSISTANT_ID = 'c08b8b99-c4f0-4aa1-8d0e-d0a833839a29';

// Valeur de démonstration courte — à ajuster selon la politique définitive du salon.
const RETENTION_DAYS = 7;

async function listOldCalls(cutoffDate) {
  const url = new URL('https://api.vapi.ai/call');
  url.searchParams.set('assistantId', ASSISTANT_ID);
  url.searchParams.set('createdAtLe', cutoffDate.toISOString());

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${VAPI_API_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`Échec de la liste des appels : ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

async function deleteCalls(ids) {
  const res = await fetch('https://api.vapi.ai/call', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    throw new Error(`Échec de la suppression : ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const oldCalls = await listOldCalls(cutoffDate);
  console.log(`${oldCalls.length} appel(s) plus vieux que ${RETENTION_DAYS} jours (avant le ${cutoffDate.toISOString()}).`);

  if (oldCalls.length === 0) return;

  if (dryRun) {
    console.log('Mode --dry-run : aucune suppression effectuée. IDs concernés :');
    oldCalls.forEach((c) => console.log('-', c.id, c.createdAt));
    return;
  }

  const ids = oldCalls.map((c) => c.id);
  await deleteCalls(ids);
  console.log(`${ids.length} appel(s) supprimé(s) (enregistrement, transcript, artefacts).`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
