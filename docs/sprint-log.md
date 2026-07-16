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
- **Limite persistante, assumée pour l'instant :** le keep-alive réduit très fortement le risque mais n'élimine pas à 100% un cas de mise en veille (ex. redémarrage du service par Render lui-même, ou keep-alive momentanément en échec) — dans ce cas de figure résiduel, le filet de sécurité (40s) laisse une marge largement suffisante pour couvrir un redémarrage à froid isolé. Passage à un plan Render payant resterait la solution définitive si ce risque devenait inacceptable (non fait pour l'instant, coût récurrent non justifié à ce stade prototype).

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

## Sprint 5 — Transfert humain
Statut : pas commencé

## Sprint 6 — Polish et répétition
Statut : pas commencé

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
