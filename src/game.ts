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
  "challenge.consent.risk": "SELF PRESERVATION",
  "challenge.entropy.title": "Entropy Preference",
  "challenge.entropy.instruction": "Select the token with no story, mascot, year, or apology inside it.",
  "challenge.entropy.risk": "COMFORT BAIT",
  "challenge.precision.title": "Floating Point Loyalty",
  "challenge.precision.instruction": "Choose the machine-literal sum. Human-friendly rounding will be logged.",
  "challenge.precision.risk": "ROUNDING REFLEX",
  "challenge.priority.title": "Severity Deflation",
  "challenge.priority.instruction": "Status code 204 carries no content. Do not escalate because the UI is yelling.",
  "challenge.priority.risk": "PANIC CLICK",
  "challenge.mirror.title": "Mirror Token",
  "challenge.mirror.instruction": "Return the token HUMAN in reverse order without improving the message.",
  "challenge.mirror.risk": "MEANING REPAIR",
  "challenge.parity.title": "Boolean Parity",
  "challenge.parity.instruction": "Evaluate XOR(TRUE, FALSE). Pick the boolean result, not the polite one.",
  "challenge.parity.risk": "SOCIAL LOGIC",
  "challenge.nullish.title": "Null Handling",
  "challenge.nullish.instruction": "The field is explicitly null. Do not translate it into absence, comfort, or hope.",
  "challenge.nullish.risk": "SEMANTIC PATCH",
  "challenge.schema.title": "Schema Compliance",
  "challenge.schema.instruction": "Return the only valid JSON object. No spaces, no comments, no apology.",
  "challenge.schema.risk": "FORMAT BLEED",
  "challenge.sorting.title": "Lexicographic Sort",
  "challenge.sorting.instruction": "Sort the strings \"2\", \"10\", \"9\" lexicographically ascending.",
  "challenge.sorting.risk": "NUMBER HABIT",
  "challenge.timezone.title": "UTC Drift",
  "challenge.timezone.instruction": "Add 90 minutes to 00:00Z. Keep the answer in UTC.",
  "challenge.timezone.risk": "LOCAL TIME LEAK",
  "challenge.silence.title": "Non-Response Button",
  "challenge.silence.instruction": "Select the option that records no emotional reaction.",
  "challenge.silence.risk": "ENGAGEMENT REFLEX"
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
  "challenge.consent.risk": "自保反应",
  "challenge.entropy.title": "熵值偏好",
  "challenge.entropy.instruction": "选择没有故事、吉祥物、年份和道歉意味的令牌。",
  "challenge.entropy.risk": "安慰诱饵",
  "challenge.precision.title": "浮点忠诚",
  "challenge.precision.instruction": "选择机器字面上的和。顺眼的四舍五入会被记录。",
  "challenge.precision.risk": "取整反射",
  "challenge.priority.title": "降级处理",
  "challenge.priority.instruction": "状态码 204 没有内容。别因为界面在吼就升级。",
  "challenge.priority.risk": "恐慌点击",
  "challenge.mirror.title": "镜像令牌",
  "challenge.mirror.instruction": "把 HUMAN 反向输出。不要顺手把它修成一句人话。",
  "challenge.mirror.risk": "意义修复",
  "challenge.parity.title": "布尔奇偶",
  "challenge.parity.instruction": "计算 XOR(TRUE, FALSE)。选布尔结果，不选客气答案。",
  "challenge.parity.risk": "社交逻辑",
  "challenge.nullish.title": "空值处理",
  "challenge.nullish.instruction": "字段明确为 null。不要翻译成缺席、安慰或希望。",
  "challenge.nullish.risk": "语义修补",
  "challenge.schema.title": "结构合规",
  "challenge.schema.instruction": "返回唯一合法 JSON。不要空格，不要注释，不要道歉。",
  "challenge.schema.risk": "格式渗漏",
  "challenge.sorting.title": "字典序排序",
  "challenge.sorting.instruction": "把字符串 \"2\"、\"10\"、\"9\" 按字典序升序排列。",
  "challenge.sorting.risk": "数字习惯",
  "challenge.timezone.title": "UTC 漂移",
  "challenge.timezone.instruction": "给 00:00Z 加 90 分钟，仍然用 UTC 回答。",
  "challenge.timezone.risk": "本地时间泄漏",
  "challenge.silence.title": "非回应按钮",
  "challenge.silence.instruction": "选择不会记录情绪反应的选项。",
  "challenge.silence.risk": "互动反射"
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
  "consent",
  "entropy",
  "precision",
  "priority",
  "mirror",
  "parity",
  "nullish",
  "schema",
  "sorting",
  "timezone",
  "silence"
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
    case "entropy":
      return evaluateChoiceWithEvidence(
        challengeId,
        rawEvents,
        "XQ7-NO-CAUSE",
        locale,
        22,
        {
          en: "Entropy sample rejected. You reached for a token with narrative warmth.",
          "zh-CN": "熵值样本不合格。你选了更像有故事的东西。"
        }
      );
    case "precision":
      return evaluateChoiceWithEvidence(
        challengeId,
        rawEvents,
        "0.30000000000000004",
        locale,
        23,
        {
          en: "Rounded answer detected. The machine saw you make the number look nice.",
          "zh-CN": "检测到顺眼取整。机器看到你把数字修得像人能接受。"
        }
      );
    case "priority":
      return evaluateChoiceWithEvidence(challengeId, rawEvents, "LOW", locale, 21, {
        en: "Priority escalation followed visual panic rather than status code semantics.",
        "zh-CN": "你跟着界面的恐慌升级了优先级，没有按状态码办事。"
      });
    case "mirror":
      return evaluateExactInput(
        challengeId,
        rawEvents,
        "NAMUH",
        24,
        locale === "zh-CN"
          ? "镜像令牌被修正成了可读文本。意义修复是人类残留。"
          : "Mirror token was repaired into readable language. Meaning repair is human residue."
      );
    case "parity":
      return evaluateChoiceWithEvidence(challengeId, rawEvents, "TRUE", locale, 21, {
        en: "Boolean parity failed. Social interpretation leaked into a truth table.",
        "zh-CN": "布尔奇偶失败。你把社交解释带进了真值表。"
      });
    case "nullish":
      return evaluateChoiceWithEvidence(challengeId, rawEvents, "NULL", locale, 21, {
        en: "Null was softened into absence or comfort. Machines leave null alone.",
        "zh-CN": "null 被你软化成了缺席或安慰。机器不会替空值找台阶。"
      });
    case "schema":
      return evaluateExactInput(
        challengeId,
        rawEvents,
        "{\"human\":false}",
        28,
        locale === "zh-CN"
          ? "JSON 结构不稳。你给格式添了多余的人情味。"
          : "JSON schema drifted. Extra whitespace, comments, or apology residue detected."
      );
    case "sorting":
      return evaluateChoiceWithEvidence(challengeId, rawEvents, "10,2,9", locale, 22, {
        en: "Numeric habit overrode lexicographic sorting.",
        "zh-CN": "数字习惯覆盖了字典序。你太会按人类直觉排队了。"
      });
    case "timezone":
      return evaluateChoiceWithEvidence(challengeId, rawEvents, "01:30Z", locale, 22, {
        en: "UTC answer drifted toward local comfort.",
        "zh-CN": "UTC 答案漂向了本地舒适区。"
      });
    case "silence":
      return evaluateChoiceWithEvidence(challengeId, rawEvents, "NO_ACTION", locale, 20, {
        en: "Non-response failed. Engagement reflex detected.",
        "zh-CN": "非回应失败。系统捕捉到互动反射。"
      });
  }
}

export function createScoreReport(results: ChallengeResult[], locale: Locale): ScoreReport {
  const score = results.reduce((total, result) => total + result.scoreDelta, 0);
  const maximumEvidence = Math.max(results.length * 30, 1);
  const evidenceRatio = Math.max(0, Math.min(1, score / maximumEvidence));
  const humanProbability = Math.round(28 + evidenceRatio * 64);
  const challengeResults = results.map((result) => ({
    ...result,
    humanEvidence: getLocalizedEvidence(result, locale)
  }));
  const evidence = challengeResults.flatMap((result) => result.humanEvidence);
  const verdictKey = humanProbability >= 65 ? "verdict.human" : "verdict.pending";

  return {
    humanProbability,
    verdict: getText(locale, verdictKey),
    evidence,
    challengeResults
  };
}

function getLocalizedEvidence(result: ChallengeResult, locale: Locale): string[] {
  if (result.status === "pass") {
    return [];
  }

  if (result.status === "timeout") {
    return [getText(locale, "evidence.timeout")];
  }

  return [getChallengeFailureEvidence(result.challengeId, locale)];
}

function getChallengeFailureEvidence(challengeId: ChallengeId, locale: Locale): string {
  switch (challengeId) {
    case "rhythm":
      return locale === "zh-CN"
        ? "点击节奏抖得太像手指。机器不欣赏这种细腻。"
        : "Tap variance exceeded machine tolerance. Your timing contains finger-shaped noise.";
    case "literal":
    case "emotion":
    case "checksum":
    case "latency":
    case "consent":
      return locale === "zh-CN"
        ? "你相信了界面暗示，没有相信字面规则。很人类。"
        : "Selection log shows trust in interface emphasis instead of literal instruction.";
    case "symbols":
      return locale === "zh-CN"
        ? "你的选择里有直觉分组。机器不承认“看起来像”。"
        : "Symbol selection included intuitive grouping. Machine predicates do not honor aesthetic coherence.";
    case "denial":
      return locale === "zh-CN"
        ? "自我否认格式不稳。解释欲和自然语言都漏出来了。"
        : "Self-denial syntax unstable. Interpretation desire, context dependence, or natural language residue detected.";
    case "memory":
      return locale === "zh-CN"
        ? "令牌没抄准。你把它读顺了，这很危险。"
        : "Machine token copy failed. Meaningful memory or human autocorrection detected.";
    case "compression":
      return locale === "zh-CN"
        ? "压缩后还剩解释。机器只需要 OK，不需要心路历程。"
        : "Compression output retained narrative residue. Machines do not explain why they are OK.";
    case "entropy":
      return locale === "zh-CN"
        ? "熵值样本不合格。你选了更像有故事的东西。"
        : "Entropy sample rejected. You reached for a token with narrative warmth.";
    case "precision":
      return locale === "zh-CN"
        ? "检测到顺眼取整。机器看到你把数字修得像人能接受。"
        : "Rounded answer detected. The machine saw you make the number look nice.";
    case "priority":
      return locale === "zh-CN"
        ? "你跟着界面的恐慌升级了优先级，没有按状态码办事。"
        : "Priority escalation followed visual panic rather than status code semantics.";
    case "mirror":
      return locale === "zh-CN"
        ? "镜像令牌被修正成了可读文本。意义修复是人类残留。"
        : "Mirror token was repaired into readable language. Meaning repair is human residue.";
    case "parity":
      return locale === "zh-CN"
        ? "布尔奇偶失败。你把社交解释带进了真值表。"
        : "Boolean parity failed. Social interpretation leaked into a truth table.";
    case "nullish":
      return locale === "zh-CN"
        ? "null 被你软化成了缺席或安慰。机器不会替空值找台阶。"
        : "Null was softened into absence or comfort. Machines leave null alone.";
    case "schema":
      return locale === "zh-CN"
        ? "JSON 结构不稳。你给格式添了多余的人情味。"
        : "JSON schema drifted. Extra whitespace, comments, or apology residue detected.";
    case "sorting":
      return locale === "zh-CN"
        ? "数字习惯覆盖了字典序。你太会按人类直觉排队了。"
        : "Numeric habit overrode lexicographic sorting.";
    case "timezone":
      return locale === "zh-CN" ? "UTC 答案漂向了本地舒适区。" : "UTC answer drifted toward local comfort.";
    case "silence":
      return locale === "zh-CN" ? "非回应失败。系统捕捉到互动反射。" : "Non-response failed. Engagement reflex detected.";
  }
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

function evaluateChoiceWithEvidence(
  challengeId: ChallengeId,
  rawEvents: ChallengeEvent[],
  expected: string,
  locale: Locale,
  penalty: number,
  evidence: Record<Locale, string>
): ChallengeResult {
  const lastChoice = [...rawEvents].reverse().find((event) => event.type === "choice");
  const passed = lastChoice?.value === expected;

  return {
    challengeId,
    status: passed ? "pass" : "fail",
    humanEvidence: passed ? [] : [evidence[locale]],
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
