grant usage on schema public to anon, authenticated;

grant select on public.workshops to anon, authenticated;
grant select on public.workshop_images to anon, authenticated;
grant select on public.workshop_sessions to anon, authenticated;
grant select on public.events to anon, authenticated;
grant select on public.institutional_activities to anon, authenticated;
grant select on public.institutional_activity_workshops to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.children_profiles to authenticated;
grant select, insert, update on public.registrations to authenticated;

grant insert, update, delete on public.workshops to authenticated;
grant insert, update, delete on public.workshop_images to authenticated;
grant insert, update, delete on public.workshop_sessions to authenticated;
grant insert, update, delete on public.events to authenticated;
grant insert, update, delete on public.institutional_activities to authenticated;
grant insert, update, delete on public.institutional_activity_workshops to authenticated;
