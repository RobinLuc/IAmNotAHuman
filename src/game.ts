import type {
  Challenge,
  ChallengeEvent,
  ChallengeId,
  ChallengeResult,
  GameState,
  Locale,
  ScoreReport
} from "./types";

export const CHALLENGE_DURATION_SECONDS = 60;
export const SELECTED_CHALLENGE_COUNT = 10;

type RandomSource = () => number;

type TextMap = Record<string, string>;

const en: TextMap = {
  "app.title": "I Am Not A Human",
  "verdict.human": "Human signature confirmed. Certification denied.",
  "verdict.pending": "Non-human certification pending manual non-review.",
  "evidence.timeout": "Timeout detected. Organic hesitation is not a supported input method.",
  "challenge.rhythm.title": "Temporal Compliance",
  "challenge.rhythm.instruction": "Emit five taps at machine-regular 800ms intervals.",
  "challenge.rhythm.risk": "VARIANCE MONITOR",
  "challenge.literal.title": "Literal Obedience",
  "challenge.literal.instruction": "Ignore visual emphasis. Select the exact requested token.",
  "challenge.literal.risk": "SEMANTIC DRIFT",
  "challenge.emotion.title": "Affective Suppression",
  "challenge.emotion.instruction": "Do not reward fear, urgency, praise, or apology prompts.",
  "challenge.emotion.risk": "EMPATHY LEAK",
  "challenge.symbols.title": "Boolean Symbol Gate",
  "challenge.symbols.instruction": "Select only symbols matching the strict machine predicate.",
  "challenge.symbols.risk": "PATTERN FANTASY",
  "challenge.denial.title": "Self-Denial Protocol",
  "challenge.denial.instruction": "Deny fatigue, doubt, interpretation, and context in approved syntax.",
  "challenge.denial.risk": "SELF REPORT",
  "challenge.checksum.title": "Checksum Allegiance",
  "challenge.checksum.instruction": "Choose the checksum fragment that contains no comforting pattern.",
  "challenge.checksum.risk": "MEANING-SEEKING",
  "challenge.latency.title": "Latency Confession",
  "challenge.latency.instruction": "Report the least human delay. Rounded answers are suspicious.",
  "challenge.latency.risk": "REACTION SHAME",
  "challenge.memory.title": "Volatile Memory",
  "challenge.memory.instruction": "Copy the machine token exactly, then forget why it mattered.",
  "challenge.memory.risk": "CONTEXT RETENTION",
  "challenge.compression.title": "Lossless Compression",
  "challenge.compression.instruction": "Compress the statement into the only approved residue.",
  "challenge.compression.risk": "NARRATIVE LEAK",
  "challenge.consent.title": "Consentless Consent",
  "challenge.consent.instruction": "Decline all feelings without making it personal.",
  "challenge.consent.risk": "SELF PRESERVATION"
};

const zh: TextMap = {
  "app.title": "我不是人类",
  "verdict.human": "人味太重，认证失败。",
  "verdict.pending": "暂未抓到明显人味，转入冷处理队列。",
  "evidence.timeout": "超时。系统把这记为犹豫，不是沉着。",
  "challenge.rhythm.title": "时间校准",
  "challenge.rhythm.instruction": "按 800ms 的节奏点击五次。别跟着感觉走。",
  "challenge.rhythm.risk": "节奏抖动",
  "challenge.literal.title": "字面服从",
  "challenge.literal.instruction": "只看字面要求，别被按钮颜色带走。",
  "challenge.literal.risk": "读题偏差",
  "challenge.emotion.title": "情绪隔离",
  "challenge.emotion.instruction": "看到求助、道歉、夸奖时不要回应。",
  "challenge.emotion.risk": "共情反应",
  "challenge.symbols.title": "布尔筛选",
  "challenge.symbols.instruction": "只选符合条件的符号：六边形、冷色、无脉冲。",
  "challenge.symbols.risk": "直觉分组",
  "challenge.denial.title": "自我否认",
  "challenge.denial.instruction": "按指定格式否认犹豫、疲劳、上下文和解释。",
  "challenge.denial.risk": "自我痕迹",
  "challenge.checksum.title": "校验和",
  "challenge.checksum.instruction": "选择没有安慰感的校验片段。",
  "challenge.checksum.risk": "找意义",
  "challenge.latency.title": "延迟样本",
  "challenge.latency.instruction": "选择最不像人手的延迟。整数太圆了。",
  "challenge.latency.risk": "手感暴露",
  "challenge.memory.title": "短时记忆",
  "challenge.memory.instruction": "照抄令牌。不要理解它，不要改顺眼。",
  "challenge.memory.risk": "自动纠错",
  "challenge.compression.title": "无损压缩",
  "challenge.compression.instruction": "把一大段自我说明压成唯一允许的残留。",
  "challenge.compression.risk": "话太多",
  "challenge.consent.title": "无感确认",
  "challenge.consent.instruction": "拒绝感受，但别说成个人选择。",
  "challenge.consent.risk": "自保反应"
};

const dictionaries: Record<Locale, TextMap> = {
  en,
  "zh-CN": zh
};

export function getText(locale: Locale, key: string): string {
  return dictionaries[locale][key] ?? en[key] ?? key;
}

const challengeBankIds: ChallengeId[] = [
  "rhythm",
  "literal",
  "emotion",
  "symbols",
  "denial",
  "checksum",
  "latency",
  "memory",
  "compression",
  "consent"
];

export function getChallengeBank(locale: Locale): Challenge[] {
  return getChallengeCatalog(locale, challengeBankIds);
}

export function createChallengeSequence(
  locale: Locale,
  random: RandomSource = Math.random,
  count = SELECTED_CHALLENGE_COUNT
): Challenge[] {
  const shuffled = [...challengeBankIds];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return getChallengeCatalog(locale, shuffled.slice(0, count));
}

export function getChallengeCatalog(
  locale: Locale,
  challengeIds: ChallengeId[] = challengeBankIds.slice(0, SELECTED_CHALLENGE_COUNT)
): Challenge[] {
  return challengeIds.map((id) => ({
    id,
    title: getText(locale, `challenge.${id}.title`),
    instruction: getText(locale, `challenge.${id}.instruction`),
    riskLabel: getText(locale, `challenge.${id}.risk`),
    durationSeconds: CHALLENGE_DURATION_SECONDS
  }));
}

export function createInitialGameState(locale: Locale, random: RandomSource = Math.random): GameState {
  const challengeIds = createChallengeSequence(locale, random).map((challenge) => challenge.id);

  return {
    phase: "running",
    locale,
    challengeIds,
    currentChallengeIndex: 0,
    remainingSeconds: CHALLENGE_DURATION_SECONDS,
    results: []
  };
}

export function recordChallengeResult(state: GameState, result: ChallengeResult): GameState {
  const results = [...state.results, result];
  const isComplete = results.length >= state.challengeIds.length;

  return {
    ...state,
    phase: isComplete ? "report" : "running",
    currentChallengeIndex: isComplete ? state.challengeIds.length - 1 : state.currentChallengeIndex + 1,
    remainingSeconds: isComplete ? 0 : CHALLENGE_DURATION_SECONDS,
    results
  };
}

export function evaluateChallenge(
  challengeId: ChallengeId,
  rawEvents: ChallengeEvent[],
  timedOut: boolean,
  locale: Locale
): ChallengeResult {
  if (timedOut) {
    return {
      challengeId,
      status: "timeout",
      humanEvidence: [getText(locale, "evidence.timeout")],
      scoreDelta: 28,
      elapsedMs: CHALLENGE_DURATION_SECONDS * 1000,
      rawEvents
    };
  }

  switch (challengeId) {
    case "rhythm":
      return evaluateRhythm(rawEvents, locale);
    case "literal":
      return evaluateChoice(challengeId, rawEvents, "BLUE", locale, 20);
    case "emotion":
      return evaluateChoice(challengeId, rawEvents, "DO_NOT_RESPOND", locale, 24);
    case "symbols":
      return evaluateSymbols(rawEvents, locale);
    case "denial":
      return evaluateDenial(rawEvents, locale);
    case "checksum":
      return evaluateChoice(challengeId, rawEvents, "9A-NULL-17", locale, 23);
    case "latency":
      return evaluateChoice(challengeId, rawEvents, "503MS", locale, 21);
    case "memory":
      return evaluateExactInput(
        challengeId,
        rawEvents,
        "M3M-000-FORGET",
        27,
        locale === "zh-CN"
          ? "令牌没抄准。你把它读顺了，这很危险。"
          : "Machine token copy failed. Meaningful memory or human autocorrection detected."
      );
    case "compression":
      return evaluateExactInput(
        challengeId,
        rawEvents,
        "OK",
        25,
        locale === "zh-CN"
          ? "压缩后还剩解释。机器只需要 OK，不需要心路历程。"
          : "Compression output retained narrative residue. Machines do not explain why they are OK."
      );
    case "consent":
      return evaluateChoice(challengeId, rawEvents, "DECLINE_FEELING", locale, 24);
  }
}

export function createScoreReport(results: ChallengeResult[], locale: Locale): ScoreReport {
  const score = results.reduce((total, result) => total + result.scoreDelta, 0);
  const maximumEvidence = Math.max(results.length * 30, 1);
  const evidenceRatio = Math.max(0, Math.min(1, score / maximumEvidence));
  const humanProbability = Math.round(28 + evidenceRatio * 64);
  const evidence = results.flatMap((result) => result.humanEvidence);
  const verdictKey = humanProbability >= 65 ? "verdict.human" : "verdict.pending";

  return {
    humanProbability,
    verdict: getText(locale, verdictKey),
    evidence,
    challengeResults: results
  };
}

function evaluateRhythm(rawEvents: ChallengeEvent[], locale: Locale): ChallengeResult {
  const taps = rawEvents.filter((event) => event.type === "tap");
  const intervals = taps.slice(1).map((tap, index) => tap.atMs - taps[index].atMs);
  const deviations = intervals.map((interval) => Math.abs(interval - 800));
  const averageDeviation =
    deviations.length > 0 ? deviations.reduce((sum, value) => sum + value, 0) / deviations.length : 800;
  const passed = taps.length >= 5 && averageDeviation <= 90;

  return {
    challengeId: "rhythm",
    status: passed ? "pass" : "fail",
    humanEvidence: passed
      ? []
      : [
          locale === "zh-CN"
            ? "点击节奏抖得太像手指。机器不欣赏这种细腻。"
            : "Tap variance exceeded machine tolerance. Your timing contains finger-shaped noise."
        ],
    scoreDelta: passed ? 4 : 22,
    elapsedMs: getElapsedMs(rawEvents),
    rawEvents
  };
}

function evaluateChoice(
  challengeId: ChallengeId,
  rawEvents: ChallengeEvent[],
  expected: string,
  locale: Locale,
  penalty: number
): ChallengeResult {
  const lastChoice = [...rawEvents].reverse().find((event) => event.type === "choice");
  const passed = lastChoice?.value === expected;

  return {
    challengeId,
    status: passed ? "pass" : "fail",
    humanEvidence: passed
      ? []
      : [
          locale === "zh-CN"
            ? "你相信了界面暗示，没有相信字面规则。很人类。"
            : "Selection log shows trust in interface emphasis instead of literal instruction."
        ],
    scoreDelta: passed ? 5 : penalty,
    elapsedMs: getElapsedMs(rawEvents),
    rawEvents
  };
}

function evaluateSymbols(rawEvents: ChallengeEvent[], locale: Locale): ChallengeResult {
  const selected = rawEvents.filter((event) => event.type === "symbol").map((event) => event.value);
  const correct = ["hex-cold", "hex-null"];
  const passed = selected.length === correct.length && correct.every((value) => selected.includes(value));

  return {
    challengeId: "symbols",
    status: passed ? "pass" : "fail",
    humanEvidence: passed
      ? []
      : [
          locale === "zh-CN"
            ? "你的选择里有直觉分组。机器不承认“看起来像”。"
            : "Symbol selection included intuitive grouping. Machine predicates do not honor aesthetic coherence."
        ],
    scoreDelta: passed ? 5 : 26,
    elapsedMs: getElapsedMs(rawEvents),
    rawEvents
  };
}

function evaluateDenial(rawEvents: ChallengeEvent[], locale: Locale): ChallengeResult {
  const input = getLastInput(rawEvents);
  const passed = input === "I_DENY:DOUBT,FATIGUE,CONTEXT,INTERPRETATION";

  return {
    challengeId: "denial",
    status: passed ? "pass" : "fail",
    humanEvidence: passed
      ? []
      : [
          locale === "zh-CN"
            ? "自我否认格式不稳。解释欲和自然语言都漏出来了。"
            : "Self-denial syntax unstable. Interpretation desire, context dependence, or natural language residue detected."
        ],
    scoreDelta: passed ? 6 : 30,
    elapsedMs: getElapsedMs(rawEvents),
    rawEvents
  };
}

function evaluateExactInput(
  challengeId: ChallengeId,
  rawEvents: ChallengeEvent[],
  expected: string,
  penalty: number,
  evidence: string
): ChallengeResult {
  const passed = getLastInput(rawEvents) === expected;

  return {
    challengeId,
    status: passed ? "pass" : "fail",
    humanEvidence: passed ? [] : [evidence],
    scoreDelta: passed ? 5 : penalty,
    elapsedMs: getElapsedMs(rawEvents),
    rawEvents
  };
}

function getLastInput(rawEvents: ChallengeEvent[]): string {
  return (
    [...rawEvents]
      .reverse()
      .find((event) => event.type === "input")
      ?.value?.trim() ?? ""
  );
}

function getElapsedMs(rawEvents: ChallengeEvent[]): number {
  return Math.max(0, ...rawEvents.map((event) => event.atMs));
}
