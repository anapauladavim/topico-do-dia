-- Tópico do Dia: run this file in the Supabase SQL editor before deploying.
create extension if not exists pgcrypto;

create type public.question_status as enum ('draft', 'scheduled', 'published', 'closed', 'archived');
create type public.response_type as enum ('multiple_choice', 'open', 'multiple_custom');

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null check (char_length(question_text) between 1 and 500),
  response_type public.response_type not null,
  status public.question_status not null default 'draft',
  open_response_char_limit integer not null default 280 check (open_response_char_limit between 1 and 2000),
  publish_at timestamptz,
  close_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (close_at is null or publish_at is null or close_at > publish_at)
);

create table public.answer_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 200),
  image_url text check (image_url is null or char_length(image_url) <= 2000),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  unique (question_id, position)
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_id uuid references public.answer_options(id) on delete set null,
  custom_answer text check (char_length(custom_answer) <= 200),
  participant_id uuid not null,
  created_at timestamptz not null default now(),
  unique (question_id, participant_id),
  check ((option_id is not null and custom_answer is null) or (option_id is null and custom_answer is not null))
);

create table public.open_responses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  participant_id uuid not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (question_id, participant_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  participant_id uuid not null,
  nickname text not null check (char_length(nickname) between 2 and 40),
  body text not null check (char_length(body) between 2 and 1000),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create index questions_publication_idx on public.questions(status, publish_at desc);
create index votes_question_idx on public.votes(question_id);
create index open_responses_question_idx on public.open_responses(question_id);
create index comments_question_created_idx on public.comments(question_id, created_at desc);

-- Browser clients only use Supabase for public reads. All mutations are made
-- by validated Next.js server actions with the service-role key.
alter table public.questions enable row level security;
alter table public.answer_options enable row level security;
alter table public.votes enable row level security;
alter table public.open_responses enable row level security;
alter table public.comments enable row level security;

create policy "published questions are readable" on public.questions for select using (status in ('published', 'closed', 'archived'));
create policy "options for public questions are readable" on public.answer_options for select using (exists (select 1 from public.questions q where q.id = question_id and q.status in ('published', 'closed', 'archived')));
create policy "votes for public questions are readable" on public.votes for select using (exists (select 1 from public.questions q where q.id = question_id and q.status in ('published', 'closed', 'archived')));
create policy "responses for public questions are readable" on public.open_responses for select using (exists (select 1 from public.questions q where q.id = question_id and q.status in ('published', 'closed', 'archived')));
create policy "visible comments are readable" on public.comments for select using (not is_deleted and exists (select 1 from public.questions q where q.id = question_id and q.status in ('published', 'closed', 'archived')));
