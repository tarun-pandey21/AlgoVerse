-- =============================================================================
-- AlgoVerse – Phase 6 database schema (Supabase / PostgreSQL 15+)
--
-- Security model
--   * Every private table has Row Level Security enabled and is scoped to
--     auth.uid(): a signed-in user can only ever see or change their own rows.
--   * The browser (publishable key + the user's JWT, role "authenticated") may
--     write only low-risk data: profile, preferences, lessons read, code drafts.
--   * Results produced by the AlgoVerse server (Judge0 verdicts, Claude
--     replies, generated questions, roadmaps) are inserted ONLY by the Express
--     server with the secret key (role "service_role", which bypasses RLS).
--     There are deliberately no INSERT policies for those tables, so users
--     cannot forge an "accepted" verdict or a tutor reply.
--   * UPDATE is granted per column, so users cannot change ownership,
--     verdicts or timestamps.
--   * Passwords are handled entirely by Supabase Auth (auth.users).
--
-- Conventions
--   * Code languages use the app's ids: 'java' | 'cpp' | 'python'.
--   * Difficulties: 'Easy' | 'Medium' | 'Hard'.
--   * All timestamps are timestamptz.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Shared helpers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Reference catalog (public, read-only for clients; seeded from src/data)
-- -----------------------------------------------------------------------------

create table public.topics (
  id            text primary key,                        -- e.g. 'arrays' (matches src/data/topics.js)
  name          text not null,
  level         text not null check (level in ('Beginner', 'Intermediate', 'Advanced')),
  position      smallint not null unique,
  description   text not null default '',
  created_at    timestamptz not null default now()
);
comment on table public.topics is 'DSA curriculum topics. Seeded from src/data/topics.js; read-only for clients.';

create table public.lesson_sections (
  key           text primary key,                        -- e.g. 'introduction'
  title         text not null,
  position      smallint not null unique
);
comment on table public.lesson_sections is 'The sections every lesson has (src/data/lessonSections.js).';

create table public.practice_problems (
  id            text primary key,                        -- e.g. 'two-sum' (matches src/data/practice/problems.js)
  title         text not null,
  difficulty    text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  topic_id      text not null references public.topics (id) on update cascade,
  position      smallint not null unique,
  created_at    timestamptz not null default now()
);
create index practice_problems_topic_idx on public.practice_problems (topic_id);
comment on table public.practice_problems is 'Coding practice catalog. Statements and tests stay in the app; this holds identity + metadata for foreign keys and stats.';

-- -----------------------------------------------------------------------------
-- 1. Users & profiles  /  8. Preferences
-- -----------------------------------------------------------------------------

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null default '' check (char_length(display_name) <= 80),
  username      text check (username ~ '^[a-z0-9_]{3,30}$'),
  headline      text not null default '' check (char_length(headline) <= 120),   -- e.g. 'Computer Science Student'
  avatar_url    text check (avatar_url is null or avatar_url ~ '^https://'),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index profiles_username_key on public.profiles (lower(username)) where username is not null;
comment on table public.profiles is 'One row per auth user. Email and password live in auth.users only.';

create table public.user_preferences (
  user_id             uuid primary key references public.profiles (id) on delete cascade,
  preferred_language  text not null default 'java' check (preferred_language in ('java', 'cpp', 'python')),
  daily_goal          smallint not null default 3 check (daily_goal between 1 and 20),
  email_reminders     boolean not null default true,
  weekly_report       boolean not null default true,
  streak_alerts       boolean not null default false,
  updated_at          timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger user_preferences_set_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- Create the profile + preferences rows when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(new.email, ''), '@', 1)), 80)
  );
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. DSA learning progress
-- -----------------------------------------------------------------------------

create table public.section_progress (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  topic_id      text not null references public.topics (id) on update cascade on delete cascade,
  section_key   text not null references public.lesson_sections (key) on update cascade on delete cascade,
  read_at       timestamptz not null default now(),
  primary key (user_id, topic_id, section_key)
);

create table public.topic_progress (
  user_id         uuid not null references public.profiles (id) on delete cascade,
  topic_id        text not null references public.topics (id) on update cascade on delete cascade,
  sections_read   smallint not null default 0,          -- maintained by trigger
  completed_at    timestamptz,                          -- maintained by trigger (all sections read)
  last_visited_at timestamptz,                          -- written by the client
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (user_id, topic_id)
);
create index topic_progress_user_recent_idx on public.topic_progress (user_id, last_visited_at desc nulls last);

create trigger topic_progress_set_updated_at before update on public.topic_progress
  for each row execute function public.set_updated_at();

-- Keep topic_progress in sync with section_progress (runs as owner because
-- clients may not write sections_read / completed_at themselves).
create or replace function public.sync_topic_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid := coalesce(new.user_id, old.user_id);
  v_topic text := coalesce(new.topic_id, old.topic_id);
  v_read  smallint;
  v_total smallint;
begin
  select count(*) into v_read from public.section_progress where user_id = v_user and topic_id = v_topic;
  select count(*) into v_total from public.lesson_sections;

  if tg_op = 'DELETE' then
    -- Only update an existing row: when a whole account is being deleted the
    -- cascade removes topic_progress too, and re-inserting it would fail.
    update public.topic_progress
       set sections_read = v_read,
           completed_at = case when v_read >= v_total then completed_at end
     where user_id = v_user and topic_id = v_topic;
    return null;
  end if;

  insert into public.topic_progress as tp (user_id, topic_id, sections_read, completed_at)
  values (v_user, v_topic, v_read, case when v_read >= v_total then now() end)
  on conflict (user_id, topic_id) do update
    set sections_read = excluded.sections_read,
        completed_at = case
          when excluded.sections_read >= v_total then coalesce(tp.completed_at, now())
          else null
        end;
  return null;
end;
$$;

create trigger section_progress_sync
  after insert or delete on public.section_progress
  for each row execute function public.sync_topic_progress();

-- -----------------------------------------------------------------------------
-- 3. Coding attempts & submissions  /  4. Solved & attempted statistics
-- -----------------------------------------------------------------------------

create table public.submissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  problem_id    text not null references public.practice_problems (id) on update cascade,
  language      text not null check (language in ('java', 'cpp', 'python')),
  verdict       text not null check (verdict in ('accepted', 'wrong_answer', 'compilation_error', 'runtime_error', 'time_limit_exceeded', 'internal_error')),
  passed        smallint not null check (passed >= 0),
  total         smallint not null check (total > 0 and passed <= total),
  runtime_ms    integer check (runtime_ms >= 0),
  memory_kb     integer check (memory_kb >= 0),
  code          text not null check (octet_length(code) <= 65536),
  created_at    timestamptz not null default now()
);
create index submissions_user_created_idx on public.submissions (user_id, created_at desc);
create index submissions_user_problem_created_idx on public.submissions (user_id, problem_id, created_at desc);
create index submissions_problem_idx on public.submissions (problem_id);
comment on table public.submissions is 'Judged submissions. Inserted only by the Express server after Judge0 returns a verdict.';

create table public.problem_progress (
  user_id             uuid not null references public.profiles (id) on delete cascade,
  problem_id          text not null references public.practice_problems (id) on update cascade on delete cascade,
  status              text not null check (status in ('attempted', 'solved')),
  attempts            integer not null default 0,
  accepted_count      integer not null default 0,
  first_attempted_at  timestamptz not null,
  last_attempted_at   timestamptz not null,
  solved_at           timestamptz,                       -- first accepted submission
  last_language       text check (last_language in ('java', 'cpp', 'python')),
  primary key (user_id, problem_id)
);
create index problem_progress_user_status_idx on public.problem_progress (user_id, status);
create index problem_progress_user_recent_idx on public.problem_progress (user_id, last_attempted_at desc);

create or replace function public.apply_submission_to_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_accepted boolean := new.verdict = 'accepted';
begin
  insert into public.problem_progress as pp (
    user_id, problem_id, status, attempts, accepted_count,
    first_attempted_at, last_attempted_at, solved_at, last_language
  ) values (
    new.user_id, new.problem_id,
    case when v_accepted then 'solved' else 'attempted' end,
    1, case when v_accepted then 1 else 0 end,
    new.created_at, new.created_at,
    case when v_accepted then new.created_at end,
    new.language
  )
  on conflict (user_id, problem_id) do update set
    status            = case when v_accepted or pp.status = 'solved' then 'solved' else 'attempted' end,
    attempts          = pp.attempts + 1,
    accepted_count    = pp.accepted_count + case when v_accepted then 1 else 0 end,
    last_attempted_at = greatest(pp.last_attempted_at, new.created_at),
    solved_at         = coalesce(pp.solved_at, case when v_accepted then new.created_at end),
    last_language     = new.language;
  return null;
end;
$$;

create trigger submissions_apply_progress
  after insert on public.submissions
  for each row execute function public.apply_submission_to_progress();

create table public.code_drafts (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  problem_id    text not null references public.practice_problems (id) on update cascade on delete cascade,
  language      text not null check (language in ('java', 'cpp', 'python')),
  code          text not null check (octet_length(code) <= 65536),
  updated_at    timestamptz not null default now(),
  primary key (user_id, problem_id, language)
);
create trigger code_drafts_set_updated_at before update on public.code_drafts
  for each row execute function public.set_updated_at();

-- Per-user statistics. security_invoker = true makes the views obey the
-- caller's RLS, so each user only ever aggregates their own rows.
create view public.user_practice_stats
with (security_invoker = true) as
select
  pp.user_id,
  count(*) filter (where pp.status = 'solved')                                  as solved_count,
  count(*) filter (where pp.status = 'attempted')                               as attempted_unsolved_count,
  count(*)                                                                       as attempted_count,
  coalesce(sum(pp.attempts), 0)::integer                                         as total_submissions,
  coalesce(sum(pp.accepted_count), 0)::integer                                   as accepted_submissions,
  count(*) filter (where pp.status = 'solved' and p.difficulty = 'Easy')        as solved_easy,
  count(*) filter (where pp.status = 'solved' and p.difficulty = 'Medium')      as solved_medium,
  count(*) filter (where pp.status = 'solved' and p.difficulty = 'Hard')        as solved_hard,
  max(pp.last_attempted_at)                                                      as last_activity_at
from public.problem_progress pp
join public.practice_problems p on p.id = pp.problem_id
group by pp.user_id;

-- One row per user per UTC day with activity (for streaks and activity charts).
create view public.user_daily_activity
with (security_invoker = true) as
select
  s.user_id,
  (s.created_at at time zone 'utc')::date                                        as day,
  count(*)                                                                       as submissions,
  count(*) filter (where s.verdict = 'accepted')                                 as accepted,
  count(distinct s.problem_id) filter (where s.verdict = 'accepted')             as problems_accepted
from public.submissions s
group by s.user_id, (s.created_at at time zone 'utc')::date;

-- -----------------------------------------------------------------------------
-- 5. AI Tutor conversation history
-- -----------------------------------------------------------------------------

create table public.tutor_conversations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  title            text not null default 'New conversation' check (char_length(title) <= 200),
  language         text not null default 'java' check (language in ('java', 'cpp', 'python')),
  context_type     text check (context_type in ('problem', 'topic')),
  context_id       text check (char_length(context_id) <= 80),
  archived         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  last_message_at  timestamptz not null default now(),
  unique (id, user_id),                                  -- target for the composite FK below
  check ((context_type is null) = (context_id is null))
);
create index tutor_conversations_user_recent_idx on public.tutor_conversations (user_id, archived, last_message_at desc);
create trigger tutor_conversations_set_updated_at before update on public.tutor_conversations
  for each row execute function public.set_updated_at();

create table public.tutor_messages (
  id               bigint generated always as identity primary key,
  conversation_id  uuid not null,
  user_id          uuid not null,
  role             text not null check (role in ('user', 'assistant')),
  content          text not null check (char_length(content) between 1 and 100000),
  model            text,                                 -- assistant messages: the Claude model that answered
  stop_reason      text,
  truncated        boolean not null default false,
  incomplete       boolean not null default false,       -- stopped / interrupted while streaming
  input_tokens     integer check (input_tokens >= 0),
  output_tokens    integer check (output_tokens >= 0),
  created_at       timestamptz not null default now(),
  -- The message must belong to a conversation of the SAME user.
  foreign key (conversation_id, user_id) references public.tutor_conversations (id, user_id) on delete cascade
);
create index tutor_messages_conversation_idx on public.tutor_messages (conversation_id, id);
create index tutor_messages_user_idx on public.tutor_messages (user_id, created_at desc);

create or replace function public.touch_tutor_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.tutor_conversations
     set last_message_at = greatest(last_message_at, new.created_at)
   where id = new.conversation_id;
  return null;
end;
$$;

create trigger tutor_messages_touch_conversation
  after insert on public.tutor_messages
  for each row execute function public.touch_tutor_conversation();

-- -----------------------------------------------------------------------------
-- 6. Generated AI questions
-- -----------------------------------------------------------------------------

create table public.ai_question_sets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  topic         text not null check (char_length(topic) <= 80),
  topic_id      text references public.topics (id) on update cascade on delete set null,
  difficulty    text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  language      text not null check (language in ('java', 'cpp', 'python')),
  focus         text not null default '' check (char_length(focus) <= 300),
  model         text not null,
  created_at    timestamptz not null default now(),
  unique (id, user_id)
);
create index ai_question_sets_user_recent_idx on public.ai_question_sets (user_id, created_at desc);

create table public.ai_questions (
  id            uuid primary key default gen_random_uuid(),
  set_id        uuid not null,
  user_id       uuid not null,
  position      smallint not null check (position >= 0),
  title         text not null check (char_length(title) <= 200),
  difficulty    text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  topic         text not null default '',
  content       jsonb not null check (jsonb_typeof(content) = 'object'),  -- statement, signature, examples, constraints, hints, approach
  is_saved      boolean not null default false,
  status        text not null default 'new' check (status in ('new', 'attempted', 'solved')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  foreign key (set_id, user_id) references public.ai_question_sets (id, user_id) on delete cascade,
  unique (set_id, position)
);
create index ai_questions_user_saved_idx on public.ai_questions (user_id, is_saved, created_at desc);
create trigger ai_questions_set_updated_at before update on public.ai_questions
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. Personalized AI roadmaps
-- -----------------------------------------------------------------------------

create table public.ai_roadmaps (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  title              text not null default 'My roadmap' check (char_length(title) <= 120),
  skill_level        text not null check (skill_level in ('Beginner', 'Intermediate', 'Advanced')),
  target_difficulty  text not null check (target_difficulty in ('Easy', 'Medium', 'Hard')),
  weeks              smallint not null check (weeks between 1 and 8),
  hours_per_week     smallint not null check (hours_per_week between 1 and 40),
  language           text not null check (language in ('java', 'cpp', 'python')),
  goals              text not null default '' check (char_length(goals) <= 500),
  weak_areas         text[] not null default '{}',
  input_snapshot     jsonb not null default '{}'::jsonb,  -- progress summary sent to Claude
  plan               jsonb not null check (jsonb_typeof(plan) = 'object'),
  model              text not null,
  is_active          boolean not null default false,
  completed_weeks    smallint[] not null default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index ai_roadmaps_user_recent_idx on public.ai_roadmaps (user_id, created_at desc);
create unique index ai_roadmaps_one_active_per_user on public.ai_roadmaps (user_id) where is_active;
create trigger ai_roadmaps_set_updated_at before update on public.ai_roadmaps
  for each row execute function public.set_updated_at();

-- Make one roadmap active (and the others inactive) in a single statement pair.
-- SECURITY INVOKER: RLS still applies, so a user can only touch their own rows.
create or replace function public.activate_roadmap(p_roadmap_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.ai_roadmaps where id = p_roadmap_id) then
    raise exception 'roadmap not found' using errcode = 'P0002';
  end if;
  update public.ai_roadmaps set is_active = false where is_active and id <> p_roadmap_id;
  update public.ai_roadmaps set is_active = true where id = p_roadmap_id;
end;
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.topics               enable row level security;
alter table public.lesson_sections      enable row level security;
alter table public.practice_problems    enable row level security;
alter table public.profiles             enable row level security;
alter table public.user_preferences     enable row level security;
alter table public.section_progress     enable row level security;
alter table public.topic_progress       enable row level security;
alter table public.submissions          enable row level security;
alter table public.problem_progress     enable row level security;
alter table public.code_drafts          enable row level security;
alter table public.tutor_conversations  enable row level security;
alter table public.tutor_messages       enable row level security;
alter table public.ai_question_sets     enable row level security;
alter table public.ai_questions         enable row level security;
alter table public.ai_roadmaps          enable row level security;

-- Catalog: anyone may read.
create policy "Catalog is public" on public.topics            for select to anon, authenticated using (true);
create policy "Catalog is public" on public.lesson_sections   for select to anon, authenticated using (true);
create policy "Catalog is public" on public.practice_problems for select to anon, authenticated using (true);

-- Profiles & preferences: read + update own (rows are created by handle_new_user).
create policy "Read own profile"   on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Read own preferences"   on public.user_preferences for select to authenticated using (user_id = (select auth.uid()));
create policy "Update own preferences" on public.user_preferences for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Learning progress: written directly by the client.
create policy "Read own section progress"   on public.section_progress for select to authenticated using (user_id = (select auth.uid()));
create policy "Insert own section progress" on public.section_progress for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Delete own section progress" on public.section_progress for delete to authenticated using (user_id = (select auth.uid()));

create policy "Read own topic progress"   on public.topic_progress for select to authenticated using (user_id = (select auth.uid()));
create policy "Insert own topic progress" on public.topic_progress for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Update own topic progress" on public.topic_progress for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Delete own topic progress" on public.topic_progress for delete to authenticated using (user_id = (select auth.uid()));

-- Practice: submissions are inserted by the server only; users may read and reset.
create policy "Read own submissions"   on public.submissions for select to authenticated using (user_id = (select auth.uid()));
create policy "Delete own submissions" on public.submissions for delete to authenticated using (user_id = (select auth.uid()));

create policy "Read own problem progress"   on public.problem_progress for select to authenticated using (user_id = (select auth.uid()));
create policy "Delete own problem progress" on public.problem_progress for delete to authenticated using (user_id = (select auth.uid()));

create policy "Read own drafts"   on public.code_drafts for select to authenticated using (user_id = (select auth.uid()));
create policy "Insert own drafts" on public.code_drafts for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Update own drafts" on public.code_drafts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Delete own drafts" on public.code_drafts for delete to authenticated using (user_id = (select auth.uid()));

-- AI content: created by the server; users may read, organise and delete.
create policy "Read own conversations"   on public.tutor_conversations for select to authenticated using (user_id = (select auth.uid()));
create policy "Update own conversations" on public.tutor_conversations for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Delete own conversations" on public.tutor_conversations for delete to authenticated using (user_id = (select auth.uid()));

create policy "Read own tutor messages" on public.tutor_messages for select to authenticated using (user_id = (select auth.uid()));

create policy "Read own question sets"   on public.ai_question_sets for select to authenticated using (user_id = (select auth.uid()));
create policy "Delete own question sets" on public.ai_question_sets for delete to authenticated using (user_id = (select auth.uid()));

create policy "Read own questions"   on public.ai_questions for select to authenticated using (user_id = (select auth.uid()));
create policy "Update own questions" on public.ai_questions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Read own roadmaps"   on public.ai_roadmaps for select to authenticated using (user_id = (select auth.uid()));
create policy "Update own roadmaps" on public.ai_roadmaps for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Delete own roadmaps" on public.ai_roadmaps for delete to authenticated using (user_id = (select auth.uid()));

-- =============================================================================
-- Privileges (defence in depth on top of RLS)
-- Supabase grants ALL on new public tables to anon/authenticated by default;
-- narrow that to exactly what the policies above intend.
-- =============================================================================

revoke all on all tables in schema public from anon, authenticated;

grant select on public.topics, public.lesson_sections, public.practice_problems to anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, username, headline, avatar_url) on public.profiles to authenticated;

grant select on public.user_preferences to authenticated;
grant update (preferred_language, daily_goal, email_reminders, weekly_report, streak_alerts) on public.user_preferences to authenticated;

grant select, insert, delete on public.section_progress to authenticated;
grant select, delete on public.topic_progress to authenticated;
grant insert (user_id, topic_id, last_visited_at) on public.topic_progress to authenticated;
grant update (last_visited_at) on public.topic_progress to authenticated;

grant select, delete on public.submissions to authenticated;
grant select, delete on public.problem_progress to authenticated;
grant select, insert, update, delete on public.code_drafts to authenticated;
grant select on public.user_practice_stats, public.user_daily_activity to authenticated;

grant select, delete on public.tutor_conversations to authenticated;
grant update (title, archived) on public.tutor_conversations to authenticated;
grant select on public.tutor_messages to authenticated;

grant select, delete on public.ai_question_sets to authenticated;
grant select on public.ai_questions to authenticated;
grant update (is_saved, status) on public.ai_questions to authenticated;

grant select, delete on public.ai_roadmaps to authenticated;
grant update (title, is_active, completed_weeks) on public.ai_roadmaps to authenticated;

-- The server (service_role) needs full access to write trusted results.
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Functions: triggers are not callable directly; only activate_roadmap is an API.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.activate_roadmap(uuid) to authenticated;
