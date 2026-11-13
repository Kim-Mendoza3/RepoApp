-- BORRAR CUENTA DESDE LA APP
-- App Store y Google Play exigen que cada persona pueda eliminar su cuenta desde la app.
--
-- La app no puede borrar filas de auth.users directamente (y no debe: sería un permiso
-- enorme). Por eso usamos una función "security definer": corre con permisos del dueño
-- de la base de datos, pero SOLO borra la cuenta de quien la llama (auth.uid()).
--
-- Al borrar el usuario, sus datos personales se eliminan en cadena gracias a los
-- "on delete cascade" del esquema inicial: profiles → children_profiles → registrations.
--
-- Excepción: el contenido institucional (talleres, sesiones, eventos, actividades) guarda
-- en created_by quién lo creó y NO se borra en cadena, porque pertenece a la asociación.
-- Si la cuenta creó contenido, se avisa con el código STAFF_CONTENT para que la app
-- muestre un mensaje claro y otra persona del staff lo reasigne primero.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Necesitas iniciar sesión para borrar tu cuenta.' using errcode = '42501';
  end if;

  if exists (select 1 from public.workshops where created_by = current_user_id)
     or exists (select 1 from public.workshop_sessions where created_by = current_user_id)
     or exists (select 1 from public.events where created_by = current_user_id)
     or exists (select 1 from public.institutional_activities where created_by = current_user_id) then
    raise exception 'STAFF_CONTENT'
      using errcode = 'P0001',
            hint = 'La cuenta creó contenido de la asociación. Otra persona del staff debe reasignarlo antes de borrarla.';
  end if;

  delete from auth.users where id = current_user_id;
end;
$$;

-- Solo usuarios con sesión pueden llamarla (y solo borra su propia cuenta).
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
