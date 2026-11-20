-- AGENDA DE TALLERES CON CÓDIGO
--
-- Cada taller que se concreta por WhatsApp lo registra un administrador en
-- `institutional_activities`. Al guardarlo, la base de datos le asigna un código
-- fácil de dictar (p. ej. COMETA-274) para que la escuela o familia consulte sus datos.
--
-- Privacidad (por la seguridad de los niños):
--   · Público (sin cuenta): solo ve QUÉ DÍA hay taller y CUÁL taller → agenda_public().
--   · Con el código: ve todos los datos de SU taller → agenda_by_code().
--   · Administradores/maestros: ven todo directamente en la tabla (política de staff).
-- Por eso se quita la lectura pública directa de la tabla.

-- 1) Columnas nuevas ---------------------------------------------------------
alter table public.institutional_activities
  add column if not exists code text,
  add column if not exists client_name text,
  add column if not exists contact_phone text,
  add column if not exists notes text,
  -- Talleres del catálogo de la app (ids como 'insectos', 'robotica'...). Uno o varios.
  add column if not exists workshop_keys text[] not null default '{}';

alter table public.institutional_activities alter column school_grade drop not null;
alter table public.institutional_activities alter column student_count drop not null;
alter table public.institutional_activities alter column created_by set default auth.uid();

-- 2) Generador de códigos ----------------------------------------------------
-- Palabra científica (sin acentos, para escribirla fácil) + 3 cifras: ~85 mil combinaciones.
create or replace function public.generate_activity_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  words text[] := array[
    'ATOMO','COMETA','NEBULOSA','GALAXIA','ORBITA','PLANETA','ESTRELLA','LUNA','ECLIPSE','METEORO',
    'AURORA','QUASAR','PULSAR','CRATER','SATURNO','JUPITER','MARTE','VENUS','ORION','VOLCAN',
    'CRISTAL','CUARZO','FOSIL','MAGMA','GLACIAR','CORAL','HELECHO','MUSGO','SEMILLA','POLEN',
    'ABEJA','CATARINA','MARIPOSA','LUCIERNAGA','AJOLOTE','COLIBRI','JAGUAR','TORTUGA','PITON','CAMALEON',
    'BALLENA','PULPO','MEDUSA','DELFIN','CELULA','NEURONA','ENZIMA','PROTON','NEUTRON','ELECTRON',
    'FOTON','IMAN','PRISMA','LASER','PLASMA','ENERGIA','VOLTIO','CIRCUITO','ROBOT','COHETE',
    'TELESCOPIO','MICROSCOPIO','LUPA','PROBETA','MATRAZ','BURBUJA','OXIGENO','CARBONO','HELIO','NEON',
    'SODIO','CALCIO','FOSFORO','HIERRO','COBRE','ZAFIRO','BRUJULA','RAYO','TRUENO','ARCOIRIS',
    'NUBE','TORNADO','CICLON','OCEANO','SELVA','BOSQUE','HONGO','LIQUEN','ORIGAMI','ENGRANE',
    'PALANCA','POLEA','ONDA','ECO','ESPIRAL'
  ];
  candidate text;
begin
  loop
    candidate := words[1 + floor(random() * array_length(words, 1))::int]
      || '-' || (100 + floor(random() * 900))::int::text;
    exit when not exists (select 1 from public.institutional_activities where code = candidate);
  end loop;
  return candidate;
end;
$$;

-- Al insertar, si no trae código se le genera uno. security definer: corre como dueño,
-- así el generador no necesita permisos públicos.
create or replace function public.set_activity_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.code is null or trim(new.code) = '' then
    new.code := public.generate_activity_code();
  else
    new.code := upper(trim(new.code));
  end if;
  return new;
end;
$$;

drop trigger if exists institutional_activities_code on public.institutional_activities;
create trigger institutional_activities_code
  before insert on public.institutional_activities
  for each row execute procedure public.set_activity_code();

-- Filas que ya existieran sin código.
update public.institutional_activities set code = public.generate_activity_code() where code is null;
alter table public.institutional_activities alter column code set not null;
create unique index if not exists institutional_activities_code_key on public.institutional_activities (code);

-- 3) Privacidad: sin lectura pública directa ---------------------------------
drop policy if exists "Anyone can view scheduled institutional activities" on public.institutional_activities;
drop policy if exists "Anyone can view activity workshops" on public.institutional_activity_workshops;
revoke select on public.institutional_activities from anon;
revoke select on public.institutional_activity_workshops from anon;
-- Los administradores siguen leyendo y escribiendo todo con "Staff manage institutional activities".

-- 4) Calendario público: solo día + talleres ---------------------------------
create or replace function public.agenda_public(p_from date, p_to date)
returns table (day date, workshop_keys text[])
language sql
security definer
set search_path = public
stable
as $$
  select (a.starts_at at time zone 'America/Mexico_City')::date as day, a.workshop_keys
    from public.institutional_activities a
   where a.status = 'scheduled'
     and p_to - p_from <= 92  -- como máximo ~3 meses por consulta
     and (a.starts_at at time zone 'America/Mexico_City')::date between p_from and p_to
   order by a.starts_at;
$$;

-- 5) Consulta con código: todos los datos de ESE taller ----------------------
-- Acepta "cometa-274", "COMETA 274" o "cometa274". Solo talleres de hace 2 días en adelante.
-- La pausa corta frena a quien intente adivinar códigos probando miles.
create or replace function public.agenda_by_code(p_code text)
returns table (
  code text,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  client_name text,
  workshop_keys text[],
  student_count integer,
  school_grade text,
  status public.session_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  wanted text := regexp_replace(translate(upper(coalesce(p_code, '')), 'ÁÉÍÓÚÜÑ', 'AEIOUUN'), '[^A-Z0-9]', '', 'g');
begin
  perform pg_sleep(0.4);
  if char_length(wanted) < 4 then
    return;
  end if;
  return query
    select a.code, a.starts_at, a.ends_at, a.location, a.client_name, a.workshop_keys,
           a.student_count, a.school_grade, a.status
      from public.institutional_activities a
     where replace(a.code, '-', '') = wanted
       and a.starts_at > now() - interval '2 days'
     limit 1;
end;
$$;

-- 6) Permisos de las funciones ------------------------------------------------
revoke execute on function public.generate_activity_code() from public, anon, authenticated;
revoke execute on function public.set_activity_code() from public, anon, authenticated;
revoke execute on function public.agenda_public(date, date) from public;
revoke execute on function public.agenda_by_code(text) from public;
grant execute on function public.agenda_public(date, date) to anon, authenticated;
grant execute on function public.agenda_by_code(text) to anon, authenticated;
