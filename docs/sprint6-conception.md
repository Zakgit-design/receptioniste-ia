# Sprint 6 — Dashboard Client : conception

Produit le 2026-07-16, avant développement (même méthode que `docs/sprint5-conception.md`). Périmètre cadré par le fondateur : espace sécurisé par entreprise cliente, en commençant par Barber Concept, réutilisant le design system et les composants du Dashboard Administrateur (Sprint 5), sur la même base Supabase/Prisma.

## 0. Deux décisions à valider avant de coder (le reste du document en dépend)

### 0.1 Écart trouvé : aucune entreprise n'est reliée à une Organisation Clerk

`docs/architecture.md` (section Authentification) prévoit qu'une **Entreprise = une Organisation Clerk** (`entreprises.clerk_organization_id`). Vérifié en base réelle : les 2 entreprises existantes (Barber Concept, MS Savané) ont `clerk_organization_id = null` — le formulaire "+ Nouvelle entreprise" (Sprint 5, tâche #59) ne crée qu'une ligne Postgres, jamais l'Organisation Clerk correspondante. C'était hors périmètre de cette tâche-là, mais **c'est un prérequis bloquant du Dashboard Client** : sans organisation Clerk liée, un utilisateur invité ne peut être rattaché à aucune entreprise.

**Proposition (à construire en premier, avant tout écran) :**
- `createEntreprise` (`entreprises/actions.ts`) crée désormais aussi l'Organisation Clerk (`clerkClient().organizations.createOrganization()`) dans la même action, et stocke son id dans `clerk_organization_id`.
- Backfill ponctuel pour les 2 entreprises déjà créées (Barber Concept, MS Savané) : créer leur Organisation Clerk et compléter la colonne — nécessaire pour pouvoir tester le Dashboard Client sur une vraie entreprise existante plutôt que d'en recréer une.

### 0.2 Rôles : 4 rôles métier vs. les 2 rôles Clerk actuels

Le modèle actuel (`RoleUtilisateur` : `admin_plateforme` / `proprietaire` / `employe`) ne distingue que 2 rôles côté organisation, recopiés directement des 2 rôles natifs de Clerk (`org:admin`/`org:member`). Le fondateur demande 4 rôles distincts pour le Dashboard Client : propriétaire, administrateur, responsable d'établissement, membre.

Clerk permet de créer jusqu'à 10 rôles personnalisés par organisation (Dashboard → Organizations → Roles & Permissions). C'est cohérent avec le principe déjà acté dans `docs/architecture.md` ("les rôles vivent dans Clerk, recopiés dans `utilisateurs.role`") — pas besoin de contourner Clerk, juste d'étendre ce qui existe déjà.

**Proposition :**
- Étendre l'enum `RoleUtilisateur` (schéma Prisma) à 5 valeurs : `admin_plateforme`, `proprietaire`, `administrateur`, `responsable_etablissement`, `membre`. Migration sans risque : 0 ligne `utilisateurs` en base actuellement (vérifié), aucune donnée à migrer.
- **Action fondateur requise (unique, non bloquante pour le code) :** créer les 4 rôles personnalisés dans Clerk (Dashboard → Organizations → Roles & Permissions) : `org:proprietaire`, `org:administrateur`, `org:responsable_etablissement`, `org:membre`. Même nature que les prérequis précédents (compte Clerk, compte Supabase) — je peux écrire tout le code qui en dépend (mapping, invitations, gardes de rôle) sans attendre, seul le test réel d'une invitation avec le nouveau rôle attend cette action.
- `src/auth/roles.ts` étendu en conséquence (mapping direct rôle interne ↔ rôle Clerk, sans table de permissions séparée — inchangé dans l'esprit).

**Portée du responsable d'établissement :** un responsable ne voit que le ou les établissements qui lui sont assignés (ex. le responsable du salon Cornavin ne voit pas Eaux-Vives). Ça n'existe dans aucune table aujourd'hui — nouvelle table `assignations_etablissement` (`utilisateur_id`, `etablissement_id`), many-to-many pour couvrir le cas d'un responsable sur plusieurs établissements.

## 1. Arborescence des écrans

Un seul projet Next.js (déjà le cas), nouveau groupe de routes `(client)` monté sous `/app` — pas de sous-segment `/app/[entrepriseId]/...` dans l'URL : l'entreprise n'est **jamais** un paramètre d'URL côté client, toujours dérivée côté serveur de la session active (`getCurrentUser().entrepriseId`). Voir section 4 (isolation).

```
/app                            Vue d'ensemble (entreprise de l'utilisateur connecté)
/app/appels                     Liste des appels de l'entreprise, drawer de détail (réutilisé du Sprint 5)
/app/rendez-vous                Rendez-vous créés par l'IA, prépare l'intégration Get Time
/app/etablissements             Liste des établissements (lecture seule — la création reste admin-only)
/app/equipe                     Membres de l'organisation, invitations, rôles
/app/parametres                 Coordonnées, préférences de notification, abonnement actuel (lecture)
```

**Garde d'accès (proxy.ts + vérif serveur par page), défense en profondeur :**
- `admin_plateforme` (aucune organisation active) → routes `(dashboard)` existantes ; redirigé hors de `/app/*`.
- `proprietaire`/`administrateur`/`responsable_etablissement`/`membre` (a une organisation active) → redirigé de `/` vers `/app` ; bloqué sur les routes `(dashboard)` existantes.
- `/app/equipe` et `/app/parametres` : accès refusé (redirection vers `/app`) pour `responsable_etablissement` et `membre`.
- Toute page de `(client)` dérive l'entreprise via `getCurrentUser()` côté serveur, jamais d'un paramètre d'URL — élimine par construction le risque de "fuite inter-entreprise par ID deviné dans l'URL".

## 2. Permissions exactes par rôle

| Écran / action | Propriétaire | Administrateur | Responsable d'établissement | Membre |
|---|---|---|---|---|
| Vue d'ensemble, Appels, Rendez-vous, Établissements | tout le périmètre de l'entreprise | tout le périmètre de l'entreprise | **limité aux établissements assignés** | tout le périmètre, lecture seule |
| Équipe et accès — voir la liste | ✓ | ✓ | ✗ (redirigé) | ✗ (redirigé) |
| Équipe — inviter un membre ou un responsable d'établissement | ✓ | ✓ | ✗ | ✗ |
| Équipe — inviter un administrateur | ✓ | ✗ | ✗ | ✗ |
| Équipe — retirer un membre / changer un rôle | ✓ (tous) | ✓ (sauf le propriétaire) | ✗ | ✗ |
| Paramètres — voir | ✓ | ✓ | ✗ (redirigé) | ✗ (redirigé) |
| Paramètres — modifier coordonnées / notifications | ✓ | ✓ | ✗ | ✗ |
| Paramètres — voir l'abonnement actuel | ✓ | ✓ | ✗ | ✗ |
| Supprimer l'entreprise elle-même | ✗ (réservé au Super Admin plateforme, pas exposé côté client) | ✗ | ✗ | ✗ |

Établissements reste un écran de lecture seule pour tous les rôles au MVP (création/édition toujours réservée au Dashboard Administrateur, comme aujourd'hui) — aucun rôle client ne peut créer/modifier un établissement pour l'instant, donc pas de ligne dédiée dans le tableau ci-dessus.

## 3. Données réelles vs. démonstration

Contrairement au Sprint 5 (qui mélangeait 3 entreprises fictives + Barber Concept réel), **le Dashboard Client n'introduit aucune donnée de démonstration** : toutes les requêtes lisent la vraie base, scopées sur l'entreprise de l'utilisateur connecté.

- **Réel dès le départ :** Entreprise (coordonnées), Établissements, Équipe (membres/invitations Clerk, déjà construit au Sprint 5), Abonnement (affiche "Aucun abonnement actif" si aucune ligne — honnête, pas simulé).
- **Réel mais vide pour l'instant :** Appels et Rendez-vous — les tables existent et sont interrogées normalement, mais Barber Concept n'a aujourd'hui aucun appel réel en base (le branchement Vapi/Twilio → table `appels` est différé après ce sprint, décision actée le 2026-07-16 dans `docs/sprint-log.md`). Les écrans afficheront donc un état vide honnête ("Aucun appel enregistré pour l'instant") plutôt que des données inventées — c'est un test valable des états vides, et ça évite de reproduire le défaut du Sprint 5 (mélange démo/réel à démêler plus tard).
- **Nouveau champ, réel mais non branché à un envoi effectif :** préférences de notification (Paramètres) — deux booléens simples sur `entreprises` (ex. `notifier_rdv_par_email`), persistés réellement, mais aucun moteur de notification n'existe encore pour les déclencher (hors périmètre, aucune prétention du contraire dans l'interface).

## 4. Isolation multi-tenant — règle absolue

Toute requête Prisma d'un écran `(client)` filtre par l'`entrepriseId` dérivé de `getCurrentUser()` (session Clerk active), jamais par une valeur transmise par le client (URL, formulaire caché, etc.). Concrètement :
- Aucune route `(client)` n'accepte d'`entrepriseId` en paramètre.
- Chaque fonction de lecture/écriture (`getVueEnsembleClient()`, `getAppelsClient()`, etc.) prend l'utilisateur courant en entrée, pas un id brut, pour rendre l'oubli du filtre impossible à l'usage (un appel sans utilisateur ne peut pas compiler).
- Pour `responsable_etablissement`, filtre supplémentaire sur les établissements assignés (`assignations_etablissement`) — la fonction de scope retourne une liste d'`etablissementId` autorisés, réutilisée par tous les écrans concernés (Appels, Rendez-vous, Vue d'ensemble), pour éviter de dupliquer cette logique cinq fois.

## 5. Composants réutilisés du Dashboard Administrateur

Directement, sans modification : `ui/*` (button, dialog, input, label, select, tabs, badge, card), `page-header.tsx`, `stat-tiles.tsx`, `calls-chart.tsx`, `call-drawer.tsx`/`call-detail.tsx` (fiche appel en panneau latéral, même mécanisme de routes interceptantes), `statut-badge.tsx`, `nav-rail.tsx` (paramétré avec un nouveau jeu d'items, voir ci-dessous), `top-bar.tsx`.

Nouveaux (spécifiques au Dashboard Client) : `lib/nav-client.ts` (jeu de navigation à 6 entrées au lieu de 4 groupes), un écran Rendez-vous (n'existe pas côté admin), un écran Équipe orienté "mon organisation" (réutilise `listOrganizationMembers`/`inviteUser` déjà construits au Sprint 5, mais avec une UI différente — liste + formulaire d'invitation avec sélecteur des 4 rôles, pas de placeholder), un formulaire Paramètres.

Le centre d'actions (`action-center.tsx`) n'est **pas** réutilisé tel quel côté client — sa version plateforme couvre tous les clients, hors de propos ici. "Appels nécessitant une attention" en Vue d'ensemble Client se limite à un filtre simple sur `appels.statut = echoue`, pas une nouvelle table.

## 6. Modèle de données — additions

| Changement | Détail |
|---|---|
| `role_utilisateur` (enum) | `employe` retiré, remplacé par `administrateur`, `responsable_etablissement`, `membre` (5 valeurs au total avec `admin_plateforme`/`proprietaire`) |
| `assignations_etablissement` (nouvelle table) | `utilisateur_id`, `etablissement_id`, clé composite — scope d'un `responsable_etablissement` |
| `entreprises.notifier_rdv_par_email` / `notifier_rdv_par_sms` (nouvelles colonnes) | Préférences de notification, booléens, `true` par défaut |

## 7. Ordre d'implémentation proposé

Dans l'ordre de dépendance (pas l'ordre listé par le fondateur, qui décrivait le périmètre fonctionnel — l'ordre de construction suit les fondations d'abord) :

1. **Prérequis** — liaison Entreprise ↔ Organisation Clerk (création automatique + backfill des 2 entreprises existantes), migration du modèle de données (enum + 2 tables/colonnes), squelette de route `(client)` + garde de rôle dans `proxy.ts` + navigation.
2. **Établissements** — le plus simple, lecture seule, définit la fonction de scope réutilisée partout ensuite.
3. **Équipe et accès** — réutilise le plus gros de l'existant (`src/auth/`), valide de bout en bout la boucle invitation → rôle → accès.
4. **Paramètres** — formulaire simple, données déjà toutes en base.
5. **Vue d'ensemble** — agrège les écrans précédents.
6. **Appels** — réutilise le drawer du Sprint 5, filtré par entreprise (et établissements assignés si responsable).
7. **Rendez-vous** — nouveau, dernier de la liste : dépend le moins des autres, et sert de base à l'intégration Get Time (Sprint 7).

Chaque étape : build, lint, tests, vérification visuelle avant de passer à la suivante — même discipline que le Sprint 5.
