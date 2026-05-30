import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, getSoundCueNotes } from "./sound";

describe("ui defaults", () => {
  it("starts the public game in Chinese", () => {
    expect(DEFAULT_LOCALE).toBe("zh-CN");
  });
});

describe("sound cues", () => {
  it("uses short multi-note cues for game interactions", () => {
    const startCue = getSoundCueNotes("start");
    const passCue = getSoundCueNotes("pass");
    const failCue = getSoundCueNotes("fail");

    expect(startCue.length).toBeGreaterThan(1);
    expect(passCue.length).toBeGreaterThan(1);
    expect(failCue.length).toBeGreaterThan(1);
    expect(passCue.map((note) => note.frequency)).not.toEqual(failCue.map((note) => note.frequency));
  });

  it("keeps decorative audio cues brief", () => {
    const cues = ["start", "tap", "select", "symbol", "type", "pass", "fail", "timeout", "leaderboard"] as const;

    for (const cue of cues) {
      const totalMs = getSoundCueNotes(cue).reduce((sum, note) => sum + note.delayMs + note.durationMs, 0);

      expect(totalMs).toBeLessThanOrEqual(650);
    }
  });
});
