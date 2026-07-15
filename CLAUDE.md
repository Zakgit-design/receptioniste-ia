# Réceptionniste IA — Contexte projet

## Vision
Plateforme SaaS d'agents IA téléphoniques pour petites entreprises. Premier produit : réceptionniste vocale IA. Client pilote : Barber Concept (Genève, 4 salons — Cornavin, Eaux-Vives, Jonction, Rive). Étape actuelle : un prototype de démonstration (MVP 1), pas encore une version multi-clients.

## Documents de référence
- `docs/architecture.md` — stack technique validée, modules, schéma de base de données
- `docs/roadmap.md` — sprints et tâches du MVP 1 (source de vérité du périmètre)
- `docs/sprint-log.md` — avancement réel, mis à jour au fil de l'eau

## Stack validée (ne pas en dévier sans le signaler explicitement)
Twilio (téléphonie + SMS) · Vapi (orchestration voix : reconnaissance + synthèse) · Claude/Anthropic (compréhension et décision) · Node.js (backend) · PostgreSQL (base de données) · Google Calendar (agenda de démonstration) · Next.js (dashboard, plus tard) · Render ou Railway (hébergement).

## Conventions de code
- Code simple, lisible, maintenable — c'est un prototype de démo, pas encore la plateforme finale. Pas de sur-ingénierie, pas d'abstraction pour des besoins hypothétiques.
- Pas de fonctionnalité en dehors du périmètre de la tâche assignée.
- Le fondateur (utilisateur) n'est pas développeur : toute explication technique doit rester simple et concrète.

## Organisation de travail
Trois rôles spécialisés, définis dans `.claude/agents/` :
- **product-manager** — cadre le périmètre, suit les sprints, ne code jamais (outils lecture seule)
- **fullstack-engineer** — implémente les tâches, respecte l'architecture validée
- **qa-engineer** — teste chaque livraison contre les critères de validation, ne corrige jamais (pas d'outils d'écriture)

Cadence : le PM cadre en début de sprint, l'ingénieur exécute tâche par tâche, le QA valide en fin de sprint avant de passer au suivant.
