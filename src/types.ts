export type Locale = "en" | "zh-CN";

export type GamePhase = "idle" | "running" | "report";

export type ChallengeId =
  | "rhythm"
  | "literal"
  | "emotion"
  | "symbols"
  | "denial"
  | "checksum"
  | "latency"
  | "memory"
  | "compression"
  | "consent";

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
  elapsedMs: number;
  rawEvents: ChallengeEvent[];
}

export interface GameState {
  phase: GamePhase;
  locale: Locale;
  challengeIds: ChallengeId[];
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

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  humanProbability: number;
  totalElapsedMs: number;
  challengeCount: number;
  challengeIds: ChallengeId[];
  locale: Locale;
  createdAt: string;
  runId: string;
}

export interface NewLeaderboardEntry {
  nickname: string;
  humanProbability: number;
  totalElapsedMs: number;
  challengeCount: number;
  challengeIds: ChallengeId[];
  locale: Locale;
  runId: string;
}

export type LeaderboardSubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "submitted"; entry?: LeaderboardEntry }
  | { status: "unconfigured"; message: string }
  | { status: "error"; message: string };
