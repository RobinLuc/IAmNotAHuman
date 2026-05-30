# I Am Not A Human

Glitch-style reverse CAPTCHA game. A normal CAPTCHA asks players to prove they are not robots; this one asks them to prove they are not human.

## What Is Included

- 20-question reverse CAPTCHA bank.
- 10 random questions per run.
- Independent 60 second timer per question.
- English and Chinese UI.
- Glitch corporate audit visual style.
- Final diagnostic report with human probability and per-question evidence.
- Optional Supabase leaderboard sorted by lowest human probability, then shortest total run time.

The game does not request camera, microphone, login, or biometric permissions.

## Local Development

```bash
npm install
npm run dev -- --port 5174
```

Open `http://127.0.0.1:5174/`.

## Verification

```bash
npm test
npm run build
```

The test suite covers challenge catalog size, 10-question run selection, per-question 60 second progression, scoring, elapsed-time summaries, leaderboard sorting, nickname cleanup, and the unconfigured Supabase path.

## Supabase Leaderboard

The leaderboard is optional. Without Supabase environment variables, the report page shows an explanatory unconfigured state and the local game still works.

### Dashboard Path

1. Create a Supabase project.
2. Run `supabase/leaderboard_scores.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Fill in:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Restart the dev server.

### CLI Path

The Supabase CLI is installed as a project dev dependency. After creating a Supabase project and logging in:

```bash
npx supabase login
npm run supabase:link -- --project-ref your-project-ref
npm run supabase:push
```

Then copy the public Project URL and anon key into `.env.local`:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The table stores only score summaries: nickname, human probability, elapsed time, challenge count, challenge IDs, locale, timestamp, and run ID. It does not store raw click/input logs.

## Deployment

This is a static Vite app. Build with:

```bash
npm run build
```

Deploy the `dist/` directory to any static host. Add the two `VITE_SUPABASE_*` variables in the host environment if online leaderboard submission should work in production.

## Anti-Cheat Boundary

This is a game-jam leaderboard, not a secure competition system. The first version uses frontend validation, a unique `run_id`, database constraints, and RLS. A serious public contest should move score validation into a Supabase Edge Function or other trusted server path.
