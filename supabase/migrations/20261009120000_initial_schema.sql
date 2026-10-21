create type public.app_role as enum ('tutor', 'admin', 'agenda_manager');
create type public.content_status as enum ('draft', 'published', 'cancelled', 'archived');
create type public.session_status as enum ('scheduled', 'cancelled', 'completed');
create type public.registration_status as enum ('confirmed', 'waitlisted', 'cancelled', 'attended');
create type public.event_type as enum ('public_event', 'cinema', 'astronomy_night', 'community_activity', 'talk');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'tutor',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.children_profiles (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.profiles(id) on delete cascade,
  alias text not null check (char_length(trim(alias)) between 1 and 60),
  age_range text,
  avatar_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  eyebrow text,
  category text,
  description text not null,
  hook text,
  activities text[] not null default '{}',
  takeaways text[] not null default '{}',
  audience text,
  duration text,
  capacity_description text,
  safety_note text,
  accent text,
  status public.content_status not null default 'draft',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.workshop_images (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  storage_path text not null,
  image_type text not null check (image_type in ('cover', 'gallery')),
  sort_order integer not null default 0 check (sort_order >= 0),
  alt_text text,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index one_cover_per_workshop
  on public.workshop_images (workshop_id)
  where image_type = 'cover';

create table public.workshop_sessions (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null,
  capacity integer check (capacity is null or capacity > 0),
  status public.session_status not null default 'scheduled',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at is null or ends_at > starts_at)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  event_type public.event_type not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null,
  capacity integer check (capacity is null or capacity > 0),
  status public.session_status not null default 'scheduled',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at is null or ends_at > starts_at)
);

create table public.institutional_activities (
  id uuid primary key default gen_random_uuid(),
  location text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  student_count integer not null check (student_count > 0),
  school_grade text not null,
  status public.session_status not null default 'scheduled',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at is null or ends_at > starts_at)
);

create table public.institutional_activity_workshops (
  activity_id uuid not null references public.institutional_activities(id) on delete cascade,
  workshop_id uuid not null references public.workshops(id),
  primary key (activity_id, workshop_id)
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workshop_sessions(id) on delete cascade,
  child_profile_id uuid not null references public.children_profiles(id) on delete cascade,
  guardian_id uuid not null references public.profiles(id) on delete cascade,
  status public.registration_status not null default 'confirmed',
  confirmation_code text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  cancelled_at timestamptz,
  unique (session_id, child_profile_id)
);

create index workshop_images_workshop_order_idx on public.workshop_images (workshop_id, sort_order);
create index workshop_sessions_start_idx on public.workshop_sessions (starts_at);
create index events_start_idx on public.events (starts_at);
create index institutional_activities_start_idx on public.institutional_activities (starts_at);
create index registrations_guardian_idx on public.registrations (guardian_id);

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'agenda_manager')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.children_profiles enable row level security;
alter table public.workshops enable row level security;
alter table public.workshop_images enable row level security;
alter table public.workshop_sessions enable row level security;
alter table public.events enable row level security;
alter table public.institutional_activities enable row level security;
alter table public.institutional_activity_workshops enable row level security;
alter table public.registrations enable row level security;

create policy "Users can view their profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_staff());

create policy "Users can update their profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Guardians manage their children"
  on public.children_profiles for all
  using (guardian_id = auth.uid())
  with check (guardian_id = auth.uid());

create policy "Anyone can view published workshops"
  on public.workshops for select
  using (status = 'published' or public.is_staff());

create policy "Staff manage workshops"
  on public.workshops for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Anyone can view images for visible workshops"
  on public.workshop_images for select
  using (exists (
    select 1 from public.workshops
    where id = workshop_id and (status = 'published' or public.is_staff())
  ));

create policy "Staff manage workshop images"
  on public.workshop_images for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Anyone can view scheduled sessions"
  on public.workshop_sessions for select
  using (status = 'scheduled' or public.is_staff());

create policy "Staff manage sessions"
  on public.workshop_sessions for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Anyone can view scheduled events"
  on public.events for select
  using (status = 'scheduled' or public.is_staff());

create policy "Staff manage events"
  on public.events for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Anyone can view scheduled institutional activities"
  on public.institutional_activities for select
  using (status = 'scheduled' or public.is_staff());

create policy "Staff manage institutional activities"
  on public.institutional_activities for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Anyone can view activity workshops"
  on public.institutional_activity_workshops for select
  using (exists (
    select 1 from public.institutional_activities
    where id = activity_id and (status = 'scheduled' or public.is_staff())
  ));

create policy "Staff manage activity workshops"
  on public.institutional_activity_workshops for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Guardians view their registrations"
  on public.registrations for select
  using (guardian_id = auth.uid() or public.is_staff());

create policy "Guardians create registrations for their children"
  on public.registrations for insert
  with check (
    guardian_id = auth.uid()
    and exists (
      select 1 from public.children_profiles
      where id = child_profile_id and guardian_id = auth.uid() and is_active
    )
  );

create policy "Guardians cancel their registrations"
  on public.registrations for update
  using (guardian_id = auth.uid())
  with check (guardian_id = auth.uid());

create policy "Staff manage registrations"
  on public.registrations for all
  using (public.is_staff())
  with check (public.is_staff());
