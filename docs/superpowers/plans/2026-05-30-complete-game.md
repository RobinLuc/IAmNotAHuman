# Complete Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the game-jam version by making the question bank feel complete: 20 possible reverse CAPTCHA challenges, 10 random questions per run, online leaderboard summaries, and clear local/Supabase setup docs.

**Architecture:** Keep the current Vite/TypeScript single-page app. Extend the existing `ChallengeId` union, dictionaries, evaluator switch, and UI render helpers instead of introducing a new framework or backend. Supabase remains optional and only stores score summaries.

**Tech Stack:** Vite, TypeScript, Vitest, Supabase JS client, static CSS.

---

### Task 1: Lock Scope With Tests

**Files:**
- Modify: `src/game.test.ts`
- Modify: `src/leaderboard.test.ts`

- [ ] Update catalog tests so `getChallengeBank("en")` must return 20 challenge definitions.
- [ ] Keep sequence tests at 10 unique selected challenges per run.
- [ ] Add passing evaluation samples for the 10 new challenge IDs.
- [ ] Run `npm test` and verify failures are caused by missing challenge IDs and evaluator cases.

### Task 2: Extend Core Game Model

**Files:**
- Modify: `src/types.ts`
- Modify: `src/game.ts`

- [ ] Add 10 new `ChallengeId` members.
- [ ] Add English and Chinese titles, instructions, and risk labels for the new challenges.
- [ ] Add the new IDs to the 20-item bank.
- [ ] Add evaluator cases using existing choice and exact-input helpers.
- [ ] Run `npm test` and verify the game model tests pass.

### Task 3: Wire The New Challenges Into The UI

**Files:**
- Modify: `src/main.ts`
- Modify: `src/styles.css`

- [ ] Add prompt copy and option sets for the new challenges in both languages.
- [ ] Route new choice/input challenges through existing render helpers.
- [ ] Update start-page copy from `RANDOM BANK: 10` to `BANK: 20 / RUN: 10`.
- [ ] Keep mobile layouts single-column under 560px.

### Task 4: Finish Docs And Supabase Constraints

**Files:**
- Create: `README.md`
- Modify: `supabase/leaderboard_scores.sql`

- [ ] Document install, dev, test, build, Supabase setup, and deployment assumptions.
- [ ] Update the SQL allowed `challenge_ids` list to match the 20-item bank while keeping `challenge_count = 10`.

### Task 5: Verify And Commit

**Files:**
- All changed files

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Verify the report and leaderboard UI in the in-app browser at desktop and 390px mobile widths.
- [ ] Commit with `git commit -m "Complete game jam release"`.
