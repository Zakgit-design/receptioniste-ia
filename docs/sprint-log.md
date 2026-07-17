# Journal d'avancement

Mis à jour après chaque tâche ou sprint. Le Product Manager et le QA Engineer s'y réfèrent mais ne l'éditent pas eux-mêmes — c'est tenu à jour par le tech lead (session principale) sur la base de leurs rapports.

## Sprint 0 — Fondations techniques
Statut : en cours — pilotage Tech Lead, exécution non linéaire (voir note ci-dessous)
Tâches : voir `docs/roadmap.md` #1-8

**Note Tech Lead (2026-07-14) :** à partir de maintenant, les tâches administratives (création de comptes externes) ne bloquent plus le développement. Elles sont marquées "En attente d'une action utilisateur" et le code avance en parallèle sur tout ce qui ne dépend pas de ces comptes. Le compte Twilio est en Pay As You Go, crédit déposé — l'achat du numéro (tâche 2) est repoussé jusqu'au moment où il devient techniquement indispensable (premier appel réel de bout en bout).

- [x] 1. Créer un compte Twilio et vérifier l'identité — terminé le 2026-07-14. Compte créé, identité vérifiée, passé en Pay As You Go. QA : aucun secret Twilio dans le dépôt, aucun débordement de périmètre.
- [x] 2. Réserver un numéro de téléphone de test — terminé le 2026-07-15. Numéro suisse **+41 22 539 16 68** acheté par le fondateur sur Twilio (SID dans `.env`).
- [x] 3. Créer un compte Vapi — terminé le 2026-07-14. Clé privée créée, stockée dans `.env` (non suivie par Git), testée avec succès via l'API Vapi.
- [x] 4. Créer un compte Anthropic (API Claude) et générer une clé API — terminé le 2026-07-14. Clé créée, stockée dans `.env` (non suivi par Git). Crédit ajouté par le fondateur, appel réel testé avec succès.
- [ ] 5. Créer un compte d'hébergement (Render ou Railway) — **En attente d'une action utilisateur**, non bloquant tant qu'on développe en local. Ne bloque pas Sprint 3 (voir note ci-dessous) — utile seulement pour un futur webhook `assistant-request` (identification client par numéro).
- [x] 6. Initialiser le projet de code — terminé le 2026-07-14. Squelette Node.js/Express créé (`package.json`, `src/server.js`, `.gitignore`, `.env.example`), route `GET /health` testée et fonctionnelle. Dépendances volontairement limitées à express + dotenv (twilio/googleapis/anthropic ajoutés seulement quand utilisés). QA validé : aucun secret, aucun scope creep, aucun commit prématuré.
  - Note technique : Node.js n'était pas installé sur la machine — installé via nvm (v24.18.0), lié dans `~/.local/bin` pour être disponible dans tous les terminaux. Aucune action requise de ta part.
- [x] 7. Connecter le numéro Twilio à Vapi — terminé le 2026-07-15. Numéro importé dans Vapi (`phoneNumberId: 32cf3e61-1c37-4a9e-8716-2c6ea58febdb`), rattaché à l'assistant Barber Concept. Webhook vocal Twilio pointe vers `api.vapi.ai/twilio/inbound_call`.
- [x] 8. Appeler le numéro et vérifier la réponse — terminé le 2026-07-15. **Plusieurs vrais appels téléphoniques réussis depuis lors** (test transcripteur multilingue, test réservation complète avec Henok, etc.) — voir sections FAQ/identification client ci-dessous. Sprint 0 concrètement terminé, au-delà du simple message de test.

**Correction du 2026-07-15 (tech lead) :** cette section n'avait pas été remise à jour après l'achat du numéro et les premiers appels réels — un product-manager consulté sur un cadrage ultérieur s'est appuyé sur ces lignes obsolètes et a cru, à tort, qu'aucun appel téléphonique réel n'avait encore eu lieu. Le numéro et la connexion Vapi sont bien opérationnels depuis le 2026-07-15.

## Sprint 1 — Conversation IA basique
Statut : en cours — contenu préparé, tests live en attente (bloqués par tâches 3/4)
- [x] 10. Premier prompt système (générique) rédigé — `src/prompts/system-prompt.md`, en attente de connexion Vapi/Claude pour test réel.
- [x] 9. Connecter la clé API Claude dans Vapi — terminé le 2026-07-14, via l'API Vapi (pas de manipulation dashboard nécessaire) : credential Anthropic créé (`AnthropicCredential`, clé jamais affichée), assistant "Receptionniste Barber Concept" créé avec modèle `claude-sonnet-4-6`, chargé avec `src/prompts/system-prompt.md`. Assistant id noté dans le code/config pour la suite (non sensible).
- [x] 12. Choisir et régler la voix française — terminé le 2026-07-14. Voix Vapi native "Elliot", langue `fr-FR` (v2) — pas besoin de compte tiers (ElevenLabs/Azure). Transcription : Deepgram nova-3, langue `fr` (fourni nativement par Vapi).
- [x] 11. (proxy texte, hors Vapi) 5 questions FAQ testées directement via l'API Claude — réponses cohérentes en français, pas d'invention.
- [x] 11-bis. Test réel via l'assistant Vapi (`/chat`, carte ajoutée) sur les 5 questions FAQ — terminé le 2026-07-14. Réponses cohérentes en français, honnêtes sur le manque d'info, ton naturel. C'est le vrai pipeline Claude-via-Vapi, pas un proxy.
- [x] 13. Latence mesurée via Vapi (`/chat`, texte) : ~2.5-8.8s selon la question. Reste à mesurer en conditions vocales réelles (STT+TTS ajoutent de la latence) — nécessite soit un appel réel (tâche 7-8, numéro Twilio), soit un test "Talk to Assistant" dans le dashboard Vapi (micro navigateur, aucun compte supplémentaire requis, tu peux le faire toi-même si tu veux entendre la voix avant l'achat du numéro).

**Sprint 1 : config et contenu essentiellement terminés.** Il ne manque plus qu'un test acoustique réel (voix) pour clore complètement le sprint.
- [x] 14. 5 questions FAQ de test listées :
  1. "Quels sont vos horaires d'ouverture ?"
  2. "Est-ce que je peux prendre rendez-vous pour une coupe demain ?"
  3. "Combien coûte une coupe barbe + cheveux ?"
  4. "Dans quel salon puis-je venir le plus proche des Eaux-Vives ?"
  5. "Est-ce que je peux parler à quelqu'un directement ?" (test du transfert humain, Sprint 5)

## Sprint 2 — FAQ complètes
Statut : en cours — infos réelles intégrées et testées, quelques points à confirmer avec Henok (voir résumé du 2026-07-14)
- [x] 15-16. Horaires + tarifs des 6 salons (site officiel) intégrés dans `src/prompts/system-prompt.md`
- [x] 17. FAQ clients (20 questions types) listées et intégrées
- [x] 18. Infos intégrées dans le prompt système, assistant Vapi existant mis à jour via l'API (pas de nouvel assistant créé)
- [x] 19. 15 questions testées via l'API Vapi réelle (`/chat`) — voir résumé
- [x] 21. Règle stricte anti-invention déjà présente et vérifiée dans les tests (disponibilités, tarif étudiant, moyens de paiement, enfants, annulation)
- [ ] 20. Corrections à prévoir : aucun échec factuel détecté sur les 15 tests, mais l'accent/la prononciation n'est testable qu'à l'oral (voir limite ci-dessous)
- Sauvegarde de l'assistant avant modification : `docs/backups/vapi-assistant-before-faq.json`

## Identification client par numéro appelant (préparation Get Time)
Statut : prompt et interface backend en place, validé par tests texte (`/chat`) — 2026-07-15.
Tâche demandée directement par le fondateur (hors numérotation roadmap.md), en préparation de l'intégration Get Time (Sprint 3+).

- Fichiers modifiés : `src/prompts/system-prompt.md` (nouvelle section « Identification du client », règle de confidentialité, recap avec numéro obligatoire avant finalisation), `src/customers.js` (nouveau — interface remplaçable : `getCallerPhoneNumber`, `normalizePhoneNumber`, `findCustomerByPhone`, `createCustomer`, jeu de données démo).
- Sauvegarde assistant avant modification : `docs/backups/vapi-assistant-before-client-identification.json`.
- Fonctionne aujourd'hui sur un appel réel (via `{{customer.number}}`, injecté nativement par Vapi) : numéro jamais redemandé s'il est déjà là, seuls les 4 derniers chiffres sont récités, jamais de récap/finalisation sans numéro confirmé, refus de divulguer les infos d'un tiers, gestion "rdv pour quelqu'un d'autre" et "numéro dicté puis corrigé".
- **Limite structurelle identifiée par les tests :** la reconnaissance d'un client déjà connu (« Bonjour, est-ce que je parle bien à Karim ? ») ne peut pas fonctionner sur un appel réel tant que `src/customers.js` n'est pas réellement interrogé avant que Claude ne parle. Cela demande un webhook Vapi (`assistant-request`) sur le numéro de téléphone, donc un backend accessible publiquement — bloqué par la tâche roadmap #5 (hébergement), pas encore fait. `findCustomerByPhone` est prêt et testé unitairement, mais non branché.
- `Get Time` n'est pas connecté (comme demandé) — seule une base de démonstration locale (3 faux clients) est utilisée dans `src/customers.js`.

## Sprint 3 — Agenda et rendez-vous
Statut : cadré par le PM (2026-07-15), préparation technique faite, **bloqué en attente de 2 actions humaines** (voir message au fondateur). Tâches roadmap.md #22-29.

- Cadrage PM (2026-07-15) : périmètre conforme aux tâches #22-29. Le PM avait signalé "pas d'appel Twilio réel possible" en s'appuyant sur la note Sprint 0 obsolète, corrigée le même jour (voir ci-dessus) — le numéro suisse fonctionne déjà.
- **Découverte technique clé :** Vapi propose des outils natifs `google.calendar.availability.check` et `google.calendar.event.create`, directement utilisables par l'assistant, sans backend ni webhook à nous. Ça évite complètement le blocage d'hébergement (tâche #5) pour ce sprint.
- Connexion Google Calendar à Vapi : OAuth pilotée **uniquement depuis le dashboard Vapi** (Integrations > Tools Provider > Google Calendar > Connect) — pas d'endpoint API pour ça, confirmé dans le schéma OpenAPI et la doc Vapi.
- Nouvelle section « Réservations » rédigée (vérifier créneau → proposer alternative si besoin → reformuler → créer → ne confirmer qu'après succès réel) mais **pas encore déployée** : elle référence les deux outils d'agenda, donc ne doit être poussée qu'une fois ces outils réellement attachés à l'assistant.
- Simplification assumée : un seul agenda Google Calendar de démonstration pour les six salons (conforme à l'intitulé de la tâche #22, "un Google Calendar de démonstration dédié" — pas un agenda par salon).
- **Actions humaines faites le 2026-07-15 :** calendrier créé, ID dans `.env` (`GOOGLE_CALENDAR_CREDENTIALS_PATH`), compte Google autorisé dans le dashboard Vapi (credential `google.calendar.oauth2-authorization`, id `1e246638-fcf6-4fae-aa88-6668be0c8786`, confirmé présent via l'API).
- **Incident du 2026-07-15 (~10:20-10:26) :** attacher les outils `google.calendar.availability.check` + `google.calendar.event.create` (sans configuration supplémentaire, l'API n'exposant pas de champ `calendarId`) a rendu l'assistant **live** totalement non-fonctionnel — même une question FAQ sans rapport a timeout (HTTP 524 côté Vapi). Rollback immédiat vers `docs/backups/vapi-assistant-before-calendar-tools.json`, assistant de nouveau opérationnel (revérifié par un test FAQ). **Leçon retenue : `PATCH /assistant` remplace l'objet `model` en entier plutôt que de fusionner — un patch partiel (ex: juste `tools`) supprime le prompt système s'il n'est pas ré-inclus. Toujours renvoyer l'objet `model` complet (messages compris) à chaque PATCH.** Cet incident a lui-même causé un aller-retour de ce type, repéré et corrigé immédiatement avant impact sur un vrai appel.
- Cause du hang non identifiée avec certitude — hypothèse : le simple fait d'avoir un outil `google.*` dans `model.tools` déclenche une validation/résolution de credential côté Vapi à chaque requête (même sans invocation réelle de l'outil), qui échoue silencieusement.
- **Diagnostic approfondi (assistant de test jetable, créé puis supprimé, aucun impact sur le live) :** reproduit à l'identique avec `google.calendar.availability.check` seul, et avec `google.calendar.event.create` seul — donc pas spécifique à un outil, ni à la question posée (même "Bonjour" plante). Tentative de correctif : création d'un credential `google.calendar.oauth2-client` (qui manquait, seul `google.calendar.oauth2-authorization` existait) — sans effet, même symptôme après.
- **Conclusion :** la config minimale via l'API (`{"type": "google.calendar.event.create"}` / `{"type": "google.calendar.availability.check"}` dans `model.tools`) ne suffit pas, malgré un schéma d'API qui l'accepte sans erreur de validation. Le schéma OpenAPI de ces outils référence des `templateUrl`/`setupInstructions` (mécanisme de "tool template"), ce qui suggère que ces outils sont conçus pour être configurés depuis l'assistant builder du dashboard Vapi (pas uniquement l'OAuth), et qu'une configuration créée à la main via l'API brute leur manque une pièce non documentée publiquement.
- **Décision :** ne pas continuer à tâtonner via l'API sur ce point (chaque essai reproduit une vraie panne pendant ~30-40 secondes, risque réel si tenté par erreur sur l'assistant live). Prochaine action humaine nécessaire : configurer les deux outils Google Calendar directement depuis le dashboard Vapi (assistant "Receptionniste Barber Concept" > Tools > Add tool > Google Calendar), qui gère probablement le câblage manquant automatiquement. Sprint 3 reste bloqué sur ce point précis.

### Suite et clôture (2026-07-15, même journée)

Outils créés manuellement dans le dashboard par le fondateur (`google_calendar_check_availability_tool` id `e7b1d000-89ae-42e1-84ce-71cb1d33b3da`, `google_calendar_tool` (create) id `800fef25-6eda-4038-a1b5-599a25875f8c`), avec `metadata.calendarId` et `metadata.timeZone: Europe/Zurich` déjà configurés — c'est précisément ce qui manquait à la tentative API brute. Attachés via `model.toolIds` (pas `model.tools` en ligne, qui avait causé la panne précédente).

**Tests, sur un assistant de test jetable (créé puis supprimé, aucun lien avec le numéro de production) :**
- Outils testés un par un puis ensemble.
- **Bug trouvé et corrigé n°1 :** le prompt ne disait jamais à l'assistant la date/heure actuelles → calculs de date faux (année 2025 au lieu de 2026 pour "jeudi prochain"). Corrigé en injectant `{{now}}` (fuseau Europe/Zurich) dans le prompt.
- **Bug trouvé et corrigé n°2 (le plus important) :** l'outil de création respecte le paramètre `timeZone` séparé, mais l'outil de vérification de disponibilité l'ignore silencieusement et traite l'heure comme de l'UTC brut — un rendez-vous réellement pris à 15h Zurich était rapporté comme "libre" par l'outil de vérification. Reproduit avec certitude (créneau réservé puis re-vérifié comme libre). Corrigé en imposant dans le prompt que l'assistant fournisse toujours le décalage horaire explicite dans la chaîne (`2026-07-16T15:00:00+02:00`) plutôt que de compter sur le champ `timeZone` séparé — revérifié, fonctionne de façon fiable des deux côtés après correctif.
- Scénario complet validé sur l'assistant de test : créneau demandé occupé → alternative proposée → créneau alternatif vérifié → prénom/nom recueillis → récapitulatif → confirmation → création réelle dans Google Calendar (événements réels créés et vérifiés dans les résultats d'outil, ex. "Coupe classique — Marie Dupont (Cornavin)", jeudi 16 juillet 15h30-16h00).
- **Bug trouvé n°3 (mineur, précision méthodologique) :** en reconstruisant un historique de conversation avec seulement du texte (sans les vrais messages `tool_calls`/`tool`), l'assistant répète parfois une phrase d'hésitation visible ("Wait, je dois d'abord vérifier...") avant de se corriger — gênant à l'oral. **Revérifié avec un historique complet incluant les vrais appels d'outils (comme lors d'un vrai appel) : 3/3 essais propres, sans hésitation.** Conclusion : c'était un artefact de la méthode de test, pas un vrai défaut en conditions d'appel réel — mais une règle défensive ("ne jamais montrer d'hésitation à voix haute") a quand même été ajoutée au prompt par précaution.

**Déployé sur l'assistant de production** après tests concluants : prompt final (date/heure actuelles, nouvelle section Réservations complète, règle anti-hésitation), outils attachés via `toolIds`. Testé de bout en bout directement sur l'assistant de production avec historique réaliste (tool_calls inclus) : réservation complète créée avec succès dans le calendrier réel (« Coupe classique — Sophie Martin » vendredi 17 juillet 10h00-10h30, salon Jonction).

Fichiers modifiés : `src/prompts/system-prompt.md` (date actuelle, nouvelle section Réservations, règle anti-hésitation). Aucun nouveau fichier backend nécessaire — tout passe par les outils natifs Vapi.
Sauvegardes : `docs/backups/vapi-assistant-before-calendar-tools.json`, `docs/backups/vapi-assistant-before-sprint3-calendar.json`.

**Limites/risques restants :**
- Un seul agenda pour les six salons (simplification assumée, voir plus haut).
- Le contrôle de séquence (vérifier avant de créer, ne confirmer qu'après succès) repose sur le prompt, pas sur une contrainte technique dure — comportement probabiliste comme pour les autres règles de ce type dans ce projet.
- Validation faite en texte (`/chat`) uniquement pour l'instant — un vrai appel téléphonique de bout en bout (tâche #28 de la roadmap) reste à faire pour clore complètement le Sprint 3.
- Quelques rendez-vous de test restent dans le calendrier Google réel ("Jean Test", "Marie Dupont", "Sophie Martin") — à supprimer manuellement si besoin, pas fait automatiquement (pas d'outil de suppression configuré).

**Statut Sprint 3 : fonctionnellement complet et validé en texte ET par un vrai appel téléphonique du fondateur (2026-07-15, 11:20-11:23)** — date/heure correctes, conflit détecté (agenda partagé entre salons, comme prévu), alternative proposée. Sprint 3 clôturé.

## Fin d'appel automatique
Statut : appliqué et testé (texte + assistant jetable), déployé en production — 2026-07-15. Demande directe du fondateur, hors numérotation roadmap.md.

- Outil natif Vapi `endCall` créé (id `efd265da-be42-4169-89c7-d27ddf3d1280`) et attaché à l'assistant via `toolIds` — mécanisme réel de raccrochage, pas une simple instruction de prompt.
- **Bug trouvé et corrigé :** sans configuration, l'outil ajoutait un filler par défaut « Goodbye » en anglais après la vraie formule de politesse en français — cassait la cohérence linguistique. Corrigé en configurant explicitement le message de fin d'outil (`request-complete`) avec un contenu neutre et `endCallAfterSpokenEnabled: true`, pour que seule la formule dite par le modèle (en français, contextuelle) soit entendue avant le raccrochage.
- Prompt : nouvelle section « Fin d'appel » (quand raccrocher : réservation confirmée / question traitée / annulation traitée / client indique qu'il a terminé ; toujours dire la formule de politesse d'abord, ne jamais raccrocher au milieu d'une phrase ou si le client n'a peut-être pas terminé).
- Testé sur un assistant jetable (créé puis supprimé) : 3/3 raccrochages propres et cohérents sur un « au revoir » clair ; pas de faux positif quand le client relance une question après un remerciement ; scénario réservation confirmée → raccrochage correct.
- Redéployé et revérifié sur l'assistant de production après tests concluants.
- **Limite non résolue :** pas de paramètre natif pour imposer une pause explicite d'exactement ~1 seconde entre la formule de politesse et le raccrochage — le mécanisme utilisé (`endCallAfterSpokenEnabled`) attend que le message soit entièrement prononcé avant de raccrocher, ce qui crée une pause naturelle proche de ce qui était demandé, mais sans valeur configurable précise. À vérifier à l'oreille lors d'un vrai appel.
- Comme pour les autres règles de ce type (enregistrement, identification), le déclenchement du raccrochage repose sur le jugement du modèle — probabiliste, pas garanti à 100%.
Sauvegarde avant modification : `docs/backups/vapi-assistant-before-endcall.json`.

## Sprint 4 — SMS de confirmation
Statut : **clôturé, validé par un vrai appel téléphonique de bout en bout (réservation + SMS reçu)** — 2026-07-16. Le blocage d'hébergement (tâche roadmap #5) est levé ; un bug de mise en veille Render découvert lors du premier vrai appel a depuis été corrigé et revérifié (voir section dédiée ci-dessous).

### Déploiement backend (tâche roadmap #5) et branchement Vapi → SMS, 2026-07-16

- **Dépôt GitHub créé** par le fondateur (`Zakgit-design/receptioniste-ia`, rendu public — nécessaire pour que Render y accède sans installation d'app OAuth ; aucun secret dans l'historique Git, vérifié avant coup). Code poussé sur `main`.
- **Compte Render créé par le fondateur**, clé API générée et transmise (stockée uniquement dans `.env`, jamais commitée — `RENDER_API_KEY` ajouté à `.env` et `.env.example`).
- **Service web créé via l'API Render** (pas de config manuelle dashboard) : `receptionniste-ia` (id `srv-d9c8n37lk1mc739emq50`), région Frankfurt, plan free, build `npm install`, start `npm start`, `healthCheckPath: /health`. URL publique : `https://receptionniste-ia-x9bo.onrender.com`.
- **9 variables d'environnement configurées via l'API Render** (tous les secrets de `.env.example` sauf `PORT`, géré par Render, et `RENDER_API_KEY`, inutile côté service).
- **`GET /health` vérifié publiquement** : 200 « ok » depuis l'extérieur.
- **Outil Vapi personnalisé créé** : `send_appointment_confirmation_sms` (type `function`, id `2506cdcb-cbbd-48f9-9002-d56933c3e65f`), pointant vers `POST /webhooks/vapi-tools` du backend Render, header `x-vapi-secret` (secret partagé `VAPI_SERVER_SECRET`, déjà présent côté serveur depuis Sprint 4 initial). Attaché à l'assistant de production via `toolIds` (en plus des outils calendrier et `endCall` existants).
- **Nouvelle section dans `src/prompts/system-prompt.md`** (étape 8 de « Réservations ») : appeler `send_appointment_confirmation_sms` uniquement après succès réel de la création du rendez-vous, une seule fois, avec l'identifiant de l'événement Google Calendar comme `appointmentId` (anti-double-envoi).
- **Bug trouvé et corrigé n°1 :** filler par défaut de Vapi en anglais (« Give me a moment ») avant le résultat de l'outil SMS — même famille de bug que le filler « Goodbye » corrigé sur `endCall` en Sprint 3. Corrigé en configurant `messages: [{type: "request-start", blocking: false}]` sur l'outil.
- **Bug trouvé et corrigé n°2 (le plus important) :** ce correctif du filler, envoyé seul via `PATCH /tool/{id}`, a fait disparaître silencieusement le champ `server` de l'outil (même défaut de fusion partielle que celui documenté au Sprint 3 pour `PATCH /assistant` — confirmé ici valable aussi pour `PATCH /tool`). Conséquence : l'appel suivant a échoué avec « No result returned » côté Vapi, sans qu'aucune requête n'atteigne notre backend (vérifié dans les logs Render — aucune trace de l'appel). Corrigé en renvoyant `messages` et `server` ensemble dans le même `PATCH`. **Leçon retenue, à généraliser : ne jamais faire de `PATCH` partiel sur une ressource Vapi (assistant ou tool) sans relire l'objet complet après coup pour vérifier qu'aucun champ n'a disparu.**
- **Tests effectués (`/chat`, historique réaliste avec vrais `tool_calls`, comme lors d'un appel réel) :**
  1. Assistant jetable, avant correctif filler : réservation complète → événement Google Calendar réel créé → SMS réel envoyé et livré (`SM3eb36b53d3e1b29d9cf5c4cc66f57400`), mais filler anglais entendu.
  2. Assistant jetable, après correctif filler seul (bug `server` disparu, non détecté immédiatement) : événement créé, mais SMS jamais envoyé (« No result returned »).
  3. Assistant jetable, après correctif complet (`messages` + `server` ensemble) : réservation complète, plus de filler anglais, SMS réel envoyé et livré (`SM8f636238dcb41edbf4f1c1d7d3e1276e`).
  4. **Assistant de production**, scénario complet incluant un créneau occupé → alternative proposée → créneau accepté → récapitulatif → confirmation → création réelle de l'événement (« Shampoing — Marie Dupont — Jonction ») → SMS envoyé automatiquement → raccrochage automatique correct après la formule de politesse. SMS revérifié directement via l'API Twilio : statut `delivered`, expéditeur `BARBERCONC` (jamais le numéro vocal).
- **Sauvegarde avant modification :** `docs/backups/vapi-assistant-before-sms-webhook.json`.
- **Limites/risques restants :**
  - Render plan gratuit : le service peut se mettre en veille après une longue période d'inactivité et mettre quelques dizaines de secondes à redémarrer au prochain appel — acceptable pour une démo, à surveiller si ça devient gênant en présentation (upgrade payant possible plus tard).
  - Anti-double-envoi SMS toujours en mémoire (`Set` local au process Node) — repart à zéro si Render redémarre le service ; suffisant pour la démo, pas pour la production multi-clients.
  - Quelques rendez-vous de test supplémentaires restent dans le calendrier Google réel (Jean Testeur x2, Marie Dupont) — à nettoyer manuellement si besoin.
  - Validation faite en `/chat` (texte, avec vrais tool_calls) sur l'assistant de production ; un vrai appel téléphonique de bout en bout avec SMS reste à faire pour une validation orale complète (recommandé avant présentation finale).

### Bug réel trouvé et corrigé lors du premier vrai appel téléphonique, 2026-07-16

- **Premier appel réel du fondateur (08:33-08:36 UTC) :** réservation créée avec succès, mais **aucun SMS reçu**. Cause identifiée dans les logs Vapi/Render : l'outil `send_appointment_confirmation_sms` a échoué par timeout (`"Your server rejected tool-calls webhook. Error: timeout of 20000ms exceeded"`). Le backend Render (plan gratuit) s'était mis en veille par inactivité ; son redémarrage à froid (~16s, confirmé dans les logs Render) a dépassé le délai d'attente de 20s configuré côté Vapi. Les deux outils calendrier n'étaient pas concernés (ce sont des outils natifs Vapi qui ne passent pas par notre backend).
- **Corrections apportées :**
  1. Ping périodique (`setInterval`, 10 min) ajouté dans `src/server.js` vers `PUBLIC_URL/health`, actif uniquement si `PUBLIC_URL` est configuré (donc jamais en local) — empêche la mise en veille du service. Log `[keep-alive] ping ok` ajouté pour pouvoir vérifier en production que le ping se déclenche réellement.
  2. Filet de sécurité : délai d'attente de l'outil Vapi `send_appointment_confirmation_sms` remonté de 20s à 40s (`PATCH /tool/{id}`, objet complet renvoyé pour éviter le bug de fusion partielle documenté plus haut).
  3. Nouvelle variable d'environnement `PUBLIC_URL` ajoutée sur Render (`.env.example` mis à jour).
- **Vérification rigoureuse, pas juste supposée :** un premier re-test juste après déploiement (SMS envoyé en 1,2s) ne prouvait rien, le service venait d'être relancé donc était forcément chaud — remarque à juste titre soulevée par le fondateur. Vérification correcte effectuée ensuite : surveillance des logs Render sur ~18 minutes sans aucune sollicitation externe, deux pings `[keep-alive]` observés à 10 minutes d'intervalle exact (09:24:31 et 09:34:30 UTC), confirmant que le mécanisme se déclenche seul. Un appel réel du fondateur passé juste après (09:35 UTC, ~31 min après le déploiement, bien au-delà du seuil de mise en veille de 15 min) a confirmé le correctif en conditions réelles : réservation créée (salon Jonction, Rabio Lavive, lundi 21 juillet 10h), SMS envoyé en 0,6s, livré (`SMb7b90dd45b0a4ebbe83fc6530d79f6fb`, statut `delivered`).
- **Limite persistante, assumée pour l'instant :** le keep-alive réduit très fortement le risque mais n'élimine pas à 100% un cas de mise en veille (ex. redémarrage du service par Render lui-même, ou keep-alive momentanément en échec) — dans ce cas de figure résiduel, le filet de sécurité (40s) laisse une marge largement suffisante pour couvrir un redémarrage à froid isolé.
- **Décision d'architecture actée le 2026-07-16 (voir `docs/architecture.md` et `docs/roadmap.md`, tâches #47-49) :** le keep-alive est une solution de contournement temporaire, propre à la phase démo sur Render gratuit — pas la solution retenue pour la production. Dès les premiers clients payants, migration vers une infrastructure toujours active (aucune mise en veille, disponibilité 24h/24, fiable pour plusieurs entreprises simultanément) et suppression du keep-alive à ce moment-là.

**Tout le reste de Sprint 4 (Twilio, `src/sms.js`, 8 tests obligatoires) était déjà fait — voir détail original ci-dessous.**

- **Côté Twilio, tout fait via l'API, aucune action humaine nécessaire (contrairement à l'attente initiale) :**
  - Vérifié dans la doc officielle Twilio : Alphanumeric Sender ID en Suisse ne nécessite **pas** de pré-enregistrement (support "dynamique"), contrairement à d'autres pays.
  - Un Alphanumeric Sender ID nécessite obligatoirement un **Messaging Service** Twilio (impossible en `From` direct sur un appel simple à l'API Messages) — créé via l'API : SID `MGcaaafbc1da69f2ff0ec28e5116f17d34`.
  - Sender alphanumérique `BARBERCONC` (10 caractères, respecte la limite de 11) ajouté à ce Messaging Service via l'API.
  - **SMS réel de test envoyé et livré avec succès** au numéro utilisé pour les tests d'appels (+41 79 815 68 58) : statut Twilio final `delivered`, expéditeur confirmé `BARBERCONC` (pas un numéro), coût réel observé **≈ 0.23 USD**.
  - Secrets (`TWILIO_MESSAGING_SERVICE_SID`, `TWILIO_SMS_SENDER_ID`) uniquement dans `.env` (non suivi par Git) et `.env.example` (valeurs vides, pour référence).

- **Fichier créé : `src/sms.js`** — fonction `sendAppointmentConfirmationSms({ to, firstName, appointmentDate, appointmentTime, salon, service, appointmentId })` (le champ `appointmentId` est un ajout non demandé explicitement mais nécessaire pour l'anti-double-envoi demandé au test 7). Inclut : normalisation et validation E.164, anti-double-envoi en mémoire (par `appointmentId`), journalisation sent/failed avec SID Twilio, messages d'erreur exploitables sans jamais exposer de secret.

- **8 tests obligatoires exécutés, tous concluants :**
  1. Rendez-vous "créé" + SMS envoyé — réel, livré (voir ci-dessus).
  2. Rendez-vous non créé → aucun appel à la fonction SMS (démontré via un contrôleur simulé avec garde conditionnelle).
  3. Numéro suisse valide — plusieurs formats testés (`079 815 68 58`, `0798156858`, `+41798156858`) → tous normalisés correctement.
  4. Numéro absent/masqué → `failed / invalid_phone_number`, aucun envoi tenté.
  5. Numéro invalide → `failed / invalid_phone_number`.
  6. Erreur Twilio réelle (Messaging Service SID invalide pour ce test précis) → `failed / twilio_error_21705`, erreur exploitable sans fuite de secret.
  7. Double appel avec le même `appointmentId` → 2e appel `skipped / already_sent`, un seul SMS réellement envoyé.
  8. Séquencement vérifié : la fonction SMS n'est invoquée par le contrôleur que si la création Calendar renvoie un statut de succès.

- **Blocage réel découvert, pas côté Twilio mais côté Vapi :** testé sur un assistant jetable (créé puis supprimé, aucun impact production) — l'outil natif Vapi `sms` refuse tout expéditeur qui n'est pas un numéro de téléphone déjà importé dans Vapi (`"Sender phone number (BARBERCONC) configuration not found"`). L'outil natif ne peut donc pas utiliser un Alphanumeric Sender ID Twilio. Pour respecter la contrainte du fondateur (jamais le numéro 022 comme expéditeur, toujours l'Alphanumeric Sender ID), il faut appeler notre propre fonction `sendAppointmentConfirmationSms` depuis un vrai backend accessible publiquement (webhook Vapi après succès de la création Calendar) — **bloqué par la tâche roadmap #5 (hébergement)**, toujours pas faite à ce stade.
- **Assistant de production non touché durant cette partie du sprint**, conformément à la consigne. (Le blocage d'hébergement a été levé et l'assistant de production a bien été modifié le 2026-07-16, une fois le backend déployé — voir section « Déploiement backend » plus haut.)

Sauvegardes de cette partie : aucune modification de l'assistant Vapi n'a eu lieu (uniquement des tests sur assistant jetable, supprimé après usage). Voir plus haut pour la sauvegarde liée au déploiement (`vapi-assistant-before-sms-webhook.json`).

## Pivot stratégique — plateforme SaaS multi-entreprises (2026-07-16)

Décision du fondateur : le projet n'est plus seulement un prototype de démo pour Barber Concept, mais une plateforme SaaS B2B destinée à accueillir de nombreuses PME (salons, restaurants, cabinets dentaires, cliniques, garages, instituts, cabinets médicaux, etc.). Barber Concept reste le client pilote, plus la cible finale unique.

Conséquence sur la roadmap (voir `docs/roadmap.md`, entièrement restructuré) : le transfert humain (ancien Sprint 5) est repoussé au Sprint 8, toujours prévu mais déprioritisé. Nouvelle priorité immédiate : **Sprint 5 — Dashboard Administrateur**, puis Sprint 6 — Dashboard Client, puis Sprint 7 — intégration Get Time (reportée, pas de dépendance tant que le projet n'a pas été présenté officiellement à Henok).

Documentation mise à jour en conséquence : `docs/roadmap.md` (nouvelle structure de sprints), `docs/architecture.md` (principe directeur multi-tenant déjà ajouté le même jour, section modules par phase mise à jour — PostgreSQL nécessaire dès le Sprint 5), mémoire du projet.

Avant tout développement massif du Dashboard Administrateur, une phase de conception dédiée est prévue (arborescence des écrans, design system, wireframes, modèle de données, choix de stack frontend justifié) — voir entrée dédiée ci-dessous une fois produite.

## Sprint 5 — Dashboard Administrateur (plateforme)
Statut : **conception terminée le 2026-07-16**, prêt pour le développement (tâches #50-61 dans `docs/roadmap.md`).

- **Décision d'architecture actée le 2026-07-16 (fondateur) : authentification via Clerk, isolé derrière une couche remplaçable.** Clerk gère uniquement identité/sessions/invitations/organisations/rôles ; toute donnée métier reste en PostgreSQL. Une couche d'abstraction interne (`src/auth/`) sera le seul point d'accès à Clerk, avec une table `Utilisateurs` qui réplique les utilisateurs Clerk (synchronisée par webhooks). Stratégie de migration future vers une solution auto-hébergée déjà prévue, sans réécriture majeure attendue (voir détail complet dans `docs/architecture.md`, section « Décision d'architecture — Authentification »).
- **Phase de conception complète produite le 2026-07-16** (`docs/sprint5-conception.md`) : stack frontend (Next.js/TypeScript/Tailwind/shadcn/ui/Prisma/Recharts, justifiée), arborescence des écrans, design system nommé « Standard » (identité poste de contrôle téléphonique — couleurs, typographies Plus Jakarta Sans/IBM Plex Mono, palette de coûts validée par le script d'accessibilité couleur du skill dataviz). Modèle de données détaillé documenté dans `docs/architecture.md`.
- **Maquette interactive publiée** (artefact HTML, thème clair/sombre, navigation cliquable) : Vue d'ensemble, Entreprises (liste + détail à onglets), Appels, Coûts — avec 3 entreprises fictives de secteurs différents (coiffure, dentaire, restauration) pour vérifier visuellement que le système tient au-delà du seul cas Barber Concept.

### Passe Product Design et décisions finales (2026-07-16, même journée)

Après la conception initiale, une revue produit approfondie (rôle Product Designer senior, inspiration Stripe/Linear/GitHub/Vercel/Notion/HubSpot) a fait remonter un principe manquant : le dashboard doit dire quoi faire, pas seulement afficher des données. Décisions validées par le fondateur :

1. **Centre d'actions** — nouvelle section héro de la Vue d'ensemble, avant toute statistique. Chaque item a un type, une gravité, une entreprise concernée (optionnelle), une action recommandée, et un cycle de vie strict (nouveau/traité/ignoré/résolu automatiquement) pour éviter l'accumulation d'items obsolètes. Nouvelle table `actions_requises`.
2. **Santé unifiée** — `evenements_sante` devient la source de vérité unique pour la colonne Santé des entreprises ET pour la nouvelle page Santé plateforme (agrégations différentes de la même donnée).
3. **"Lignes en direct" → "Derniers appels"** — remplacement d'un panneau d'appels en cours (non actionnable) par les derniers appels terminés et cliquables.
4. **Fiche appel en panneau latéral (drawer)**, présentée en frise chronologique, pas en formulaire plat.
5. **"Coûts" renommé "Finances"** — distingue coûts fixes de plateforme (nouvelle table `couts_fixes_plateforme`, ex. Render), coûts variables par entreprise, revenus estimés et marge brute (marge en chiffre hero, tri par défaut du moins rentable). Toute valeur non vérifiée porte la mention explicite "estimé".
6. **Abonnements** : concept conservé distinct de Finances (pas de fusion, sur demande du fondateur — Stripe amènera factures/paiements/remboursements, un sujet différent de la rentabilité), mais la page globale est différée à l'intégration Stripe pour éviter un écran quasi vide aujourd'hui. Seul l'onglet par entreprise existe pour l'instant.
7. **Invitations utilisateurs** : modèle d'invitation directe retenu pour le MVP (le Super Admin/propriétaire invite, pas de demande d'accès autonome) — plus simple, correspond au modèle Clerk natif. La demande d'accès autonome reste une option future si le besoin apparaît.
8. **Graphique 14 jours conservé tel quel** (pas simplifié en sparkline, sur demande du fondateur), repositionné après le centre d'actions dans l'ordre de lecture de la page.

Modèle de données étendu en conséquence (`docs/architecture.md`) : `entreprises.email_contact`/`telephone_contact` (pour l'action "contacter le client"), `appels.rendez_vous_id`/`sms_envoye`/`outils_utilises`/`erreurs`, et les nouvelles tables `evenements_sante`, `actions_requises`, `couts_fixes_plateforme` — 17 tables au total.

Roadmap réordonnée (`docs/roadmap.md`, tâches #50-60) selon l'ordre de dépendance validé par le fondateur : modèle de données + centre d'actions d'abord, puis Vue d'ensemble, Entreprises, Appels, Santé plateforme, Finances, invitations utilisateurs, détail entreprise. Aucune tâche P2 ne démarre avant que ces tâches P1 soient fonctionnelles, testées et documentées.

**Prérequis d'infrastructure identifiés au moment de démarrer le développement :** ni la base PostgreSQL de production ni le compte Clerk n'existent encore. Vérifié que l'API Render (déjà utilisée pour le service web) ne permet pas de créer une base Postgres par le même mécanisme simple — création probablement à faire depuis le dashboard Render, ou compte à créer chez un autre fournisseur. Ces comptes suivent la même règle que celle actée au Sprint 0 : action utilisateur nécessaire, mais non bloquante pour le code.

### Implémentation (2026-07-16, même journée) — les 7 phases P1 construites et vérifiées

Développement mené tâche par tâche, dans l'ordre validé, chaque phase vérifiée (build, lint, tests, contenu réel, et capture d'écran pour les écrans les plus visuels) avant de passer à la suivante — aucune tâche P2 démarrée.

1. **Échafaudage Next.js** (`dashboard/`) — App Router, TypeScript, Tailwind, shadcn/ui (base Radix, forcé explicitement car la CLI shadcn actuelle bascule vers "Base UI" par défaut), tokens de couleur et typographies (Plus Jakarta Sans, IBM Plex Mono) portés depuis la maquette. 7 routes placeholder, rail de navigation à 3 groupes.
2. **Modèle de données Prisma** (17 tables, `prisma/schema.prisma`) — noms de modèles PascalCase mappés vers les noms de table français documentés. Migration initiale générée par diffing (`prisma migrate diff --from-empty`, ne nécessite pas de base live) mais **pas encore appliquée** (pas de Postgres réel). Logique pure du centre d'actions et de la santé (`src/lib/health.ts`, `src/lib/actions-center.ts`), 17 tests unitaires réels (`node --test`).
3. **Écran Vue d'ensemble** — centre d'actions en section héro (3 exemples : SMS en échec, essai qui expire, Calendar déconnecté), stats, graphique 14 jours (Recharts) + "Derniers appels". Badge de compteur ajouté dans la nav a posteriori (petit oubli initial, corrigé).
4. **Écran Entreprises** (liste + détail) — colonne Santé calculée via `santeParEntreprise`, tri "problèmes en premier", filtre "Nécessite une attention" actif par défaut. Détail à onglets, "Vue d'ensemble" par défaut avec rentabilité.
5. **Écran Appels + drawer** — routes interceptantes Next.js (`@drawer/(.)appels/[id]`) : clic depuis la liste ouvre un panneau latéral par-dessus la liste (vérifié visuellement, capture d'écran à l'appui), visite directe de l'URL affiche la page complète. Frise chronologique construite à partir des vrais champs du modèle `Appel`. Une première tentative sur cette tâche a échoué (agent bloqué 10 min sans progression, relancé à zéro sans dégât).
6. **Écran Santé plateforme** — 7 services, statut calculé via `santeParService`, lien "entreprises impactées". Les données de santé ont été centralisées dans un seul module (`src/lib/demo-evenements-sante.ts`) partagé avec l'écran Entreprises, pour garantir que les deux écrans + le centre d'actions racontent toujours la même histoire — conformément au principe de source de vérité unique.
7. **Écran Finances** — marge brute plateforme en hero (capture d'écran vérifiée), coûts fixes de plateforme séparés des coûts variables, rentabilité par entreprise triée (la moins rentable en premier), mention "estimé" explicite. Chiffres réconciliés avec ceux déjà affichés dans le détail entreprise (pas de double calcul divergent).
8. **Invitations utilisateurs (Clerk)** — couche d'abstraction `src/auth/` (seul point de contact avec le SDK Clerk), route webhook de synchronisation écrite (non testable sans compte Clerk réel), écran Utilisateurs avec données de démonstration. Vérifié explicitement que l'application entière continue de fonctionner sans aucune clé Clerk configurée (`ClerkProvider` activé conditionnellement) — risque le plus sérieux de cette phase, testé avec soin.

**Écart identifié pendant l'implémentation, à traiter avant une vraie mise en service de l'authentification :** `getCurrentUser()`/`getUserRole()` (`src/auth/`) dépendent de `clerkMiddleware()`, qui nécessite un fichier `proxy.ts` (équivalent Next.js 16 de `middleware.ts`) — pas encore créé, hors périmètre de cette phase (couplé à l'écran `/login` et à la vraie protection des routes, pas encore construits). À faire une fois le compte Clerk créé.

### Compte Clerk créé et branché (2026-07-16, même journée)

Le fondateur a créé l'application Clerk (`Receptionniste IA`) et lancé le CLI Clerk pour finaliser l'intégration, en suivant le guide officiel :
- CLI installé, authentifié (`clerk auth login`), projet lié à l'application Clerk existante (`clerk init --app ...`).
- `clerk init` a généré `src/proxy.ts` (résout exactement le gap signalé ci-dessus — `getCurrentUser()`/`getUserRole()` fonctionnent désormais réellement), les pages `/sign-in` et `/sign-up`, et les clés réelles dans `.env.local`. Il a correctement respecté notre `layout.tsx` existant (« Already has ClerkProvider », aucune duplication) — la couche d'abstraction `src/auth/` construite avant la création du compte s'articule sans conflit avec ce que `clerk init` a généré.
- Matcher du proxy vérifié contre la documentation Next.js 16 embarquée (`node_modules/next/dist/docs/`, « Proxy » = renommage de « Middleware », mécanique inchangée) et contre les skills Clerk fraîchement installés par le CLI (`~/.agents/skills/clerk-nextjs-patterns`) : le matcher généré correspond exactement au gabarit canonique du SDK actuel — l'ajout de `/__clerk/:path*` mentionné dans une version plus ancienne du guide n'est plus nécessaire, non appliqué délibérément après vérification.
- Protection des routes vérifiée réellement : accès non authentifié à `/` → redirection 307 vers `/sign-in` ; `/sign-in` accessible (200) sans session. Mode « Protected-first », adapté à un outil interne.
- `UserButton` intégré dans le rail de navigation (`nav-rail.tsx`), ré-exporté via un nouveau fichier `src/auth/ui.ts` plutôt qu'importé directement, pour garder la règle « un seul point de contact avec le SDK Clerk » même pour les composants visuels.
- Thème shadcn appliqué à Clerk (`@clerk/ui`, étape optionnelle du guide officiel) : les composants Clerk (page de connexion, etc.) reprennent la couleur d'accent cuivre/ambre du design system "Standard" plutôt que le bleu par défaut — vérifié par capture d'écran avant/après.
- Vérifié réellement : `npm run build`/`lint`/`test` (21 tests) toujours au vert, `clerk doctor` sans anomalie, capture d'écran de la page de connexion (Google + email, thème appliqué, aucune erreur console).

**Ce qui reste bloqué, en attente d'action du fondateur :** seule la base PostgreSQL réelle manque encore désormais (tâche #1). Une fois créée : appliquer la migration (`prisma migrate deploy`), tester la synchronisation webhook Clerk → table `Utilisateur` en conditions réelles, puis la démonstration de bout en bout (créer une entreprise, vérifier qu'elle apparaît partout où attendu).

### Base PostgreSQL réelle (Supabase) branchée, tâches #59/#60 réalisées (2026-07-16, même journée)

Le fondateur a créé un projet Supabase. Connexion faite en respectant l'architecture existante (Prisma 7, adaptateur `node-postgres` déjà en place dans `src/lib/prisma.ts`) :
- `DATABASE_URL` (pooler transaction-mode, port 6543, utilisé au runtime par l'application) et `DIRECT_URL` (connexion directe, port 5432, utilisée pour les migrations) ajoutées à `dashboard/.env.local`.
- Écart découvert avec le prompt générique fourni par Supabase : Prisma 7 n'accepte plus `url`/`directUrl` dans le bloc `datasource` de `schema.prisma` (erreur `P1012`) — la configuration a été déplacée dans `prisma.config.ts` (`datasource.url`, pointé sur `DIRECT_URL`). `dotenv/config` par défaut ne charge que `.env` et pas `.env.local` : chargement explicite ajouté dans `prisma.config.ts`.
- `prisma migrate deploy` appliqué avec succès contre la vraie base : les 17 tables existent. Vérifié directement via une connexion `pg` brute (liste des tables) en plus de la sortie de la CLI.
- `npm run build`/`lint`/`test` (21 tests) toujours au vert après le changement.
- Tâche #59 : bouton "+ Nouvelle entreprise" (`entreprises/page.tsx`) rendu fonctionnel — dialog shadcn/ui + server action (`entreprises/actions.ts`) qui insère via Prisma (champs `nom`, `secteur`, `statut`, `emailContact`, `telephoneContact`). Barber Concept créé via ce formulaire (pas en SQL manuel), vérifié en base (`id: 4116d8ed-...`).
- Tâche #60 : `getEntreprisesListe()`/`getEntrepriseDetail()` (`entreprises/data.ts`) interrogent désormais Prisma en plus des entreprises de démonstration existantes — vérifié que Barber Concept apparaît bien dans la liste et que sa fiche détail se résout (établissements/rentabilité à zéro, cohérent avec une entreprise sans données associées pour l'instant).
- **Écart de périmètre à traiter plus tard :** Vue d'ensemble, Finances et Santé plateforme n'ont pas été branchés sur la vraie base dans cette tâche (ils lisent encore leurs propres fichiers de données de démo, dont `finances/data.ts` qui dépend en partie de `entreprises/data.ts`) — l'écran Entreprises affiche donc temporairement un mélange de 3 entreprises de démo + Barber Concept (réel). Décision volontaire pour ne pas casser ces écrans hors périmètre des tâches #59/#60 ; à traiter en Sprint 6 ou dans une tâche P2 dédiée au branchement complet.
- **Vérifié visuellement par le fondateur (2026-07-16)** : test concluant dans un vrai navigateur — Barber Concept créé via le formulaire, apparaît dans la liste, sa fiche détail fonctionne, les données persistent réellement dans Supabase.

### Suppression d'entreprise (tâche #61) et clôture du Sprint 5 (2026-07-16, même journée)

Manque relevé par le fondateur pendant le test de la tâche #59/#60 : aucune option pour supprimer une entreprise créée par erreur. Ajouté : bouton "Supprimer" sur la fiche détail (`entreprises/[id]/page.tsx`), visible uniquement pour les entreprises réelles (pas les 3 entreprises de démonstration, distinguées par un nouveau champ `estDemo` sur `EntrepriseDetail`). Confirmation par saisie exacte du nom (`supprimer-entreprise-dialog.tsx`) avant d'appeler la server action `supprimerEntreprise` (`entreprises/actions.ts`).

**Détail technique important pour toute suppression future dans ce schéma :** `prisma/migrations/0001_init/migration.sql` ne définit aucune contrainte `ON DELETE CASCADE` — toutes les relations obligatoires sont en `RESTRICT` par défaut (comportement standard Prisma). La suppression d'une entreprise doit donc vider ses tables dépendantes manuellement, dans l'ordre des contraintes de clé étrangère (enfants avant parents : conversations → appels → rendez-vous/disponibilités → agents IA/services/clients finaux → établissements → factures → abonnement → intégrations → entreprise), via un seul `prisma.$transaction`. Les tables en `ON DELETE SET NULL` (utilisateurs, notifications, evenements_sante, actions_requises) n'ont pas besoin d'être vidées, la base s'en charge.

Vérifié : build, lint, 21 tests toujours au vert.

**Sprint 5 officiellement clôturé le 2026-07-16.** Décision du fondateur : le branchement des appels réels Vapi/Twilio vers la table `Appels` (et la fin du mélange démo/réel sur Vue d'ensemble/Finances/Santé plateforme) est volontairement différé à une tâche dédiée après le Sprint 6, pour ne pas interrompre la construction du Dashboard Client.

## Sprint 6 — Dashboard Client
Statut : **P1 terminé le 2026-07-16** — les 7 tâches (#62-68 dans `docs/roadmap.md`) sont construites et vérifiées (build/lint/tests + vérification directe contre la vraie base à chaque étape). Reste en attente : vérification visuelle par le fondateur dans un vrai navigateur (aucune session Clerk disponible pour les agents qui ont implémenté ces tâches).

**Conception produite le 2026-07-16**, même méthode que le Sprint 5 : arborescence des écrans (`/app/*`, nouveau groupe de routes, entreprise jamais en paramètre d'URL — toujours dérivée de la session côté serveur), permissions exactes des 4 rôles client (propriétaire/administrateur/responsable d'établissement/membre), composants réutilisés du Dashboard Administrateur, aucune donnée de démonstration introduite (contrairement au Sprint 5 — voir écart de périmètre ci-dessus).

**Écart d'architecture trouvé pendant la conception (vérifié en base réelle) :** aucune des 2 entreprises existantes (Barber Concept, MS Savané — 0 ligne `utilisateurs` en base) n'est reliée à une Organisation Clerk, pourtant prévu dans `docs/architecture.md` depuis le Sprint 5. À corriger en premier (tâche #62) avant tout écran : liaison automatique à la création + rattrapage des 2 entreprises existantes.

**Décision de conception (rôles) :** extension de l'enum `RoleUtilisateur` à 5 valeurs et création de 4 rôles personnalisés Clerk (`org:proprietaire`/`org:administrateur`/`org:responsable_etablissement`/`org:membre`) plutôt que de découpler nos rôles de Clerk — cohérent avec le principe déjà acté ("les rôles vivent dans Clerk, recopiés dans `utilisateurs.role`"). Nouvelle table `assignations_etablissement` pour scoper un responsable d'établissement à ses établissements assignés.

**Action fondateur requise, non bloquante (même nature que les prérequis Postgres/Clerk précédents) :** créer les 4 rôles personnalisés dans Clerk (Dashboard → Organizations → Roles & Permissions).

### Tâche #62 — Prérequis (2026-07-16, même journée)

Migration Prisma appliquée sur la vraie base Supabase (`role_utilisateur` étendu à 5 valeurs — `employe` retiré, `administrateur`/`responsable_etablissement`/`membre` ajoutés ; nouvelle table `assignations_etablissement` ; colonnes `notifier_rdv_par_email`/`notifier_rdv_par_sms` sur `entreprises`) — 0 ligne `utilisateurs` en base au moment de la migration, aucune donnée à migrer. Mapping des rôles (`src/auth/roles.ts`) étendu aux 4 rôles Clerk personnalisés, avec repli sur les rôles natifs `org:admin`/`org:member` tant qu'ils ne sont pas créés côté Clerk. `createEntreprise` crée désormais l'Organisation Clerk correspondante (`createOrganizationForEntreprise`, sans `createdBy` pour ne pas rendre l'admin plateforme membre de l'organisation cliente). Squelette de route `(client)` sous `/app` (6 pages placeholder), garde d'accès à deux niveaux : redirection admin ↔ client par `orgId` dans `proxy.ts`, restriction fine par rôle interne (`getUserRole()`) directement dans les pages Équipe/Paramètres. `nav-rail.tsx` rendu réutilisable par les deux dashboards (les icônes passent désormais par un nom sérialisable, pas le composant lucide-react directement — une fonction ne peut pas traverser la frontière Server → Client Component dans cette version de Next.js).

**Bug trouvé et corrigé pendant la relecture (avant cette tâche, mais visible seulement maintenant) :** `getCurrentUser()` (`src/auth/index.ts`) fixait `entrepriseId` à l'`orgId` Clerk brut, alors que le contrat documenté (`src/auth/types.ts`) est notre `Entreprise.id` interne. Sans donnée réelle à scoper au Sprint 5, ce n'était pas encore un problème visible — mais bloquant pour tous les écrans du Sprint 6, qui filtrent leurs requêtes Prisma par cet id. Corrigé : résolution via `prisma.entreprise.findUnique({ where: { clerkOrganizationId: orgId } })`.

**Blocage rencontré et résolu :** la création d'Organisation Clerk échouait (`organization_not_enabled_in_instance`) — la fonctionnalité "Organizations" n'était pas activée sur l'instance Clerk. Activée via le CLI Clerk (`clerk enable orgs`, déjà lié à l'app), avec confirmation du fondateur avant d'agir (changement de configuration sur un service tiers réel). Le rattrapage de Barber Concept et MS Savané a ensuite été rejoué avec succès (script ponctuel, non commité, supprimé après vérification) — les deux entreprises ont désormais un `clerk_organization_id` réel.

Vérifié : build, lint, 21 tests toujours au vert ; requête non authentifiée vers `/app` redirige bien vers `/sign-in`.

### Tâche #63 — Écran Établissements (2026-07-16, même journée)

`/app/etablissements`, lecture seule, aucune donnée de démonstration (toutes les requêtes lisent la vraie base, scopées sur l'entreprise réelle de l'utilisateur connecté). Pièce centrale : `getEtablissementIdsAutorises` (`src/lib/scope-client.ts`), la fonction de scope partagée annoncée dans `docs/sprint6-conception.md` — prend toujours l'utilisateur courant en entrée, jamais un id d'URL ; retourne tous les établissements de l'entreprise pour propriétaire/administrateur/membre, seulement les établissements assignés (table `assignations_etablissement`) pour un responsable d'établissement. Réutilisée telle quelle par les tâches suivantes (Appels, Rendez-vous, Vue d'ensemble).

Chaque carte affiche numéro/assistant IA (`AgentIA`), appels des 7 derniers jours, statut de l'intégration Google Calendar. Choix technique : composant dédié (`etablissements-liste-client.tsx`) plutôt que réutilisation du tableau admin (`etablissements-table.tsx`, qui n'affiche pas ces statistiques) — le tableau admin n'a pas été modifié. Point de modélisation à garder en tête : l'intégration Google Calendar est stockée par entreprise (une seule connexion partagée), pas par établissement.

Vérifié contre la vraie base (données de test créées puis nettoyées, Barber Concept revenu à 0 établissement) : statistiques correctes, scope responsable d'établissement confirmé (ne voit que son établissement assigné), scope propriétaire confirmé (voit tout), cas sans entreprise/utilisateur renvoie bien une liste vide. Build, lint, 21 tests au vert. **Reste à vérifier par le fondateur** : rendu réel dans le navigateur — impossible avant qu'une invitation existe (tâche #64).

### Tâche #64 — Écran Équipe et accès (2026-07-16, même journée)

`/app/equipe` : liste des membres actifs et invitations en attente de l'organisation Clerk de l'entreprise (`listOrganizationMembers`, déjà construit au Sprint 5), bouton "+ Inviter" (email + rôle, options selon le rôle de l'appelant), changement de rôle et retrait par ligne, contrôle à cases à cocher des établissements assignés pour un responsable d'établissement. Aucune donnée de démonstration — tout vient de Clerk et de la vraie base.

Trois nouvelles fonctions Clerk dans `src/auth/index.ts` : `changerRoleMembre`, `retirerMembre`, `revoquerInvitation` — toutes de simples appels au SDK (`updateOrganizationMembership`/`deleteOrganizationMembership`/`revokeOrganizationInvitation`), aucune n'écrit dans `utilisateurs` directement (c'est toujours le webhook qui synchronise). `MembreOrganisation` (`src/auth/types.ts`) porte désormais l'id Clerk de l'invitation (`invitationId`), nécessaire pour pouvoir la révoquer précisément.

**Permissions — défense en profondeur :** les règles exactes de `docs/sprint6-conception.md` §2 (propriétaire : tout ; administrateur : tout sauf le propriétaire) sont revérifiées dans chaque Server Action (`src/app/(client)/app/equipe/actions.ts`), pas seulement dans la garde de la page — un appel direct à `changerRole`/`retirer` avec un rôle insuffisant échoue avec un message d'erreur, testé en relisant le code comme un attaquant (pas de session Clerk réelle disponible pour un test de bout en bout). Règles pures extraites dans `src/lib/equipe-permissions.ts` (`peutGererRole`, `rolesAssignablesPar`), testées unitairement (6 nouveaux tests). Garde-fous "bon sens" ajoutés : impossible de se retirer soi-même ou de changer son propre rôle depuis cet écran.

**Interprétation au-delà du tableau, à signaler explicitement :** le tableau du fondateur ne restreint que le rôle *cible* pour un administrateur ("sauf le propriétaire"), pas le nouveau rôle qu'il peut attribuer lors d'un changement de rôle. Sans restriction supplémentaire, un administrateur aurait pu promouvoir n'importe qui au rôle administrateur (ou même propriétaire) via un changement de rôle — un contournement de la règle "administrateur ne peut pas inviter un administrateur". `rolesAssignablesPar` est donc appliqué à la fois à l'invitation et au changement de rôle. Ce choix n'était pas explicitement écrit dans le tableau — à confirmer par le fondateur si un comportement différent était voulu.

**Écart corrigé, touchant un fichier déjà en production :** `src/auth/webhook.ts` ne gérait pas l'événement `organizationMembership.deleted`. Ajouté : supprime les `assignations_etablissement` de l'utilisateur puis sa ligne `utilisateurs`, dans une transaction (la contrainte `ON DELETE RESTRICT` de la migration `20260716183055_sprint6_roles_client` empêchait de supprimer l'utilisateur directement). Sans ce correctif, un membre retiré côté Clerk par `retirerMembre` serait resté scopé à l'entreprise dans notre base.

Vérifié : build, lint, 27 tests au vert (21 précédents + 6 nouveaux sur `equipe-permissions.ts`). **Reste à vérifier par le fondateur**, une fois une vraie invitation acceptée : rendu réel dans le navigateur, invitation avec les 4 rôles personnalisés Clerk, changement de rôle/retrait/révocation d'invitation en conditions réelles, réception effective de l'événement `organizationMembership.deleted` par le webhook.

### Tâche #65 — Écran Paramètres (2026-07-16, même journée)

`/app/parametres` : trois panneaux — coordonnées de l'entreprise (nom, secteur, email et téléphone de contact) modifiables via un formulaire, préférences de notification (deux interrupteurs `notifierRdvParEmail`/`notifierRdvParSms`, persistés immédiatement à chaque bascule, avec un texte honnête précisant qu'aucun moteur de notification n'existe encore pour les déclencher), abonnement actuel en lecture seule (plan, prix, cycle, statut, fin de période). Aucune donnée de démonstration.

Nouveau composant `src/components/ui/switch.tsx` (primitive Radix, déjà disponible via le paquet `radix-ui` installé — même façon de faire que `ui/select.tsx`/`ui/label.tsx`), pour les deux interrupteurs de notification.

**Permissions — défense en profondeur :** comme pour Équipe et accès, la garde de page (propriétaire/administrateur) est revérifiée dans les deux Server Actions (`src/app/(client)/app/parametres/actions.ts`), pas seulement dans `page.tsx`.

Vérifié directement contre la vraie base (pas de session Clerk réelle disponible) : lecture/écriture des coordonnées et des préférences de notification sur Barber Concept, valeurs restaurées après coup ; création puis lecture d'un abonnement de test (plan "Standard", 149 CHF/mensuel, actif, échéance) confirmant le format d'affichage, puis suppression pour laisser Barber Concept sans abonnement (état réel actuel — l'écran affiche donc "Aucun abonnement actif"). Build, lint, 27 tests au vert. **Reste à vérifier par le fondateur** : rendu réel dans le navigateur.

### Tâche #66 — Écran Vue d'ensemble (2026-07-16, même journée)

`/app` : quatre tuiles de stats (appels aujourd'hui, appels manqués, rendez-vous créés, taux de conversion — chacune avec un delta réel "vs hier", pas inventé), "Appels nécessitant une attention" (filtre simple `appels.statut = echoue`, pas de nouvelle table, pas le centre d'actions plateforme), "Activité récente" (derniers appels tous statuts confondus) et "Statistiques par établissement" (appels et RDV du jour, par établissement). Aucune donnée de démonstration — tout est scopé via `getEtablissementIdsAutorises` (Sprint 6, tâche #63), réutilisée telle quelle.

**Composants :** `StatTiles` (Sprint 5) réutilisé directement. `CallsChart` (graphique 14 jours) volontairement omis pour cette tâche : avec zéro appel réel aujourd'hui, il n'afficherait qu'une ligne plate à zéro sur 14 jours, sans valeur ajoutée par rapport aux tuiles déjà affichées — à reconsidérer une fois le branchement Vapi/Twilio fait. `RecentCalls` (Sprint 5, admin) non réutilisé pour "Activité récente" : son champ `entrepriseNom` n'a pas de sens pour une seule entreprise — nouveau composant dédié `ActiviteRecenteClient`, même logique que le choix déjà fait pour Établissements (tâche #63). Deux autres nouveaux composants, sans équivalent existant : `AppelsAttentionClient`, `StatsEtablissementsClient`.

**Résultat/statut d'un appel** dérivé du modèle (pas de champ `resultat` en base) : "Échec" si `statut = echoue`, "Transféré" si `transfere`, sinon "Rendez-vous pris" ou "Renseignement" selon la présence d'un `rendezVousId`.

Vérifié contre la vraie base : données de test créées (1 établissement, 1 agent, 2 appels aujourd'hui dont 1 échoué, 1 appel hier, 1 rendez-vous), fonction `getVueEnsembleClient` appelée directement — stats (2 appels, 1 manqué, 1 RDV, 50% de conversion, delta "+1 vs hier"), liste d'attention (le seul appel échoué), activité récente (3 appels, triés du plus récent au plus ancien) et répartition par établissement toutes correctes ; données supprimées ensuite, Barber Concept revérifié à l'état vide réel (zéros partout, "Aucun appel pour l'instant"). Build, lint, 27 tests au vert. **Reste à vérifier par le fondateur** : rendu réel dans le navigateur.

### Tâche #67 — Écran Appels (2026-07-16, même journée)

`/app/appels` : liste des appels scopée par établissements autorisés, barre de filtres (établissement, période, résultat, statut — filtrage en mémoire, volumes attendus faibles pour une seule entreprise), fiche détail (transcription, résumé, durée, rendez-vous créé, SMS envoyé, erreurs) ouverte en panneau latéral au clic. Aucune donnée de démonstration, Barber Concept sans appel réel affiche un état vide honnête.

**Point de routing important, à retenir pour toute future route du Dashboard Client :** contrairement à l'admin (où `@drawer` et `appels` vivent tous les deux directement sous le groupe `(dashboard)`, invisible dans l'URL), côté client `app/` est un vrai segment d'URL. Il a fallu un layout imbriqué `(client)/app/layout.tsx` (sous `(client)/layout.tsx`, qui garde le rail de navigation) pour brancher le slot `@drawer` au bon niveau et intercepter `/app/appels/[id]`. Toute route future de `(client)/app/...` ayant besoin d'un panneau latéral devra suivre ce même schéma. Vérifié au build : `/app`, `/app/(.)appels/[id]`, `/app/appels`, `/app/appels/[id]` listées comme routes distinctes, sans erreur de slot parallèle.

**Composants dédiés** (`AppelsTableClient`, `CallDetailClient`) plutôt que réutilisation forcée de ceux de l'admin — mêmes raisons que les tâches #63/#66 (colonnes Entreprise/Coût sans objet pour une seule entreprise ; le téléphone appelant n'est pas masqué ici, contrairement à l'admin, puisque c'est la propre clientèle de l'entreprise). Types et fonctions pures séparés dans `src/lib/appels-client.ts` (pas dans `data.ts`, qui importe Prisma — un composant `"use client"` ne peut pas importer un module qui dépend du pilote de base de données).

Isolation vérifiée explicitement : `getAppelDetailClient` filtre `agentIaId` par la liste des agents autorisés dans la requête Prisma elle-même (pas un filtre après coup) — un appel d'une autre entreprise renvoie `null`, pas une fuite de données. Vérifié contre la vraie base (établissement + agent + 3 appels de test, statuts variés, transcription/résumé), données supprimées ensuite. Build, lint, 27 tests au vert.

### Tâche #68 — Écran Rendez-vous (2026-07-16, même journée) — dernière tâche P1 du Sprint 6

`/app/rendez-vous` : liste des rendez-vous scopée par établissements autorisés (établissement, service, client, date/heure, statut), filtres établissement/statut, même schéma que Appels (tâche #67). Aucune donnée de démonstration, Barber Concept sans rendez-vous réel affiche un état vide honnête.

**Colonne "Collaborateur" — limite honnête, pas une colonne inventée :** vérifié que ce concept n'existe nulle part dans le modèle de données (`RendezVous`, `Service`) ni dans le backend vocal Vapi/Twilio actuel. Plutôt que d'ajouter une colonne condamnée à rester vide, l'écran affiche "Non renseigné" pour cette information — à combler le jour où le produit capture réellement cette donnée (probablement lié à l'intégration Get Time, Sprint 7).

**Get Time :** aucune intégration construite, comme prévu ("préparation sans connecter maintenant") — l'écran lit `RendezVous` tel quel, sans logique câblée en dur sur Google Calendar (pas de lien fabriqué à partir de `googleCalendarEventId`). Le modèle `Integration`, déjà générique, reste le point d'extension prévu.

Vérifié contre la vraie base (2 établissements, 1 service, 2 clients, 4 rendez-vous — un par statut confirmé/terminé/absent/annulé) : liste complète et liste scopée à un seul établissement toutes deux correctes, aucune fuite inter-établissement, données supprimées ensuite. Build, lint, 27 tests au vert.

**Sprint 6 — les 7 tâches P1 (#62-68) sont maintenant toutes terminées.** Reste en attente : vérification visuelle du fondateur dans un vrai navigateur (aucune session Clerk disponible pour les agents qui ont implémenté ce sprint).

### Écart Clerk trouvé et corrigé au moment de préparer la vérification visuelle (2026-07-17)

En préparant la première connexion réelle, découverte que l'activation d'Organizations (`clerk enable orgs`, faite à la tâche #62) avait mis par défaut le mode **« Membership required »** (`force_organization_selection: true`, défaut Clerk depuis fin 2025) : tout utilisateur connecté est forcé de choisir/créer une organisation. Conséquence directe : le compte du fondateur avait été automatiquement enrôlé dans une organisation "Zakaria's Organization" créée à la volée, le faisant apparaître comme "propriétaire" d'une entreprise plutôt que comme admin plateforme — contraire à la règle actée dans `docs/architecture.md` (« un admin plateforme n'appartient à aucune organisation »).

**Corrigé, avec confirmation du fondateur avant d'agir (changement de config sur un service réel) :**
- `force_organization_selection` repassé à `false` (mode « Membership optional ») via `clerk config patch`.
- L'organisation "Zakaria's Organization", créée par erreur, supprimée.
- `public_metadata.role = "admin_plateforme"` renseigné sur le compte du fondateur (prévu depuis le Sprint 5 mais jamais fait explicitement — voir `src/auth/index.ts`, `getCurrentUser`).

**À garder en tête pour tout futur compte admin plateforme** : `publicMetadata.role` doit être renseigné manuellement dans le dashboard Clerk (aucune UI dans le produit pour ça, décision déjà actée au Sprint 5) — sans quoi le rôle reste `null` dès que le compte n'a aucune organisation active.

### Vérification visuelle du Sprint 6 (2026-07-17) et création des 4 rôles Clerk

Vérification visuelle faite par le fondateur dans le navigateur : les 6 écrans du Dashboard Client s'affichent correctement (pages vides attendues, aucune donnée réelle branchée encore — normal). Sprint 6 considéré visuellement validé.

En vérifiant l'état de l'instance Clerk (`clerk api /organization_roles`), confirmé que les 4 rôles personnalisés annoncés depuis la tâche #62 (`org:proprietaire`, `org:administrateur`, `org:responsable_etablissement`, `org:membre`) n'avaient en réalité jamais été créés — seuls les rôles natifs `org:admin`/`org:member` existaient, donc l'écran Équipe et accès retombait sur le repli à 2 rôles. Créés via l'API (`POST /organization_roles`, dry-run puis réel, confirmé avec le fondateur avant d'agir sur ce service tiers) avec les clés exactes attendues par `src/auth/roles.ts`. Les 6 rôles (4 personnalisés + 2 natifs) sont maintenant présents sur l'instance. Reste à vérifier : une vraie invitation avec l'un des 4 rôles, en conditions réelles.

## Sprint 6bis — Branchement des appels réels (Vapi/Twilio) vers la base
Statut : cadré par le product-manager le 2026-07-17, décisions d'architecture validées par le fondateur le jour même. Tâches #69-75 ajoutées à `docs/roadmap.md`. Prêt pour le développement.

**Constat de cadrage, plus large que prévu au départ :** aucune table liée aux appels (`agents_ia`, `appels`, `conversations`, `rendez_vous`, `clients_finaux`) n'est jamais écrite pour un vrai appel — le backend Express (racine du dépôt, séparé de `dashboard/`) n'a aujourd'hui aucune connexion à Postgres. Bonne nouvelle identifiée pendant le cadrage : la prise de rendez-vous passe déjà par les outils natifs Vapi (Google Calendar), donc tout l'enregistrement en base peut se faire **après la fin de l'appel** (rapport de fin d'appel Vapi, nouveau webhook dédié), jamais pendant — aucun risque de dégrader l'expérience de l'appelant.

**Périmètre retenu :** connecter le backend au vrai numéro/assistant Barber Concept (`agents_ia`), écrire `Appels`/`Conversations` à la fin de chaque appel, `RendezVous`/`ClientsFinaux` quand une réservation a réellement eu lieu, refléter fidèlement `sms_envoye`/`erreurs`. Hors périmètre explicite : Vue d'ensemble/Finances/Santé plateforme (admin) restent sur données de démo pour l'instant (sujet séparé), multi-numéro Twilio, Get Time, migration d'hébergement.

**Décisions d'architecture actées par le fondateur (voir `docs/architecture.md`, nouvelle section dédiée) :**
- Connexion directe du backend Express à la base Postgres (Supabase), pas de relais HTTP via le dashboard Next.js — plus simple, aucune dépendance de disponibilité supplémentaire puisque l'écriture se fait après la fin d'appel. Les migrations Prisma restent la propriété de `dashboard/`.
- Établissement d'un appel déduit du rendez-vous réellement pris quand il y en a un (le salon apparaît dans les paramètres de l'événement Google Calendar créé) ; sinon état honnête « établissement non déterminé », jamais un rattachement arbitraire à un salon fictif — limite propre au partage actuel d'un seul numéro/agenda Barber Concept pour ses 6 salons, qui disparaîtra naturellement avec un numéro par salon plus tard (`agents_ia.numero_twilio` déjà prévu comme clé de résolution).
- Aucun rattrapage manuel des quelques vrais appels déjà passés avant ce chantier (tests fondateur, appel avec Henok) — les dashboards repartent à zéro à la mise en service.

**Risques signalés par le cadrage, à garder en tête pendant le développement :** panne d'écriture en base ne doit jamais faire échouer l'appel réel (donnée analytique, pas fonctionnelle) ; idempotence via `appels.vapi_call_id` (déjà unique) contre les doublons en cas de retry Vapi ; correspondance service prononcé à l'oral ↔ table `services` à surveiller pendant les tests réels.

### Tâche #70 — Connexion technique backend Express ↔ Postgres (2026-07-17)

**Conflit trouvé et résolu avant le code :** `AgentIA.etablissementId` est obligatoire dans le schéma — or Barber Concept partage un seul agent/numéro pour ses 6 salons, donc déduire l'établissement d'un appel via l'agent (comme le faisait déjà le code du Sprint 6, `appels-client.ts`) aurait fixé arbitrairement tous les appels sur un seul salon et cassé le scope d'un responsable d'établissement. Décision (fondateur, avant le code) : nouveau champ **`Appel.etablissementId`, nullable**, indépendant de `AgentIA` — sera rempli avec `rendezVous.etablissementId` quand une réservation a réellement eu lieu (tâche #73), laissé `null` sinon. Voir `docs/architecture.md` pour le détail.

- **Schéma Prisma** (`dashboard/prisma/schema.prisma`) : champ `Appel.etablissementId` ajouté (nullable), relation optionnelle vers `Etablissement`, index cohérent avec le reste du fichier. Migration `20260717120846_appel_etablissement_id` générée et appliquée contre la vraie base Supabase (via `DIRECT_URL`, comme les migrations précédentes). 27 tests, lint, build du dashboard toujours au vert après coup.
- **Backend Express** (racine du dépôt) : dépendance `pg` ajoutée, nouveau module `src/db.js` — pool de connexion réutilisable vers la même base Supabase, pooler transaction-mode (port 6543, comme le runtime du dashboard), aucun Prisma côté backend (requêtes SQL directes uniquement, cohérent avec la simplicité déjà pratiquée dans `src/sms.js`/`src/customers.js`). Les migrations restent la propriété exclusive de `dashboard/prisma/migrations`. `DATABASE_URL` ajoutée à `.env` (racine, non commité) et `.env.example`. Si la variable est absente, `pool` vaut `null` et rien ne plante (même principe que `PUBLIC_URL`/keep-alive dans `server.js`).
- **Vérifié concrètement** : `SELECT count(*) FROM entreprises` (2 trouvées), écriture puis lecture puis suppression d'une ligne de test dans `evenements_sante`, toutes réussies contre la vraie base. `GET /health` répond toujours `200`, testé avec et sans `DATABASE_URL` configurée — le service ne plante jamais dans les deux cas.
- **Aucune logique métier de webhook fin d'appel, aucune écriture réelle de ligne `Appels`/`Conversations`** — volontairement hors périmètre de cette tâche, viendra à la tâche #72.

Sauvegardes : aucune (pas de modification de l'assistant Vapi dans cette tâche). Fichiers modifiés/créés : `dashboard/prisma/schema.prisma`, `dashboard/prisma/migrations/20260717120846_appel_etablissement_id/`, `src/db.js`, `.env.example`, `package.json`.

### Tâche #71 — Agent IA réel + 6 établissements Barber Concept (2026-07-17)

**Préalable découvert en vérifiant la base réelle :** aucun établissement n'existait encore pour Barber Concept (table `etablissements` vide), alors que `AgentIA.etablissementId` est obligatoire — impossible de créer l'agent sans au moins un établissement. Le fondateur a confirmé au passage que Barber Concept a **6 salons réels** (Cornavin, Eaux-Vives, Jonction, Rive, Lausanne, Sion) et non 4 comme l'indiquait `CLAUDE.md` par erreur (corrigé le jour même, voir commit dédié) — les 6 étaient déjà pleinement documentés dans `src/prompts/system-prompt.md` (adresses, téléphones, horaires) depuis le Sprint 2/3.

Script ponctuel `scripts/seed-barber-concept.js` (connexion `pg` directe, cohérente avec `src/db.js` de la tâche #70), commité (contrairement à d'autres rattrapages ponctuels non commités sur ce projet — celui-ci documente une donnée réelle de production reproductible) :
- **6 lignes `Etablissement`** créées avec les vraies adresses (`src/prompts/system-prompt.md`), fuseau `Europe/Zurich`, même `google_calendar_id` pour les 6 (agenda partagé, décision Sprint 3) lu depuis `.env` (`GOOGLE_CALENDAR_CREDENTIALS_PATH` — nom de variable trompeur, contient en réalité l'identifiant du calendrier, pas un chemin de fichier).
- **1 ligne `AgentIA` réelle** : `numeroTwilio` `+41225391668`, `vapiAssistantId` `c08b8b99-c4f0-4aa1-8d0e-d0a833839a29` (assistant "Receptionniste Barber Concept"), `statut` `actif`, `configVoix` (voix Elliot, `fr-FR`, transcripteur Deepgram `nova-3`, conforme au Sprint 1 tâche #12).

**Choix assumé, pas une vraie décision métier :** `etablissementId` de cet agent rattaché arbitrairement à Cornavin (salon historique), uniquement parce que le champ est obligatoire dans le schéma — n'a plus de sens réel pour attribuer un appel à un salon depuis la tâche #70 (`Appel.etablissementId`, nullable, est désormais la vraie source de vérité, déduite du rendez-vous réel).

**Effet de bord connu et accepté, pas corrigé dans cette tâche :** l'écran client Établissements (`dashboard/src/app/(client)/app/etablissements/data.ts`) affiche numéro/assistant via `etablissement.agentsIA[0]` — seul Cornavin affichera donc le numéro Twilio, les 5 autres salons "Non configuré", tant que ce fichier n'est pas revu (hors périmètre de ce chantier).

Vérifié : requête directe confirmant les 6 établissements et l'agent avec les bonnes valeurs ; build, lint, 27 tests du dashboard toujours au vert (aucun code applicatif modifié, uniquement insertion de données réelles).

## Sprint 7 — Intégration Get Time
Statut : volontairement reporté (pas de présentation officielle du projet à Henok pour l'instant).

## Sprint 8 — Transfert humain
Statut : pas commencé, reporté (déprioritisé au profit des dashboards le 2026-07-16 — voir « Pivot stratégique » ci-dessus). Contenu inchangé par rapport à l'ancien Sprint 5.

## Sprint 9 — Polish et répétition
Statut : pas commencé.

## Transparence et consentement — enregistrement des appels
Statut : appliqué et testé (texte, `/chat`) — 2026-07-15. Demande directe du fondateur (conformité Suisse), hors numérotation roadmap.md.

- Vérification préalable (documentation/API Vapi) : **l'enregistrement ne peut pas être désactivé dynamiquement en cours d'appel.** `recordingEnabled` (et `transcriptPlan.enabled`) sont fixés à la config de l'assistant, avant l'appel ; `PATCH /call/{id}` ne permet de modifier que le champ `name`. Aucun outil/fonction Vapi natif ne permet de couper l'enregistrement pendant que l'appel est en cours. Conséquence directe sur le comportement de repli : en cas de refus, l'assistant est honnête sur cette limite plutôt que de prétendre avoir arrêté l'enregistrement.
- Fichiers modifiés : `src/prompts/system-prompt.md` (nouvelle section « Confidentialité et enregistrement des appels ») ; `src/retention.js` (nouveau, script manuel de suppression des appels après une durée configurable, valeur démo 7 jours — pas de suppression automatique disponible côté Vapi, testé en `--dry-run` seulement, jamais exécuté en réel).
- Configuration Vapi modifiée : `firstMessage` (texte exact fourni par le fondateur, prononcé automatiquement avant toute prise de parole du modèle) ; `artifactPlan.structuredOutputs` ajouté (extraction IA post-appel : `recording_notice_played`, `recording_consent_status`, `recording_disabled` — ce dernier restera `false` tant que la désactivation technique n'existe pas).
- Sauvegarde avant modification : `docs/backups/vapi-assistant-before-recording-consent.json`.
- 6 scénarios testés via `/chat` (accepte implicitement, refuse immédiatement, refuse en cours d'appel, refuse en anglais, consentement ambigu, limite technique) — tous corrects en test écrit.
- **Bug réel trouvé lors du premier appel web de vérification (2026-07-15, ~09:32) :** face à un refus, l'assistant a dit « L'enregistrement ne sera pas effectué pour cet appel » (faux — `recording_disabled` est resté `false`) et a quand même continué à recueillir prestation/salon/jour/heure/nom. Cause probable : variabilité du modèle (température 0.5), la règle n'était suivie qu'"en moyenne" en test écrit. Corrigé le même jour : règle reformulée en "RÈGLE ABSOLUE" avec liste explicite de phrases interdites, phrase de refus quasi figée à répéter, séquence stricte (s'arrêter avant de proposer le choix), température de l'assistant baissée de 0.5 à 0.3. Retesté 8 fois (5x refus immédiat + 3x refus en cours de réservation) via `/chat` après le correctif : 8/8 réponses identiques et correctes. Sauvegardes : `docs/backups/vapi-assistant-before-recording-consent.json` (avant tout), `docs/backups/vapi-assistant-after-recording-consent-fix.json` (après correctif).
- Confirmé sur cet appel réel : le `structuredOutputs` post-appel fonctionne (`recording_notice_played: true`, `recording_consent_status: "refused"`, `recording_disabled: false` — correctement détecté).
- **Limite non résolue, à garder en tête :** un test répété (8/8) donne confiance mais ne garantit pas 100% sur tous les phrasés possibles — un contrôle par prompt reste probabiliste par nature, sans garde-fou déterministe (pas de fonction/webhook qui bloquerait la conversation en dur). À surveiller sur les prochains appels réels.

## Bugs / risques ouverts
- **Numération suisse romande (septante/huitante/nonante) non respectée à l'oral.** Le texte généré par Claude est correct (vérifié), mais la voix Vapi "Clara" (et vraisemblablement toutes les voix du fournisseur natif "vapi") re-normalise les nombres en français standard à la synthèse. Testé sans succès : version legacy (v1, change aussi le genre de la voix), fournisseur ElevenLabs (voix "sarah", rejeté par le fondateur). Décision du 2026-07-14 : on garde Clara (voix jugée bonne par ailleurs), on accepte cette limitation pour l'instant. À revisiter plus tard si nécessaire (autres voix ElevenLabs, Azure, ou dictionnaire de prononciation).
