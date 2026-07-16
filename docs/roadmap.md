# Roadmap — Plateforme SaaS multi-entreprises

Source de vérité du périmètre. Toute tâche non listée ici est hors scope sauf validation explicite du fondateur.

## Pivot stratégique (2026-07-16)

Jusqu'ici, le projet visait uniquement un prototype de démonstration pour Barber Concept (MVP 1). À partir de maintenant, l'objectif est de construire une véritable plateforme SaaS B2B destinée à accueillir de nombreuses PME (salons de coiffure, restaurants, cabinets dentaires, cliniques, garages, instituts, cabinets médicaux, etc.), Barber Concept restant le client pilote mais plus la cible finale unique. Voir `docs/architecture.md` (section « Principe directeur ») pour la conséquence sur chaque décision technique.

Conséquence directe sur les priorités : le transfert humain (ancien Sprint 5) est repoussé — il reste une fonctionnalité prévue, mais la priorité immédiate devient le **Dashboard Administrateur**, cœur opérationnel de la plateforme SaaS.

## Vue d'ensemble — roadmap officielle

| Sprint | Contenu | Statut |
|---|---|---|
| 1 | Assistant vocal | ✅ terminé |
| 2 | Google Calendar | ✅ terminé |
| 3 | Réservation intelligente | ✅ terminé |
| 4 | SMS de confirmation + Backend Render | ✅ terminé |
| 5 | **Dashboard Administrateur** (plateforme) | nouvelle priorité — en cadrage |
| 6 | Dashboard Client | à venir |
| 7 | Intégration Get Time | reporté (dépend de la présentation officielle à Henok) |
| 8 | Transfert vers un humain | reporté, toujours prévu |
| 9 | Polish et répétition | à venir |

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
**Statut :** cadrage et conception en cours (voir plan de conception dédié dans `docs/sprint-log.md` avant tout développement massif).
**Dépendances :** Sprints 1-4 (le backend Twilio/Vapi/Calendar/SMS existant devient la première ressource gérée par ce dashboard).
**Critères de validation :** démonstration en moins de 30 secondes de l'état de toute la plateforme ; capacité réelle à créer/gérer une entreprise depuis l'interface.

**Contenu prévu** (détail exact et découpage en tâches définis à l'issue de la phase de conception) :
- créer une nouvelle entreprise, la supprimer
- gérer les numéros Twilio
- gérer les assistants Vapi
- gérer les calendriers
- suivre les coûts techniques (Vapi, Twilio, Anthropic...)
- statistiques globales de la plateforme
- suivi des appels de tous les clients
- gestion des abonnements
- gestion des utilisateurs
- déploiement facilité d'un nouveau client

**Implication d'architecture majeure :** ce dashboard a besoin d'un vrai stockage relationnel (entreprises, établissements, utilisateurs, abonnements...) — la base de données PostgreSQL, jusqu'ici prévue pour "MVP 3+", devient donc nécessaire dès ce sprint. Voir `docs/architecture.md`.

## Sprint 6 — Dashboard Client

**Objectif :** donner à chaque entreprise cliente (ex. Barber Concept) son propre espace, avec un rendu premium (niveau Stripe/Linear/Vercel/Notion).
**Statut :** à venir, après le Dashboard Administrateur.
**Dépendances :** Sprint 5 (réutilise le même modèle de données et la même architecture frontend).
**Critères de validation :** Henok doit avoir l'impression d'utiliser un logiciel premium dès l'ouverture.

**Contenu prévu** (détail exact défini à l'issue de la phase de conception) :
- appels du jour, appels manqués
- rendez-vous créés
- calendrier
- statistiques et performance de l'IA
- historique des conversations
- paramètres de l'entreprise, gestion des horaires
- vue consolidée multi-établissements (6 salons Barber Concept) + filtre par salon + comparaison entre salons
- emplacement prévu pour les futurs modules Get Time

## Sprint 7 — Intégration Get Time

**Objectif :** connecter l'agenda réel Get Time de Barber Concept, en remplacement du Google Calendar de démonstration.
**Statut :** volontairement reporté — le projet n'a pas encore été présenté officiellement à Henok, donc pas de dépendance à Get Time pour l'instant.
**Dépendances :** Sprint 6 (les dashboards doivent fonctionner sans Get Time ; l'intégration vient s'y brancher).
**Contrainte de conception :** le code des Sprints 5-6 doit déjà prévoir cette intégration (interface remplaçable), sans la construire maintenant.

## Sprint 8 — Transfert vers un humain

**Objectif :** l'agent transfère l'appel à un vrai numéro si nécessaire.
**Livrable visible :** demande de transfert → appel transféré.
**Statut :** reporté (déprioritisé au profit des dashboards) mais toujours prévu.
**Dépendances :** Sprint 3.
**Critères de validation :** transfert réussi testé avec 3 formulations différentes.

- [ ] 35. Définir le numéro humain de secours
- [ ] 36. Ajouter la détection d'une demande de transfert dans le prompt
- [ ] 37. Configurer la fonction de transfert d'appel
- [ ] 38. Tester le transfert avec plusieurs formulations
- [ ] 39. Prévoir un message de repli si personne ne décroche
- [ ] (à prévoir aussi, mentionné par le fondateur) demande de rappel + notification associée

## Sprint 9 — Polish et répétition

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

## Vers la version production — infrastructure toujours active

Cette section n'est pas rattachée à un sprint précis : elle documente une décision d'architecture déjà actée (voir `docs/architecture.md`, section « Décision d'architecture — Hébergement »), déclenchée par l'arrivée des premiers clients payants plutôt que par l'avancement des sprints ci-dessus.

**Déclencheur :** premier client payant (au-delà de la démo pilote Barber Concept).

- [ ] 47. Migrer le backend vers une infrastructure toujours active (Render Starter ou hébergeur équivalent) — objectifs : aucune mise en veille, aucune latence au premier appel, disponibilité 24h/24, fiable pour plusieurs entreprises simultanément.
- [ ] 48. Supprimer le mécanisme de keep-alive (`src/server.js`) devenu inutile une fois l'infrastructure toujours active en place.
- [ ] 49. Revalider par un vrai appel de bout en bout (réservation + SMS) que la migration n'a rien cassé.

Rappel valable pour toute tâche ajoutée à cette roadmap : penser l'architecture pour des dizaines puis des centaines d'entreprises, jamais seulement pour Barber Concept (voir `docs/architecture.md`).
