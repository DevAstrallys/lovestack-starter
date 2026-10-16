-- =====================================================================
-- A — Création de l'espace PUBLIC pour les logos d'organisation
-- =====================================================================
-- Quand : AVANT de fusionner la demande de fusion GitHub.
-- Effet : AJOUT uniquement. Ne modifie et ne supprime rien d'existant.
-- Réversible : oui (voir « RETOUR ARRIÈRE » en bas).
--
-- Pourquoi : les logos étaient rangés dans `ticket-attachments`, qui va
-- devenir privé. Un logo doit rester visible publiquement (pages QR,
-- en-têtes), il lui faut donc son propre espace public.
--
-- SVG volontairement exclu : un SVG peut contenir du code exécutable.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organization-logos',
  'organization-logos',
  true,                                        -- lecture publique (logos)
  2097152,                                     -- 2 Mo maximum
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- Dépôt d'un logo : uniquement un administrateur plateforme, ou un membre
-- ayant la permission `organization.manage` sur l'organisation concernée.
-- Le premier dossier du chemin est l'id de l'organisation : <org_id>/logo-xxx.png
drop policy if exists "org_logos_insert_by_org_managers" on storage.objects;
create policy "org_logos_insert_by_org_managers"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'organization-logos'
  and (
    exists (
      select 1
      from public.memberships m
      join public.roles r on r.id = m.role_id
      where m.user_id = auth.uid()
        and m.is_active
        and r.code = 'admin_platform'
    )
    or case
         when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         then public.fn_has_org_perm(auth.uid(), ((storage.foldername(name))[1])::uuid, 'organization.manage')
         else false
       end
  )
);

-- Aucune règle SELECT / UPDATE / DELETE : les logos sont lisibles via leur
-- adresse publique, mais personne ne peut lister, écraser ou supprimer
-- les fichiers depuis l'application. Chaque envoi crée un nouveau fichier.

-- =====================================================================
-- VÉRIFICATION (lecture seule) — doit renvoyer 1 ligne : organization-logos | true
-- =====================================================================
-- select id, public from storage.buckets where id = 'organization-logos';

-- =====================================================================
-- RETOUR ARRIÈRE (ne pas exécuter sauf problème)
-- =====================================================================
-- drop policy if exists "org_logos_insert_by_org_managers" on storage.objects;
-- puis supprimer l'espace « organization-logos » depuis Supabase > Storage.
