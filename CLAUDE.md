# CLAUDE.md — Astra-Link

> Dernière mise à jour : avril 2026
> Ce fichier est le brief de référence pour Claude, Lovable, et tout développeur reprenant le projet.
> Il doit être mis à jour à la fin de chaque sprint.

---

## 1. Présentation du projet

**Astra-Link** est un SaaS de gestion de bâtiments et de copropriété.
C'est le système d'exploitation central pour des résidences et portefeuilles immobiliers.

Il sert simultanément plusieurs types d'acteurs :

- **Syndics** : gestion opérationnelle des immeubles
- **Conseil syndical** : supervision et validation
- **Propriétaires & locataires** : suivi de leurs demandes
- **Prestataires** : réception et traitement des tickets
- **Administrateurs plateforme** : gestion multi-organisations

Un même utilisateur peut avoir **plusieurs rôles sur plusieurs bâtiments** simultanément.
C'est l'invariant métier le plus important du projet.

### Modèle de monétisation

| Segment      | Modèle                              |
| ------------ | ----------------------------------- |
| Syndics      | Abonnement SaaS mensuel             |
| Prestataires | Abonnement marketplace              |
| Freemium     | Publicité CPM (affichée au scan QR) |

---

## 2. Environnement de développement

- **Développement exclusivement via Lovable.dev** (browser, pas de CLI locale)
- **Pas d'expérience Git** — ne jamais demander de commandes Git manuelles
- **Windows** comme OS
- **Supabase SQL Editor** pour toutes les migrations SQL
- Les prompts Lovable doivent être **prêts-à-coller**, sans ambiguïté
- Chaque SQL doit être **présenté pour relecture** avant exécution

---

## 3. Stack technique

| Couche             | Technologie                                              |
| ------------------ | -------------------------------------------------------- |
| Frontend           | React 18 + TypeScript + Vite                             |
| UI                 | Tailwind CSS + shadcn/ui                                 |
| Data fetching      | React Query                                              |
| Backend            | Supabase (DB, Auth, RLS, Edge Functions, Storage)        |
| Emails             | Resend (API key configurée, domain verification pending) |
| Repo               | GitHub : `DevAstrallys/lovestack-starter`                |
| Lovable project ID | `b959c7f6-a91a-4583-ae6b-f833e5a61f78`                   |

---

## 4. Règles absolues — respecter sur chaque modification

### 4.1 Table buildings — INTERDITE

**Ne jamais utiliser la table `buildings`.**
Toujours utiliser la hiérarchie : `location_ensembles → location_groups → location_elements → qr_codes`

### 4.2 Service layer — obligatoire

- Toute interaction Supabase passe par `/src/services/[domaine]/index.ts`
- Zéro appel `supabase.from()` direct depuis un composant ou une page
- Services existants : `auth`, `tickets`, `notifications`, `users`, `locations`, `qr-codes`, `taxonomy`, `organizations`
- Si un nouveau domaine émerge : créer `/src/services/[nouveau-domaine]/index.ts`

### 4.3 Variables d'environnement

- Aucune clé, URL ou secret hardcodé
- Côté client : `import.meta.env.VITE_*`
- Côté edge functions : `Deno.env.get()`

### 4.4 Logs

- Zéro `console.log()` / `console.error()`
- Utiliser exclusivement `/src/lib/logger.ts`
- Format : `{ level, message, service, timestamp }` (JSON structuré)

### 4.5 Gestion des erreurs

- Chaque appel async doit avoir un `try/catch`
- Les erreurs sont loggées via `logger.ts`, jamais silencieuses

### 4.6 Types TypeScript

- Chaque entité principale a son type dans `/src/types/`
- Les types sont exportés et utilisés dans les services et composants
- Ne jamais utiliser `any` sur des entités métier

---

## 5. Workflow de développement — règles de processus

| Règle                                 | Description                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Audit-first**                       | Avant chaque modification, produire un prompt d'audit. Ne modifier qu'après validation du plan. |
| **Un fichier / une table par prompt** | Chaque prompt Lovable cible un seul fichier ou une seule table.                                 |
| **SQL présenté avant exécution**      | Chaque requête SQL est montrée pour relecture. Indiquer si réversible.                          |
| **Validation critère**                | Chaque prompt se termine par un critère de validation observable.                               |
| **CLAUDE.md vivant**                  | Mise à jour proposée à la fin de chaque sprint fonctionnel.                                     |

---

## 6. Modèle de données

### Hiérarchie de lieux

```
Organization
  └── Location Ensemble (résidence, campus, parc…)
        └── Location Group (bâtiment, aile, tour…)
              └── Location Element (appartement, bureau, local…)
                    └── QR Code
```

### Tables principales

| Domaine       | Tables                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------- |
| Auth & Rôles  | `profiles`, `roles`, `permissions`, `role_permissions`, `memberships`, `location_memberships` |
| Organisations | `organizations`, `companies`, `company_users`                                                 |
| Lieux         | `location_ensembles`, `location_groups`, `location_elements`, `location_tags`                 |
| Tickets       | `tickets`, `ticket_activities`, `ticket_attachments`, `ticket_events`, `ticket_followers`     |
| QR Codes      | `qr_codes`, `qr_codes_public` (vue)                                                           |
| Taxonomie     | `tax_actions`, `tax_categories`, `tax_objects`, `tax_details`, `tax_suggestions`              |
| Notifications | `notifications_prefs`, `channels_outbox`                                                      |
| Audit         | `audit_logs`                                                                                  |

### Hiérarchie des rôles (sort_order)

| Scope                | Rôles                                                                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Platform (1–6)       | `admin_platform`, `super_admin`, `admin`, `gestionnaire_logiciel`, `tech_logiciel`, `concierge_digital`                                                                                   |
| Organisation (10–19) | `admin_org`, `manager`, `gestionnaire`, `syndic`, `conseil_syndical`, `gestionnaire_biens`, `comptable`, `assistant`, `juridique`, `gestion_locative`                                     |
| Terrain (20–29)      | `proprietaire`, `proprietaire_bailleur`, `locataire`, `gardien`, `externe`, `prestataire`, `technicien_prestataire`, `technicien`, `maintenance`, `urgence`                               |
| Spécialisés (30–43)  | `user`, `visiteur`, `consultant`, `expert`, `auditeur`, `assurance`, `notaire`, `invite`, `partenaire`, `data_client`, `services_publics`, `pompier`, `police`, `administration_publique` |

> **Règle RLS anti-escalade** : un utilisateur ne peut créer un membership qu'avec un `sort_order >=` à son propre rôle le plus élevé.

---

## 7. Flux critiques

### 7.1 Flux QR → ticket anonyme

```
Scan QR → /ticket-form/:slug
  └── TicketLanding.tsx
        ├── [Authentifié] → redirect vers formulaire pré-rempli
        ├── [Déclarant one-shot] → génère tracking_code (format XXXX-XXXX)
        │     → stocké dans meta.tracking_code
        │     → envoyé par email/SMS
        └── [Demande d'accès] → ticket avec source: 'access_request'

Suivi anonyme : /suivi/:slug → lookup par tracking_code
```

### 7.2 Cycle de vie d'un ticket

```
Création (anon ou auth)
  → Assignation (syndic / gestionnaire)
    → En cours (prestataire / technicien)
      → Résolu → Clôturé
        → ticket_activities enregistre chaque transition
```

### 7.3 Formulaire de déclaration adaptatif (3 étapes)

1. Identité et rôle
2. Type de déclaration (Je signale / J'informe / Je demande / Je vérifie) + toggle initial/relance
3. Taxonomie cascadée (catégorie → objet → urgence 1–4 → localisation) + médias + notification

---

## 8. Edge Functions

| Fonction              | Auth                    | Description                             |
| --------------------- | ----------------------- | --------------------------------------- |
| `send-email`          | JWT ou Service Role Key | Envoi d'emails via Resend               |
| `notification-engine` | JWT utilisateur         | Orchestre les notifications multi-canal |
| `expire-memberships`  | Cron / Service Role     | Désactive les memberships expirés       |
| `rgpd`                | JWT utilisateur         | Export/suppression données RGPD         |

> Toutes les edge functions rejettent les appels non authentifiés (401).
> `notification-engine` appelle `send-email` via la Service Role Key.

---

## 9. Sécurité & RLS

- Les politiques RLS sur `memberships` empêchent l'escalade de privilèges via `sort_order`
- Chaque nouvelle table doit avoir des politiques RLS explicites pour SELECT / INSERT / UPDATE / DELETE
- Tester systématiquement les deux contextes : utilisateur authentifié ET anonyme
- Pas de credentials hardcodés dans les migrations
- Les edge functions utilisent JWT — pattern `Authorization: Bearer` obligatoire

### RLS déjà corrigées (historique)

- `qr_codes` : INSERT pour admin plateforme, SELECT pour anon
- `location_memberships` : INSERT pour admin plateforme
- `ticket_activities` : INSERT/SELECT pour auth et anon
- `tax_actions/categories/objects/details` : accès anonyme en lecture

---

## 10. Dettes techniques actives

| Priorité    | Dette                                                 | Mitigation actuelle                                   |
| ----------- | ----------------------------------------------------- | ----------------------------------------------------- |
| 🔴 Critical | Bucket `ticket-attachments` public                    | TODO — edge function dédiée upload (non démarrée)     |
| 🔴 Critical | Resend domain verification non complété               | API key configurée, emails bloqués sur domaine custom |
| 🟡 Medium   | `form_config` QR non implémenté dans `TicketForm.tsx` | Déféré post-sprint QR                                 |
| 🟡 Medium   | `tax_suggestions` table non créée                     | Design validé, migration non exécutée                 |
| 🟡 Medium   | SMS sans provider configuré                           | Affiché "coming soon" dans le formulaire              |
| 🟡 Medium   | Props legacy `buildings` dans `TicketsPortfolio.tsx`   | TODO Sprint 4 — renommer en `ensembles`               |
| 🟡 Medium   | Champs `building_id/building_name` dans type `Ticket`  | TODO Sprint 4 — nettoyer les champs legacy            |
| 🟢 Low      | Push notifications                                    | Marqué "coming soon" dans la déclaration              |
| ~~🔴~~      | ~~Table `buildings` utilisée dans le code applicatif~~ | ✅ Éliminée — Sprint 1 + EmergencyButton corrigé      |

---

## 11. Glossaire métier

| Terme                 | Définition                                                                            |
| --------------------- | ------------------------------------------------------------------------------------- |
| **Syndic**            | Gestionnaire professionnel d'une copropriété (personne morale ou physique)            |
| **Conseil syndical**  | Groupe de copropriétaires élus qui supervisent le syndic                              |
| **Copropriété**       | Immeuble dont les parties communes sont partagées entre propriétaires                 |
| **Lot**               | Fraction d'un immeuble en copropriété (appartement + quote-part des parties communes) |
| **Tantième**          | Quote-part de chaque propriétaire dans les charges communes                           |
| **AG**                | Assemblée Générale — réunion annuelle obligatoire des copropriétaires                 |
| **Déclarant**         | Toute personne (anonyme ou non) qui soumet un ticket via QR code                      |
| **Tracking code**     | Code 8 caractères (XXXX-XXXX) permettant à un déclarant anonyme de suivre son ticket  |
| **Location Ensemble** | Plus grande unité géographique : résidence, campus, parc d'activité                   |
| **Location Group**    | Subdivision : bâtiment, tour, aile                                                    |
| **Location Element**  | Unité finale : appartement, bureau, local technique                                   |

---

## 12. Objectif long terme

L'app est conçue pour être K8s-ready :

- Architecture en services découplés
- Logs structurés JSON
- Health check sur `/health`
- Config par variables d'environnement
- Supabase reste le backend tout au long de la phase MVP — aucune migration prévue

---

## 13. Ce qui ne doit jamais changer (invariants)

1. **Jamais `buildings`** — toujours `location_*`
2. **Jamais `supabase.from()` hors service layer**
3. **Jamais `console.log`** — toujours `logger.ts`
4. **Jamais de secret hardcodé**
5. **Un utilisateur = plusieurs rôles sur plusieurs bâtiments** — l'isolation est par `organization_id` ET `location_*`
6. **Audit-first** — on audite avant de modifier, toujours

---

## 14. Sprints complétés

### Sprint 1 — Élimination table buildings (avril 2026)

- `fetchBuildings()` supprimée de `services/tickets/index.ts`
- `BuildingsManagement.tsx` supprimé
- `useTickets.ts` : 7 appels directs Supabase → service layer
- `Dashboard.tsx` : 2 appels directs Supabase → service layer
- `LocationsManagement.tsx` : import mort supprimé
- Nouvelles fonctions créées : `fetchOrganizationEnsembles`, `fetchFilteredTickets`, `fetchTicketIdsByElementIds`, `fetchElementIdsByGroupId`, `fetchElementIdsByEnsembleId`
- `EmergencyButton.tsx` : `supabase.from('buildings')` supprimé, données extraites de `ticket.location`, composant simplifié (suppression `useState` + `useEffect` async)

**TODO Sprint 4 restants issus de ce sprint :**

- Renommer props `TicketsPortfolio.tsx` : `buildings` → `ensembles`
- Nettoyer champs legacy `building_id` / `building_name` dans type `Ticket`

### Sprint 2 — Rapatriement hooks vers service layer (avril 2026)

- `useLocations.ts` : appel legacy `locations` → `fetchAccessibleLocationElements()` sur `location_elements`
- `useQRCodes.ts` : 6 appels directs Supabase → service layer, paramètre `buildingId` legacy supprimé
- `useTaxonomy.ts` / `useUserTicketRole.ts` / `AuthContext.tsx` : déjà conformes, aucune modification nécessaire
- `QRCodeManagement.tsx` : corrigé suite suppression `buildingId`
- Nouvelles fonctions : `fetchQRCodesByLocation`, `deactivateActiveQRCodesForLocation`, `regenerateQRCode`, `fetchAccessibleLocationElements`

**Reste à traiter (composants admin — Sprint 3) :**

- `AccessSecurityManager.tsx`
- `UsersManagement.tsx`
- `PermissionsManager.tsx`
- `UserCompanyAffiliations.tsx`
- `TagsManagement.tsx`
- `LocationGroups.tsx` / `LocationEnsembles.tsx`
- `InviteUserDialog.tsx` / `RequestRoleDialog.tsx`
