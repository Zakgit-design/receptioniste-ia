// Webhook Vapi "fin d'appel" — voir docs/roadmap.md #72/#73, docs/architecture.md
// (section « Décision d'architecture — Branchement des appels réels »).
//
// Vapi envoie un message `end-of-call-report` (message.type) au `server.url` de
// l'assistant une fois l'appel terminé et le post-traitement fait — jamais
// pendant l'appel. On écrit ici une ligne `Appels` + `Conversations`, et,
// quand une réservation a réellement eu lieu (tâche #73), `ClientFinal` +
// `RendezVous`.
//
// Format du rapport vérifié empiriquement (pas deviné) contre le SDK serveur
// officiel Vapi (VapiAI/server-sdk-typescript, types ServerMessageEndOfCallReport/
// Artifact/Analysis/Call) et contre un vrai test sur assistant jetable — voir
// docs/sprint-log.md, tâche #72, pour le détail de la vérification.
//
// **Résolution de réservation (tâche #73) — découverte empirique importante,
// pas supposée :** l'outil natif Vapi `google_calendar_tool` n'a PAS de
// paramètres séparés pour le salon/la prestation/le client — seulement
// `summary` (texte libre), `startDateTime`, `endDateTime`. Vérifié en
// inspectant les payloads réels de 10 vrais appels passés depuis le 2026-07-15
// (API Vapi, `GET /call/{id}`) : le format de `summary` varie fortement d'un
// appel à l'autre (ordre Nom/Prestation/Salon différent, séparateurs "–"/"—"/
// "-"/"|", salon parfois absent du tout) — l'hypothèse du journal Sprint 3
// ("Coupe classique — Marie Dupont (Cornavin)") ne s'est pas confirmée comme
// un format stable. La résolution ci-dessous fait donc un rapprochement par
// présence de nom connu (salon/prestation, catalogues fermés et connus, pas
// une supposition sur une valeur arbitraire) dans ce texte libre — si le
// salon OU la prestation ne peut pas être rapproché avec confiance, aucune
// invention : avertissement journalisé, aucun `RendezVous`/`ClientFinal`
// créé, `Appel.etablissementId` reste `null` ("non déterminé"), conforme à
// la décision actée dans docs/architecture.md. Voir docs/sprint-log.md,
// tâche #73, pour le détail complet de cette vérification et ses limites.
//
// Périmètre volontaire de cette tâche (le reste vient à la tâche #74) :
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

async function trouverAgent(vapiAssistantId) {
  if (!vapiAssistantId) return null;
  const res = await pool.query('SELECT id, entreprise_id FROM agents_ia WHERE vapi_assistant_id = $1', [vapiAssistantId]);
  if (res.rows.length === 0) return null;
  return { id: res.rows[0].id, entrepriseId: res.rows[0].entreprise_id };
}

async function appelDejaEnregistre(vapiCallId) {
  if (!vapiCallId) return false;
  const res = await pool.query('SELECT id FROM appels WHERE vapi_call_id = $1', [vapiCallId]);
  return res.rows.length > 0;
}

// Retrouve, dans `artifact.messages`, le dernier appel réussi à l'outil natif
// Vapi `google_calendar_tool` (id `800fef25-6eda-4038-a1b5-599a25875f8c`) —
// c'est-à-dire un tour `tool_calls` suivi d'un `tool_call_result` dont le
// résultat est un événement Google Calendar créé (`id` présent, pas d'erreur).
// "Dernier" plutôt que "premier" pour couvrir le cas d'une nouvelle tentative
// après un échec (rare, pas observé en pratique sur les vrais appels inspectés).
function extraireReservationGoogleCalendar(messages) {
  if (!Array.isArray(messages)) return null;

  let derniere = null;
  for (const m of messages) {
    if (m?.role !== 'tool_call_result' || m.name !== 'google_calendar_tool') continue;

    let resultat;
    try {
      resultat = typeof m.result === 'string' ? JSON.parse(m.result) : m.result;
    } catch {
      continue;
    }
    if (!resultat || typeof resultat.id !== 'string' || resultat.error) continue;

    const messageAppelOutil = messages.find(
      (mm) => mm?.role === 'tool_calls' && mm.toolCalls?.some((tc) => tc.id === m.toolCallId)
    );
    const toolCall = messageAppelOutil?.toolCalls?.find((tc) => tc.id === m.toolCallId);
    let args = {};
    try {
      args = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : {};
    } catch {
      args = {};
    }

    derniere = {
      summary: typeof args.summary === 'string' ? args.summary : '',
      googleCalendarEventId: resultat.id,
      debut: resultat.start?.dateTime ? new Date(resultat.start.dateTime) : null,
    };
  }
  return derniere;
}

// Rapprochement par nom connu dans un texte libre — pas une supposition sur
// une valeur arbitraire : `candidats` est toujours un catalogue fermé et déjà
// connu (les établissements ou les services réels de l'entreprise). Trié du
// nom le plus long au plus court pour éviter qu'un nom plus court et proche ne
// prenne le pas sur un nom plus précis (ex. "Coupe classique" vs "Coupe et
// barbe avec traçage").
function trouverCorrespondance(texte, candidats) {
  if (!texte) return null;
  const texteNormalise = texte.toLowerCase();
  const tries = [...candidats].sort((a, b) => b.nom.length - a.nom.length);
  for (const candidat of tries) {
    if (texteNormalise.includes(candidat.nom.toLowerCase())) return candidat;
  }
  return null;
}

function retirerToutesOccurrences(texte, sousChaine) {
  if (!sousChaine) return texte;
  const echappe = sousChaine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return texte.replace(new RegExp(echappe, 'gi'), ' ');
}

// Une fois la prestation et l'établissement retirés du texte libre (voir
// ci-dessus), ce qui reste est en pratique le prénom/nom du client — vérifié
// contre les vrais résumés d'événements inspectés (tâche #73). Retourne
// `null` si plus rien d'exploitable ne reste (aucune invention de nom).
function extraireNomClient(summary, service, etablissement) {
  let reste = retirerToutesOccurrences(summary, service?.nom);
  reste = retirerToutesOccurrences(reste, etablissement?.nom);
  reste = reste.replace(/barber concept/gi, ' ').replace(/\bsalon\b/gi, ' ');
  reste = reste
    .split(/[-–—|,]+/)
    .map((morceau) => morceau.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return reste || null;
}

async function trouverOuCreerClientFinal(entrepriseId, telephone, nomDecouvert) {
  const existant = await pool.query(
    'SELECT id, nom FROM clients_finaux WHERE entreprise_id = $1 AND telephone = $2 LIMIT 1',
    [entrepriseId, telephone]
  );
  if (existant.rows.length > 0) {
    const client = existant.rows[0];
    if (!client.nom && nomDecouvert) {
      await pool.query('UPDATE clients_finaux SET nom = $1 WHERE id = $2', [nomDecouvert, client.id]);
    }
    return client.id;
  }
  const id = randomUUID();
  await pool.query(
    'INSERT INTO clients_finaux (id, entreprise_id, telephone, nom) VALUES ($1, $2, $3, $4)',
    [id, entrepriseId, telephone, nomDecouvert ?? null]
  );
  return id;
}

// Cœur de la tâche #73 : si une réservation a réellement eu lieu pendant
// l'appel (outil `google_calendar_tool` appelé avec succès), rapproche le
// salon et la prestation, crée/retrouve le `ClientFinal`, crée le
// `RendezVous`, et retourne de quoi mettre à jour la ligne `Appels`. Retourne
// `{ etablissementId: null, rendezVousId: null }` ("non déterminé") dans tous
// les cas où l'information ne peut pas être établie honnêtement — jamais de
// correspondance approximative devinée (voir commentaire en tête de fichier).
async function resoudreReservation({ entrepriseId, telephoneReel, messages }) {
  const reservation = extraireReservationGoogleCalendar(messages);
  if (!reservation) return { etablissementId: null, rendezVousId: null };

  if (!telephoneReel) {
    console.warn('[vapi-call-ended] Réservation détectée mais numéro appelant inconnu, RendezVous non créé.');
    return { etablissementId: null, rendezVousId: null };
  }
  if (!reservation.debut) {
    console.warn(
      "[vapi-call-ended] Réservation détectée mais heure de début absente du résultat Google Calendar, RendezVous non créé."
    );
    return { etablissementId: null, rendezVousId: null };
  }

  const [servicesRes, etablissementsRes] = await Promise.all([
    pool.query('SELECT id, nom, duree_minutes FROM services WHERE entreprise_id = $1', [entrepriseId]),
    pool.query('SELECT id, nom FROM etablissements WHERE entreprise_id = $1', [entrepriseId]),
  ]);
  const services = servicesRes.rows.map((r) => ({ id: r.id, nom: r.nom, dureeMinutes: r.duree_minutes }));
  const etablissements = etablissementsRes.rows.map((r) => ({ id: r.id, nom: r.nom }));

  const service = trouverCorrespondance(reservation.summary, services);
  const etablissement = trouverCorrespondance(reservation.summary, etablissements);

  if (!service || !etablissement) {
    const manquants = [!service && 'prestation', !etablissement && 'établissement'].filter(Boolean).join(' et ');
    console.warn(
      `[vapi-call-ended] Réservation détectée mais ${manquants} non reconnu(e) dans le résumé de l'événement ` +
        `("${reservation.summary}") — RendezVous non créé, aucune correspondance approximative devinée.`
    );
    return { etablissementId: null, rendezVousId: null };
  }

  const nomClient = extraireNomClient(reservation.summary, service, etablissement);
  const clientFinalId = await trouverOuCreerClientFinal(entrepriseId, telephoneReel, nomClient);

  const rendezVousId = randomUUID();
  await pool.query(
    `INSERT INTO rendez_vous
      (id, etablissement_id, service_id, client_final_id, google_calendar_event_id, debut, duree_minutes, statut)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirme')`,
    [
      rendezVousId,
      etablissement.id,
      service.id,
      clientFinalId,
      reservation.googleCalendarEventId,
      reservation.debut,
      service.dureeMinutes,
    ]
  );

  console.log(
    `[vapi-call-ended] Rendez-vous créé : ${rendezVousId} (établissement=${etablissement.nom}, service=${service.nom})`
  );
  return { etablissementId: etablissement.id, rendezVousId };
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
    const agent = await trouverAgent(vapiAssistantId);
    if (!agent) {
      console.error(`[vapi-call-ended] Aucun agent IA trouvé pour vapi_assistant_id=${vapiAssistantId}, rapport ignoré`);
      return;
    }
    const agentIaId = agent.id;

    const vapiCallId = message.call?.id ?? null;
    if (await appelDejaEnregistre(vapiCallId)) {
      console.log(`[vapi-call-ended] Appel déjà enregistré (vapi_call_id=${vapiCallId}), doublon ignoré`);
      return;
    }

    const telephoneReel = message.customer?.number ?? message.call?.customer?.number ?? null;
    const telephoneAppelant = telephoneReel ?? 'Numéro non communiqué';
    const debut = message.startedAt ? new Date(message.startedAt) : new Date();
    const fin = message.endedAt ? new Date(message.endedAt) : null;
    const dureeSecondes = fin ? Math.round((fin.getTime() - debut.getTime()) / 1000) : null;
    const statut = determinerStatut(message.endedReason);
    const coutDetail = message.cost !== undefined ? { total: message.cost, repartition: message.costs ?? [] } : null;
    const urlEnregistrement = message.artifact?.recordingUrl ?? message.artifact?.stereoRecordingUrl ?? null;

    // Résolution du rendez-vous éventuel (tâche #73), isolée dans son propre
    // bloc try/catch : un échec ici ne doit jamais empêcher l'écriture
    // Appels/Conversations ci-dessous (déjà acquise depuis la tâche #72).
    let etablissementId = null;
    let rendezVousId = null;
    try {
      const resultat = await resoudreReservation({
        entrepriseId: agent.entrepriseId,
        telephoneReel,
        messages: message.artifact?.messages,
      });
      etablissementId = resultat.etablissementId;
      rendezVousId = resultat.rendezVousId;
    } catch (err) {
      console.error(
        '[vapi-call-ended] Erreur lors de la résolution du rendez-vous (Appel/Conversations reste écrit) :',
        err.message
      );
    }

    const appelId = randomUUID();
    await pool.query(
      `INSERT INTO appels
        (id, agent_ia_id, etablissement_id, vapi_call_id, telephone_appelant, debut, fin, duree_secondes, statut, cout_detail, url_enregistrement, rendez_vous_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        appelId,
        agentIaId,
        etablissementId,
        vapiCallId,
        telephoneAppelant,
        debut,
        fin,
        dureeSecondes,
        statut,
        coutDetail ? JSON.stringify(coutDetail) : null,
        urlEnregistrement,
        rendezVousId,
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
