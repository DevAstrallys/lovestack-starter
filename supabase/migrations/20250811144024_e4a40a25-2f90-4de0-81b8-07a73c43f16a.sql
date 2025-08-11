-- Insert all roles into the roles table
INSERT INTO public.roles (code, label, is_platform_scope) VALUES
-- Phase 1: MVP Core (16 rôles)
('ADMIN', '{"fr": "Administrateur", "en": "Administrator"}', true),
('GESTIONNAIRE', '{"fr": "Gestionnaire", "en": "Manager"}', false),
('PROPRIETAIRE', '{"fr": "Propriétaire", "en": "Owner"}', false),
('LOCATAIRE', '{"fr": "Locataire", "en": "Tenant"}', false),
('CONSEIL_SYNDICAL', '{"fr": "Conseil Syndical", "en": "Syndicate Council"}', false),
('PRESTATAIRE', '{"fr": "Prestataire", "en": "Service Provider"}', false),
('GARDIEN', '{"fr": "Gardien", "en": "Caretaker"}', false),
('TECHNICIEN', '{"fr": "Technicien", "en": "Technician"}', false),
('MAINTENANCE', '{"fr": "Maintenance", "en": "Maintenance"}', false),
('URGENCE', '{"fr": "Urgence", "en": "Emergency"}', false),
('VISITEUR', '{"fr": "Visiteur", "en": "Visitor"}', false),
('CONSULTANT', '{"fr": "Consultant", "en": "Consultant"}', false),
('COMPTABLE', '{"fr": "Comptable", "en": "Accountant"}', false),
('JURIDIQUE', '{"fr": "Juridique", "en": "Legal"}', false),
('CONTROLE', '{"fr": "Contrôle", "en": "Control"}', false),
('INVITE', '{"fr": "Invité", "en": "Guest"}', false),

-- Phase 2: Business Extensions (6 rôles)
('SYNDIC', '{"fr": "Syndic", "en": "Property Manager"}', false),
('EXPERT', '{"fr": "Expert", "en": "Expert"}', false),
('ASSURANCE', '{"fr": "Assurance", "en": "Insurance"}', false),
('NOTAIRE', '{"fr": "Notaire", "en": "Notary"}', false),
('AUDITEUR', '{"fr": "Auditeur", "en": "Auditor"}', false),
('PARTENAIRE', '{"fr": "Partenaire", "en": "Partner"}', false)

ON CONFLICT (code) DO NOTHING;

-- Insert comprehensive permissions
INSERT INTO public.permissions (code, label) VALUES
-- Core entity permissions
('entity.read', '{"fr": "Lecture des entités", "en": "Read entities"}'),
('entity.write', '{"fr": "Écriture des entités", "en": "Write entities"}'),
('entity.delete', '{"fr": "Suppression des entités", "en": "Delete entities"}'),
('entity.validate', '{"fr": "Validation des entités", "en": "Validate entities"}'),
('entity.comment', '{"fr": "Commentaire des entités", "en": "Comment entities"}'),

-- User management
('users.read', '{"fr": "Lecture des utilisateurs", "en": "Read users"}'),
('users.write', '{"fr": "Écriture des utilisateurs", "en": "Write users"}'),
('users.invite', '{"fr": "Invitation des utilisateurs", "en": "Invite users"}'),
('users.manage', '{"fr": "Gestion des utilisateurs", "en": "Manage users"}'),

-- Location management
('locations.read', '{"fr": "Lecture des lieux", "en": "Read locations"}'),
('locations.write', '{"fr": "Écriture des lieux", "en": "Write locations"}'),
('locations.manage', '{"fr": "Gestion des lieux", "en": "Manage locations"}'),
('locations.access', '{"fr": "Accès aux lieux", "en": "Access locations"}'),

-- Building management
('buildings.read', '{"fr": "Lecture des bâtiments", "en": "Read buildings"}'),
('buildings.write', '{"fr": "Écriture des bâtiments", "en": "Write buildings"}'),
('buildings.manage', '{"fr": "Gestion des bâtiments", "en": "Manage buildings"}'),
('building.read', '{"fr": "Lecture du bâtiment", "en": "Read building"}'),
('building.write', '{"fr": "Écriture du bâtiment", "en": "Write building"}'),

-- Document management
('documents.read', '{"fr": "Lecture des documents", "en": "Read documents"}'),
('documents.write', '{"fr": "Écriture des documents", "en": "Write documents"}'),
('documents.manage', '{"fr": "Gestion des documents", "en": "Manage documents"}'),
('document.read', '{"fr": "Lecture du document", "en": "Read document"}'),

-- Contract management
('contracts.read', '{"fr": "Lecture des contrats", "en": "Read contracts"}'),
('contracts.write', '{"fr": "Écriture des contrats", "en": "Write contracts"}'),
('contracts.create', '{"fr": "Création des contrats", "en": "Create contracts"}'),
('contracts.update', '{"fr": "Mise à jour des contrats", "en": "Update contracts"}'),
('contracts.review', '{"fr": "Révision des contrats", "en": "Review contracts"}'),
('contract.read', '{"fr": "Lecture du contrat", "en": "Read contract"}'),

-- Financial management
('budgets.read', '{"fr": "Lecture des budgets", "en": "Read budgets"}'),
('budgets.write', '{"fr": "Écriture des budgets", "en": "Write budgets"}'),
('budgets.review', '{"fr": "Révision des budgets", "en": "Review budgets"}'),
('finances.read', '{"fr": "Lecture des finances", "en": "Read finances"}'),
('finances.write', '{"fr": "Écriture des finances", "en": "Write finances"}'),

-- Ticket management
('tickets.read', '{"fr": "Lecture des tickets", "en": "Read tickets"}'),
('tickets.write', '{"fr": "Écriture des tickets", "en": "Write tickets"}'),
('tickets.create', '{"fr": "Création des tickets", "en": "Create tickets"}'),
('tickets.assign', '{"fr": "Assignation des tickets", "en": "Assign tickets"}'),
('tickets.resolve', '{"fr": "Résolution des tickets", "en": "Resolve tickets"}'),

-- Equipment management
('equipment.read', '{"fr": "Lecture des équipements", "en": "Read equipment"}'),
('equipment.write', '{"fr": "Écriture des équipements", "en": "Write equipment"}'),
('equipment.manage', '{"fr": "Gestion des équipements", "en": "Manage equipment"}'),

-- Survey management
('surveys.read', '{"fr": "Lecture des sondages", "en": "Read surveys"}'),
('surveys.write', '{"fr": "Écriture des sondages", "en": "Write surveys"}'),
('surveys.manage', '{"fr": "Gestion des sondages", "en": "Manage surveys"}'),

-- Report management
('reports.read', '{"fr": "Lecture des rapports", "en": "Read reports"}'),
('reports.write', '{"fr": "Écriture des rapports", "en": "Write reports"}'),
('reports.request', '{"fr": "Demande de rapports", "en": "Request reports"}'),

-- QR Code management
('qr_codes.read', '{"fr": "Lecture des QR codes", "en": "Read QR codes"}'),
('qr_codes.write', '{"fr": "Écriture des QR codes", "en": "Write QR codes"}'),
('qr_codes.manage', '{"fr": "Gestion des QR codes", "en": "Manage QR codes"}'),

-- Module management
('modules.read', '{"fr": "Lecture des modules", "en": "Read modules"}'),
('modules.write', '{"fr": "Écriture des modules", "en": "Write modules"}'),
('modules.manage', '{"fr": "Gestion des modules", "en": "Manage modules"}'),

-- Organization management
('organization.read', '{"fr": "Lecture de l\'organisation", "en": "Read organization"}'),
('organization.write', '{"fr": "Écriture de l\'organisation", "en": "Write organization"}'),
('organization.manage', '{"fr": "Gestion de l\'organisation", "en": "Manage organization"}'),

-- Company management
('company.read', '{"fr": "Lecture des entreprises", "en": "Read companies"}'),
('company.write', '{"fr": "Écriture des entreprises", "en": "Write companies"}'),

-- Notification management
('notifications.read', '{"fr": "Lecture des notifications", "en": "Read notifications"}'),
('notifications.send', '{"fr": "Envoi des notifications", "en": "Send notifications"}'),

-- Emergency permissions
('emergency.access', '{"fr": "Accès d\'urgence", "en": "Emergency access"}'),
('emergency.override', '{"fr": "Override d\'urgence", "en": "Emergency override"}'),

-- Audit permissions
('audit.read', '{"fr": "Lecture des audits", "en": "Read audits"}'),
('audit.write', '{"fr": "Écriture des audits", "en": "Write audits"}'),

-- Platform admin permissions
('platform.admin', '{"fr": "Administration plateforme", "en": "Platform administration"}'),
('system.settings', '{"fr": "Paramètres système", "en": "System settings"}')

ON CONFLICT (code) DO NOTHING;