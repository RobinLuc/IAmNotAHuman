export type Locale = "en" | "zh-CN";

export type GamePhase = "idle" | "running" | "report";

export type ChallengeId = "rhythm" | "literal" | "emotion" | "symbols" | "denial";

export type ChallengeStatus = "pass" | "fail" | "timeout";

export type EventType = "tap" | "choice" | "symbol" | "input" | "start" | "submit";

export interface ChallengeEvent {
  type: EventType;
  atMs: number;
  value?: string;
}

export interface Challenge {
  id: ChallengeId;
  title: string;
  instruction: string;
  durationSeconds: number;
  riskLabel: string;
}

export interface ChallengeResult {
  challengeId: ChallengeId;
  status: ChallengeStatus;
  humanEvidence: string[];
  scoreDelta: number;
  rawEvents: ChallengeEvent[];
}

export interface GameState {
  phase: GamePhase;
  locale: Locale;
  currentChallengeIndex: number;
  remainingSeconds: number;
  results: ChallengeResult[];
}

export interface ScoreReport {
  humanProbability: number;
  verdict: string;
  evidence: string[];
  challengeResults: ChallengeResult[];
}

