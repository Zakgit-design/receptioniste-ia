# Architecture technique — référence pour l'implémentation

Version condensée pour le développement. Document stratégique complet disponible séparément (vision, business model) — ce fichier ne garde que ce qui sert à coder.

**Pivot du 2026-07-16 :** le projet n'est plus seulement un prototype de démo pour Barber Concept — c'est désormais une plateforme SaaS B2B multi-entreprises, avec Barber Concept comme client pilote. Voir `docs/roadmap.md` pour le détail des sprints (le Dashboard Administrateur, Sprint 5, devient la priorité immédiate).

## Principe directeur : conçu pour plusieurs entreprises, pas seulement Barber Concept

Barber Concept est le client pilote, pas la cible finale. La plateforme vise des dizaines puis des centaines d'entreprises (barbiers, restaurants, cabinets dentaires, cliniques, garages, etc.), chacune avec son propre agent IA, son propre numéro, son propre agenda.

Conséquence pour chaque décision technique : ne jamais optimiser uniquement pour le cas Barber Concept. Un choix d'architecture doit favoriser la scalabilité, la simplicité de maintenance, et la possibilité d'ajouter un nouveau client sans modifier le code existant. Certaines simplifications du MVP 1 (ex. un seul agenda partagé pour tous les salons) restent acceptées pour l'instant car explicitement scopées à la démo — mais toute décision qui engage l'architecture au-delà de la démo (hébergement, base de données, intégrations) doit être pensée multi-clients dès le départ, comme ci-dessous pour l'hébergement.

## Schéma du flux d'appel

```
 CLIENT (téléphone) -> TÉLÉPHONIE (Twilio) -> VAPI (voix <-> texte) -> CLAUDE (comprend, décide)
                                                                              |
                                                                              v
                                                                      BACKEND (Node.js)
                                                                        |          |
                                                                        v          v
                                                          BASE DE DONNÉES     GOOGLE CALENDAR
                                                            (PostgreSQL)      (agenda démo)
                                                                        |
                                                                        v
                                                                  SMS (Twilio)
```

## Stack (téléphonie et voix — Sprints 1-4, terminés)

| Couche | Techno | Rôle |
|---|---|---|
| Téléphonie | Twilio | Reçoit l'appel, envoie les SMS |
| Orchestration voix | Vapi | Reconnaissance vocale + synthèse vocale + gestion temps réel |
| Intelligence | Claude (API Anthropic) | Comprend la demande, décide de l'action |
| Backend | Node.js | Logique métier, relie Vapi à l'agenda et aux SMS |
| Agenda (démo) | Google Calendar API | Créneaux disponibles + création de RDV |
| Hébergement | Render (plan gratuit + keep-alive, temporaire — voir décision ci-dessous) | Fait tourner le backend |

**Mise à jour du 2026-07-16 :** la base de données PostgreSQL, jusqu'ici prévue pour "MVP 3+", devient nécessaire dès le Sprint 5 (Dashboard Administrateur) — un dashboard multi-entreprises ne peut pas fonctionner sur Google Calendar seul comme mémoire. Voir « Convention pour les tâches futures » ci-dessous pour le découpage de tables déjà validé, et le plan de conception du Sprint 5 (`docs/sprint-log.md`) pour le détail technique retenu.

## Décision d'architecture — Hébergement

**État actuel :** le backend tourne sur Render (plan gratuit), uniquement pour le développement et les démonstrations.

**Limite connue de ce plan :** le service se met en veille après une période d'inactivité, ce qui provoque un délai de démarrage à froid (« cold start ») pénalisant pour l'expérience utilisateur — concrètement, ce délai a fait échouer l'envoi du SMS de confirmation lors d'un vrai appel test (voir `docs/sprint-log.md`, Sprint 4). Un keep-alive (ping périodique du backend vers lui-même) a été mis en place comme **solution de contournement temporaire** pour éviter cette mise en veille pendant la phase de démonstration.

**Vision production :** dès les premiers clients payants, cette solution de contournement sera abandonnée. Le backend de production devra tourner sur une infrastructure toujours active (Render Starter ou équivalent chez un autre hébergeur), avec ces objectifs :
- aucune mise en veille du backend ;
- aucune latence au premier appel ;
- disponibilité 24h/24 ;
- infrastructure fiable pour plusieurs entreprises simultanément ;
- architecture évolutive (multi-tenant), pour accueillir de nouvelles entreprises sans changement de code.

**Action à prévoir :** supprimer le mécanisme de keep-alive dès que le backend est migré vers une infrastructure toujours active — il devient inutile et n'a plus de raison d'être maintenu.

## Décision d'architecture — Authentification (Clerk, isolé derrière une couche remplaçable)

**Décision du 2026-07-16 (fondateur) :** l'authentification du Dashboard Administrateur (puis du Dashboard Client) utilise **Clerk** (service géré), mais jamais appelé directement par le reste du code — toujours à travers une couche d'abstraction interne, remplaçable.

**Ce que Clerk gère (et seulement ça) :** identité (connexion/inscription), sessions, invitations, organisations, rôles.

**Ce que Clerk NE gère PAS :** toute donnée métier (entreprises, établissements, rendez-vous, appels, abonnements, factures, etc.) reste exclusivement dans notre base PostgreSQL — jamais dans Clerk.

**Mécanisme d'isolation :**
- Une couche d'abstraction unique (ex. `src/auth/`) expose les seules fonctions dont le reste du produit a besoin (utilisateur courant, son rôle, son entreprise, inviter un utilisateur, lister les membres...). Aucun autre fichier n'importe le SDK Clerk directement — seule cette couche connaît Clerk.
- La table `Utilisateurs` (modèle de données ci-dessous) stocke une copie légère de chaque utilisateur Clerk (identifiant Clerk, email, nom, rôle, entreprise associée), synchronisée via les webhooks Clerk (création/mise à jour d'utilisateur, changement de rôle, invitation acceptée...). Le reste de l'application lit cette table pour toute décision métier — jamais l'API Clerk en direct.
- Mapping direct : une **Entreprise** (notre modèle) correspond à une **Organisation** Clerk ; les rôles internes (admin plateforme, propriétaire d'entreprise, employé...) correspondent aux rôles Clerk au sein de cette organisation.

**Stratégie de migration future vers une solution auto-hébergée (sans réécriture majeure) :** comme les données métier, les entreprises et les rôles sont déjà répliqués dans notre propre base, une migration future se limite à : (1) écrire un nouvel adaptateur derrière la même couche d'abstraction (ex. Keycloak ou solution interne), (2) migrer les comptes utilisateurs (email comme identifiant stable, réinitialisation de mot de passe ou pont SSO), (3) rebrancher l'adaptateur et rejouer la synchronisation. Le reste du produit ne change pas, puisqu'il n'a jamais dépendu de Clerk directement.

## Modules par phase

**Téléphonie et voix (Sprints 1-4, terminés) :**
- Agent IA réceptionniste (configuration : voix, ton, langue, script)
- Agenda & disponibilités (via Google Calendar)
- Prise de rendez-vous
- SMS de confirmation

**Plateforme SaaS (Sprints 5-7, priorité actuelle) :**
- Dashboard Administrateur (gestion des entreprises, numéros, assistants, calendriers, coûts, abonnements, utilisateurs — voir `docs/roadmap.md`)
- Dashboard Client (par entreprise, ex. Barber Concept)
- Base de données relationnelle (PostgreSQL, voir découpage de tables ci-dessous)
- Authentification et rôles : Clerk, isolé derrière une couche remplaçable (voir décision ci-dessus)
- Intégration Get Time (reportée, Sprint 7)

**Reporté, toujours prévu :**
- Transfert d'appel vers un humain (Sprint 8)

Hors périmètre pour l'instant : facturation réelle (paiement), API publique, white-label complet.

## Modèle de données — PostgreSQL (Sprint 5)

Détail issu de la phase de conception du Sprint 5 (2026-07-16, complété le même jour après la conception UX du centre d'actions). 17 tables, toutes rattachées à `entreprises` directement ou indirectement (isolation multi-tenant par clé étrangère, pas de schéma séparé par client — trop lourd à opérer pour des dizaines/centaines de clients).

| Table | Rôle | Colonnes clés | Relations |
|---|---|---|---|
| `entreprises` | Une entreprise cliente (ex. Barber Concept) | `id`, `nom`, `secteur`, `statut` (essai/actif/suspendu/résilié), `email_contact`, `telephone_contact`, `clerk_organization_id`, `plan_id`, `created_at` | 1—N vers presque toutes les autres tables |
| `etablissements` | Un lieu physique d'une entreprise (ex. salon Cornavin) | `id`, `entreprise_id`, `nom`, `adresse`, `fuseau_horaire`, `google_calendar_id`, `created_at` | N—1 `entreprises` |
| `utilisateurs` | Copie légère d'un utilisateur Clerk (voir décision Authentification ci-dessus) | `id`, `clerk_user_id` (unique), `email`, `nom`, `role` (admin_plateforme/proprietaire/employe), `entreprise_id` (null si admin plateforme), `created_at` | N—1 `entreprises` ; synchronisé par webhook Clerk, jamais écrit depuis le reste du produit. MVP : modèle d'invitation directe uniquement (un admin/propriétaire invite, pas de demande d'accès autonome — voir décision Utilisateurs ci-dessous) |
| `agents_ia` | Un assistant Vapi configuré pour un établissement | `id`, `entreprise_id`, `etablissement_id`, `vapi_assistant_id`, `numero_twilio`, `statut` (actif/inactif), `config_voix` (jsonb), `created_at` | N—1 `etablissements` |
| `services` | Une prestation proposée (coupe, détartrage, table...) | `id`, `entreprise_id`, `nom`, `duree_minutes`, `prix`, `description` | N—1 `entreprises` |
| `disponibilites` | Gabarit hebdomadaire récurrent d'ouverture | `id`, `etablissement_id`, `jour_semaine`, `heure_debut`, `heure_fin` | N—1 `etablissements` ; les créneaux réels restent gérés par Google Calendar, cette table ne sert qu'à afficher/éditer le gabarit dans le dashboard |
| `rendez_vous` | Un rendez-vous pris par un client final | `id`, `etablissement_id`, `service_id`, `client_final_id`, `google_calendar_event_id`, `debut`, `duree_minutes`, `statut` (confirmé/annulé/terminé/absent), `created_at` | N—1 `etablissements`, `services`, `clients_finaux` |
| `clients_finaux` | Le client d'une entreprise cliente (ex. un client de Barber Concept) | `id`, `entreprise_id`, `telephone`, `nom`, `notes`, `created_at` | N—1 `entreprises` ; à ne pas confondre avec `utilisateurs` (personnel de l'entreprise) |
| `appels` | Un appel téléphonique reçu | `id`, `agent_ia_id`, `vapi_call_id`, `telephone_appelant`, `debut`, `fin`, `duree_secondes`, `statut` (terminé/échoué/transféré), `cout_detail` (jsonb — répartition Vapi/Twilio/Anthropic renvoyée par Vapi), `url_enregistrement`, `rendez_vous_id` (nullable — le RDV créé par cet appel, si applicable), `sms_envoye` (booléen), `outils_utilises` (jsonb — liste des outils Vapi déclenchés et leur résultat), `erreurs` (jsonb, nullable), `created_at` | N—1 `agents_ia` ; N—0..1 `rendez_vous` |
| `conversations` | Le contenu d'un appel (transcript, résumé) | `id`, `appel_id`, `transcript` (jsonb), `resume`, `structured_outputs` (jsonb), `created_at` | 1—1 `appels` |
| `integrations` | Une connexion externe active pour une entreprise | `id`, `entreprise_id`, `type` (google_calendar/get_time/...), `config` (jsonb), `statut` (connecté/déconnecté/erreur), `connected_at` | N—1 `entreprises` ; c'est ici que vit l'« interface remplaçable » prévue pour Get Time (Sprint 7) |
| `abonnements` | Le plan payant d'une entreprise | `id`, `entreprise_id`, `nom_plan`, `prix`, `cycle_facturation`, `statut` (actif/impayé/résilié), `stripe_subscription_id` (nullable, hors périmètre facturation réelle pour l'instant), `fin_periode_courante`, `created_at` | 1—1 `entreprises` ; page globale "Abonnements" différée à l'intégration Stripe, seul l'onglet par entreprise existe pour l'instant (voir `docs/sprint5-conception.md`) |
| `factures` | Une facture émise | `id`, `abonnement_id`, `montant`, `statut` (payée/en attente/échouée), `emise_le`, `payee_le`, `stripe_invoice_id` (nullable) | N—1 `abonnements` |
| `notifications` | Une notification interne simple (ex. invitation envoyée, rappel) | `id`, `utilisateur_id` (nullable), `entreprise_id` (nullable), `type`, `message`, `lu_le`, `created_at` | N—1 `utilisateurs`/`entreprises` ; à ne pas confondre avec `actions_requises` (voir ci-dessous), qui porte le centre d'actions |
| `evenements_sante` | Une mesure de santé d'un service (technique, plateforme ou par entreprise) | `id`, `service` (render/twilio/vapi/anthropic/google_calendar/base_de_donnees/webhooks), `entreprise_id` (nullable — vide si c'est un événement plateforme globale), `statut` (ok/degrade/echec), `latence_ms` (nullable), `detail` (jsonb), `created_at` | N—1 `entreprises` (optionnel) ; **source de vérité unique** pour la santé par entreprise ET pour la page Santé plateforme — les deux écrans lisent la même table, agrégée différemment (par entreprise vs par service) |
| `actions_requises` | Un item du centre d'actions (Vue d'ensemble) | `id`, `type` (technique/business/securite), `gravite` (critique/a_surveiller), `titre`, `description`, `entreprise_id` (nullable), `action_recommandee` (libellé + lien), `statut` (nouveau/traite/ignore/resolu_automatiquement), `resolu_le` (nullable), `created_at` | N—1 `entreprises` (optionnel) ; alimentée par plusieurs déclencheurs (santé, cycle de vie des abonnements, invitations) — voir `docs/sprint5-conception.md` |
| `couts_fixes_plateforme` | Un coût fixe d'infrastructure, non attribuable à une entreprise précise | `id`, `fournisseur` (ex. Render), `montant_mensuel`, `devise`, `actif_depuis` | Aucune — volontairement hors du périmètre `entreprise_id`, pour ne pas répartir artificiellement un coût fixe entre clients (voir Finances dans `docs/sprint5-conception.md`) |

**Notes de conception :**
- Isolation multi-tenant par colonne `entreprise_id` (directe ou via une table intermédiaire), pas par schéma Postgres séparé — plus simple à opérer et migrer à l'échelle de centaines de clients, au prix d'une vigilance stricte : chaque requête métier doit filtrer par `entreprise_id`, jamais l'inverse (interdiction de lister toutes les données tous clients confondus, sauf dans le Dashboard Administrateur explicitement).
- `appels.cout_detail` (jsonb) évite une table séparée par fournisseur : Vapi renvoie déjà une répartition de coût par appel (transport, transcription, LLM, synthèse) — on la stocke telle quelle plutôt que de la re-modéliser.
- Aucune table `roles`/`permissions` séparée : les rôles vivent dans Clerk (Organizations + Roles) et sont simplement recopiés dans `utilisateurs.role` pour les requêtes rapides côté dashboard.
- `evenements_sante` et `actions_requises` sont deux tables différentes et complémentaires : la première journalise des mesures brutes (« Twilio a répondu en 340ms, succès »), la seconde porte des décisions à prendre (« Twilio en échec répété → vérifier »). Un événement de santé dégradé peut déclencher la création d'une action requise, mais l'inverse n'a pas de sens.
- `actions_requises.statut = resolu_automatiquement` couvre le cas où la cause a disparu seule (ex. reconnexion Calendar redevenue saine) avant intervention humaine — évite l'accumulation d'items obsolètes dans le centre d'actions.
