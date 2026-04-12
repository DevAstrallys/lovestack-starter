# Sécurité Astra-Link

## Principes

1. **Row Level Security (RLS)** sur toutes les tables Supabase — aucune donnée accessible sans politique RLS
2. **Edge Functions avec JWT** pour les opérations admin (création/suppression utilisateur)
3. **Séparation des couches** — les composants n'ont jamais accès direct à Supabase
4. **Aucun credential hardcodé** — variables d'environnement uniquement

## Authentification

- Supabase Auth avec email/password
- Session gérée via `AuthContext`
- Routes protégées via `ProtectedAdminRoute` (vérifie le rôle admin côté client ET serveur)

## Row Level Security (RLS)

### Tables critiques et leurs politiques

**tickets** :

- SELECT : utilisateurs de l'organisation propriétaire du ticket
- INSERT : utilisateurs authentifiés + formulaire public anonyme (via QR code, source `'qr_code'` requise)
- UPDATE : utilisateurs avec rôle suffisant dans l'organisation
- DELETE : admin uniquement

**organizations** :

- SELECT : membres de l'organisation (via `memberships` ou `location_memberships`) + admin plateforme
- INSERT : admin plateforme ou utilisateur avec permission `organization.create`
- UPDATE : utilisateurs avec permission `organization.manage`
- DELETE : interdit

**location_elements / location_groups / location_ensembles** :

- SELECT : utilisateurs avec permission `locations.read` dans l'organisation + admin plateforme
- ALL : utilisateurs avec permission `locations.manage` + admin plateforme
- Les QR codes publics donnent un accès anonyme en INSERT uniquement sur tickets

**memberships** :

- SELECT : l'utilisateur ne voit que ses propres memberships
- INSERT : réservé aux rôles autorisés (`admin_platform`, `super_admin`, `admin`, `admin_org`, `manager`, `gestionnaire`, `syndic`) avec contrôle anti-escalade via `sort_order`
- UPDATE/DELETE : admin plateforme, super admin, admin org uniquement

**location_memberships** :

- SELECT : l'utilisateur voit ses propres memberships + managers org voient tous
- INSERT : managers org + admin plateforme (via `locations.manage`)
- UPDATE/DELETE : managers org uniquement

**qr_codes** :

- SELECT public pour les QR actifs (rôles `anon` + `authenticated`)
- INSERT : membres de l'organisation avec rôle suffisant
- UPDATE/DELETE : membres de l'organisation

**taxonomy tables** (`tax_actions`, `tax_categories`, `tax_objects`, `tax_details`) :

- SELECT public (rôle `anon` autorisé — nécessaire pour le formulaire)
- INSERT/UPDATE/DELETE : admin uniquement

### Flux anonyme (QR code → ticket)

1. L'utilisateur scanne un QR code → arrive sur `/ticket-form/:slug`
2. Le slug résout le QR code via la vue `qr_codes_public` (SELECT public)
3. Le formulaire charge la taxonomie (SELECT public sur `tax_*`)
4. Le ticket est créé avec `created_by = null` (INSERT anonyme autorisé par RLS si source = `'qr_code'`)
5. Un code de suivi `XXXX-XXXX` est généré et affiché à l'utilisateur

⚠️ Ce flux a nécessité des corrections RLS spécifiques — les politiques doivent autoriser `anon` sur `qr_codes_public`, les tables taxonomy, et INSERT sur `tickets`.

## Edge Functions

| Fonction           | Rôle                        | Auth                        |
| ------------------ | --------------------------- | --------------------------- |
| `create-user`      | Création utilisateur admin  | JWT admin requis            |
| `delete-user`      | Suppression + anonymisation RGPD | JWT admin requis       |
| `update-user-email`| Modification email          | JWT admin requis            |
| `send-email`       | Envoi email via Resend      | JWT ou Service Role Key     |
| `notification-engine` | Orchestration multi-canal | JWT utilisateur             |
| `expire-memberships` | Désactivation auto des accès expirés | Cron interne (pas de JWT) |
| `rgpd`             | Export/suppression données  | JWT utilisateur             |

Toutes les edge functions (sauf `expire-memberships`) vérifient le JWT via `getClaims()` avant d'exécuter. La suppression d'utilisateur anonymise les champs `reporter_name` et `reporter_email` des tickets associés conformément au RGPD.

## Système de rôles

43 rôles hiérarchiques triés par `sort_order`. Les rôles critiques :

| Rôle               | sort_order | Scope       | Accès                              |
| ------------------ | ---------- | ----------- | ---------------------------------- |
| `admin_platform`   | 1          | Plateforme  | Accès total, gestion multi-org     |
| `super_admin`      | 2          | Plateforme  | Accès global illimité              |
| `admin_org`        | 10         | Organisation| Gestion complète d'une org         |
| `syndic`           | 13         | Organisation| Gestion opérationnelle             |
| `conseil_syndical` | 14         | Organisation| Validation, lecture étendue        |
| `proprietaire`     | 20         | Terrain     | Accès limité à ses lieux           |
| `locataire`        | 22         | Terrain     | Accès limité à ses lieux           |

### Protection contre l'escalade de privilèges

La politique RLS sur `memberships` impose qu'un utilisateur ne peut créer un membership qu'avec un `sort_order >=` à son propre rôle le plus élevé. Cela empêche un manager de s'attribuer un rôle admin.

### Héritage hiérarchique des accès

La fonction `fn_user_has_location_access` implémente un modèle hybride :

- Les rôles `admin`, `admin_org`, `manager`, `gestionnaire` à un niveau parent (ensemble ou groupe) héritent automatiquement de l'accès aux niveaux enfants
- Les rôles opérationnels (`member`, `viewer`) nécessitent une attribution explicite au niveau cible

### Vérification des permissions

La vérification se fait à deux niveaux :

1. **RLS côté Supabase** (sécurité serveur) — via `fn_has_org_perm()` et `fn_has_perm()`
2. **`useSimulatedPermissions`** côté React (UX — masquer les éléments non autorisés)

⚠️ Ne JAMAIS se fier uniquement au contrôle côté client. Le RLS est la seule barrière de sécurité réelle.

## Fonctions de sécurité (SECURITY DEFINER)

| Fonction                        | Rôle                                                |
| ------------------------------- | --------------------------------------------------- |
| `fn_has_perm`                   | Vérifie une permission via building_id               |
| `fn_has_org_perm`               | Vérifie une permission via organization_id           |
| `fn_user_has_location_access`   | Résout l'accès hiérarchique (ensemble → groupe → élément) |
| `fn_can_add_ticket_activity`    | Contourne les limitations RLS pour les activités ticket |
| `fn_deactivate_expired_memberships` | Désactive les memberships expirés (cron)         |
| `fn_audit_membership_changes`   | Trace toutes les modifications de memberships        |
| `regenerate_qr_code`            | Régénère un QR avec vérification d'accès org         |

Toutes utilisent `SET search_path TO 'public'` pour prévenir les attaques par injection de schéma.

## Audit

Toutes les modifications de memberships (`memberships` et `location_memberships`) sont automatiquement tracées dans `audit_logs` via des triggers (`fn_audit_membership_changes`, `fn_audit_location_membership_changes`).

Les changements de tickets (statut, assignation, priorité) sont tracés via le trigger `log_ticket_changes` dans `ticket_activities`.

## Bonnes pratiques

- Toute nouvelle table DOIT avoir des politiques RLS avant d'être utilisée
- Tester les politiques RLS avec un utilisateur non-admin après chaque modification
- Les edge functions DOIVENT vérifier le JWT ET le rôle
- Aucun `service_role` key côté client — uniquement `anon` key
- Les buckets storage sont en accès restreint (sécurisation dédiée prévue)

## Vulnérabilités connues et mitigations

| Risque                                        | Statut   | Mitigation                                          |
| --------------------------------------------- | -------- | --------------------------------------------------- |
| Bucket `ticket-attachments` public             | Différé  | Edge function d'upload dédiée prévue                |
| Pas de rate limiting sur le formulaire public  | À faire  | Implémenter côté edge function ou Supabase          |
| Pas de CAPTCHA sur le formulaire QR            | À faire  | Intégrer un CAPTCHA simple                          |
| Resend domain verification non complété        | En cours | API key configurée, emails bloqués sur domaine custom |
