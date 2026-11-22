-- Minimal stand-in for the parts of Supabase the migrations rely on, so schema, constraints
-- and RLS policies can be tested in-process with PGlite (no Docker required).
-- Mirrors Supabase: roles anon/authenticated/service_role, auth.users, auth.uid(), default grants
-- (as on projects created with automatic API exposure disabled — the current default).
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text unique,
  raw_user_meta_data jsonb not null default '{}'
);

-- Supabase reads the user id from the JWT claims exposed as request.jwt.claims / request.jwt.claim.sub.
create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant execute on function auth.uid() to anon, authenticated, service_role;

grant usage on schema public to anon, authenticated, service_role;
-- New Supabase projects no longer expose tables to the API roles automatically: anon and
-- authenticated get NO default table privileges, so migrations must GRANT explicitly.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
