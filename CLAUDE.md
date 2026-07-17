# Réceptionniste IA — Contexte projet

## Vision
Plateforme SaaS d'agents IA téléphoniques pour petites entreprises (salons, restaurants, cabinets dentaires, cliniques, garages, instituts, cabinets médicaux, etc.). Premier produit : réceptionniste vocale IA. Client pilote : Barber Concept (Suisse romande, 6 salons — Cornavin, Eaux-Vives, Jonction, Rive, Lausanne, Sion), pas la cible finale unique.

**Pivot du 2026-07-16 :** la partie vocale (téléphonie, agenda, SMS) est terminée pour Barber Concept. La priorité devient maintenant la construction de la plateforme SaaS multi-entreprises elle-même — Dashboard Administrateur puis Dashboard Client — pensée dès le départ pour des dizaines puis des centaines d'entreprises clientes, jamais seulement pour Barber Concept. Voir `docs/architecture.md` (« Principe directeur ») et `docs/roadmap.md` (structure complète des sprints).

## Documents de référence
- `docs/architecture.md` — stack technique validée, modules, schéma de base de données
- `docs/roadmap.md` — sprints et tâches (source de vérité du périmètre)
- `docs/sprint-log.md` — avancement réel, mis à jour au fil de l'eau

## Stack validée (ne pas en dévier sans le signaler explicitement)
Twilio (téléphonie + SMS) · Vapi (orchestration voix : reconnaissance + synthèse) · Claude/Anthropic (compréhension et décision) · Node.js (backend) · PostgreSQL (base de données) · Google Calendar (agenda de démonstration) · Next.js (dashboard, plus tard) · Render ou Railway (hébergement).

## Conventions de code
- Code simple, lisible, maintenable. Le pivot vers une plateforme SaaS multi-entreprises (voir Vision) ne change pas cette règle : penser multi-tenant dès la conception des données et de l'architecture, mais sans sur-ingénierie ni abstraction pour des besoins hypothétiques non encore rencontrés.
- Pas de fonctionnalité en dehors du périmètre de la tâche assignée.
- Le fondateur (utilisateur) n'est pas développeur : toute explication technique doit rester simple et concrète.

## Organisation de travail
Trois rôles spécialisés, définis dans `.claude/agents/` :
- **product-manager** — cadre le périmètre, suit les sprints, ne code jamais (outils lecture seule)
- **fullstack-engineer** — implémente les tâches, respecte l'architecture validée
- **qa-engineer** — teste chaque livraison contre les critères de validation, ne corrige jamais (pas d'outils d'écriture)

Cadence : le PM cadre en début de sprint, l'ingénieur exécute tâche par tâche, le QA valide en fin de sprint avant de passer au suivant.
