require('dotenv').config();

const express = require('express');
const { sendAppointmentConfirmationSms } = require('./sms');
const { handleVapiCallEnded } = require('./call-webhook');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// Webhook appelé par l'assistant Vapi (outil "function" send_appointment_confirmation_sms),
// uniquement après que le rendez-vous a réellement été créé dans Google Calendar.
app.post('/webhooks/vapi-tools', async (req, res) => {
  const expectedSecret = process.env.VAPI_SERVER_SECRET;
  if (expectedSecret && req.header('x-vapi-secret') !== expectedSecret) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const toolCalls =
    req.body?.message?.toolCallList ||
    (req.body?.message?.toolWithToolCallList || []).map((t) => t.toolCall);

  const results = await Promise.all(
    (toolCalls || []).map(async (toolCall) => {
      const { id, function: fn } = toolCall;

      if (fn?.name !== 'send_appointment_confirmation_sms') {
        return { toolCallId: id, result: 'unknown_tool' };
      }

      const args = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments) : fn.arguments;
      const smsResult = await sendAppointmentConfirmationSms(args);
      return { toolCallId: id, result: JSON.stringify(smsResult) };
    })
  );

  res.status(200).json({ results });
});

// Webhook appelé par Vapi à la fin de chaque appel (rapport de fin d'appel),
// jamais pendant — voir src/call-webhook.js et docs/roadmap.md, tâche #72.
app.post('/webhooks/vapi-call-ended', handleVapiCallEnded);

// Ping périodique de notre propre URL publique pour éviter la mise en veille
// du plan gratuit Render (qui endort le service après ~15 min sans requête
// entrante) — un service endormi fait échouer l'appel SMS pendant un vrai
// appel (délai d'attente Vapi dépassé pendant le redémarrage à froid).
// N'agit que si PUBLIC_URL est configuré (donc jamais en développement local).
const PUBLIC_URL = process.env.PUBLIC_URL;
const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;

if (PUBLIC_URL) {
  setInterval(() => {
    fetch(`${PUBLIC_URL}/health`)
      .then(() => console.log('[keep-alive] ping ok'))
      .catch((err) => console.log('[keep-alive] ping échoué:', err.message));
  }, KEEP_ALIVE_INTERVAL_MS);
}

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
