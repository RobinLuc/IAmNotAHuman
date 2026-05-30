import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  ChallengeId,
  ChallengeResult,
  LeaderboardEntry,
  LeaderboardSubmissionState,
  Locale,
  NewLeaderboardEntry
} from "./types";

const TABLE_NAME = "leaderboard_scores";
const LEADERBOARD_LIMIT = 20;

type EnvLike = Record<string, string | undefined>;

interface SupabaseRow {
  id: string;
  nickname: string;
  human_probability: number;
  total_elapsed_ms: number;
  challenge_count: number;
  challenge_ids: ChallengeId[];
  locale: Locale;
  created_at: string;
  run_id: string;
}

export interface LeaderboardConfig {
  configured: boolean;
  url?: string;
  anonKey?: string;
}

export interface FetchLeaderboardOptions {
  config?: LeaderboardConfig;
  client?: SupabaseClient;
}

export interface FetchLeaderboardResult {
  status: "ok" | "unconfigured" | "error";
  entries: LeaderboardEntry[];
  message?: string;
}

export interface BuildLeaderboardPayloadInput {
  nickname: string;
  humanProbability: number;
  totalElapsedMs?: number;
  results?: ChallengeResult[];
  challengeIds: ChallengeId[];
  locale: Locale;
  runId: string;
}

export function sanitizeNickname(input: string): string {
  return Array.from(
    input
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .replace(/[\u0000-\u001f\u007f<>]/g, "")
      .trim()
  )
    .slice(0, 12)
    .join("");
}

export function sortLeaderboardEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((left, right) => {
    if (left.humanProbability !== right.humanProbability) {
      return left.humanProbability - right.humanProbability;
    }

    if (left.totalElapsedMs !== right.totalElapsedMs) {
      return left.totalElapsedMs - right.totalElapsedMs;
    }

    return Date.parse(left.createdAt) - Date.parse(right.createdAt);
  });
}

export function sumElapsedMs(results: ChallengeResult[]): number {
  return results.reduce((total, result) => total + result.elapsedMs, 0);
}

export function buildLeaderboardPayload(input: BuildLeaderboardPayloadInput): NewLeaderboardEntry {
  const nickname = sanitizeNickname(input.nickname);
  const totalElapsedMs = input.totalElapsedMs ?? sumElapsedMs(input.results ?? []);

  return {
    nickname,
    humanProbability: input.humanProbability,
    totalElapsedMs,
    challengeCount: input.challengeIds.length,
    challengeIds: input.challengeIds,
    locale: input.locale,
    runId: input.runId
  };
}

export function getLeaderboardConfig(env: EnvLike = import.meta.env): LeaderboardConfig {
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return { configured: false };
  }

  return { configured: true, url, anonKey };
}

export async function fetchLeaderboard(options: FetchLeaderboardOptions = {}): Promise<FetchLeaderboardResult> {
  const config = options.config ?? getLeaderboardConfig();
  const client = options.client ?? createLeaderboardClient(config);

  if (!config.configured || !client) {
    return {
      status: "unconfigured",
      entries: [],
      message: "Leaderboard is waiting for Supabase keys."
    };
  }

  const { data, error } = await client
    .from(TABLE_NAME)
    .select("*")
    .order("human_probability", { ascending: true })
    .order("total_elapsed_ms", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(LEADERBOARD_LIMIT);

  if (error) {
    return { status: "error", entries: [], message: error.message };
  }

  return {
    status: "ok",
    entries: sortLeaderboardEntries(((data ?? []) as SupabaseRow[]).map(mapRow))
  };
}

export async function submitScore(
  entry: NewLeaderboardEntry,
  options: FetchLeaderboardOptions = {}
): Promise<LeaderboardSubmissionState> {
  const config = options.config ?? getLeaderboardConfig();
  const client = options.client ?? createLeaderboardClient(config);

  if (!config.configured || !client) {
    return {
      status: "unconfigured",
      message: "Leaderboard is not connected yet. Your report still counts locally."
    };
  }

  if (entry.nickname.length < 2) {
    return { status: "error", message: "Nickname needs at least 2 characters." };
  }

  const row = toRow(entry);
  const { data, error } = await client.from(TABLE_NAME).insert(row).select("*").single();

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "submitted", entry: mapRow(data as SupabaseRow) };
}

function createLeaderboardClient(config: LeaderboardConfig): SupabaseClient | undefined {
  if (!config.configured || !config.url || !config.anonKey) {
    return undefined;
  }

  return createClient(config.url, config.anonKey);
}

function mapRow(row: SupabaseRow): LeaderboardEntry {
  return {
    id: row.id,
    nickname: row.nickname,
    humanProbability: row.human_probability,
    totalElapsedMs: row.total_elapsed_ms,
    challengeCount: row.challenge_count,
    challengeIds: row.challenge_ids,
    locale: row.locale,
    createdAt: row.created_at,
    runId: row.run_id
  };
}

function toRow(entry: NewLeaderboardEntry): Omit<SupabaseRow, "id" | "created_at"> {
  return {
    nickname: entry.nickname,
    human_probability: entry.humanProbability,
    total_elapsed_ms: entry.totalElapsedMs,
    challenge_count: entry.challengeCount,
    challenge_ids: entry.challengeIds,
    locale: entry.locale,
    run_id: entry.runId
  };
}
