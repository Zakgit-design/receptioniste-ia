# Roadmap — Plateforme SaaS multi-entreprises

Source de vérité du périmètre. Toute tâche non listée ici est hors scope sauf validation explicite du fondateur.

## Pivot stratégique (2026-07-16)

Jusqu'ici, le projet visait uniquement un prototype de démonstration pour Barber Concept (MVP 1). À partir de maintenant, l'objectif est de construire une véritable plateforme SaaS B2B destinée à accueillir de nombreuses PME (salons de coiffure, restaurants, cabinets dentaires, cliniques, garages, instituts, cabinets médicaux, etc.), Barber Concept restant le client pilote mais plus la cible finale unique. Voir `docs/architecture.md` (section « Principe directeur ») pour la conséquence sur chaque décision technique.

Conséquence directe sur les priorités : le transfert humain (ancien Sprint 5) est repoussé — il reste une fonctionnalité prévue, mais la priorité immédiate devient le **Dashboard Administrateur**, cœur opérationnel de la plateforme SaaS.

## Vue d'ensemble — roadmap officielle

**Réorganisation du 2026-07-22 (fondateur, cadrage CTO) :** la démonstration officielle à Henok a eu lieu — accueil positif, décision finale en attente de ses associés.

**Recadrage du même jour, avant tout développement :** Barber Concept n'a pas encore confirmé le pilote. Construire immédiatement un déploiement complet à 6 salons (un numéro/assistant/agenda par salon) serait donc une sur-ingénierie prématurée — l'investissement doit rester proportionné tant que l'accord n'est pas confirmé. **Le Sprint 7 est recadré autour d'un pilote réel limité à un seul salon** (numéro, assistant, agenda et établissement uniques, les 5 autres salons restant présents en base mais non configurés/non actifs), avec un accès distant réel pour Henok (Dashboard Client déployé publiquement sur Vercel, parcours d'invitation Clerk). L'extension à un numéro/assistant/agenda par salon, l'onboarding industrialisé d'une deuxième entreprise et la migration vers une infrastructure toujours active restent prévus, mais deviennent une **phase suivante, déclenchée par la validation commerciale de Barber Concept** — pas par l'avancement des sprints. Get Time et le transfert humain restent prévus mais repoussés plus loin ; la facturation (Stripe) reste volontairement hors périmètre tant qu'aucune relation commerciale formelle n'est signée.

| Sprint | Contenu | Statut |
|---|---|---|
| 1 | Assistant vocal | ✅ terminé |
| 2 | Google Calendar | ✅ terminé |
| 3 | Réservation intelligente | ✅ terminé |
| 4 | SMS de confirmation + Backend Render | ✅ terminé |
| 5 | Dashboard Administrateur (plateforme) | ✅ terminé |
| 6 | Dashboard Client | ✅ terminé |
| 6bis | Branchement des appels réels (Vapi/Twilio) vers la base | ✅ terminé |
| 7 | **Pilote réel mono-salon** — un seul salon, dashboards déployés publiquement, accès Henok | nouvelle priorité |
| 8 | Catalogue de services complet et généralisé | en pause — après validation commerciale |
| 9 | Infrastructure de production toujours active | en pause — après validation commerciale |
| 10 | Onboarding industrialisé d'une nouvelle entreprise | en pause — après validation commerciale |
| 11 | Supervision minimale réelle (santé, alerte) | en pause — après validation commerciale |
| 12 | Intégration Get Time | reporté (attend la décision des associés de Barber Concept) |
| 13 | Transfert vers un humain | reporté, toujours prévu |
| 14 | Polish et répétition | à venir |

Les sprints 1 à 4 de cette vue regroupent le détail historique conservé ci-dessous (anciens Sprints 0 à 4, numérotation de tâches inchangée pour ne pas perdre la traçabilité des tests déjà effectués).

---

## Détail historique — Sprints 0 à 4 (terminés)

### Sprint 0 — Fondations techniques
**Objectif :** avoir tous les outils prêts et un numéro qui décroche, sans encore aucune intelligence.
**Livrable visible :** un numéro de téléphone qu'on appelle et qui répond par un message automatique de test.
**Dépendances :** aucune.
**Critères de validation :** appel réel depuis un téléphone → une voix répond.

- [x] 1. Créer un compte Twilio et vérifier l'identité
- [x] 2. Réserver un numéro de téléphone de test
- [x] 3. Créer un compte Vapi
- [x] 4. Créer un compte Anthropic (API Claude) et générer une clé API
- [x] 5. Créer un compte d'hébergement (Render ou Railway)
- [x] 6. Initialiser le projet de code (dossier + dépôt Git vide)
- [x] 7. Connecter le numéro Twilio à Vapi (sans logique encore)
- [x] 8. Appeler le numéro et vérifier qu'un message automatique par défaut répond

### Sprint 1 — Conversation IA basique
**Objectif :** l'agent comprend une question simple et répond intelligemment, en français.
**Livrable visible :** on pose une question à l'oral, l'IA répond correctement.
**Dépendances :** Sprint 0.
**Critères de validation :** 5 questions simples posées à voix haute → réponses cohérentes.

- [x] 9. Connecter la clé API Claude dans Vapi
- [x] 10. Écrire un premier prompt système simple
- [x] 11. Tester une question ouverte, vérifier une réponse cohérente
- [x] 12. Choisir et régler la voix française
- [x] 13. Mesurer le temps de réponse et ajuster si trop lent
- [x] 14. Lister les 5 premières questions FAQ à tester

### Sprint 2 — FAQ complètes de Barber Concept
**Objectif :** l'agent connaît par cœur les vraies infos des 4 salons.
**Livrable visible :** démo orale robuste sur les questions fréquentes.
**Dépendances :** Sprint 1 + contenu réel (à réunir par le fondateur).
**Critères de validation :** 15-20 questions variées testées, taux de bonnes réponses élevé.

- [x] 15. Réunir les horaires des 4 salons
- [x] 16. Réunir la liste des services et des prix
- [x] 17. Lister les questions fréquentes types des clients
- [x] 18. Intégrer ces infos dans le prompt système
- [x] 19. Tester 10 questions et noter les échecs
- [ ] 20. Corriger le prompt pour les questions ratées (aucun échec factuel détecté, voir `docs/sprint-log.md`)
- [x] 21. Ajouter une règle stricte "je ne sais pas" (anti-invention)

### Sprint 3 — Agenda et prise de rendez-vous
**Objectif :** l'agent consulte un agenda de démo et y inscrit un vrai rendez-vous.
**Livrable visible :** appel de bout en bout → le RDV apparaît dans Google Calendar.
**Dépendances :** Sprint 2.
**Critères de validation :** RDV pris par téléphone, vérifié dans le calendrier avec les bonnes infos.

- [x] 22. Créer un Google Calendar de démonstration dédié
- [x] 23. Créer des créneaux de disponibilité types
- [x] 24. Connecter l'API Google Calendar au backend
- [x] 25. Construire la fonction "chercher un créneau disponible"
- [x] 26. Construire la fonction "créer un rendez-vous"
- [x] 27. Relier ces fonctions à la conversation
- [x] 28. Tester un appel complet de prise de RDV
- [x] 29. Vérifier le RDV dans Google Calendar

### Sprint 4 — SMS de confirmation
**Objectif :** un SMS part automatiquement après la prise de RDV.
**Livrable visible :** réception d'un vrai SMS après un appel test.
**Dépendances :** Sprint 3.
**Critères de validation :** SMS reçu en moins de 30 secondes, contenu correct.

- [x] 30. Activer l'envoi de SMS sur le compte Twilio
- [x] 31. Écrire le modèle du message de confirmation
- [x] 32. Construire la fonction qui déclenche le SMS après création du RDV
- [x] 33. Tester la réception du SMS après un appel — validé par un vrai appel téléphonique de bout en bout le 2026-07-16 (voir `docs/sprint-log.md`)
- [x] 34. Ajuster la formulation si besoin (aucun ajustement nécessaire, formulation déjà validée)

---

## Sprint 5 — Dashboard Administrateur (plateforme)

**Objectif :** donner au fondateur une interface interne pour piloter toute la plateforme, entreprise par entreprise — le cœur opérationnel du SaaS.
**Statut :** conception terminée le 2026-07-16 (voir `docs/sprint5-conception.md` et `docs/architecture.md`) — prêt pour le développement.
**Dépendances :** Sprints 1-4 (le backend Twilio/Vapi/Calendar/SMS existant devient la première ressource gérée par ce dashboard).
**Critères de validation :** démonstration en moins de 30 secondes de l'état de toute la plateforme ; capacité réelle à créer/gérer une entreprise depuis l'interface.

**Implication d'architecture majeure :** ce dashboard a besoin d'un vrai stockage relationnel (entreprises, établissements, utilisateurs, abonnements, santé, centre d'actions...) — la base de données PostgreSQL, jusqu'ici prévue pour "MVP 3+", devient donc nécessaire dès ce sprint. Modèle détaillé (17 tables) dans `docs/architecture.md`. Stack : Next.js/TypeScript/Tailwind/shadcn/Prisma/Clerk (justification complète dans `docs/sprint5-conception.md`).

**Conception UX finalisée le 2026-07-16** (`docs/sprint5-conception.md`) : le dashboard est organisé autour d'un centre d'actions ("qu'est-ce qui nécessite mon intervention aujourd'hui"), pas seulement de la consultation de données. Détail des écrans, du centre d'actions et des choix de conception dans ce document.

**Prérequis d'infrastructure — action utilisateur nécessaire, non bloquante :** ni la base PostgreSQL de production ni le compte Clerk n'existent encore. Comme au Sprint 0, ces comptes ne bloquent pas le développement : tout ce qui ne dépend pas d'eux (schéma, migrations, code de la couche d'authentification, écrans avec données de démonstration) avance en parallèle. Voir `docs/sprint-log.md` pour le détail.

**Tâches, dans l'ordre de dépendance validé par le fondateur (ne pas commencer une tâche P2 avant que les tâches ci-dessous soient fonctionnelles, testées et documentées) :**

- [x] 50. Initialiser le projet Next.js du dashboard (TypeScript, Tailwind, shadcn/ui) — terminé le 2026-07-16
- [x] 51. Modèle de données + centre d'actions : schéma Prisma des 17 tables, logique de calcul de santé (`evenements_sante`) et de création/résolution des items (`actions_requises`) — terminé le 2026-07-16. Schéma et logique pure vérifiés (17 tests) ; migration générée mais **pas encore appliquée** (pas de Postgres réel, voir tâche #1 ci-dessus)
- [x] 52. Écran Vue d'ensemble (centre d'actions en section héro, statistiques clés, "Derniers appels", graphique 14 jours en dernier) — terminé et vérifié (capture d'écran) le 2026-07-16
- [x] 53. Écran Entreprises — liste avec colonne Santé, tri "problèmes en premier", filtre "Nécessite une attention" + création d'une entreprise (bouton visuel, non fonctionnel sans base) — terminé le 2026-07-16
- [x] 54. Écran Appels — historique consolidé, filtre "Échecs / à traiter", fiche détail en panneau latéral (drawer, timeline, routes interceptantes Next.js) — terminé et vérifié visuellement le 2026-07-16
- [x] 55. Écran Santé plateforme — état des 7 services critiques, lien vers les entreprises impactées — terminé le 2026-07-16
- [x] 56. Écran Finances (renommé depuis Coûts) — marge brute en hero, coûts fixes vs variables, revenus estimés, mention "estimé" explicite — terminé et vérifié visuellement le 2026-07-16
- [x] 57. Invitations utilisateurs — couche d'abstraction Clerk (`src/auth/`), écran Utilisateurs avec données de démonstration — terminé le 2026-07-16. Synchronisation webhook écrite mais non testable sans compte Clerk réel (tâche #2) ; `clerkMiddleware()`/`proxy.ts` restent à ajouter avant une vraie mise en service (couplé à l'écran `/login`, pas encore construit)
- [x] 58. Écran Détail entreprise (onglets : vue d'ensemble par défaut avec rentabilité, établissements, numéros & assistants, calendriers, appels, abonnement, utilisateurs) — terminé le 2026-07-16 (les 5 onglets secondaires restent en placeholder, hors périmètre P1)
- [x] 59. Brancher les données réelles de Barber Concept (première entreprise créée via le dashboard, pas insérée à la main) — terminé le 2026-07-16. Base PostgreSQL réelle (Supabase) branchée, migration `0001_init` appliquée, bouton "+ Nouvelle entreprise" rendu fonctionnel (server action Prisma), Barber Concept créé via ce formulaire (pas en SQL manuel)
- [x] 60. Démonstration de bout en bout : créer une entreprise, vérifier qu'elle apparaît partout où attendu — terminé le 2026-07-16, vérifié en base et via les fonctions de lecture (`getEntreprisesListe`/`getEntrepriseDetail`). **Vérifié visuellement dans le navigateur par le fondateur le 2026-07-16 : test concluant** (Barber Concept créé via le formulaire, apparaît dans la liste, fiche détail fonctionnelle, données persistées dans Supabase)
- [x] 61. Suppression d'une entreprise depuis le dashboard — terminé le 2026-07-16. Bouton "Supprimer" sur la fiche détail (entreprises réelles uniquement, pas les entreprises de démonstration), confirmation par saisie du nom exact, suppression en cascade manuelle côté serveur (le schéma n'a pas de `ON DELETE CASCADE`, tout est `RESTRICT` par défaut — voir `entreprises/actions.ts`).

**Statut au 2026-07-16 : Sprint 5 clôturé.** Tous les écrans P1 sont fonctionnels, testés, documentés et vérifiés visuellement (y compris par le fondateur en conditions réelles). La base PostgreSQL réelle est branchée (Supabase) et la première vraie entreprise (Barber Concept) est créée via le dashboard. Écran Entreprises et Finances affichent encore un mélange données de démo + données réelles le temps que les autres écrans (Vue d'ensemble, Finances, Santé plateforme) soient branchés sur la vraie base.

**Décision du fondateur (2026-07-16) : le branchement des appels réels Vapi/Twilio vers la table `Appels` (et par extension la fin du mélange démo/réel sur Vue d'ensemble/Finances/Santé plateforme) est volontairement différé à une tâche dédiée, après la construction du Dashboard Client (Sprint 6)** — pour respecter l'ordre de dépendance de la roadmap plutôt que d'interrompre le Sprint 6 en cours de route.

**Différé (P2+, pas avant que tout ce qui précède soit fonctionnel) :** page globale Abonnements (attend l'intégration Stripe), historique 30 jours façon uptime sur Santé plateforme, hiérarchie visuelle fine des colonnes secondaires.

## Sprint 6 — Dashboard Client

**Objectif :** donner à chaque entreprise cliente (ex. Barber Concept) son propre espace, avec un rendu premium (niveau Stripe/Linear/Vercel/Notion), en réutilisant le design system et les composants du Dashboard Administrateur, sur la même base Supabase/Prisma, avec une isolation multi-tenant stricte (un utilisateur client ne voit jamais les données d'une autre entreprise).
**Statut :** conception terminée le 2026-07-16 (voir `docs/sprint6-conception.md`) — prêt pour le développement.
**Dépendances :** Sprint 5 (réutilise le même modèle de données et la même architecture frontend).
**Critères de validation :** Henok doit avoir l'impression d'utiliser un logiciel premium dès l'ouverture ; isolation multi-tenant vérifiée (un compte d'une entreprise ne peut jamais accéder aux données d'une autre).

**Écart d'architecture trouvé pendant la conception, à corriger en premier :** aucune des 2 entreprises existantes en base (Barber Concept, MS Savané) n'est reliée à une Organisation Clerk (`clerk_organization_id` vide) — pourtant prévu depuis `docs/architecture.md`. Sans cette liaison, aucun utilisateur ne peut être invité sur une entreprise. Voir `docs/sprint6-conception.md`, section 0.1, pour le correctif (création automatique désormais + rattrapage des 2 entreprises existantes).

**Action fondateur requise, non bloquante pour le code (même nature que les prérequis Postgres/Clerk des sprints précédents) :** créer 4 rôles personnalisés dans Clerk (Dashboard → Organizations → Roles & Permissions) — `org:proprietaire`, `org:administrateur`, `org:responsable_etablissement`, `org:membre` — voir `docs/sprint6-conception.md`, section 0.2.

**Tâches, dans l'ordre de dépendance (voir justification complète dans `docs/sprint6-conception.md`, section 7) :**

- [x] 62. Prérequis : liaison Entreprise ↔ Organisation Clerk (création auto + backfill Barber Concept/MS Savané), migration du modèle de données (enum `role_utilisateur` étendu à 5 valeurs, table `assignations_etablissement`, colonnes de préférences de notification), squelette de route `(client)` sous `/app` avec garde de rôle (`proxy.ts`) et navigation dédiée — terminé le 2026-07-16. Blocage rencontré et résolu en cours de route : la fonctionnalité "Organizations" n'était pas activée sur l'instance Clerk (`clerk enable orgs`, action désormais faite) — le backfill des 2 entreprises existantes a été rejoué avec succès après activation
- [x] 63. Écran Établissements (lecture seule, scope par établissements assignés pour un responsable d'établissement) — terminé le 2026-07-16. Fonction de scope partagée `getEtablissementIdsAutorises` (`src/lib/scope-client.ts`), réutilisée dès maintenant par les tâches suivantes ; aucune donnée de démonstration, cartes affichant numéro/assistant/appels 7j/intégration Google Calendar
- [x] 64. Écran Équipe et accès (liste des membres, invitations avec sélecteur des 4 rôles, retrait/changement de rôle selon permissions) — terminé le 2026-07-16. Nouvelles fonctions Clerk (`changerRoleMembre`, `retirerMembre`, `revoquerInvitation` dans `src/auth/index.ts`), permissions exactes de `docs/sprint6-conception.md` §2 revérifiées dans chaque Server Action (`src/app/(client)/app/equipe/actions.ts`), pas seulement la garde de page ; ajout du cas `organizationMembership.deleted` au webhook (`src/auth/webhook.ts`), non géré jusqu'ici ; contrôle à cases à cocher pour les établissements assignés d'un responsable d'établissement
- [x] 65. Écran Paramètres (coordonnées, préférences de notification, abonnement actuel en lecture) — terminé le 2026-07-16. Formulaire coordonnées + interrupteurs de notification persistés réellement sur `Entreprise` (revérification du rôle dans `src/app/(client)/app/parametres/actions.ts`, même défense en profondeur qu'Équipe) ; nouveau composant `ui/switch.tsx` (Radix) ; abonnement affiché en lecture seule, "Aucun abonnement actif" honnête tant qu'aucune ligne `Abonnement` n'existe (cas réel de Barber Concept aujourd'hui)
- [x] 66. Écran Vue d'ensemble (appels reçus, rendez-vous pris, taux de conversion, appels à traiter, activité récente, stats par établissement) — terminé le 2026-07-16. Données réelles scopées via `getEtablissementIdsAutorises` ; "appels nécessitant une attention" = filtre simple `statut = echoue` (pas de nouvelle table) ; graphique 14 jours volontairement omis tant qu'aucun vrai appel n'existe (ligne plate à zéro, aucune valeur) ; composant `ActiviteRecenteClient` dédié plutôt que réutilisation forcée de `RecentCalls` (admin, suppose plusieurs entreprises) ; vérifié avec des données de test réelles (établissement/agent/appels/RDV créés puis supprimés) confirmant stats/conversion/attention/activité/répartition par établissement, Barber Concept revérifié à zéro ensuite
- [x] 67. Écran Appels (liste filtrée par entreprise/établissements assignés, drawer de détail réutilisé du Sprint 5) — terminé le 2026-07-16. Barre de filtres établissement/période/résultat/statut ; nouveau layout imbriqué `(client)/app/layout.tsx` nécessaire pour brancher le slot `@drawer` (routing différent de l'admin : `app/` est un vrai segment d'URL côté client) — même schéma à réutiliser pour toute future route client ayant besoin d'un panneau latéral ; composants dédiés `AppelsTableClient`/`CallDetailClient` (pas d'Entreprise/Coût, même décision que #63/#66) ; isolation vérifiée (un appel d'une autre entreprise renvoie `null`) ; données de test créées puis supprimées, Barber Concept revérifié à zéro appel réel
- [x] 68. Écran Rendez-vous (créés par l'IA — établissement, service, collaborateur si disponible, statut ; pas de connexion Get Time à ce stade) — terminé le 2026-07-16. Colonne "Collaborateur" affichée "Non renseigné" (concept absent du modèle de données et du backend vocal actuel — pas de colonne inventée) ; aucune logique Get Time construite, l'écran lit `RendezVous` tel quel. **Toutes les tâches P1 du Sprint 6 (#62-68) sont maintenant terminées.**

**Contenu couvert par ces tâches, tel que cadré par le fondateur** :
- Vue d'ensemble : appels du jour, appels manqués, rendez-vous créés, taux de conversion, appels nécessitant une attention, activité récente, statistiques par établissement
- Appels : filtres par établissement/période/résultat/statut, drawer avec transcription/résumé/durée/RDV créé/SMS envoyé/erreurs
- Rendez-vous : établissement, service, collaborateur, date/heure/client/statut
- Établissements : liste, statistiques, numéro/assistant, état des intégrations
- Équipe et accès : rôles propriétaire/administrateur/responsable d'établissement/membre, invitations directes uniquement
- Paramètres : informations entreprise, coordonnées, préférences de notification, abonnement actuel (sans construire Stripe)
- vue consolidée multi-établissements (6 salons Barber Concept) + filtre par salon + comparaison entre salons
- emplacement prévu pour les futurs modules Get Time

## Sprint 6bis — Branchement des appels réels (Vapi/Twilio) vers la base

**Objectif :** faire en sorte que chaque vrai appel téléphonique écrive réellement dans la base Postgres (`Appels`, `Conversations`, `RendezVous`), pour que les dashboards Admin et Client (Sprints 5-6) affichent enfin de vrais chiffres plutôt que des zéros.
**Statut :** cadré par le PM le 2026-07-17 (voir `docs/sprint-log.md`), décisions d'architecture actées par le fondateur (voir `docs/architecture.md`, section « Décision d'architecture — Branchement des appels réels »). Prêt pour le développement.
**Dépendances :** Sprints 1-4 (backend vocal existant), Sprint 5-6 (schéma Prisma et écrans déjà branchés sur la vraie base, en attente de données réelles).
**Critères de validation :** plusieurs vrais appels de test (avec réservation, sans réservation, avec échec) font apparaître les bonnes données dans l'écran Appels/Rendez-vous/Vue d'ensemble du Dashboard Client, sans jamais avoir dégradé l'expérience de l'appelant (SMS, réservation, fin d'appel toujours fonctionnels).

**Hors périmètre de ce chantier (voir cadrage complet dans `docs/sprint-log.md`) :** branchement de Vue d'ensemble/Finances/Santé plateforme (admin) sur la vraie base ; `evenements_sante`/`actions_requises` ; support de plusieurs numéros Twilio simultanés ; Get Time/notion de "collaborateur" ; migration d'hébergement (tâches #47-49).

- [x] 69. Décisions d'architecture actées et documentées (connexion backend↔Postgres, résolution établissement par appel) — **terminé le 2026-07-17**, voir `docs/architecture.md`
- [x] 70. Connexion technique du backend Express à la base Postgres (Supabase), sans logique métier — **terminé le 2026-07-17**, voir `docs/sprint-log.md`
- [x] 71. Création de l'unique ligne `agents_ia` réelle correspondant au numéro/assistant Barber Concept — **terminé le 2026-07-17**, élargie pour inclure la création des 6 établissements réels (aucun n'existait encore en base), voir `docs/sprint-log.md`
- [x] 72. Nouveau webhook Vapi "fin d'appel" → écriture `Appels` + `Conversations` après le raccrochage (jamais pendant) — **terminé le 2026-07-17**, validé par 2 vrais appels téléphoniques de bout en bout, voir `docs/sprint-log.md`
- [x] 73. Écriture `ClientsFinaux` + `RendezVous` quand une réservation a réellement eu lieu, liaison `appels.rendez_vous_id`, établissement déduit du RDV ou "non déterminé" sinon — **terminé le 2026-07-17**, voir `docs/sprint-log.md` (limite honnête sur les prestations spécifiques par salon, non reconnues)
- [x] 74. `sms_envoye`/`erreurs` fidèles au résultat réel de l'outil SMS existant — **terminé le 2026-07-17**, voir `docs/sprint-log.md`
- [x] 75. Vérification de bout en bout avec plusieurs vrais appels (avec RDV, sans RDV, avec échec) — **terminé le 2026-07-18**, validé par le fondateur avec 3 vrais appels téléphoniques, voir `docs/sprint-log.md`. **Sprint 6bis clos.**

## Sprint 7 — Pilote réel mono-salon Barber Concept

**Objectif :** rendre le pilote réellement utilisable par Barber Concept à l'échelle d'**un seul salon**, avec un accès distant réel pour Henok — sans investir dans un déploiement complet à 6 salons tant que le projet n'est pas confirmé.
**Statut :** recadré le 2026-07-22 (fondateur), suite à la démonstration officielle à Henok (accueil positif, décision finale en attente de ses associés). Prêt pour le développement.
**Dépendances :** Sprint 6bis (branchement des appels réels).
**Décision de périmètre (fondateur, 2026-07-22) :** Barber Concept n'a pas encore confirmé le pilote — construire immédiatement un numéro/assistant/agenda par salon (6 salons) serait une sur-ingénierie prématurée. Le pilote reste volontairement limité à :
- un seul numéro Twilio, un seul assistant Vapi, un seul agenda Google Calendar, un seul établissement : **Jonction** (confirmé par le fondateur le 2026-07-22 — Cornavin avait été proposé par défaut car déjà configuré depuis le Sprint 6bis, mais le fondateur a tranché pour Jonction ; l'agent existant a été rattaché à Jonction, `scripts/set-pilot-etablissement.js`, aucun changement Twilio/Vapi nécessaire, seule la colonne `agents_ia.etablissement_id` a changé) ;
- les 5 autres salons restent présents dans le modèle de données (`etablissements`) mais **sans ligne `agents_ia`** — non configurés, non actifs, aucun travail de provisioning supplémentaire pour l'instant ;
- l'architecture reste extensible : `agents_ia.etablissement_id`/`numero_twilio` et `etablissements.google_calendar_id` supportent déjà un numéro/assistant/agenda par salon sans refonte — voir « Phase suivante, après validation commerciale » ci-dessous.
**Critères de validation :** Henok se connecte au Dashboard Client depuis son propre ordinateur ou téléphone, via une URL publique, et ne voit que les données du salon pilote Barber Concept.

- [x] 76. Confirmer avec le fondateur l'établissement retenu pour le pilote et vérifier que rien dans le code des dashboards ne suppose à tort que les 6 salons sont tous configurés — **terminé le 2026-07-22**, Jonction confirmé (pas Cornavin), agent réel rattaché via `scripts/set-pilot-etablissement.js` (vérifié avant/après), code du Dashboard Client déjà data-driven (`etablissement.agentsIA[0]`, aucune logique en dur à corriger, seul un commentaire obsolète mentionnant Cornavin a été mis à jour), build/lint/27 tests toujours au vert
- [x] 77. Déployer le Dashboard Next.js (Admin + Client, même codebase) sur Vercel : build de production, variables d'environnement (connexion Supabase en mode pooler, clés Clerk), URL Vercel par défaut (domaine personnalisé différé, voir `docs/architecture.md`) — **terminé le 2026-07-22**, après deux incidents réels trouvés et corrigés en déployant (voir `docs/sprint-log.md`) : échec de build (P1001, page `/entreprises` pré-rendue statiquement) puis échec runtime (P1001, `DATABASE_URL` stockée en variable Vercel "Sensitive" illisible). URL de production : https://receptioniste-ia.vercel.app — connexion réelle du fondateur vérifiée par les logs runtime (niveau `error` : aucun résultat)
- [ ] 78. Reconfigurer Clerk pour l'URL publique Vercel : URLs de redirection après connexion/déconnexion, endpoint du webhook `.../api/webhooks/clerk` pointé vers Vercel (plus localhost) — **pas encore fait** : `CLERK_WEBHOOK_SIGNING_SECRET` toujours absente de Vercel (confirmé via `vercel env ls`), endpoint jamais enregistré côté dashboard Clerk. La connexion elle-même fonctionne déjà (redirections `NEXT_PUBLIC_CLERK_SIGN_IN_URL`/etc. relatives, indépendantes du domaine), mais la synchronisation webhook Clerk → table `Utilisateur` reste non branchée en production
- [ ] 79. Vérifier/finaliser la liaison Organisation Clerk ↔ Barber Concept (`clerk_organization_id`, normalement déjà backfillée depuis la tâche #62) puis inviter réellement Henok par email depuis l'écran "Équipe et accès" existant (Sprint 6, tâche #64), avec le rôle approprié — **volontairement en attente (2026-07-22, fondateur) :** Henok a accueilli la démo positivement mais n'a pas encore donné son accord explicite pour tester réellement dans un de ses salons. Ne pas envoyer l'invitation avant ce retour, distinct de l'accueil positif déjà obtenu — l'accord porte spécifiquement sur l'usage opérationnel d'un vrai salon, pas sur l'intérêt général pour le projet
- [ ] 80. Test de bout en bout par une personne externe (pas le fondateur) : réception de l'invitation, connexion sécurisée, redirection vers `/app`, vérification qu'elle ne voit que les données du salon pilote Barber Concept — **pas encore fait** : seule la connexion du fondateur a été vérifiée aujourd'hui (voir tâche #77), pas celle d'Henok
- [ ] 81. Documenter explicitement dans `docs/architecture.md` que Render gratuit ne convient pas à une exploitation réelle durable (démarrage à froid) — fait, limite acceptée sciemment pour ce pilote à faible volume, pas résolue

### Phase suivante, après validation commerciale de Barber Concept (en pause, ne pas démarrer avant)

Une fois Barber Concept confirme le projet au-delà du pilote (ou qu'une deuxième entreprise réelle arrive), les chantiers suivants redeviennent prioritaires — non détaillés davantage pour l'instant, pour éviter d'investir dans une conception qui pourrait changer selon les retours du pilote mono-salon :

- **Extension multi-salons** — un numéro/assistant/agenda propre par salon pour les 5 salons Barber Concept restants (mécanisme générique de provisioning à concevoir à ce moment-là, réutilisable pour toute entreprise)
- **Sprint 8 — Catalogue de services complet et généralisé** — combler les trous connus (tarifs étudiants, prestations spécifiques par salon) et généraliser le modèle `Service` (prix/durée variable par établissement)
- **Sprint 9 — Infrastructure de production toujours active** — sortir de Render gratuit + keep-alive (tâches #47-49, voir `docs/architecture.md`)
- **Sprint 10 — Onboarding industrialisé d'une nouvelle entreprise** — éditeur établissements/services dans le dashboard, réutilisation du mécanisme de provisioning ci-dessus pour une entreprise test d'un autre secteur
- **Sprint 11 — Supervision minimale réelle** — `evenements_sante`/`actions_requises` branchés sur de vrais déclencheurs, alerte au fondateur

---

## Sprint 12 — Intégration Get Time

**Objectif :** connecter l'agenda réel Get Time de Barber Concept, en remplacement de l'agenda Google Calendar dédié mis en place au Sprint 7.
**Statut :** reporté — en attente de la décision des associés de Barber Concept suite à la démonstration officielle à Henok (accueil positif, décision collective encore à venir).
**Dépendances :** Sprint 7 (chaque salon a déjà son agenda dédié — Get Time viendra s'y substituer, pas s'y ajouter).
**Contrainte de conception :** le code des Sprints 5-6 prévoit déjà cette intégration (interface remplaçable, table `integrations`), sans la construire maintenant.

## Sprint 13 — Transfert vers un humain

**Objectif :** l'agent transfère l'appel à un vrai numéro si nécessaire.
**Livrable visible :** demande de transfert → appel transféré.
**Statut :** reporté, toujours prévu — à réévaluer plus tôt si un futur client (notamment hors coiffure : dentaire, médical, garage) le signale comme bloquant à la vente.
**Dépendances :** Sprint 3.
**Critères de validation :** transfert réussi testé avec 3 formulations différentes.

- [ ] 35. Définir le numéro humain de secours
- [ ] 36. Ajouter la détection d'une demande de transfert dans le prompt
- [ ] 37. Configurer la fonction de transfert d'appel
- [ ] 38. Tester le transfert avec plusieurs formulations
- [ ] 39. Prévoir un message de repli si personne ne décroche
- [ ] (à prévoir aussi, mentionné par le fondateur) demande de rappel + notification associée

## Sprint 14 — Polish et répétition

**Objectif :** une démo fluide, sans accroc, prête à présenter.
**Livrable visible :** un test complet filmé, sans bug, répété deux fois.
**Statut :** à venir, après tous les sprints précédents.
**Dépendances :** tous les sprints précédents.
**Critères de validation :** deux répétitions complètes réussies devant un public test.

- [ ] 40. Lister les cas d'erreur possibles
- [ ] 41. Ajouter une réponse de repli pour chaque cas
- [ ] 42. Réduire la latence perçue si nécessaire
- [ ] 43. Écrire le script de présentation de la démo
- [ ] 44. Faire un premier test complet filmé
- [ ] 45. Corriger les derniers problèmes identifiés
- [ ] 46. Refaire un second test complet sans accroc

---

Rappel valable pour toute tâche ajoutée à cette roadmap : penser l'architecture pour des dizaines puis des centaines d'entreprises, jamais seulement pour Barber Concept (voir `docs/architecture.md`).
