create extension if not exists pgcrypto;

create table if not exists public.leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  human_probability smallint not null,
  total_elapsed_ms integer not null,
  challenge_count smallint not null default 10,
  challenge_ids text[] not null,
  locale text not null,
  created_at timestamptz not null default now(),
  run_id text not null,
  constraint leaderboard_scores_nickname_check
    check (
      char_length(nickname) between 2 and 12
      and nickname = btrim(nickname)
      and nickname !~ '[<>[:cntrl:]]'
    ),
  constraint leaderboard_scores_probability_check
    check (human_probability between 0 and 100),
  constraint leaderboard_scores_elapsed_check
    check (total_elapsed_ms between 0 and 600000),
  constraint leaderboard_scores_count_check
    check (challenge_count = 10),
  constraint leaderboard_scores_ids_check
    check (
      cardinality(challenge_ids) = challenge_count
      and challenge_ids <@ array[
        'rhythm',
        'literal',
        'emotion',
        'symbols',
        'denial',
        'checksum',
        'latency',
        'memory',
        'compression',
        'consent'
      ]
    ),
  constraint leaderboard_scores_locale_check
    check (locale in ('en', 'zh-CN')),
  constraint leaderboard_scores_run_id_check
    check (char_length(run_id) between 8 and 80),
  constraint leaderboard_scores_run_id_unique unique (run_id)
);

create index if not exists leaderboard_scores_rank_idx
  on public.leaderboard_scores (human_probability asc, total_elapsed_ms asc, created_at asc);

alter table public.leaderboard_scores enable row level security;

drop policy if exists "anon can read leaderboard" on public.leaderboard_scores;
create policy "anon can read leaderboard"
  on public.leaderboard_scores
  for select
  to anon
  using (true);

drop policy if exists "anon can insert valid leaderboard scores" on public.leaderboard_scores;
create policy "anon can insert valid leaderboard scores"
  on public.leaderboard_scores
  for insert
  to anon
  with check (
    char_length(nickname) between 2 and 12
    and nickname = btrim(nickname)
    and nickname !~ '[<>[:cntrl:]]'
    and human_probability between 0 and 100
    and total_elapsed_ms between 0 and 600000
    and challenge_count = 10
    and cardinality(challenge_ids) = 10
    and challenge_ids <@ array[
      'rhythm',
      'literal',
      'emotion',
      'symbols',
      'denial',
      'checksum',
      'latency',
      'memory',
      'compression',
      'consent'
    ]
    and locale in ('en', 'zh-CN')
    and char_length(run_id) between 8 and 80
  );

revoke update, delete on public.leaderboard_scores from anon;
grant select (
  id,
  nickname,
  human_probability,
  total_elapsed_ms,
  challenge_count,
  challenge_ids,
  locale,
  created_at,
  run_id
) on public.leaderboard_scores to anon;
grant insert (
  nickname,
  human_probability,
  total_elapsed_ms,
  challenge_count,
  challenge_ids,
  locale,
  run_id
) on public.leaderboard_scores to anon;
