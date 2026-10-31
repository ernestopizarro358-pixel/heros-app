-- ════════════════════════════════════════════════════════════════════
-- Heroes App — esquema propuesto para Supabase (Postgres)
--
-- Refleja 1:1 los tipos de lib/data/types.ts y los métodos de
-- lib/data/repository.ts. Cada fila lleva user_id y RLS para que cada
-- usuario (de momento, solo tú) vea únicamente sus datos.
--
-- Días sin hora ("hoy", completados, fecha objetivo) se guardan como DATE
-- ya calculados en America/La_Paz por la app.
-- ════════════════════════════════════════════════════════════════════

-- ───────────────────────── Ajustes ─────────────────────────
create table if not exists user_settings (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  user_name     text not null default 'Santiago',
  sound_enabled boolean not null default true,
  updated_at    timestamptz not null default now()
);

-- ───────────────────────── Hábitos ─────────────────────────
create table if not exists habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  reward      text,
  priority    boolean not null default false,
  position    integer not null default 0,
  -- Enlace opcional con la Ley Causal o con una solución de un jefe
  link_kind   text check (link_kind in ('input', 'solution')),
  link_goal_id  uuid,
  link_input_id uuid,
  link_boss_id  uuid,
  link_entry_id uuid,
  created_at  timestamptz not null default now()
);
create index if not exists habits_user_idx on habits (user_id, priority desc, position);

create table if not exists habit_completions (
  habit_id  uuid not null references habits (id) on delete cascade,
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day       date not null,
  primary key (habit_id, day)
);
create index if not exists habit_completions_user_idx on habit_completions (user_id, day);

-- ───────────────────── Portal / Antiportal ─────────────────────
create table if not exists vision_boards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('portal', 'antiportal')),
  beliefs    text not null default '',
  text       text not null default '',
  inspiration_slots integer not null default 8 check (inspiration_slots between 1 and 200),
  updated_at timestamptz not null default now(),
  unique (user_id, kind)
);

create table if not exists vision_slides (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  board_id  uuid not null references vision_boards (id) on delete cascade,
  key       text not null,               -- 'yo', 'ella', 'dinero'… empareja Portal y Antiportal
  title     text not null,
  text      text not null default '',
  position  integer not null default 0
);
create index if not exists vision_slides_board_idx on vision_slides (board_id, position);

-- Imágenes por URL: del tablero (slide_id null) o de una slide (slot 0-3)
create table if not exists vision_images (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  board_id  uuid not null references vision_boards (id) on delete cascade,
  slide_id  uuid references vision_slides (id) on delete cascade,
  slot      integer not null,
  url       text not null,
  unique nulls not distinct (board_id, slide_id, slot)
);

-- ───────────────────────── Ley Causal ─────────────────────────
create table if not exists causal_goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  effect        text not null default '',
  initial_state text not null default '',
  target_date   date,
  is_main       boolean not null default false,
  created_at    timestamptz not null default now()
);
-- Solo un objetivo principal por usuario
create unique index if not exists causal_goals_one_main on causal_goals (user_id) where is_main;

create table if not exists causal_inputs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id   uuid not null references causal_goals (id) on delete cascade,
  text      text not null,
  status    text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  habit_id  uuid references habits (id) on delete set null,
  boss_id   uuid,                          -- FK añadida tras crear bosses
  position  integer not null default 0
);
create index if not exists causal_inputs_goal_idx on causal_inputs (goal_id, position);

-- ───────────────────────── Jefes ─────────────────────────
create table if not exists bosses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number          integer not null,
  name            text not null,
  sprite_id       text not null default 'knight',
  started_at      date not null default current_date,
  defeated_at     timestamptz,
  source_goal_id  uuid references causal_goals (id) on delete set null,
  source_input_id uuid references causal_inputs (id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (user_id, number)
);

alter table causal_inputs
  drop constraint if exists causal_inputs_boss_fk,
  add constraint causal_inputs_boss_fk foreign key (boss_id) references bosses (id) on delete set null;

-- El HP NO se guarda: se calcula sumando el daño de las entradas
-- (ver lib/boss.ts y lib/game.config.ts). Así borrar una entrada devuelve su HP.
create table if not exists boss_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  boss_id      uuid not null references bosses (id) on delete cascade,
  type         text not null check (type in ('belief', 'learning', 'solution')),
  text         text not null,
  -- Solo soluciones
  size         text check (size in ('small', 'medium', 'large')),
  target       integer check (target is null or target > 1),
  progress     integer not null default 0,
  completed_at timestamptz,
  habit_id     uuid references habits (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists boss_entries_boss_idx on boss_entries (boss_id, created_at desc);

create index if not exists vision_slides_user_idx on vision_slides (user_id);
create index if not exists vision_images_slide_idx on vision_images (slide_id);
create index if not exists vision_images_user_idx on vision_images (user_id);
create index if not exists causal_goals_user_idx on causal_goals (user_id);
create index if not exists causal_inputs_habit_idx on causal_inputs (habit_id);
create index if not exists causal_inputs_boss_idx on causal_inputs (boss_id);
create index if not exists causal_inputs_user_idx on causal_inputs (user_id);
create index if not exists bosses_source_goal_idx on bosses (source_goal_id);
create index if not exists bosses_source_input_idx on bosses (source_input_id);
create index if not exists boss_entries_habit_idx on boss_entries (habit_id);
create index if not exists boss_entries_user_idx on boss_entries (user_id);

-- ───────────────────────── RLS ─────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'user_settings', 'habits', 'habit_completions', 'vision_boards', 'vision_slides',
    'vision_images', 'causal_goals', 'causal_inputs', 'bosses', 'boss_entries'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "own rows" on %I', t);
    execute format(
      'create policy "own rows" on %I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))',
      t
    );
  end loop;
end $$;

-- ───────────────────────── Permisos ─────────────────────────
-- Solo "authenticated" accede a las tablas; "anon" no tiene ningún permiso.
revoke all on
  user_settings, habits, habit_completions, vision_boards, vision_slides,
  vision_images, causal_goals, causal_inputs, bosses, boss_entries
from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  user_settings, habits, habit_completions, vision_boards, vision_slides,
  vision_images, causal_goals, causal_inputs, bosses, boss_entries
to authenticated;
