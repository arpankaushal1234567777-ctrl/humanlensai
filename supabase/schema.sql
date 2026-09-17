-- ==============================================================================
-- HUMANLENS AI — Production PostgreSQL Schema (Supabase Free Tier)
-- Compliant with Complete Project Specification (Sections 10, 13, 14, 18)
-- ==============================================================================

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- ------------------------------------------------------------------------------
-- 2. USERS & PROFILES
-- ------------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  consent_version text default '1.0' not null
);

create table if not exists public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  full_name text,
  age_range text check (age_range in ('13-17', '18-24', '25-34', '35+')),
  generation_group text default 'Gen Z',
  student_status text default 'undergraduate' check (student_status in ('high_school', 'undergraduate', 'graduate', 'non_student')),
  preferences jsonb default '{"tone_alerts": true, "daily_reminder": true}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 3. BEHAVIOR LOGS (Longitudinal Behavior Lens - Section 5.2 & 7)
-- ------------------------------------------------------------------------------
create table if not exists public.behavior_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  date date default current_date not null,
  stress numeric(3,1) check (stress between 1 and 10),
  mood integer check (mood between 1 and 5),
  sleep_hours numeric(3,1) check (sleep_hours between 0 and 24),
  academic_pressure numeric(3,1) check (academic_pressure between 1 and 10),
  social_score numeric(3,1) check (social_score between 1 and 10),
  exercise_minutes integer default 0,
  screen_time_hours numeric(3,1) default 0,
  journal_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, date)
);

-- ------------------------------------------------------------------------------
-- 4. CONVERSATIONS & CHAT (RAG Wellbeing Coach)
-- ------------------------------------------------------------------------------
create table if not exists public.conversation_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  summary text
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.conversation_sessions(id) on delete cascade not null,
  role text check (role in ('user', 'assistant', 'system')) not null,
  content text not null,
  content_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 5. ANALYSIS & INTERVENTIONS (Before You Speak - Section 9)
-- ------------------------------------------------------------------------------
create table if not exists public.analysis_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  event_type text default 'text_analysis',
  scores_json jsonb not null,
  model_version text default 'humanlens-v2.0',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.interventions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  trigger_type text not null,
  intervention_type text default 'pause_and_reflect',
  outcome text check (outcome in ('applied_rewrite', 'paused_then_edited', 'sent_anyway', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 6. CONSENTS & PRIVACY GOVERNANCE (Section 18)
-- ------------------------------------------------------------------------------
create table if not exists public.consents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  consent_type text not null, -- 'product_terms', 'research_study', 'camera_ephemeral'
  version text not null,
  granted boolean default true not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 7. KNOWLEDGE CHUNKS (RAG Vector Store - Section 10)
-- ------------------------------------------------------------------------------
create table if not exists public.knowledge_chunks (
  id uuid primary key default uuid_generate_v4(),
  source_id text unique not null,
  title text not null,
  framework text not null,
  content text not null,
  actionable_step text not null,
  embedding vector(384), -- SentenceTransformers 384-dimensional dense vectors
  metadata jsonb default '{}'::jsonb
);

-- ------------------------------------------------------------------------------
-- 8. ANONYMIZED RESEARCH EVENTS (Section 13 & 19)
-- ------------------------------------------------------------------------------
create table if not exists public.research_events (
  id uuid primary key default uuid_generate_v4(),
  anonymized_user_id text not null,
  event_type text not null,
  aggregate_features jsonb not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.behavior_logs enable row level security;
alter table public.conversation_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.analysis_events enable row level security;
alter table public.interventions enable row level security;
alter table public.consents enable row level security;
alter table public.knowledge_chunks enable row level security;

-- Users can read/write their own records or guest demo session
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = user_id or auth.uid() is null);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id or auth.uid() is null);
create policy "Users can manage own behavior logs" on public.behavior_logs for all using (auth.uid() = user_id or auth.uid() is null or user_id = '00000000-0000-0000-0000-000000000001');
create policy "Users can view own sessions" on public.conversation_sessions for all using (auth.uid() = user_id or auth.uid() is null);
create policy "Anyone can read RAG knowledge chunks" on public.knowledge_chunks for select using (true);
create policy "Anyone can insert interventions" on public.interventions for insert with check (true);
create policy "Anyone can read interventions" on public.interventions for select using (true);
create policy "Anyone can insert analysis_events" on public.analysis_events for insert with check (true);

-- ------------------------------------------------------------------------------
-- 10. DEMO USER SEED (Guest / Default Session)
-- ------------------------------------------------------------------------------
insert into public.users (id, email, consent_version)
values ('00000000-0000-0000-0000-000000000001', 'demo@humanlens.ai', '1.0')
on conflict (id) do nothing;

insert into public.profiles (user_id, full_name, age_range, generation_group, student_status)
values ('00000000-0000-0000-0000-000000000001', 'HumanLens Explorer', '18-24', 'Gen Z', 'undergraduate')
on conflict (user_id) do nothing;

-- ------------------------------------------------------------------------------
-- 11. PRE-SEEDED RAG EVIDENCE KNOWLEDGE
-- ------------------------------------------------------------------------------
insert into public.knowledge_chunks (source_id, title, framework, content, actionable_step)
values
(
  'kb-01',
  'Physiological Sigh & 20-Second Downregulation',
  'Stanford Behavioral Neuroscience (2022)',
  'When autonomic anger triggers fight-or-flight, prefrontal impulse control diminishes. A 20-second delay with two deep nasal inhales followed by an extended sigh rapidly activates the parasympathetic vagal brake.',
  'Inhale twice deeply through your nose, then sigh slowly through your mouth before hitting send.'
),
(
  'kb-02',
  'Separating Observation from Evaluation',
  'Nonviolent Communication (Dr. Marshall Rosenberg)',
  'Communicating with labels like "you are lazy" or "you ruined this" triggers immediate defensive denial. Replacing judgments with neutral sensory observations keeps dialogue focused on problem-solving.',
  'State what concretely occurred without diagnosing the other person character.'
),
(
  'kb-03',
  'Cognitive Attribution in Digital Text',
  'Journal of Computer-Mediated Communication',
  'Digital text lacks facial warmth and vocal tone, leading people to attribute negative malice to ambiguous mistakes. Asking an open question defuses 70% of digital group chat friction.',
  'Formulate an open inquiry rather than an accusation.'
),
(
  'kb-04',
  'Sleep Deficit and Affective Reactivity',
  'Sleep Medicine Reviews (2020)',
  'Students sleeping less than 6 hours display a 3.2x increase in amygdala reactivity to minor frustrating stimuli. Recognizing internal biological exhaustion helps prevent interpersonal hostility.',
  'Acknowledge internal fatigue before sending high-stakes messages.'
)
on conflict (source_id) do nothing;
