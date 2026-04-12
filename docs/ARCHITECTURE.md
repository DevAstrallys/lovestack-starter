# Architecture Astra-Link

## Vue d'ensemble

Astra-Link est une application React SPA (Single Page Application) avec un backend Supabase. L'architecture suit un pattern en couches strictes :

```
Pages (routes) → Hooks (React Query) → Services (data access) → Supabase (DB + Auth + Edge Functions)
↕                                        ↕
Contexts (état global)                  Types (contrats)
```

### Règle fondamentale

Les composants et hooks n'appellent JAMAIS Supabase directement. Tout passe par la couche services dans `/src/services/`.

## Couche Types (`/src/types/`)

Point d'entrée unique : `import type { ... } from '@/types'`

Fichiers :

- `ticket.ts` — Ticket, EnrichedTicket, TicketInsert, TicketActivity, TicketFilters
- `location.ts` — LocationData, LocationElement, LocationGroup, LocationEnsemble, LocationTag
- `organization.ts` — Organization, WhiteLabelConfig
- `user.ts` — Profile, Role, Permission, Membership, LocationMembership
- `qr-code.ts` — QRCode, QRCodeFormConfig, QRCodeTemplate
- `taxonomy.ts` — TaxAction, TaxCategory, TaxObject, TaxDetail, TaxSuggestion
- `enums.ts` — TicketStatus, TicketPriority, Initiality
- `company.ts` — Company, CompanyUser
- `notification.ts` — SendEmailParams, NotificationType

Chaque type business a sa source unique ici. Aucune interface ne doit être définie dans les composants.

## Couche Services (`/src/services/`)

12 domaines, chacun dans son dossier avec un `index.ts` :

| Service       | Responsabilité                       | Tables Supabase                                                                          |
| ------------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| admin         | Edge functions (create/delete user)  | — (edge functions)                                                                       |
| auth          | Login, signup, session               | auth.users                                                                               |
| companies     | CRUD entreprises                     | companies, company\_users                                                                |
| locations     | Hiérarchie lieux, QR codes, tags     | location\_\* tables, qr\_codes                                                           |
| notifications | Email via Resend                     | — (edge function send-email)                                                             |
| organizations | CRUD organisations                   | organizations                                                                            |
| roles         | Rôles, permissions, memberships      | roles, permissions, role\_permissions, memberships, location\_memberships, role\_requests |
| storage       | Upload fichiers                      | storage.objects                                                                          |
| system        | Stats système, audit logs            | profiles, organizations, tickets, audit\_logs                                            |
| taxonomy      | Classification universelle           | tax\_actions, tax\_categories, tax\_objects, tax\_details, tax\_suggestions               |
| tickets       | CRUD tickets, activités, filtres     | tickets, ticket\_activities                                                              |
| users         | Profils, rôles utilisateur           | profiles, memberships                                                                    |

Chaque fonction de service :

1. Appelle Supabase
2. Log via le logger structuré
3. Throw en cas d'erreur (pas de return null silencieux)
4. Retourne des données typées

## Couche Hooks (`/src/hooks/`)

Tous les hooks data utilisent React Query :

| Hook                     | Type        | Clé de cache                        |
| ------------------------ | ----------- | ----------------------------------- |
| useTicketsQuery          | useQuery    | `['tickets', filters, page, limit]` |
| useTicketQuery           | useQuery    | `['ticket', id]`                    |
| useTicketActivitiesQuery | useQuery    | `['ticket-activities', ticketId]`   |
| useCreateTicket          | useMutation | invalide `['tickets']`              |
| useUpdateTicket          | useMutation | invalide `['tickets']`              |
| useAddActivity           | useMutation | invalide `['ticket-activities', ticketId]` |

Configuration globale du QueryClient :

- `staleTime` : 30 secondes
- `retry` : 1 pour les queries, 0 pour les mutations
- `refetchOnWindowFocus` : désactivé

## Couche Contexts

| Context              | Rôle                       | Données                                          |
| -------------------- | -------------------------- | ------------------------------------------------ |
| AuthContext           | Session utilisateur        | user, session, login/logout                      |
| OrganizationContext   | Org sélectionnée           | selectedOrganization, organizations, isPlatformAdmin |
| RoleViewContext       | Simulation de rôle         | simulatedRole, userMemberships, activeMembership |
| WhiteLabelContext     | Personnalisation visuelle  | logo, couleurs, config white-label               |

## Couche Composants

### Locations — Pattern générique

`LocationHierarchyManager.tsx` (~190 lignes) est un composant générique qui gère la CRUD pour les ensembles ET les groupes. Il est composé de 5 sous-composants dans `/hierarchy/` :

- `HierarchyFormDialog` — Dialog de création/édition
- `HierarchyTable` — Vue tableau
- `HierarchyCards` — Vue cartes
- `HierarchyToolbar` — Recherche, filtre tags, toggle vue
- `HierarchyEmptyStates` — États vides
- `types.ts` — Types partagés (HierarchyItem, DisplayTag)

`LocationEnsembles.tsx` et `LocationGroups.tsx` (~45 lignes chacun) sont des wrappers qui adaptent les props service vers le composant générique.

### Tickets — Cockpit

Le cockpit ticket contient : ChatBar, SmartDispatcher, AuditTrail, EmergencyButton. Chaque composant reçoit le ticket en prop typé.

## Routing et Code Splitting

Pages statiques (chargées immédiatement) :

- Index, TicketLanding, TicketForm, Health, NotFound, Unauthorized

Pages lazy-loaded (chargées à la demande) :

- Admin, Locations, Users, Tickets, TicketDetail, TicketTracking, Profile

Chaque page lazy-loaded est wrappée dans un ErrorBoundary individuel + un ErrorBoundary global autour du Router.

## Flux de données typique

Exemple : Affichage de la liste des tickets

1. `Tickets.tsx` (page) → `useTicketsQuery(filters)`
2. `useTicketsQuery` (hook) → `fetchFilteredTickets(filters)` + `fetchOrganizations(ids)`
3. `fetchFilteredTickets` (service) → `supabase.from('tickets').select(...)` avec filtres RLS
4. React Query cache le résultat 30s, re-fetch si stale
5. Le composant reçoit `{ data, isLoading, error }` et rend le JSX

## Taxonomie — Service Core

La taxonomie n'est PAS un module — c'est un service core utilisé par tous les modules qui ont besoin de listes de sélection :

- **Structure** : action → catégorie → objet → détail
- **Auto-learning** : les saisies « Autre » (texte libre) sont enregistrées dans `tax_suggestions`
- **Promotion automatique** : quand un seuil d'occurrences est atteint, la suggestion devient une entrée officielle
- **Modules consommateurs** : Tickets, Main Courante, Documents, Contrats, Entreprises, Réception de Travaux
