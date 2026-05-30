import { describe, expect, it } from "vitest";
import {
  buildLeaderboardPayload,
  fetchLeaderboard,
  getLeaderboardConfig,
  sanitizeNickname,
  sortLeaderboardEntries,
  sumElapsedMs
} from "./leaderboard";
import type { ChallengeResult, LeaderboardEntry } from "./types";

describe("leaderboard nickname handling", () => {
  it("cleans whitespace, control characters, angle brackets, and overlong names", () => {
    expect(sanitizeNickname("  A\nI<>审查员很长很长  ")).toBe("A I审查员很长很长");
  });

  it("keeps short Chinese nicknames intact", () => {
    expect(sanitizeNickname("罗宾")).toBe("罗宾");
  });
});

describe("leaderboard sorting", () => {
  it("sorts by lowest human probability, then shortest elapsed time, then oldest creation time", () => {
    const entries: LeaderboardEntry[] = [
      makeEntry("b", 52, 7000, "2026-05-30T10:00:02.000Z"),
      makeEntry("a", 41, 9000, "2026-05-30T10:00:01.000Z"),
      makeEntry("c", 41, 8000, "2026-05-30T10:00:03.000Z"),
      makeEntry("d", 41, 8000, "2026-05-30T10:00:00.000Z")
    ];

    expect(sortLeaderboardEntries(entries).map((entry) => entry.nickname)).toEqual(["d", "c", "a", "b"]);
  });
});

describe("leaderboard payloads", () => {
  it("sums challenge elapsed time for submission payloads", () => {
    const results: ChallengeResult[] = [
      makeResult("rhythm", 1200),
      makeResult("literal", 2400),
      makeResult("emotion", 3600)
    ];

    expect(sumElapsedMs(results)).toBe(7200);
  });

  it("builds the summary payload without raw event logs", () => {
    const payload = buildLeaderboardPayload({
      nickname: "  Robin<>  ",
      humanProbability: 42,
      results: [makeResult("rhythm", 1000), makeResult("literal", 2000)],
      challengeIds: ["rhythm", "literal"],
      locale: "en",
      runId: "run-1"
    });

    expect(payload).toEqual({
      nickname: "Robin",
      humanProbability: 42,
      totalElapsedMs: 3000,
      challengeCount: 2,
      challengeIds: ["rhythm", "literal"],
      locale: "en",
      runId: "run-1"
    });
  });
});

describe("leaderboard configuration", () => {
  it("reports unconfigured state when Supabase env vars are missing", async () => {
    expect(getLeaderboardConfig({}).configured).toBe(false);

    const response = await fetchLeaderboard({ config: getLeaderboardConfig({}) });

    expect(response.status).toBe("unconfigured");
    expect(response.entries).toEqual([]);
  });
});

function makeResult(challengeId: ChallengeResult["challengeId"], elapsedMs: number): ChallengeResult {
  return {
    challengeId,
    status: "fail",
    humanEvidence: [],
    scoreDelta: 10,
    elapsedMs,
    rawEvents: [{ type: "submit", atMs: elapsedMs }]
  };
}

function makeEntry(
  nickname: string,
  humanProbability: number,
  totalElapsedMs: number,
  createdAt: string
): LeaderboardEntry {
  return {
    id: nickname,
    nickname,
    humanProbability,
    totalElapsedMs,
    challengeCount: 10,
    challengeIds: ["rhythm"],
    locale: "en",
    createdAt,
    runId: `run-${nickname}`
  };
}
