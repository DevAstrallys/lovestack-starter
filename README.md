# Astra-Link

Plateforme SaaS de gestion et copropriété immobilière. Système central pour la gestion des bâtiments résidentiels et portefeuilles immobiliers.

## Stack technique

- **Frontend** : React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend** : Supabase (PostgreSQL, RLS, Edge Functions, Auth)
- **State** : React Query (TanStack Query)
- **Routing** : React Router v6 avec lazy loading
- **Développement** : Lovable.dev (environnement browser)
- **Tests** : Vitest + Testing Library

## Démarrage rapide

```bash
npm install
npm run dev       # Serveur de développement
npm run build     # Build production
npm run test      # Tests unitaires
```

## Architecture du projet

```
src/
├── components/          # Composants UI organisés par domaine
│   ├── admin/           # Administration plateforme
│   ├── auth/            # Authentification et routes protégées
│   ├── features/        # Composants feature-specific
│   ├── locations/       # Gestion des lieux (hierarchy manager)
│   ├── tickets/         # Cockpit tickets, filtres, détail
│   └── ui/              # Composants shadcn/ui + ErrorBoundary
├── contexts/            # React Contexts (Auth, Organization, RoleView, WhiteLabel)
├── hooks/               # Hooks React Query (useTicketsQuery, useTicketQuery, useQRCodes)
├── integrations/        # Client Supabase auto-généré (NE PAS MODIFIER)
├── lib/                 # Utilitaires (logger structuré, utils)
├── pages/               # Pages routes (lazy-loaded pour les pages internes)
├── services/            # Couche d'accès données — SEUL point d'appel Supabase
│   ├── admin/           # Edge functions (create-user, delete-user)
│   ├── auth/            # Authentification
│   ├── companies/       # Entreprises
│   ├── locations/       # Hiérarchie lieux + QR codes
│   ├── notifications/   # Email (Resend)
│   ├── organizations/   # Organisations
│   ├── roles/           # Rôles, permissions, memberships
│   ├── storage/         # Upload fichiers
│   ├── system/          # Stats système, audit logs
│   ├── taxonomy/        # Actions, catégories, objets, détails
│   ├── tickets/         # CRUD tickets, activités, suivi
│   └── users/           # Profils utilisateurs
├── test/                # Infrastructure de test (setup, mocks)
└── types/               # Types TypeScript centralisés
```

## Conventions de code

### Règles absolues

1. **Aucun `any`** — chaque variable, paramètre et retour est typé
2. **Aucun `console.log`** — utiliser le logger structuré `createLogger()` de `/src/lib/logger.ts`
3. **Aucun import Supabase hors de `/src/services/`** — les composants et hooks appellent les services, jamais Supabase directement
4. **Types centralisés dans `/src/types/`** — aucune interface dupliquée dans les composants

### Patterns

- **Services** : chaque domaine a son fichier dans `/src/services/[domain]/index.ts`
- **Hooks** : React Query pour toutes les requêtes (useQuery, useMutation)
- **Error Boundaries** : chaque page lazy-loaded a son ErrorBoundary
- **Lazy loading** : les pages internes (Admin, Tickets, Locations…) sont lazy-loaded, les pages publiques (TicketForm, TicketLanding) sont statiques

### Imports

```typescript
// Types — toujours depuis @/types
import type { Ticket, EnrichedTicket, Organization } from '@/types';

// Services — depuis @/services/[domain]
import { fetchFilteredTickets } from '@/services/tickets';

// Logger — depuis @/lib/logger
import { createLogger } from '@/lib/logger';
const log = createLogger('component:mon-composant');
```

## Hiérarchie des lieux

```
Organisation
└── Ensemble (résidence, site, portefeuille)
      └── Groupe (bâtiment, escalier, étage)
            └── Élément (appartement, local, zone technique)
                  └── QR Code (point de déclaration)
```

⚠️ Ne jamais utiliser la table legacy `buildings` — utiliser `location_ensembles → location_groups → location_elements → qr_codes`.

## Système de rôles

43 rôles triés par `sort_order` (de `admin_platform=1` à `administration_publique=43`). Les permissions sont assignées par rôle via la table `role_permissions`. Les memberships sont scopées à deux niveaux :

- **Organisation** : table `memberships` (rôle global dans l'org)
- **Lieu** : table `location_memberships` (rôle sur un ensemble/groupe/élément spécifique)

## Documentation complémentaire

- `CLAUDE.md` — Brief projet complet pour les assistants IA (architecture, sécurité, flux métier, glossaire)
