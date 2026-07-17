// Webhook Vapi "fin d'appel" — voir docs/roadmap.md #72, docs/architecture.md
// (section « Décision d'architecture — Branchement des appels réels »).
//
// Vapi envoie un message `end-of-call-report` (message.type) au `server.url` de
// l'assistant une fois l'appel terminé et le post-traitement fait — jamais
// pendant l'appel. On écrit ici une ligne `Appels` + `Conversations`.
//
// Format du rapport vérifié empiriquement (pas deviné) contre le SDK serveur
// officiel Vapi (VapiAI/server-sdk-typescript, types ServerMessageEndOfCallReport/
// Artifact/Analysis/Call) et contre un vrai test sur assistant jetable — voir
// docs/sprint-log.md, tâche #72, pour le détail de la vérification.
//
// Périmètre volontaire de cette tâche (le reste vient aux tâches #73/#74) :
// - `etablissementId` reste `null` ("non déterminé") — la résolution via le
//   rendez-vous réellement pris est la tâche #73.
// - `rendezVousId`/`ClientFinal` non écrits ici — tâche #73.
// - `smsEnvoye`/`erreurs` laissés à leur valeur par défaut — tâche #74.
// - Un seul agent IA réel existe aujourd'hui (Barber Concept, tâche #71) :
//   l'agent est résolu via `vapi_assistant_id` (déjà la bonne clé de jointure
//   dans le schéma), sans construire de logique multi-agent — une seule requête
//   simple, qui continuera de fonctionner telle quelle le jour où d'autres
//   agents existeront.

const { randomUUID } = require('crypto');
const { pool } = require('./db');

// Raisons de fin d'appel Vapi correspondant à une fin normale de conversation
// (le client ou l'assistant a raccroché proprement). Liste vérifiée contre
// l'enum réel `ServerMessageEndOfCallReportEndedReason` du SDK Vapi.
const RAISONS_TERMINE = new Set([
  'customer-ended-call',
  'assistant-ended-call',
  'assistant-said-end-call-phrase',
  'assistant-ended-call-with-hangup-task',
  'assistant-ended-call-after-message-spoken',
]);

// Seule raison correspondant réellement à un transfert humain (fonctionnalité
// pas encore construite, Sprint 8) — gardée par anticipation, sans effet
// aujourd'hui puisqu'aucun outil de transfert n'est attaché à l'assistant.
const RAISONS_TRANSFERE = new Set(['assistant-forwarded-call']);

// `StatutAppel` (enum Postgres) n'a que 3 valeurs et la colonne est obligatoire
// (pas de `null` possible) — toute raison qui n'est ni une fin normale ni un
// transfert (erreur pipeline, silence, pas de réponse, dépassement de durée...)
// est classée `echoue`, le bucket le plus honnête des 3 pour "l'appel ne s'est
// pas terminé proprement". Documenté ici plutôt que deviné au cas par cas.
function determinerStatut(endedReason) {
  if (RAISONS_TRANSFERE.has(endedReason)) return 'transfere';
  if (RAISONS_TERMINE.has(endedReason)) return 'termine';
  return 'echoue';
}

// `artifact.messages` (SDK Vapi) contient les tours de parole avec un `role`
// ("user"/"bot"/"system"/"tool_calls"/"tool_call_result"...). L'écran Appels du
// Dashboard Client (dashboard/src/lib/appels-client.ts) n'affiche que les tours
// client/IA au format `{ locuteur: "ia" | "client", texte }` — on ne garde donc
// que ceux-là.
function construireTranscript(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && (m.role === 'user' || m.role === 'bot') && typeof m.message === 'string')
    .map((m) => ({ locuteur: m.role === 'user' ? 'client' : 'ia', texte: m.message }));
}

async function trouverAgentId(vapiAssistantId) {
  if (!vapiAssistantId) return null;
  const res = await pool.query('SELECT id FROM agents_ia WHERE vapi_assistant_id = $1', [vapiAssistantId]);
  return res.rows[0]?.id ?? null;
}

async function appelDejaEnregistre(vapiCallId) {
  if (!vapiCallId) return false;
  const res = await pool.query('SELECT id FROM appels WHERE vapi_call_id = $1', [vapiCallId]);
  return res.rows.length > 0;
}

async function handleVapiCallEnded(req, res) {
  const expectedSecret = process.env.VAPI_SERVER_SECRET;
  if (expectedSecret && req.header('x-vapi-secret') !== expectedSecret) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // Toujours répondre 200 à Vapi au-delà de ce point : une panne d'écriture
  // analytique ne doit jamais se voir côté Vapi (voir docs/architecture.md).
  res.status(200).json({ received: true });

  try {
    const message = req.body?.message;
    if (message?.type !== 'end-of-call-report') return;

    if (!pool) {
      console.log('[vapi-call-ended] DATABASE_URL absent, rapport ignoré (attendu en local sans base configurée)');
      return;
    }

    const vapiAssistantId = message.call?.assistantId ?? message.assistant?.id ?? null;
    const agentIaId = await trouverAgentId(vapiAssistantId);
    if (!agentIaId) {
      console.error(`[vapi-call-ended] Aucun agent IA trouvé pour vapi_assistant_id=${vapiAssistantId}, rapport ignoré`);
      return;
    }

    const vapiCallId = message.call?.id ?? null;
    if (await appelDejaEnregistre(vapiCallId)) {
      console.log(`[vapi-call-ended] Appel déjà enregistré (vapi_call_id=${vapiCallId}), doublon ignoré`);
      return;
    }

    const telephoneAppelant = message.customer?.number ?? message.call?.customer?.number ?? 'Numéro non communiqué';
    const debut = message.startedAt ? new Date(message.startedAt) : new Date();
    const fin = message.endedAt ? new Date(message.endedAt) : null;
    const dureeSecondes = fin ? Math.round((fin.getTime() - debut.getTime()) / 1000) : null;
    const statut = determinerStatut(message.endedReason);
    const coutDetail = message.cost !== undefined ? { total: message.cost, repartition: message.costs ?? [] } : null;
    const urlEnregistrement = message.artifact?.recordingUrl ?? message.artifact?.stereoRecordingUrl ?? null;

    const appelId = randomUUID();
    await pool.query(
      `INSERT INTO appels
        (id, agent_ia_id, vapi_call_id, telephone_appelant, debut, fin, duree_secondes, statut, cout_detail, url_enregistrement)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        appelId,
        agentIaId,
        vapiCallId,
        telephoneAppelant,
        debut,
        fin,
        dureeSecondes,
        statut,
        coutDetail ? JSON.stringify(coutDetail) : null,
        urlEnregistrement,
      ]
    );

    await pool.query(
      `INSERT INTO conversations (id, appel_id, transcript, resume, structured_outputs)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        randomUUID(),
        appelId,
        JSON.stringify(construireTranscript(message.artifact?.messages)),
        message.analysis?.summary ?? null,
        message.artifact?.structuredOutputs ? JSON.stringify(message.artifact.structuredOutputs) : null,
      ]
    );

    console.log(`[vapi-call-ended] Appel enregistré : ${appelId} (vapi_call_id=${vapiCallId}, statut=${statut})`);
  } catch (err) {
    console.error('[vapi-call-ended] Erreur lors de l\'écriture en base :', err.message);
  }
}

module.exports = { handleVapiCallEnded, determinerStatut, construireTranscript };
