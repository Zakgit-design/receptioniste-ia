# Architecture technique — référence pour l'implémentation

Version condensée pour le développement. Document stratégique complet disponible séparément (vision, business model) — ce fichier ne garde que ce qui sert à coder.

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

## Stack (MVP 1 — prototype de démo)

| Couche | Techno | Rôle |
|---|---|---|
| Téléphonie | Twilio | Reçoit l'appel, envoie les SMS |
| Orchestration voix | Vapi | Reconnaissance vocale + synthèse vocale + gestion temps réel |
| Intelligence | Claude (API Anthropic) | Comprend la demande, décide de l'action |
| Backend | Node.js | Logique métier, relie Vapi à l'agenda et aux SMS |
| Agenda (démo) | Google Calendar API | Créneaux disponibles + création de RDV |
| Hébergement | Render ou Railway | Fait tourner le backend |

Pas de base de données PostgreSQL ni de dashboard au stade du MVP 1 — l'agenda Google Calendar suffit comme mémoire pour la démo. Ces briques arrivent à partir du MVP 3 (voir `docs/roadmap.md`).

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

## Modules concernés par le MVP 1

- Agent IA réceptionniste (configuration : voix, ton, langue, script)
- Agenda & disponibilités (via Google Calendar)
- Prise de rendez-vous
- SMS de confirmation
- Transfert d'appel vers un humain

Modules hors périmètre du MVP 1 (voir roadmap pour la suite) : gestion multi-entreprises, authentification, facturation, dashboard, base de données relationnelle, API publique.

## Convention pour les tâches futures (MVP 3+)

Quand la base de données PostgreSQL sera introduite, les tables suivront ce découpage (déjà validé, ne pas le redessiner) : Entreprises, Établissements, Utilisateurs, Agents IA, Services, Disponibilités, Rendez-vous, Clients finaux, Appels, Conversations, Intégrations, Abonnements, Factures, Notifications.
