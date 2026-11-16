-- =============================================================================
-- AlgoVerse – profile names come only from what the user entered.
--
-- The original sign-up trigger filled profiles.display_name with the part of
-- the email before "@" when no name was given (e.g. "ben.k"). The app now
-- shows "Welcome back!" when there is no real name instead of a made-up one,
-- so:
--   1. new profiles get the name from sign-up metadata, or an empty string;
--   2. existing profiles whose name was auto-filled from the email (and the
--      user never entered a name at sign-up) are cleared.
-- Names users typed themselves are never changed.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(trim(new.raw_user_meta_data ->> 'display_name'), ''), 80));
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

update public.profiles p
   set display_name = ''
  from auth.users u
 where u.id = p.id
   and coalesce(trim(u.raw_user_meta_data ->> 'display_name'), '') = ''
   and p.display_name = split_part(coalesce(u.email, ''), '@', 1);

-- Keep trigger functions non-callable through the API (as in the base migration).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
