import type { Locale } from "./types";

export const DEFAULT_LOCALE: Locale = "zh-CN";

export type SoundCue = "start" | "tap" | "select" | "symbol" | "type" | "pass" | "fail" | "timeout" | "leaderboard";

export interface SoundNote {
  frequency: number;
  durationMs: number;
  delayMs: number;
  type: OscillatorType;
  gain?: number;
}

const soundCues: Record<SoundCue, SoundNote[]> = {
  start: [
    { frequency: 196, durationMs: 70, delayMs: 0, type: "square", gain: 0.016 },
    { frequency: 294, durationMs: 70, delayMs: 70, type: "square", gain: 0.016 },
    { frequency: 392, durationMs: 110, delayMs: 140, type: "sawtooth", gain: 0.014 }
  ],
  tap: [
    { frequency: 520, durationMs: 28, delayMs: 0, type: "square", gain: 0.012 },
    { frequency: 760, durationMs: 22, delayMs: 30, type: "square", gain: 0.009 }
  ],
  select: [
    { frequency: 360, durationMs: 45, delayMs: 0, type: "triangle", gain: 0.013 },
    { frequency: 245, durationMs: 35, delayMs: 48, type: "sawtooth", gain: 0.009 }
  ],
  symbol: [
    { frequency: 280, durationMs: 35, delayMs: 0, type: "triangle", gain: 0.012 },
    { frequency: 430, durationMs: 45, delayMs: 38, type: "triangle", gain: 0.011 }
  ],
  type: [
    { frequency: 700, durationMs: 16, delayMs: 0, type: "square", gain: 0.006 },
    { frequency: 520, durationMs: 14, delayMs: 18, type: "square", gain: 0.004 }
  ],
  pass: [
    { frequency: 520, durationMs: 65, delayMs: 0, type: "triangle", gain: 0.014 },
    { frequency: 780, durationMs: 75, delayMs: 68, type: "triangle", gain: 0.014 },
    { frequency: 1040, durationMs: 110, delayMs: 146, type: "square", gain: 0.011 }
  ],
  fail: [
    { frequency: 180, durationMs: 90, delayMs: 0, type: "sawtooth", gain: 0.014 },
    { frequency: 118, durationMs: 140, delayMs: 86, type: "square", gain: 0.012 }
  ],
  timeout: [
    { frequency: 110, durationMs: 130, delayMs: 0, type: "sawtooth", gain: 0.013 },
    { frequency: 76, durationMs: 210, delayMs: 132, type: "square", gain: 0.01 }
  ],
  leaderboard: [
    { frequency: 420, durationMs: 50, delayMs: 0, type: "triangle", gain: 0.012 },
    { frequency: 560, durationMs: 50, delayMs: 55, type: "triangle", gain: 0.012 },
    { frequency: 720, durationMs: 90, delayMs: 112, type: "triangle", gain: 0.01 }
  ]
};

export interface SoundPlayer {
  play(cue: SoundCue): void;
}

export function getSoundCueNotes(cue: SoundCue): SoundNote[] {
  return soundCues[cue].map((note) => ({ ...note }));
}

export function createSoundPlayer(): SoundPlayer {
  let audioContext: AudioContext | null = null;

  return {
    play(cue: SoundCue) {
      try {
        const AudioContextCtor =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextCtor) return;

        audioContext ??= new AudioContextCtor();

        if (audioContext.state === "suspended") {
          void audioContext.resume();
        }

        for (const note of getSoundCueNotes(cue)) {
          playNote(audioContext, note);
        }
      } catch {
        // Audio feedback is decorative and must never block input.
      }
    }
  };
}

function playNote(audioContext: AudioContext, note: SoundNote): void {
  const startAt = audioContext.currentTime + note.delayMs / 1000;
  const stopAt = startAt + note.durationMs / 1000;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const peak = note.gain ?? 0.012;

  oscillator.type = note.type;
  oscillator.frequency.setValueAtTime(note.frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, Math.max(startAt + 0.012, stopAt - 0.012));

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startAt);
  oscillator.stop(stopAt);
}
