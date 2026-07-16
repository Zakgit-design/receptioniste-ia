# Sprint 5 — Dashboard Administrateur : conception (version finale)

Produit le 2026-07-16, avant tout développement massif (voir `docs/sprint-log.md`). Ce document couvre le choix de stack, l'arborescence des écrans, le design system, le centre d'actions et les wireframes. Le modèle de données complet est dans `docs/architecture.md`.

## 1. Stack frontend

| Brique | Choix | Pourquoi |
|---|---|---|
| Framework | Next.js (App Router) | Un seul projet peut servir le Dashboard Administrateur (Sprint 5) et le Dashboard Client (Sprint 6) avec le même code de base |
| Langage | TypeScript | Le modèle de données a 17 tables liées entre elles — les types attrapent les erreurs de champ/relation avant l'exécution |
| Style | Tailwind CSS | Cohérent avec le design system ci-dessous (tokens = variables Tailwind) |
| Composants | shadcn/ui (basé sur Radix UI) | Composants copiés dans le projet, personnalisables à 100%, accessibles par défaut |
| Authentification | Clerk, isolé derrière une couche remplaçable | Décision actée séparément, voir `docs/architecture.md` |
| Base de données | PostgreSQL + Prisma (ORM) | Types générés directement depuis le schéma, migrations versionnées |
| Graphiques | Recharts | Suffisant pour les besoins du dashboard sans sur-ingénierie |
| Hébergement | Render (existant) | Migration vers infra toujours active au premier client payant (décision déjà actée) |

## 2. Le centre d'actions — cœur philosophique du dashboard

Décision du 2026-07-16 : le dashboard doit répondre en premier à « qu'est-ce qui nécessite mon intervention aujourd'hui », pas seulement afficher des données. Le centre d'actions est la section principale, en haut de la Vue d'ensemble — avant toute statistique.

**Structure d'un item** (table `actions_requises`, voir `docs/architecture.md`) :
- `type` : technique / business / sécurité
- `gravité` : critique / à surveiller
- `entreprise concernée` (optionnel — certains items sont plateforme globale)
- `action recommandée` : un verbe + un lien qui fait réellement quelque chose (ou qui explique quoi faire quand l'action ne peut pas être automatisée — ex. reconnexion Google Calendar, qui passe par le dashboard Vapi, pas par notre interface)
- `état` : nouveau / traité / ignoré / résolu automatiquement

**Cycle de vie — le point le plus important :** un item ne doit jamais s'accumuler indéfiniment, sinon le centre d'actions perd sa valeur (comme une boîte mail jamais vidée). Trois façons de sortir de l'état "nouveau" : le Super Admin le marque traité, il l'ignore explicitement, ou la cause disparaît d'elle-même et il passe en résolu automatiquement.

**Sources qui alimentent la table** (extensible, toutes les sources ne sont pas branchées dès le Sprint 5) :
- `evenements_sante` dégradé/échec de manière répétée → item technique
- Abonnement en essai à J-3 de l'expiration → item business (nécessite `entreprises.email_contact`/`telephone_contact`, ajoutés au modèle)
- Paiement échoué → item business, **différé** : pas actionnable avant l'intégration Stripe
- Invitation utilisateur → **pas un item du centre d'actions au MVP** : le modèle retenu est l'invitation directe (le Super Admin ou le propriétaire d'entreprise invite, la personne rejoint dès qu'elle accepte — pas de demande d'accès autonome à valider). Une demande d'accès autonome reste possible plus tard, elle générerait alors un vrai item à ce moment-là.

**Où il vit :** section héro de la Vue d'ensemble (pas une page séparée, pour éviter d'avoir à naviguer pour voir "ce qui a besoin de moi"), plus un badge de compteur persistant visible depuis tout écran.

## 3. Arborescence des écrans — Dashboard Administrateur

```
/login                         (Clerk — écran géré, pas de développement custom)
/                               Vue d'ensemble
  ├─ Centre d'actions           (section héro, en haut)
  ├─ Statistiques clés
  ├─ Derniers appels            (terminés, cliquables — remplace "lignes en direct")
  └─ Graphique 14 jours         (après le centre d'actions et les stats, pas avant)
/entreprises                    Liste des entreprises clientes
  └─ filtre "Nécessite une attention" (santé dégradée/incident en premier)
/entreprises/nouvelle           Création d'une entreprise (assistant en étapes)
/entreprises/[id]               Détail d'une entreprise (onglet par défaut : Vue d'ensemble)
  ├─ Vue d'ensemble             (par défaut à l'ouverture — inclut la rentabilité de cette entreprise)
  ├─ Établissements
  ├─ Numéros & assistants       (Twilio + Vapi)
  ├─ Calendriers                (Google Calendar, futur Get Time)
  ├─ Appels                     (filtré sur cette entreprise)
  ├─ Abonnement                 (plan, statut — page globale différée, voir point 6)
  └─ Utilisateurs               (membres de l'organisation Clerk)
/appels                         Historique consolidé, toutes entreprises, filtre "Échecs / à traiter"
  └─ [id] en panneau latéral (drawer), pas une page séparée — timeline de l'appel
/finances                       Coûts fixes + variables, revenus estimés, marge brute (renommé depuis /couts)
/sante-plateforme               État en temps réel des services critiques (nouveau)
/utilisateurs                   Admins plateforme + accès par entreprise
```

Changements par rapport à la première version : suppression de "lignes en direct" (remplacé), fiche appel en drawer plutôt qu'en page, page globale Abonnements retirée du MVP, ajout de Santé plateforme, Coûts renommé Finances.

## 4. Design system — nom de code « Standard »

Inchangé, toujours d'actualité : un poste de contrôle (« standard téléphonique »), pas un tableau de bord générique — voir la maquette pour le détail (couleurs, typographies Plus Jakarta Sans/IBM Plex Mono, palette de coûts validée par script d'accessibilité).

Une cohérence supplémentaire à noter : le centre d'actions renforce cette identité plutôt que de la contredire — réagir à des signaux (sonnerie, voyant rouge) est exactement le métier d'un standard téléphonique.

## 5. Finances (renommé depuis Coûts)

Distinction à quatre niveaux, dans cet ordre de lecture :
1. **Marge brute plateforme** (chiffre hero, tout en haut, avant tout tableau)
2. **Coûts fixes de plateforme** (Render, futurs abonnements techniques — table `couts_fixes_plateforme`, non attribués à une entreprise précise pour ne pas fausser la marge individuelle)
3. **Coûts variables par entreprise** (Vapi/Twilio/Anthropic, déjà dans `appels.cout_detail`)
4. **Revenus estimés et marge par entreprise**, triés par défaut du moins rentable au plus rentable

Toute valeur non issue d'un paiement vérifié (donc tout, tant que Stripe n'est pas intégré) porte une mention explicite "estimé — basé sur le plan déclaré".

## 6. Abonnements — page globale différée

Concept conservé et distinct de Finances (ne pas fusionner — une fois Stripe intégré, factures/moyens de paiement/upgrades/remboursements/TVA n'ont rien à voir avec l'analyse de rentabilité). Mais la page globale `/abonnements` n'est pas construite au Sprint 5 : sans Stripe, elle serait presque vide, ce qui donnerait une impression de produit inachevé. Seul l'onglet "Abonnement" par entreprise existe pour l'instant (plan, statut). La page globale sera construite quand l'intégration Stripe lui donnera du contenu réel.

## 7. Santé — une seule source de vérité

`evenements_sante` (voir `docs/architecture.md`) alimente à la fois :
- la colonne Santé de la liste Entreprises (agrégée par `entreprise_id`)
- la page Santé plateforme (agrégée par `service`, tous clients confondus)

Un incident plateforme (ex. Vapi en panne) doit pouvoir être relié depuis la page Santé plateforme vers la liste des entreprises impactées, plutôt que de laisser deviner la corrélation.

Statut calculé et mis en cache (vérification en tâche de fond), jamais recalculé en direct à l'ouverture d'une page — pour rester rapide et ne pas dépendre de la disponibilité de Twilio/Vapi/Google pour s'afficher.

## 8. Fiche appel (drawer)

Ouverture en panneau latéral (pas une page séparée) pour rester dans le contexte de la liste, avec une URL propre (partageable) quand même. Présentation en frise chronologique (décroché → vérification agenda → RDV créé → SMS envoyé → raccroché), pas un formulaire plat — plus le détail : entreprise, établissement, numéro, durée, coût, transcription, résumé IA, audio (avec gestion propre du cas "supprimé par la politique de rétention"), outils utilisés, RDV créé ou non, SMS envoyé ou non, erreurs techniques.

## 9. Wireframes

Maquette HTML navigable (cliquable, thème clair/sombre), mise à jour le 2026-07-16 pour refléter toutes les décisions ci-dessus : centre d'actions en haut de la Vue d'ensemble, "Derniers appels" à la place des lignes en direct, fiche appel en drawer, page Finances (marge + coûts fixes/variables), page Santé plateforme, navigation sans "Abonnements" global, filtre "Nécessite une attention" sur Entreprises.

→ Voir l'artefact publié dans la conversation pour la maquette interactive.

## 10. Prochaine étape

Conception validée par le fondateur le 2026-07-16. Développement séquencé par ordre de dépendance (voir `docs/roadmap.md`, tâches #50+) : modèle de données + centre d'actions d'abord, puis écran par écran. Aucune tâche P2 ne démarre avant que les écrans P1 soient fonctionnels, testés et documentés.
