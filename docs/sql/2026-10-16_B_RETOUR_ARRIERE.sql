-- =====================================================================
-- RETOUR ARRIÈRE de B — remet `ticket-attachments` dans l'état d'avant
-- =====================================================================
-- À n'exécuter QUE si l'étape B pose un problème bloquant.
-- ⚠️ Cela ré-ouvre la faille : tous les fichiers redeviennent lisibles par tous.
-- =====================================================================

begin;

update storage.buckets
set public = true,
    file_size_limit = null
where id = 'ticket-attachments';

drop policy if exists "ticket_attachments_insert" on storage.objects;
drop policy if exists "ticket_attachments_select_if_ticket_visible" on storage.objects;

create policy "Anyone can upload ticket attachments"
on storage.objects for insert
with check (bucket_id = 'ticket-attachments');

create policy "Anyone can read ticket attachments"
on storage.objects for select
using (bucket_id = 'ticket-attachments');

-- L'index tickets_attachments_gin est sans risque : on le garde.

commit;
