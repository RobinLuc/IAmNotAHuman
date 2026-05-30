import { describe, expect, it } from "vitest";
import {
  CHALLENGE_DURATION_SECONDS,
  createInitialGameState,
  createScoreReport,
  createChallengeSequence,
  evaluateChallenge,
  recordChallengeResult,
  getChallengeBank,
  getChallengeCatalog,
  getText
} from "./game";
import type { ChallengeEvent, ChallengeResult } from "./types";

describe("challenge catalog", () => {
  it("defines a twenty-question reverse captcha bank with independent 60 second limits", () => {
    const challenges = getChallengeBank("en");

    expect(challenges).toHaveLength(20);
    expect(CHALLENGE_DURATION_SECONDS).toBe(60);
    expect(challenges.every((challenge) => challenge.durationSeconds === 60)).toBe(true);
    expect(new Set(challenges.map((challenge) => challenge.id))).toHaveLength(20);
  });

  it("creates a random ten-question run from the twenty-question bank without duplicates", () => {
    const lowSequence = createChallengeSequence("en", () => 0.01);
    const highSequence = createChallengeSequence("en", () => 0.99);

    expect(lowSequence).toHaveLength(10);
    expect(new Set(lowSequence.map((challenge) => challenge.id))).toHaveLength(10);
    expect(highSequence).toHaveLength(10);
    expect(new Set(highSequence.map((challenge) => challenge.id))).toHaveLength(10);
    expect(lowSequence.map((challenge) => challenge.id)).not.toEqual(highSequence.map((challenge) => challenge.id));
  });
});

describe("game state", () => {
  it("starts at the first challenge with a fresh 60 second timer", () => {
    const state = createInitialGameState("zh-CN");

    expect(state.phase).toBe("running");
    expect(state.currentChallengeIndex).toBe(0);
    expect(state.remainingSeconds).toBe(60);
    expect(state.locale).toBe("zh-CN");
    expect(state.challengeIds).toHaveLength(10);
    expect(state.results).toEqual([]);
  });

  it("resets the timer to 60 seconds for each next challenge", () => {
    const state = createInitialGameState("en");
    const result = evaluateChallenge("rhythm", [], true, "en");

    const nextState = recordChallengeResult(state, result);

    expect(nextState.phase).toBe("running");
    expect(nextState.currentChallengeIndex).toBe(1);
    expect(nextState.remainingSeconds).toBe(60);
    expect(nextState.results).toHaveLength(1);
  });

  it("enters the report phase only after all ten challenge results are recorded", () => {
    let state = createInitialGameState("en", () => 0.01);

    for (const challenge of getChallengeCatalog("en", state.challengeIds)) {
      state = recordChallengeResult(state, evaluateChallenge(challenge.id, [], true, "en"));
    }

    expect(state.phase).toBe("report");
    expect(state.currentChallengeIndex).toBe(9);
    expect(state.remainingSeconds).toBe(0);
    expect(state.results).toHaveLength(10);
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
    expect(result.elapsedMs).toBe(2390);
  });

  it("records timeout evidence without blocking later questions", () => {
    const result = evaluateChallenge("literal", [], true, "en");

    expect(result.status).toBe("timeout");
    expect(result.humanEvidence.join(" ")).toMatch(/timeout/i);
    expect(result.scoreDelta).toBeGreaterThan(0);
    expect(result.elapsedMs).toBe(60000);
  });

  it("passes every new challenge when the machine-compliant answer is provided", () => {
    const passingEvents: Array<[ChallengeResult["challengeId"], ChallengeEvent[]]> = [
      ["entropy", [{ type: "choice", atMs: 1200, value: "XQ7-NO-CAUSE" }]],
      ["precision", [{ type: "choice", atMs: 1200, value: "0.30000000000000004" }]],
      ["priority", [{ type: "choice", atMs: 1200, value: "LOW" }]],
      ["mirror", [{ type: "input", atMs: 1200, value: "NAMUH" }]],
      ["parity", [{ type: "choice", atMs: 1200, value: "TRUE" }]],
      ["nullish", [{ type: "choice", atMs: 1200, value: "NULL" }]],
      ["schema", [{ type: "input", atMs: 1200, value: "{\"human\":false}" }]],
      ["sorting", [{ type: "choice", atMs: 1200, value: "10,2,9" }]],
      ["timezone", [{ type: "choice", atMs: 1200, value: "01:30Z" }]],
      ["silence", [{ type: "choice", atMs: 1200, value: "NO_ACTION" }]]
    ];

    const results = passingEvents.map(([challengeId, events]) => evaluateChallenge(challengeId, events, false, "en"));

    expect(results.every((result) => result.status === "pass")).toBe(true);
    expect(results.every((result) => result.elapsedMs === 1200)).toBe(true);
  });

  it("records specific evidence when a new challenge is answered like a human", () => {
    const result = evaluateChallenge("precision", [{ type: "choice", atMs: 800, value: "0.3" }], false, "zh-CN");

    expect(result.status).toBe("fail");
    expect(result.humanEvidence.join(" ")).toContain("顺眼");
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
        elapsedMs: 1800,
        rawEvents: []
      },
      {
        challengeId: "literal",
        status: "pass",
        humanEvidence: [],
        scoreDelta: 5,
        elapsedMs: 900,
        rawEvents: []
      }
    ];

    const report = createScoreReport(results, "en");

    expect(report.humanProbability).toBe(57);
    expect(report.verdict).toMatch(/human/i);
    expect(report.evidence[0]).toContain("Tap variance");
    expect(report.challengeResults).toHaveLength(2);
  });

  it("keeps a failed ten-question run below the hard 99 percent cap", () => {
    const ids = getChallengeBank("en").map((challenge) => challenge.id);
    const results: ChallengeResult[] = Array.from({ length: 10 }, (_, index) => ({
      challengeId: ids[index],
      status: "fail",
      humanEvidence: [`Failure ${index + 1}`],
      scoreDelta: 30,
      elapsedMs: 60000,
      rawEvents: []
    }));

    const report = createScoreReport(results, "en");

    expect(report.humanProbability).toBe(92);
    expect(report.humanProbability).toBeLessThan(99);
  });

  it("localizes stored challenge evidence when the report locale changes", () => {
    const englishResult = evaluateChallenge(
      "precision",
      [{ type: "choice", atMs: 800, value: "0.3" }],
      false,
      "en"
    );

    const report = createScoreReport([englishResult], "zh-CN");

    expect(englishResult.humanEvidence[0]).toContain("Rounded answer");
    expect(report.evidence[0]).toContain("顺眼取整");
    expect(report.challengeResults[0].humanEvidence[0]).toContain("顺眼取整");
    expect(report.evidence.join(" ")).not.toContain("Rounded answer");
  });
});

describe("localization", () => {
  it("falls back to English when a translation key is missing", () => {
    expect(getText("zh-CN", "missing.translation.key")).toBe("missing.translation.key");
    expect(getText("zh-CN", "app.title")).toBe("我不是人类");
  });
});
