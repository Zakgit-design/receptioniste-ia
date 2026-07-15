# Architecture technique — référence pour l'implémentation

Version condensée pour le développement. Document stratégique complet disponible séparément (vision, business model) — ce fichier ne garde que ce qui sert à coder.

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

## Modules concernés par le MVP 1

- Agent IA réceptionniste (configuration : voix, ton, langue, script)
- Agenda & disponibilités (via Google Calendar)
- Prise de rendez-vous
- SMS de confirmation
- Transfert d'appel vers un humain

Modules hors périmètre du MVP 1 (voir roadmap pour la suite) : gestion multi-entreprises, authentification, facturation, dashboard, base de données relationnelle, API publique.

## Convention pour les tâches futures (MVP 3+)

Quand la base de données PostgreSQL sera introduite, les tables suivront ce découpage (déjà validé, ne pas le redessiner) : Entreprises, Établissements, Utilisateurs, Agents IA, Services, Disponibilités, Rendez-vous, Clients finaux, Appels, Conversations, Intégrations, Abonnements, Factures, Notifications.
