-- =====================================================================
-- B — Rendre l'espace `ticket-attachments` PRIVÉ
-- =====================================================================
-- Quand : UNIQUEMENT APRÈS que la demande de fusion GitHub a été fusionnée
--         ET que les pièces jointes s'affichent toujours dans Lovable.
--         (Le nouveau code fonctionne avec l'espace public ET privé ;
--          l'ancien code, lui, casse si on rend l'espace privé.)
-- Effet : MODIFIE la sécurité du stockage. Tout est dans une transaction :
--         si une ligne échoue, rien n'est appliqué.
-- Réversible : oui, voir 2026-10-16_B_RETOUR_ARRIERE.sql
--
-- ⚠️ Les noms des deux anciennes règles ci-dessous viennent des migrations
--    du dépôt. Ils seront confirmés avec le diagnostic avant exécution.
-- =====================================================================

begin;

-- 1. Espace privé + taille maximale côté serveur (20 Mo, comme l'interface)
update storage.buckets
set public = false,
    file_size_limit = 20971520
where id = 'ticket-attachments';

-- 2. Suppression des anciennes règles « tout le monde peut tout lire / déposer »
drop policy if exists "Anyone can upload ticket attachments" on storage.objects;
drop policy if exists "Anyone can read ticket attachments" on storage.objects;

-- 3. DÉPÔT
--    - Formulaire de déclaration (anonyme ou connecté) : fichier à la racine,
--      nom aléatoire, sans dossier.
--    - Conversation d'un ticket : seulement une personne connectée, dans le
--      dossier d'un ticket qu'elle a le droit de voir.
--    Aucune règle UPDATE / DELETE : un fichier déposé ne peut être ni
--    écrasé ni supprimé depuis l'application.
drop policy if exists "ticket_attachments_insert" on storage.objects;
create policy "ticket_attachments_insert"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'ticket-attachments'
  and (
    coalesce(array_length(storage.foldername(name), 1), 0) = 0
    or (
      auth.uid() is not null
      and exists (
        select 1 from public.tickets t
        where t.id::text = (storage.foldername(name))[1]
      )
    )
  )
);

-- 4. LECTURE (= obtenir un lien temporaire) : seulement une personne connectée
--    qui a le droit de voir le ticket ou le message qui référence le fichier.
--    Les règles de sécurité existantes des tables `tickets` et
--    `ticket_activities` s'appliquent à l'intérieur de cette règle :
--    on ne peut lire que les fichiers des tickets qu'on voit déjà.
drop policy if exists "ticket_attachments_select_if_ticket_visible" on storage.objects;
create policy "ticket_attachments_select_if_ticket_visible"
on storage.objects for select to authenticated
using (
  bucket_id = 'ticket-attachments'
  and (
    -- pièces jointes du formulaire (tickets.attachments[].storage_path)
    exists (
      select 1 from public.tickets t
      where t.attachments @> jsonb_build_array(
              jsonb_build_object('storage_path', storage.objects.name))
    )
    -- fichiers envoyés dans la conversation (nouveau format)
    or exists (
      select 1 from public.ticket_activities a
      where a.metadata ->> 'attachment_path' = storage.objects.name
    )
    -- anciens fichiers de conversation : dossier = id du ticket
    or exists (
      select 1 from public.tickets t
      where t.id::text = (storage.foldername(storage.objects.name))[1]
    )
  )
);

-- 5. Index pour que la vérification ci-dessus reste rapide (ajout pur)
create index if not exists tickets_attachments_gin
  on public.tickets using gin (attachments jsonb_path_ops);

commit;

-- =====================================================================
-- VÉRIFICATION (lecture seule)
-- =====================================================================
-- select id, public, file_size_limit from storage.buckets where id = 'ticket-attachments';
--   → attendu : ticket-attachments | false | 20971520
-- select policyname, cmd from pg_policies
--   where schemaname = 'storage' and tablename = 'objects' and policyname like 'ticket_attachments%';
--   → attendu : 2 lignes (INSERT et SELECT)
