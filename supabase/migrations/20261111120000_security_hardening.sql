-- =============================================================================
-- Endurecimiento de seguridad
--
-- 1. Un usuario ya no puede cambiar su propio rol (antes podía hacerse admin).
-- 2. Solo un admin puede cambiar roles, mediante la función set_user_role().
-- 3. Los tutores ya no escriben directo en `registrations`: usan las funciones
--    register_child() y cancel_registration(), que validan cupo, fechas y
--    lista de espera. El staff sigue gestionando inscripciones directamente.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. PERFILES: permisos por columna
-- -----------------------------------------------------------------------------
-- Antes: "grant update on profiles" permitía actualizar TODAS las columnas,
-- incluida `role`. La política RLS solo revisaba que la fila fuera tuya, no
-- qué columnas cambiabas. Ahora solo se pueden editar nombre y teléfono.

revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;


-- -----------------------------------------------------------------------------
-- 2. CAMBIO DE ROL: solo administradores
-- -----------------------------------------------------------------------------
-- `security definer` hace que la función se ejecute con permisos de su dueño
-- (puede escribir `role`), pero dentro validamos que quien la llama sea admin.

create or replace function public.set_user_role(target_user uuid, new_role public.app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar roles' using errcode = '42501';
  end if;

  -- Evita que la asociación se quede sin ningún administrador.
  if target_user = auth.uid() and new_role <> 'admin' then
    raise exception 'No puedes quitarte tu propio rol de administrador' using errcode = '42501';
  end if;

  update public.profiles
     set role = new_role,
         updated_at = timezone('utc', now())
   where id = target_user;

  if not found then
    raise exception 'Usuario no encontrado' using errcode = 'P0002';
  end if;
end;
$$;


-- -----------------------------------------------------------------------------
-- 3. INSCRIPCIONES: los tutores pasan por funciones validadas
-- -----------------------------------------------------------------------------
-- Antes un tutor podía insertar/actualizar cualquier columna de su inscripción:
-- marcarse como 'attended', cambiar de sesión o saltarse el cupo.
-- Quitamos sus políticas de escritura; la de staff ("Staff manage registrations")
-- y la de lectura ("Guardians view their registrations") se conservan.

drop policy if exists "Guardians create registrations for their children" on public.registrations;
drop policy if exists "Guardians cancel their registrations" on public.registrations;


-- Inscribe a un niño en una sesión. Si hay cupo queda 'confirmed'; si está
-- llena queda 'waitlisted'. Si ya existía una inscripción cancelada, la reactiva.
create or replace function public.register_child(p_session_id uuid, p_child_id uuid)
returns public.registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.workshop_sessions;
  v_taken integer;
  v_status public.registration_status;
  v_existing public.registrations;
  v_result public.registrations;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;

  -- El niño debe pertenecer al tutor y estar activo.
  if not exists (
    select 1 from public.children_profiles
     where id = p_child_id and guardian_id = auth.uid() and is_active
  ) then
    raise exception 'Perfil infantil no válido' using errcode = '42501';
  end if;

  -- `for update` bloquea la sesión mientras contamos lugares: si dos tutores
  -- se inscriben al mismo tiempo, el segundo espera y ve el conteo correcto.
  select * into v_session
    from public.workshop_sessions
   where id = p_session_id
   for update;

  if not found or v_session.status <> 'scheduled' or v_session.starts_at <= now() then
    raise exception 'La sesión no está disponible para inscripción' using errcode = 'P0001';
  end if;

  select * into v_existing
    from public.registrations
   where session_id = p_session_id and child_profile_id = p_child_id;

  if found and v_existing.status <> 'cancelled' then
    raise exception 'Este niño ya está inscrito en la sesión' using errcode = '23505';
  end if;

  select count(*) into v_taken
    from public.registrations
   where session_id = p_session_id and status in ('confirmed', 'attended');

  v_status := case
    when v_session.capacity is null or v_taken < v_session.capacity then 'confirmed'
    else 'waitlisted'
  end;

  if v_existing.id is not null then
    update public.registrations
       set status = v_status,
           cancelled_at = null,
           created_at = timezone('utc', now())  -- vuelve al final de la fila
     where id = v_existing.id
    returning * into v_result;
  else
    insert into public.registrations (session_id, child_profile_id, guardian_id, status, confirmation_code)
    values (
      p_session_id,
      p_child_id,
      auth.uid(),
      v_status,
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
    )
    returning * into v_result;
  end if;

  return v_result;
end;
$$;


-- Cancela una inscripción propia. Si liberaba un lugar confirmado, sube al
-- primero de la lista de espera.
create or replace function public.cancel_registration(p_registration_id uuid)
returns public.registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg public.registrations;
  v_next_id uuid;
begin
  select * into v_reg
    from public.registrations
   where id = p_registration_id and guardian_id = auth.uid()
   for update;

  if not found then
    raise exception 'Inscripción no encontrada' using errcode = 'P0002';
  end if;

  if v_reg.status not in ('confirmed', 'waitlisted') then
    raise exception 'Esta inscripción ya no se puede cancelar' using errcode = 'P0001';
  end if;

  -- Bloqueamos la sesión para que la promoción de la lista de espera no
  -- compita con una inscripción simultánea.
  perform 1 from public.workshop_sessions where id = v_reg.session_id for update;

  update public.registrations
     set status = 'cancelled',
         cancelled_at = timezone('utc', now())
   where id = v_reg.id
  returning * into v_reg;

  select id into v_next_id
    from public.registrations
   where session_id = v_reg.session_id and status = 'waitlisted'
   order by created_at
   limit 1;

  -- Solo promovemos si de verdad hay un lugar libre (si quien canceló estaba
  -- en lista de espera, el cupo sigue lleno). Lo comprobamos recontando.
  if v_next_id is not null and exists (
    select 1 from public.workshop_sessions s
     where s.id = v_reg.session_id
       and (s.capacity is null or s.capacity > (
         select count(*) from public.registrations r
          where r.session_id = s.id and r.status in ('confirmed', 'attended')
       ))
  ) then
    update public.registrations set status = 'confirmed' where id = v_next_id;
  end if;

  return v_reg;
end;
$$;


-- -----------------------------------------------------------------------------
-- 4. QUIÉN PUEDE LLAMAR A LAS FUNCIONES
-- -----------------------------------------------------------------------------
-- Postgres permite ejecutar funciones a PUBLIC por defecto (incluye `anon`,
-- los visitantes sin cuenta). Lo restringimos a usuarios con sesión.

revoke execute on function public.set_user_role(uuid, public.app_role) from public, anon;
revoke execute on function public.register_child(uuid, uuid) from public, anon;
revoke execute on function public.cancel_registration(uuid) from public, anon;

grant execute on function public.set_user_role(uuid, public.app_role) to authenticated;
grant execute on function public.register_child(uuid, uuid) to authenticated;
grant execute on function public.cancel_registration(uuid) to authenticated;
