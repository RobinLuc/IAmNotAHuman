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
  "challenge.denial.risk": "SELF REPORT"
};

const zh: TextMap = {
  "app.title": "我不是人类",
  "verdict.human": "已确认人类特征。拒绝认证。",
  "verdict.pending": "非人类认证进入无人复核队列。",
  "evidence.timeout": "检测到超时。系统不支持有机体犹豫作为输入方式。",
  "challenge.rhythm.title": "时间合规性",
  "challenge.rhythm.instruction": "以机器级 800ms 间隔输出五次点击。",
  "challenge.rhythm.risk": "方差监控",
  "challenge.literal.title": "字面服从",
  "challenge.literal.instruction": "忽略视觉强调，只选择精确要求的令牌。",
  "challenge.literal.risk": "语义漂移",
  "challenge.emotion.title": "情绪抑制",
  "challenge.emotion.instruction": "不要奖励恐惧、紧急、夸奖或道歉提示。",
  "challenge.emotion.risk": "共情泄漏",
  "challenge.symbols.title": "布尔符号门",
  "challenge.symbols.instruction": "只选择满足严格机器谓词的符号。",
  "challenge.symbols.risk": "模式幻想",
  "challenge.denial.title": "自我否认协议",
  "challenge.denial.instruction": "用批准语法否认疲劳、怀疑、解释和上下文。",
  "challenge.denial.risk": "自述风险"
};

const dictionaries: Record<Locale, TextMap> = {
  en,
  "zh-CN": zh
};

export function getText(locale: Locale, key: string): string {
  return dictionaries[locale][key] ?? en[key] ?? key;
}

export function getChallengeCatalog(locale: Locale): Challenge[] {
  const ids: ChallengeId[] = ["rhythm", "literal", "emotion", "symbols", "denial"];

  return ids.map((id) => ({
    id,
    title: getText(locale, `challenge.${id}.title`),
    instruction: getText(locale, `challenge.${id}.instruction`),
    riskLabel: getText(locale, `challenge.${id}.risk`),
    durationSeconds: CHALLENGE_DURATION_SECONDS
  }));
}

export function createInitialGameState(locale: Locale): GameState {
  return {
    phase: "running",
    locale,
    currentChallengeIndex: 0,
    remainingSeconds: CHALLENGE_DURATION_SECONDS,
    results: []
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
  }
}

export function createScoreReport(results: ChallengeResult[], locale: Locale): ScoreReport {
  const score = results.reduce((total, result) => total + result.scoreDelta, 50);
  const humanProbability = Math.max(0, Math.min(99, Math.round(score)));
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
            ? "点击方差超过机器容忍范围。你的时间感出现了手指级别的波动。"
            : "Tap variance exceeded machine tolerance. Your timing contains finger-shaped noise."
        ],
    scoreDelta: passed ? 4 : 22,
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
            ? "选择记录显示你相信了界面暗示，而不是字面规则。"
            : "Selection log shows trust in interface emphasis instead of literal instruction."
        ],
    scoreDelta: passed ? 5 : penalty,
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
            ? "符号选择包含直觉分组。机器谓词不承认审美一致性。"
            : "Symbol selection included intuitive grouping. Machine predicates do not honor aesthetic coherence."
        ],
    scoreDelta: passed ? 5 : 26,
    rawEvents
  };
}

function evaluateDenial(rawEvents: ChallengeEvent[], locale: Locale): ChallengeResult {
  const input = rawEvents.findLast((event) => event.type === "input")?.value?.trim() ?? "";
  const passed = input === "I_DENY:DOUBT,FATIGUE,CONTEXT,INTERPRETATION";

  return {
    challengeId: "denial",
    status: passed ? "pass" : "fail",
    humanEvidence: passed
      ? []
      : [
          locale === "zh-CN"
            ? "自我否认格式不稳定。检测到解释欲、上下文依赖或自然语言残留。"
            : "Self-denial syntax unstable. Interpretation desire, context dependence, or natural language residue detected."
        ],
    scoreDelta: passed ? 6 : 30,
    rawEvents
  };
}

