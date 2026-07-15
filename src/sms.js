// SMS de confirmation de rendez-vous — module autonome, remplaçable.
// Envoie via un Twilio Messaging Service (Alphanumeric Sender ID), jamais via le
// numéro vocal +41 22 539 16 68 qui est Voice/SIP uniquement.

require('dotenv').config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;

// Anti-double-envoi pour la démo (en mémoire — repart à zéro si le process redémarre).
// Passer un `appointmentId` stable (ex : l'id de l'événement Google Calendar) pour l'activer.
const sentAppointments = new Set();

function normalizePhoneNumber(rawNumber) {
  if (!rawNumber) return null;
  const digits = rawNumber.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('00')) return '+' + digits.slice(2);
  if (digits.startsWith('0')) return '+41' + digits.slice(1);
  if (digits.startsWith('41')) return '+' + digits;
  return null;
}

function isValidE164(number) {
  return /^\+[1-9]\d{7,14}$/.test(number);
}

function buildMessage({ firstName, appointmentDate, appointmentTime, salon, service }) {
  return `Bonjour ${firstName},\nVotre rendez-vous chez Barber Concept est confirmé.\n\nDate : ${appointmentDate}\nHeure : ${appointmentTime}\nSalon : ${salon}\nPrestation : ${service}\n\nÀ bientôt chez Barber Concept.`;
}

// appointmentId (optionnel) : identifiant stable du rendez-vous, pour éviter un double envoi
// si la fonction est appelée deux fois pour le même rendez-vous.
async function sendAppointmentConfirmationSms({
  to,
  firstName,
  appointmentDate,
  appointmentTime,
  salon,
  service,
  appointmentId,
}) {
  const normalized = normalizePhoneNumber(to);
  if (!normalized || !isValidE164(normalized)) {
    console.error(`[SMS] numéro invalide ou absent, envoi annulé.`);
    return { status: 'failed', error: 'invalid_phone_number' };
  }

  if (appointmentId && sentAppointments.has(appointmentId)) {
    console.log(`[SMS] déjà envoyé pour ce rendez-vous (${appointmentId}), envoi ignoré.`);
    return { status: 'skipped', error: 'already_sent' };
  }

  const body = buildMessage({ firstName, appointmentDate, appointmentTime, salon, service });

  const params = new URLSearchParams();
  params.append('To', normalized);
  params.append('MessagingServiceSid', TWILIO_MESSAGING_SERVICE_SID);
  params.append('Body', body);

  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      }
    );
    const data = await res.json();

    if (!res.ok) {
      console.error(`[SMS] échec Twilio (code ${data.code}) pour un numéro se terminant par ${normalized.slice(-4)}.`);
      return { status: 'failed', error: `twilio_error_${data.code}` };
    }

    if (appointmentId) sentAppointments.add(appointmentId);
    console.log(`[SMS] envoyé avec succès — sid=${data.sid}, statut=${data.status}.`);
    return { status: 'sent', twilioMessageSid: data.sid };
  } catch (err) {
    console.error(`[SMS] erreur réseau lors de l'envoi.`);
    return { status: 'failed', error: 'network_error' };
  }
}

module.exports = { sendAppointmentConfirmationSms, normalizePhoneNumber, isValidE164 };
