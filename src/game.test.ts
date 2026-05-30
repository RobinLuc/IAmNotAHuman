import { describe, expect, it } from "vitest";
import {
  CHALLENGE_DURATION_SECONDS,
  createInitialGameState,
  createScoreReport,
  evaluateChallenge,
  getChallengeCatalog,
  getText
} from "./game";
import type { ChallengeEvent, ChallengeResult } from "./types";

describe("challenge catalog", () => {
  it("defines exactly five reverse captcha challenges with independent 60 second limits", () => {
    const challenges = getChallengeCatalog("en");

    expect(challenges).toHaveLength(5);
    expect(CHALLENGE_DURATION_SECONDS).toBe(60);
    expect(challenges.every((challenge) => challenge.durationSeconds === 60)).toBe(true);
  });
});

describe("game state", () => {
  it("starts at the first challenge with a fresh 60 second timer", () => {
    const state = createInitialGameState("zh-CN");

    expect(state.phase).toBe("running");
    expect(state.currentChallengeIndex).toBe(0);
    expect(state.remainingSeconds).toBe(60);
    expect(state.locale).toBe("zh-CN");
    expect(state.results).toEqual([]);
  });
});

describe("challenge evaluation", () => {
  it("records human variance when rhythm taps are inconsistent", () => {
    const events: ChallengeEvent[] = [
      { type: "tap", atMs: 0 },
      { type: "tap", atMs: 620 },
      { type: "tap", atMs: 1710 },
      { type: "tap", atMs: 2390 }
    ];

    const result = evaluateChallenge("rhythm", events, false, "en");

    expect(result.status).toBe("fail");
    expect(result.humanEvidence.join(" ")).toMatch(/variance/i);
    expect(result.scoreDelta).toBeGreaterThan(0);
  });

  it("records timeout evidence without blocking later questions", () => {
    const result = evaluateChallenge("literal", [], true, "en");

    expect(result.status).toBe("timeout");
    expect(result.humanEvidence.join(" ")).toMatch(/timeout/i);
    expect(result.scoreDelta).toBeGreaterThan(0);
  });
});

describe("score report", () => {
  it("creates a diagnostic human probability from all challenge results", () => {
    const results: ChallengeResult[] = [
      {
        challengeId: "rhythm",
        status: "fail",
        humanEvidence: ["Tap variance exceeded machine tolerance."],
        scoreDelta: 22,
        rawEvents: []
      },
      {
        challengeId: "literal",
        status: "pass",
        humanEvidence: [],
        scoreDelta: 5,
        rawEvents: []
      }
    ];

    const report = createScoreReport(results, "en");

    expect(report.humanProbability).toBe(77);
    expect(report.verdict).toMatch(/human/i);
    expect(report.evidence[0]).toContain("Tap variance");
    expect(report.challengeResults).toHaveLength(2);
  });
});

describe("localization", () => {
  it("falls back to English when a translation key is missing", () => {
    expect(getText("zh-CN", "missing.translation.key")).toBe("missing.translation.key");
    expect(getText("zh-CN", "app.title")).toBe("我不是人类");
  });
});

