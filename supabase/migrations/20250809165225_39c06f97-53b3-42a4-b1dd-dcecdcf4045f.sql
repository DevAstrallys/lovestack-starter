-- ASTRALINK Schema - Complete database structure
create extension if not exists "uuid-ossp";

-- TAXONOMIES
create table public.taxonomies (
  id uuid primary key default uuid_generate_v4(),
  kind text not null check (kind in ('ticket_category','ticket_nature','document_tag','equipment_type','company_tag')),
  code text not null,
  label jsonb not null,
  is_active boolean not null default true,
  unique(kind, code)
);

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  locale text default 'fr',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- BUILDINGS & HIERARCHY
create table public.buildings (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  city text,
  zip_code text,
  country text default 'FR',
  timezone text default 'Europe/Paris',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.building_blocks (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entrances (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  block_id uuid references public.building_blocks(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.floors (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  entrance_id uuid references public.entrances(id) on delete set null,
  level int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  entrance_id uuid references public.entrances(id) on delete set null,
  floor_id uuid references public.floors(id) on delete set null,
  ref text,
  lot_number text,
  area_m2 numeric,
  is_private boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ROLES & PERMISSIONS
create table public.roles (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  label jsonb not null,
  is_platform_scope boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  label jsonb not null
);

create table public.role_permissions (
  role_id uuid references public.roles(id) on delete cascade,
  permission_id uuid references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- COMPANIES (forward declaration for memberships FK)
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  siret text,
  email text,
  phone text,
  address text,
  city text,
  zip_code text,
  tags text[],
  rating numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MEMBERSHIPS
create table public.memberships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  building_id uuid not null references public.buildings(id) on delete cascade,
  block_id uuid references public.building_blocks(id),
  entrance_id uuid references public.entrances(id),
  floor_id uuid references public.floors(id),
  unit_id uuid references public.units(id),
  company_id uuid references public.companies(id),
  is_active boolean not null default true,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- MODULES
create table public.modules (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  label jsonb not null,
  created_at timestamptz not null default now()
);

create table public.building_modules (
  building_id uuid references public.buildings(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  is_enabled boolean not null default true,
  config jsonb,
  primary key (building_id, module_id)
);

-- COMPANY USERS
create table public.company_users (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text,
  created_at timestamptz not null default now()
);

-- EQUIPMENT
create table public.equipment (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  location jsonb,
  ref text,
  type_code text,
  created_at timestamptz not null default now()
);

-- CONTRACTS
create table public.contracts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  building_id uuid not null references public.buildings(id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date,
  sla_json jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.equipment_contracts (
  contract_id uuid references public.contracts(id) on delete cascade,
  equipment_id uuid references public.equipment(id) on delete cascade,
  primary key (contract_id, equipment_id)
);

-- QR CODES
create table public.qr_codes (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  location jsonb,
  display_label text,
  target_slug text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- TICKETS
create type ticket_status as enum ('open','in_progress','waiting','resolved','closed','canceled');
create type ticket_priority as enum ('low','medium','high','urgent');

create table public.tickets (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  location jsonb,
  title text not null,
  description text,
  category_code text,
  nature_code text,
  priority ticket_priority default 'medium',
  status ticket_status not null default 'open',
  source text,
  created_by uuid references public.profiles(id),
  reporter_name text,
  reporter_email text,
  reporter_phone text,
  assigned_to uuid references public.profiles(id),
  duplicate_of uuid references public.tickets(id),
  communication_mode text,
  sla_due_at timestamptz,
  first_response_at timestamptz,
  closed_at timestamptz,
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ticket_events (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  kind text not null,
  data jsonb,
  created_at timestamptz not null default now()
);

create table public.ticket_followers (
  ticket_id uuid references public.tickets(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (ticket_id, user_id)
);

create table public.ticket_attachments (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  storage_path text not null,
  filename text,
  content_type text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- DOCUMENTS
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid references public.buildings(id) on delete cascade,
  title text not null,
  storage_path text not null,
  tags text[],
  visibility text not null default 'building',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.document_links (
  document_id uuid references public.documents(id) on delete cascade,
  ticket_id uuid references public.tickets(id) on delete cascade,
  primary key (document_id, ticket_id)
);

-- SURVEYS
create table public.surveys (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  title text not null,
  description text,
  target jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.survey_questions (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  kind text not null,
  label jsonb not null,
  options jsonb,
  position int not null default 0
);

create table public.survey_responses (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  user_id uuid references public.profiles(id),
  answers jsonb not null,
  created_at timestamptz not null default now()
);

-- REPORTS
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  name text not null,
  config jsonb not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.scheduled_reports (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references public.reports(id) on delete cascade,
  schedule text not null,
  target jsonb not null,
  is_active boolean not null default true,
  last_run_at timestamptz
);

-- NOTIFICATIONS / OUTBOX
create table public.notifications_prefs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email boolean default true,
  sms boolean default false,
  push boolean default true,
  locale text default 'fr'
);

create table public.channels_outbox (
  id uuid primary key default uuid_generate_v4(),
  channel text not null,
  to_ref jsonb not null,
  subject text,
  body text,
  payload jsonb,
  status text not null default 'queued',
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- WEBHOOKS / AUDIT
create table public.webhooks (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid references public.buildings(id) on delete cascade,
  url text not null,
  secret text,
  events text[] not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  data jsonb,
  created_at timestamptz not null default now()
);

-- Helper functions for RLS
create or replace function public.fn_context_covers(
  m_block uuid,
  m_entrance uuid,
  m_floor uuid,
  m_unit uuid,
  loc jsonb
) returns boolean
language sql immutable as $$
  select
    (m_unit     is null or (loc ? 'unit_id')     and (loc->>'unit_id')::uuid     = m_unit) and
    (m_floor    is null or (loc ? 'floor_id')    and (loc->>'floor_id')::uuid    = m_floor) and
    (m_entrance is null or (loc ? 'entrance_id') and (loc->>'entrance_id')::uuid = m_entrance) and
    (m_block    is null or (loc ? 'block_id')    and (loc->>'block_id')::uuid    = m_block);
$$;

create or replace function public.fn_has_perm(
  uid uuid,
  bld uuid,
  perm_code text
) returns boolean
security definer
set search_path = public
language sql as $$
  select exists (
    select 1
    from public.memberships m
    join public.roles r on r.id = m.role_id
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where m.user_id = uid
      and m.building_id = bld
      and m.is_active
      and p.code = perm_code
  );
$$;

-- Enable RLS on main tables
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.buildings enable row level security;
alter table public.tickets enable row level security;
alter table public.documents enable row level security;
alter table public.surveys enable row level security;
alter table public.companies enable row level security;

-- Basic RLS policies
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id);

create policy "memberships_select_self"
on public.memberships
for select
to authenticated
using (auth.uid() = user_id);

create policy "memberships_select_building_admins"
on public.memberships
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships m2
    join public.roles r2 on r2.id = m2.role_id
    where m2.user_id = auth.uid()
      and m2.is_active
      and m2.building_id = memberships.building_id
      and r2.code in ('property_manager','tech_support','admin_platform')
  )
);

create policy "tickets_select_scoped"
on public.tickets
for select
to authenticated
using (
  (created_by = auth.uid())
  or (assigned_to = auth.uid())
  or exists (
      select 1 from public.ticket_followers tf
      where tf.ticket_id = tickets.id and tf.user_id = auth.uid()
  )
  or exists (
      select 1
      from public.memberships m
      join public.roles r on r.id = m.role_id
      join public.role_permissions rp on rp.role_id = r.id
      join public.permissions p on p.id = rp.permission_id and p.code = 'ticket.read'
      where m.user_id = auth.uid()
        and m.is_active
        and m.building_id = tickets.building_id
        and public.fn_context_covers(m.block_id, m.entrance_id, m.floor_id, m.unit_id, tickets.location)
  )
);

-- Trigger for auto-updating updated_at timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_buildings_updated_at before update on public.buildings
  for each row execute function public.update_updated_at_column();

create trigger update_tickets_updated_at before update on public.tickets
  for each row execute function public.update_updated_at_column();

-- Trigger for auto profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, locale)
  values (new.id, new.raw_user_meta_data ->> 'full_name', coalesce(new.raw_user_meta_data ->> 'locale', 'fr'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();