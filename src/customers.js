// Interface d'identification client — remplaçable par le connecteur Get Time plus tard.
// Tant que Get Time n'est pas branché, ces fonctions utilisent une petite base de
// démonstration en mémoire. Le jour de l'intégration, seul le contenu de ce fichier
// change (mêmes noms de fonctions, mêmes formats d'entrée/sortie) — le reste du code
// et le prompt Vapi n'ont pas besoin d'être modifiés.

const DEMO_CUSTOMERS = [
  { id: 1, firstName: 'Karim', lastName: 'Haddad', phone: '+41791234567' },
  { id: 2, firstName: 'Sophie', lastName: 'Muller', phone: '+41765554433' },
  { id: 3, firstName: 'David', lastName: 'Nguyen', phone: '+41221234567' },
];

let nextId = DEMO_CUSTOMERS.length + 1;

// Extrait le numéro de l'appelant depuis les métadonnées d'appel Twilio/Vapi.
function getCallerPhoneNumber(callPayload) {
  return (callPayload && callPayload.customer && callPayload.customer.number) || null;
}

// Normalise un numéro suisse (ou déjà international) au format E.164.
// Retourne null si le format n'est pas reconnu plutôt que de deviner.
function normalizePhoneNumber(rawNumber) {
  if (!rawNumber) return null;
  const digits = rawNumber.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('00')) return '+' + digits.slice(2);
  if (digits.startsWith('0')) return '+41' + digits.slice(1);
  if (digits.startsWith('41')) return '+' + digits;
  return null;
}

// Recherche un client par numéro E.164. Retourne le client ou null.
function findCustomerByPhone(e164Number) {
  if (!e164Number) return null;
  return DEMO_CUSTOMERS.find((c) => c.phone === e164Number) || null;
}

// Crée un nouveau client dans la base de démonstration et le retourne.
function createCustomer({ firstName, lastName, phone }) {
  const customer = { id: nextId++, firstName, lastName, phone };
  DEMO_CUSTOMERS.push(customer);
  return customer;
}

module.exports = {
  getCallerPhoneNumber,
  normalizePhoneNumber,
  findCustomerByPhone,
  createCustomer,
  DEMO_CUSTOMERS,
};
