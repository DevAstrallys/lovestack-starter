# CLAUDE.md — Brief Projet

## Architecture & règles de développement

Ce projet est un hub d'information (gestion de tickets,
notifications emails/SMS, multi-utilisateurs, OTP).
Stack : React + Vite + TypeScript + Supabase + Tailwind.

---

## Règles absolues — respecter sur chaque modification

### 1. SERVICES
- Toute interaction avec Supabase passe par `/src/services/[domaine]`
- Ne jamais appeler supabase directement depuis un composant
- Services existants : `auth`, `tickets`, `notifications`, `users`

### 2. VARIABLES D'ENVIRONNEMENT
- Aucune clé, URL ou secret hardcodé dans le code
- Toujours utiliser `import.meta.env.VITE_*`

### 3. LOGS
- Aucun `console.log()`
- Toujours utiliser le logger de `src/lib/logger.ts`
- Format : `{ level, message, service, timestamp }`

### 4. ERREURS
- Chaque appel async doit avoir un `try/catch`
- Les erreurs doivent être loggées, jamais silencieuses

### 5. NOUVEAUX SERVICES
- Si un nouveau domaine métier émerge, créer `/src/services/[nouveau-domaine]/index.ts`
- Suivre le même pattern que les services existants

### 6. BASE DE DONNÉES
- Supabase reste externe, ne jamais le containeriser
- Les edge functions utilisent `Deno.env.get()`

---

## Modèle de données clé

### Hiérarchie de lieux
```
Organization
  └── Location Ensemble (résidence, campus…)
        └── Location Group (bâtiment, aile…)
              └── Location Element (appartement, bureau…)
```

### Tables principales
| Domaine | Tables |
|---------|--------|
| Auth & Rôles | `profiles`, `roles`, `permissions`, `role_permissions`, `memberships`, `location_memberships` |
| Organisations | `organizations`, `companies`, `company_users` |
| Lieux | `location_ensembles`, `location_groups`, `location_elements`, `location_tags` |
| Tickets | `tickets`, `ticket_activities`, `ticket_attachments`, `ticket_events`, `ticket_followers` |
| QR Codes | `qr_codes`, `qr_codes_public` (vue) |
| Taxonomie | `tax_actions`, `tax_categories`, `tax_objects`, `tax_details` |
| Notifications | `notifications_prefs`, `channels_outbox` |
| Audit | `audit_logs` |

### Hiérarchie des rôles (sort_order)
| Scope | Rôles (sort_order) |
|-------|-------------------|
| Platform (1-6) | `admin_platform`, `super_admin`, `admin`, `gestionnaire_logiciel`, `tech_logiciel`, `concierge_digital` |
| Organisation (10-19) | `admin_org`, `manager`, `gestionnaire`, `syndic`, `conseil_syndical`, `gestionnaire_biens`, `comptable`, `assistant`, `juridique`, `gestion_locative` |
| Terrain (20-29) | `proprietaire`, `proprietaire_bailleur`, `locataire`, `gardien`, `externe`, `prestataire`, `technicien_prestataire`, `technicien`, `maintenance`, `urgence` |
| Spécialisés (30-43) | `user`, `visiteur`, `consultant`, `expert`, `auditeur`, `assurance`, `notaire`, `invite`, `partenaire`, `data_client`, `services_publics`, `pompier`, `police`, `administration_publique` |

> **Règle RLS** : un utilisateur ne peut créer un membership qu'avec un `sort_order >=` à son propre rôle le plus élevé.

---

## Edge Functions

| Fonction | Auth | Description |
|----------|------|-------------|
| `send-email` | JWT ou Service Role Key | Envoi d'emails via Resend |
| `notification-engine` | JWT utilisateur | Orchestre les notifications multi-canal |
| `expire-memberships` | Cron / Service Role | Désactive les memberships expirés |
| `rgpd` | JWT utilisateur | Export/suppression données RGPD |

---

## Sécurité — points d'attention

- Les Edge Functions rejettent les appels non authentifiés (401)
- `notification-engine` appelle `send-email` via la Service Role Key
- Le bucket `ticket-attachments` est public (à sécuriser via edge function dédiée — TODO)
- Les politiques RLS sur `memberships` empêchent l'escalade de privilèges via `sort_order`
- Pas de credentials hardcodés dans les migrations

---

## Objectif long terme

L'app est conçue pour être K8s-ready :
architecture en services découplés, logs structurés JSON,
health check sur `/health`, config par variables d'env.
