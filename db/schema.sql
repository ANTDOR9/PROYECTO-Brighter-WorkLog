-- ================================================================
--  Brighter WorkLog — Esquema de base de datos (Supabase / Postgres)
--  Ejecutar UNA vez en: Supabase → SQL Editor → New query → Run
-- ================================================================

-- 1) Perfiles: un registro por usuario que inicia sesión
create table if not exists public.perfiles (
  id        uuid primary key references auth.users on delete cascade,
  nombre    text,
  rol       text not null default 'registrador',   -- 'admin' | 'registrador'
  creado_en timestamptz default now()
);

-- 2) Registros por mes: los días guardados como JSON
create table if not exists public.registros_mes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  empleado       text not null,
  anio           int  not null,
  mes            int  not null,               -- 0 = Enero ... 11 = Diciembre
  dias           jsonb not null default '[]',
  actualizado_en timestamptz default now(),
  unique (user_id, empleado, anio, mes)
);

-- 3) Seguridad a nivel de fila (RLS)
alter table public.perfiles      enable row level security;
alter table public.registros_mes enable row level security;

-- ¿el usuario actual es administrador? (security definer evita recursión de RLS)
create or replace function public.es_admin() returns boolean
language sql security definer stable as $$
  select exists(select 1 from public.perfiles where id = auth.uid() and rol = 'admin');
$$;

-- Políticas: PERFILES
drop policy if exists "perfil select" on public.perfiles;
create policy "perfil select" on public.perfiles
  for select using (id = auth.uid() or public.es_admin());
drop policy if exists "perfil insert" on public.perfiles;
create policy "perfil insert" on public.perfiles
  for insert with check (id = auth.uid());
drop policy if exists "perfil update" on public.perfiles;
create policy "perfil update" on public.perfiles
  for update using (id = auth.uid());

-- Políticas: REGISTROS (propios, y el admin ve todos)
drop policy if exists "reg select" on public.registros_mes;
create policy "reg select" on public.registros_mes
  for select using (user_id = auth.uid() or public.es_admin());
drop policy if exists "reg insert" on public.registros_mes;
create policy "reg insert" on public.registros_mes
  for insert with check (user_id = auth.uid());
drop policy if exists "reg update" on public.registros_mes;
create policy "reg update" on public.registros_mes
  for update using (user_id = auth.uid());
drop policy if exists "reg delete" on public.registros_mes;
create policy "reg delete" on public.registros_mes
  for delete using (user_id = auth.uid());

-- 4) Crear el perfil automáticamente cuando alguien se registra
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', ''));
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================================
--  DESPUÉS de que la monitora cree su cuenta en la app,
--  conviértela en administradora ejecutando (con su correo real):
--
--  update public.perfiles set rol = 'admin'
--  where id = (select id from auth.users where email = 'correo_de_la_monitora@ejemplo.com');
-- ================================================================
