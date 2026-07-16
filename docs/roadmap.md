# Roadmap — Prototype de démo (MVP 1)

Source de vérité du périmètre. Toute tâche non listée ici est hors scope du MVP 1 sauf validation explicite du fondateur.

## Sprint 0 — Fondations techniques
**Objectif :** avoir tous les outils prêts et un numéro qui décroche, sans encore aucune intelligence.
**Livrable visible :** un numéro de téléphone qu'on appelle et qui répond par un message automatique de test.
**Dépendances :** aucune.
**Critères de validation :** appel réel depuis un téléphone → une voix répond.

- [ ] 1. Créer un compte Twilio et vérifier l'identité
- [ ] 2. Réserver un numéro de téléphone de test
- [ ] 3. Créer un compte Vapi
- [ ] 4. Créer un compte Anthropic (API Claude) et générer une clé API
- [x] 5. Créer un compte d'hébergement (Render ou Railway)
- [x] 6. Initialiser le projet de code (dossier + dépôt Git vide)
- [ ] 7. Connecter le numéro Twilio à Vapi (sans logique encore)
- [ ] 8. Appeler le numéro et vérifier qu'un message automatique par défaut répond

## Sprint 1 — Conversation IA basique
**Objectif :** l'agent comprend une question simple et répond intelligemment, en français.
**Livrable visible :** on pose une question à l'oral, l'IA répond correctement.
**Dépendances :** Sprint 0.
**Critères de validation :** 5 questions simples posées à voix haute → réponses cohérentes.

- [ ] 9. Connecter la clé API Claude dans Vapi
- [ ] 10. Écrire un premier prompt système simple
- [ ] 11. Tester une question ouverte, vérifier une réponse cohérente
- [ ] 12. Choisir et régler la voix française
- [ ] 13. Mesurer le temps de réponse et ajuster si trop lent
- [ ] 14. Lister les 5 premières questions FAQ à tester

## Sprint 2 — FAQ complètes de Barber Concept
**Objectif :** l'agent connaît par cœur les vraies infos des 4 salons.
**Livrable visible :** démo orale robuste sur les questions fréquentes.
**Dépendances :** Sprint 1 + contenu réel (à réunir par le fondateur).
**Critères de validation :** 15-20 questions variées testées, taux de bonnes réponses élevé.

- [ ] 15. Réunir les horaires des 4 salons
- [ ] 16. Réunir la liste des services et des prix
- [ ] 17. Lister les questions fréquentes types des clients
- [ ] 18. Intégrer ces infos dans le prompt système
- [ ] 19. Tester 10 questions et noter les échecs
- [ ] 20. Corriger le prompt pour les questions ratées
- [ ] 21. Ajouter une règle stricte "je ne sais pas" (anti-invention)

## Sprint 3 — Agenda et prise de rendez-vous
**Objectif :** l'agent consulte un agenda de démo et y inscrit un vrai rendez-vous.
**Livrable visible :** appel de bout en bout → le RDV apparaît dans Google Calendar.
**Dépendances :** Sprint 2.
**Critères de validation :** RDV pris par téléphone, vérifié dans le calendrier avec les bonnes infos.

- [ ] 22. Créer un Google Calendar de démonstration dédié
- [ ] 23. Créer des créneaux de disponibilité types
- [ ] 24. Connecter l'API Google Calendar au backend
- [ ] 25. Construire la fonction "chercher un créneau disponible"
- [ ] 26. Construire la fonction "créer un rendez-vous"
- [ ] 27. Relier ces fonctions à la conversation
- [ ] 28. Tester un appel complet de prise de RDV
- [ ] 29. Vérifier le RDV dans Google Calendar

## Sprint 4 — SMS de confirmation
**Objectif :** un SMS part automatiquement après la prise de RDV.
**Livrable visible :** réception d'un vrai SMS après un appel test.
**Dépendances :** Sprint 3.
**Critères de validation :** SMS reçu en moins de 30 secondes, contenu correct.

- [x] 30. Activer l'envoi de SMS sur le compte Twilio
- [x] 31. Écrire le modèle du message de confirmation
- [x] 32. Construire la fonction qui déclenche le SMS après création du RDV
- [x] 33. Tester la réception du SMS après un appel (validé en `/chat` avec exécution réelle des outils ; un vrai appel téléphonique reste recommandé avant la démo finale)
- [x] 34. Ajuster la formulation si besoin (aucun ajustement nécessaire, formulation déjà validée)

## Sprint 5 — Transfert vers un humain
**Objectif :** l'agent transfère l'appel à un vrai numéro si nécessaire.
**Livrable visible :** demande de transfert → appel transféré.
**Dépendances :** Sprint 3.
**Critères de validation :** transfert réussi testé avec 3 formulations différentes.

- [ ] 35. Définir le numéro humain de secours
- [ ] 36. Ajouter la détection d'une demande de transfert dans le prompt
- [ ] 37. Configurer la fonction de transfert d'appel
- [ ] 38. Tester le transfert avec plusieurs formulations
- [ ] 39. Prévoir un message de repli si personne ne décroche

## Sprint 6 — Polish et répétition
**Objectif :** une démo fluide, sans accroc, prête à présenter.
**Livrable visible :** un test complet filmé, sans bug, répété deux fois.
**Dépendances :** tous les sprints précédents.
**Critères de validation :** deux répétitions complètes réussies devant un public test.

- [ ] 40. Lister les cas d'erreur possibles
- [ ] 41. Ajouter une réponse de repli pour chaque cas
- [ ] 42. Réduire la latence perçue si nécessaire
- [ ] 43. Écrire le script de présentation de la démo
- [ ] 44. Faire un premier test complet filmé
- [ ] 45. Corriger les derniers problèmes identifiés
- [ ] 46. Refaire un second test complet sans accroc
