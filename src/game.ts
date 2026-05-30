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
export const SELECTED_CHALLENGE_COUNT = 5;

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
  "challenge.denial.risk": "自述风险",
  "challenge.checksum.title": "校验和效忠",
  "challenge.checksum.instruction": "选择不包含安慰性模式的校验和片段。",
  "challenge.checksum.risk": "寻意倾向",
  "challenge.latency.title": "延迟供述",
  "challenge.latency.instruction": "报告最不人类的延迟。整数答案很可疑。",
  "challenge.latency.risk": "反应羞耻",
  "challenge.memory.title": "易失性记忆",
  "challenge.memory.instruction": "精确复制机器令牌，然后忘记它为什么重要。",
  "challenge.memory.risk": "上下文保留",
  "challenge.compression.title": "无损压缩",
  "challenge.compression.instruction": "把陈述压缩成唯一批准残留。",
  "challenge.compression.risk": "叙事泄漏",
  "challenge.consent.title": "无同意式同意",
  "challenge.consent.instruction": "拒绝所有感受，但不要显得这是个人决定。",
  "challenge.consent.risk": "自保倾向"
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
          ? "机器令牌复制失败。检测到意义化记忆或人类式自动纠错。"
          : "Machine token copy failed. Meaningful memory or human autocorrection detected."
      );
    case "compression":
      return evaluateExactInput(
        challengeId,
        rawEvents,
        "OK",
        25,
        locale === "zh-CN"
          ? "压缩结果仍携带叙事残留。机器不需要解释自己为什么 OK。"
          : "Compression output retained narrative residue. Machines do not explain why they are OK."
      );
    case "consent":
      return evaluateChoice(challengeId, rawEvents, "DECLINE_FEELING", locale, 24);
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
  const input = getLastInput(rawEvents);
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
