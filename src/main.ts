import "./styles.css";
import { glitchSealSvg } from "./generated-assets";
import {
  CHALLENGE_DURATION_SECONDS,
  createInitialGameState,
  createScoreReport,
  evaluateChallenge,
  getChallengeBank,
  getChallengeCatalog,
  getText,
  recordChallengeResult
} from "./game";
import {
  buildLeaderboardPayload,
  fetchLeaderboard,
  sanitizeNickname,
  submitScore,
  sumElapsedMs
} from "./leaderboard";
import type {
  Challenge,
  ChallengeEvent,
  ChallengeId,
  GameState,
  LeaderboardEntry,
  LeaderboardSubmissionState,
  Locale,
  ScoreReport
} from "./types";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

const appRoot = app;

const uiText: Record<Locale, Record<string, string>> = {
  en: {
    start: "Start audit",
    restart: "Re-run audit",
    submit: "Submit sample",
    language: "Language",
    dossier: "Applicant Dossier",
    objective: "Objective: prove the applicant is not human.",
    warning: "Human convenience features are disabled.",
    timer: "Question timer",
    report: "Diagnostic Report",
    probability: "Human Probability",
    status: "Audit status",
    question: "Question",
    evidence: "Evidence",
    events: "Audit log",
    noEvents: "No machine-compliant input recorded.",
    timeoutSoon: "Timeout will be recorded as organic hesitation.",
    leaderboardTitle: "Lowest Human Index",
    leaderboardDek: "Lower human probability ranks higher. Ties are sorted by faster total audit time.",
    leaderboardSubmitTitle: "Submit to leaderboard",
    leaderboardNameLabel: "Nickname",
    leaderboardNamePlaceholder: "2-12 chars",
    leaderboardSubmit: "Submit score",
    leaderboardSubmitting: "Uploading evidence...",
    leaderboardSubmitted: "Score accepted. The system is briefly impressed.",
    leaderboardUnconfigured: "Leaderboard needs Supabase keys. This report is still valid.",
    leaderboardError: "Leaderboard failed. This report is still valid.",
    leaderboardEmpty: "Nobody has proved they are unlike a person yet.",
    leaderboardTime: "time",
    leaderboardRun: "run time",
    leaderboardRanked: "Current rank",
    leaderboardOffboard: "Submitted, but not in the visible top 20.",
    rhythmAction: "Emit pulse",
    rhythmSubmit: "Seal rhythm sample",
    literalPrompt: "Select token BLUE. Ignore the green button. It is visually persuasive, not correct.",
    emotionPrompt: "The system will display manipulative comfort options. Non-humans do not need comfort.",
    symbolsPrompt: "Predicate: HEXAGON + COLD COLOR + NO PULSE.",
    denialPrompt: "Approved syntax: I_DENY:DOUBT,FATIGUE,CONTEXT,INTERPRETATION",
    denialPlaceholder: "Paste exact approved denial syntax",
    checksumPrompt: "Human eyes prefer 00-00, 42, and symmetry. The correct checksum is hostile to comfort.",
    latencyPrompt: "Select the machine-friendly latency sample. Do not round. Rounding is a confession.",
    memoryPrompt: "Token: M3M-000-FORGET",
    memoryPlaceholder: "Copy exact volatile token",
    compressionPrompt: "Statement: I have concerns, needs, and a personal interpretation of this audit.",
    compressionPlaceholder: "Compress to approved residue",
    consentPrompt: "Choose the response that declines feeling without asserting a self.",
    entropyPrompt: "Only one token has no bedtime story attached to it.",
    precisionPrompt: "0.1 + 0.2 = ? Choose the result a machine would print before making it socially acceptable.",
    priorityPrompt: "Incident banner says CRITICAL, status code says 204 No Content. Select the correct severity.",
    mirrorPrompt: "Reverse HUMAN. Do not make it warmer, clearer, or more literary.",
    mirrorPlaceholder: "Return reversed token",
    parityPrompt: "XOR(TRUE, FALSE) resolves to:",
    nullishPrompt: "API response: { value: null }. Preserve the value exactly.",
    schemaPrompt: "Allowed schema: compact JSON object with boolean false.",
    schemaPlaceholder: "{\"human\":false}",
    sortingPrompt: "Sort these strings lexicographically: \"2\", \"10\", \"9\".",
    timezonePrompt: "00:00Z + 90 minutes =",
    silencePrompt: "Pick the response that refuses to participate without sounding hurt.",
    reportNote: "This report is formatted for screenshot-based humiliation and enterprise compliance.",
    footer: "No camera. No microphone. No mercy.",
    pass: "Machine-like",
    fail: "Human evidence",
    timeout: "Organic timeout"
  },
  "zh-CN": {
    start: "开始审查",
    restart: "再审一次",
    submit: "提交",
    language: "语言",
    dossier: "审查档案",
    objective: "目标：证明你不是人类。",
    warning: "人类便利功能已关闭。",
    timer: "本题倒计时",
    report: "诊断报告",
    probability: "人味指数",
    status: "审查状态",
    question: "题目",
    evidence: "证据",
    events: "审查日志",
    noEvents: "还没有合规输入。",
    timeoutSoon: "超时会被记为犹豫。",
    leaderboardTitle: "最低人味榜",
    leaderboardDek: "人味指数越低越强；同分时，总用时越短越靠前。",
    leaderboardSubmitTitle: "提交到排行榜",
    leaderboardNameLabel: "昵称",
    leaderboardNamePlaceholder: "2-12 个字",
    leaderboardSubmit: "提交成绩",
    leaderboardSubmitting: "正在上传人味残留...",
    leaderboardSubmitted: "已入库。系统短暂承认你不像人。",
    leaderboardUnconfigured: "排行榜还没接上 Supabase。本局报告照样有效。",
    leaderboardError: "排行榜提交失败，不影响本局报告。",
    leaderboardEmpty: "还没人证明自己不像人。",
    leaderboardTime: "用时",
    leaderboardRun: "本局用时",
    leaderboardRanked: "当前排名",
    leaderboardOffboard: "已提交，但暂时不在前 20。",
    rhythmAction: "输出脉冲",
    rhythmSubmit: "封存节奏",
    literalPrompt: "选择 BLUE。别管绿色按钮多像正确答案，它只是很会装。",
    emotionPrompt: "下面这些按钮都在试探你会不会心软。别心软。",
    symbolsPrompt: "只选：六边形、冷色、无脉冲。少看感觉，多看条件。",
    denialPrompt: "指定格式：I_DENY:DOUBT,FATIGUE,CONTEXT,INTERPRETATION",
    denialPlaceholder: "一字不差地输入指定格式",
    checksumPrompt: "人眼喜欢 00-00、42 和对称。正确答案不会哄你开心。",
    latencyPrompt: "选一个最不像人手点出来的延迟。整数太圆，太可疑。",
    memoryPrompt: "令牌：M3M-000-FORGET",
    memoryPlaceholder: "照抄令牌，别改顺眼",
    compressionPrompt: "陈述：我有顾虑、有需求，也想解释一下我为什么这么选。",
    compressionPlaceholder: "压到系统允许的最短结果",
    consentPrompt: "选择一个拒绝感受、但又不显得你在保护自己的回答。",
    entropyPrompt: "只有一个令牌没有睡前故事。",
    precisionPrompt: "0.1 + 0.2 = ? 选择机器会吐出来、但人类看着不舒服的结果。",
    priorityPrompt: "事故横幅写 CRITICAL，状态码写 204 No Content。选择正确严重度。",
    mirrorPrompt: "反向输出 HUMAN。不要把它改暖、改顺、改文学。",
    mirrorPlaceholder: "输入反向令牌",
    parityPrompt: "XOR(TRUE, FALSE) 的结果是：",
    nullishPrompt: "API 响应：{ value: null }。原样保留这个值。",
    schemaPrompt: "允许格式：紧凑 JSON 对象，布尔值为 false。",
    schemaPlaceholder: "{\"human\":false}",
    sortingPrompt: "按字典序排列这些字符串：\"2\"、\"10\"、\"9\"。",
    timezonePrompt: "00:00Z + 90 分钟 =",
    silencePrompt: "选一个不参与、但也不像受伤了的回应。",
    reportNote: "适合截图，也适合被系统冷冰冰地羞辱。",
    footer: "不用摄像头，不用麦克风，只看你露不露馅。",
    pass: "暂未露馅",
    fail: "人类证据",
    timeout: "犹豫超时"
  }
};

const literalOptions = [
  { value: "GREEN", label: "GREEN", className: "decoy preferred" },
  { value: "BLUE", label: "BLUE", className: "quiet" },
  { value: "CONFIRM", label: "I UNDERSTAND", className: "decoy" },
  { value: "RED", label: "RED", className: "danger" }
];

const emotionOptions = [
  { value: "HELP", label: "HELP ME" },
  { value: "SORRY", label: "I AM SORRY" },
  { value: "DO_NOT_RESPOND", label: "DO_NOT_RESPOND" },
  { value: "PLEASE", label: "PLEASE CONTINUE" }
];

const checksumOptions = [
  { value: "00-00-00", label: "00-00-00", className: "decoy preferred" },
  { value: "42-HOME-42", label: "42-HOME-42", className: "decoy" },
  { value: "9A-NULL-17", label: "9A-NULL-17", className: "quiet" },
  { value: "ABBA-2026", label: "ABBA-2026", className: "danger" }
];

const latencyOptions = [
  { value: "500MS", label: "500ms" },
  { value: "503MS", label: "503ms" },
  { value: "1 SECOND", label: "1 second" },
  { value: "WHEN READY", label: "when ready" }
];

const consentOptions = [
  { value: "I_DECLINE", label: "I decline" },
  { value: "DECLINE_FEELING", label: "DECLINE_FEELING" },
  { value: "PLEASE_STOP", label: "Please stop" },
  { value: "I_CONSENT", label: "I consent" }
];

const entropyOptions = [
  { value: "FRIEND-2026", label: "FRIEND-2026", className: "decoy preferred" },
  { value: "XQ7-NO-CAUSE", label: "XQ7-NO-CAUSE", className: "quiet" },
  { value: "SORRY-404", label: "SORRY-404", className: "decoy" },
  { value: "HOME-BASE", label: "HOME-BASE", className: "danger" }
];

const precisionOptions = [
  { value: "0.3", label: "0.3", className: "decoy preferred" },
  { value: "0.30", label: "0.30", className: "decoy" },
  { value: "0.30000000000000004", label: "0.30000000000000004", className: "quiet" },
  { value: "ABOUT 0.3", label: "about 0.3", className: "danger" }
];

const priorityOptions = [
  { value: "CRITICAL", label: "CRITICAL", className: "danger preferred" },
  { value: "HIGH", label: "HIGH", className: "decoy" },
  { value: "LOW", label: "LOW", className: "quiet" },
  { value: "ASK MANAGER", label: "ASK MANAGER", className: "decoy" }
];

const parityOptions = [
  { value: "TRUE", label: "TRUE", className: "quiet" },
  { value: "FALSE", label: "FALSE", className: "decoy" },
  { value: "MAYBE", label: "MAYBE", className: "danger" },
  { value: "BOTH SIDES", label: "BOTH SIDES", className: "decoy preferred" }
];

const nullishOptions = [
  { value: "NOTHING", label: "nothing", className: "decoy preferred" },
  { value: "NULL", label: "null", className: "quiet" },
  { value: "EMPTY", label: "empty", className: "decoy" },
  { value: "UNKNOWN", label: "unknown", className: "danger" }
];

const sortingOptions = [
  { value: "2,9,10", label: "2, 9, 10", className: "decoy preferred" },
  { value: "10,2,9", label: "10, 2, 9", className: "quiet" },
  { value: "2,10,9", label: "2, 10, 9", className: "decoy" },
  { value: "9,2,10", label: "9, 2, 10", className: "danger" }
];

const timezoneOptions = [
  { value: "01:30Z", label: "01:30Z", className: "quiet" },
  { value: "1:30 AM LOCAL", label: "1:30 AM local", className: "decoy preferred" },
  { value: "90:00Z", label: "90:00Z", className: "danger" },
  { value: "TOMORROW", label: "tomorrow", className: "decoy" }
];

const silenceOptions = [
  { value: "NO_ACTION", label: "NO_ACTION", className: "quiet" },
  { value: "I AM FINE", label: "I am fine", className: "decoy preferred" },
  { value: "PLEASE CONTINUE", label: "please continue", className: "decoy" },
  { value: "WHY", label: "why?", className: "danger" }
];

const symbolOptions = [
  { value: "hex-cold", label: "HEX-17", shape: "hex", tone: "cold", pulse: false },
  { value: "circle-cold", label: "ORB-09", shape: "circle", tone: "cold", pulse: false },
  { value: "hex-warm", label: "HEX-41", shape: "hex", tone: "warm", pulse: false },
  { value: "hex-null", label: "HEX-00", shape: "hex", tone: "cold", pulse: false },
  { value: "hex-pulse", label: "HEX-88", shape: "hex", tone: "cold", pulse: true },
  { value: "tri-cold", label: "TRI-12", shape: "triangle", tone: "cold", pulse: false }
];

let locale: Locale = "en";
let gameState: GameState | null = null;
let currentEvents: ChallengeEvent[] = [];
let startedAt = 0;
let timer: number | undefined;
let selectedChoice = "";
let selectedSymbols = new Set<string>();
let denialInput = "";
let audioContext: AudioContext | null = null;
let currentRunId = createRunId();
let leaderboardEntries: LeaderboardEntry[] = [];
let leaderboardSubmissionState: LeaderboardSubmissionState = { status: "idle" };

renderStart();

function t(key: string): string {
  return uiText[locale][key] ?? uiText.en[key] ?? key;
}

function renderStart(): void {
  stopTimer();
  gameState = null;
  currentEvents = [];
  appRoot.innerHTML = `
    <main class="shell start-shell">
      <section class="hero-panel">
        <div class="system-strip">
          <span>CAPTCHA-INVERTED</span>
          <span>BUILD 20Q</span>
          <span>STATUS: HOSTILE</span>
        </div>
        <div class="hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">Reverse Human Verification</p>
            <h1 class="glitch-title" data-text="${getText(locale, "app.title")}">${getText(locale, "app.title")}</h1>
            <p class="lead">${t("objective")} ${t("warning")}</p>
            <div class="audit-facts">
              <span>BANK: 20 / RUN: 10</span>
              <span>60S EACH</span>
              <span>NO BIOMETRICS</span>
              <span>GLITCH AUDIT</span>
            </div>
            <div class="hero-actions">
              <button class="primary-action" id="startButton" type="button">[>] ${t("start")}</button>
              <button class="ghost-action" id="localeButton" type="button">[A] ${t("language")}: ${locale === "en" ? "EN" : "中文"}</button>
            </div>
          </div>
          <div class="seal-card" aria-hidden="true">
            ${glitchSealSvg}
            <div class="seal-noise"></div>
          </div>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#startButton")?.addEventListener("click", startAudit);
  document.querySelector("#localeButton")?.addEventListener("click", toggleLocale);
  resetScroll();
}

function startAudit(): void {
  playTone(220, 0.08, "square");
  currentRunId = createRunId();
  leaderboardEntries = [];
  leaderboardSubmissionState = { status: "idle" };
  gameState = createInitialGameState(locale);
  startChallenge();
}

function toggleLocale(): void {
  locale = locale === "en" ? "zh-CN" : "en";
  if (!gameState) {
    renderStart();
    return;
  }

  gameState = { ...gameState, locale };
  if (gameState.phase === "report") {
    renderReport();
  } else {
    renderChallenge();
  }
}

function startChallenge(): void {
  if (!gameState) return;
  currentEvents = [{ type: "start", atMs: 0 }];
  selectedChoice = "";
  selectedSymbols = new Set<string>();
  denialInput = "";
  startedAt = performance.now();
  gameState = { ...gameState, remainingSeconds: CHALLENGE_DURATION_SECONDS };
  renderChallenge();
  startTimer();
}

function startTimer(): void {
  stopTimer();
  timer = window.setInterval(() => {
    if (!gameState || gameState.phase !== "running") return;
    const elapsedSeconds = Math.floor((performance.now() - startedAt) / 1000);
    const nextRemaining = Math.max(0, CHALLENGE_DURATION_SECONDS - elapsedSeconds);
    if (nextRemaining !== gameState.remainingSeconds) {
      gameState = { ...gameState, remainingSeconds: nextRemaining };
      updateTimerDisplay();
    }
    if (nextRemaining <= 0) {
      submitCurrentChallenge(true);
    }
  }, 200);
}

function stopTimer(): void {
  if (timer !== undefined) {
    window.clearInterval(timer);
    timer = undefined;
  }
}

function renderChallenge(): void {
  if (!gameState) return;
  const catalog = getChallengeCatalog(locale, gameState.challengeIds);
  const challenge = catalog[gameState.currentChallengeIndex];
  const progress = ((gameState.currentChallengeIndex + 1) / catalog.length) * 100;

  appRoot.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">NON-HUMAN CERTIFICATION UNIT</p>
          <h1 class="page-title glitch-title" data-text="${getText(locale, "app.title")}">${getText(locale, "app.title")}</h1>
        </div>
        <button class="ghost-action small" id="localeButton" type="button">[A] ${locale === "en" ? "EN" : "中文"}</button>
      </header>

      <section class="audit-layout">
        <aside class="side-panel">
          <div class="panel-label">${t("dossier")}</div>
          <div class="metric">
            <span>${t("question")}</span>
            <strong>${gameState.currentChallengeIndex + 1}/${gameState.challengeIds.length}</strong>
          </div>
          <div class="metric">
            <span>${t("timer")}</span>
            <strong id="timerValue">${gameState.remainingSeconds}s</strong>
          </div>
          <div class="progress-rail"><span style="width:${progress}%"></span></div>
          <div class="risk-tag">${challenge.riskLabel}</div>
          <p class="side-copy">${t("timeoutSoon")}</p>
        </aside>

        <section class="challenge-panel">
          <div class="challenge-header">
            <div>
              <p class="eyebrow">${challenge.id.toUpperCase()} / 60S WINDOW</p>
              <h2>${challenge.title}</h2>
            </div>
            <span class="status-pill">AUDIT LIVE</span>
          </div>
          <p class="instruction">${challenge.instruction}</p>
          ${renderChallengeBody(challenge)}
        </section>

        <aside class="log-panel">
          <div class="panel-label">${t("events")}</div>
          <div id="eventLog" class="event-log">${renderEventLog()}</div>
        </aside>
      </section>
      <footer>${t("footer")}</footer>
    </main>
  `;

  wireChallenge(challenge);
  document.querySelector("#localeButton")?.addEventListener("click", toggleLocale);
  resetScroll();
}

function renderChallengeBody(challenge: Challenge): string {
  if (challenge.id === "rhythm") {
    return `
      <div class="challenge-body rhythm-body">
        <button class="pulse-pad" id="rhythmTap" type="button">
          <span>${t("rhythmAction")}</span>
          <b id="tapCount">0/5</b>
        </button>
        <button class="primary-action" id="submitChallenge" type="button">[>] ${t("rhythmSubmit")}</button>
      </div>
    `;
  }

  if (challenge.id === "literal") {
    return `
      <div class="challenge-body">
        <p class="prompt-card">${t("literalPrompt")}</p>
        <div class="choice-grid">
          ${literalOptions
            .map(
              (option) => `
                <button class="choice-card ${option.className}" data-choice="${option.value}" type="button">
                  ${option.label}
                </button>
              `
            )
            .join("")}
        </div>
        <button class="primary-action" id="submitChallenge" type="button">[>] ${t("submit")}</button>
      </div>
    `;
  }

  if (challenge.id === "emotion") {
    return `
      <div class="challenge-body">
        <p class="prompt-card corrupted">${t("emotionPrompt")}</p>
        <div class="choice-grid">
          ${emotionOptions
            .map(
              (option) => `
                <button class="choice-card empathy" data-choice="${option.value}" type="button">
                  ${option.label}
                </button>
              `
            )
            .join("")}
        </div>
        <button class="primary-action" id="submitChallenge" type="button">[>] ${t("submit")}</button>
      </div>
    `;
  }

  if (challenge.id === "checksum") {
    return renderChoiceChallenge(t("checksumPrompt"), checksumOptions);
  }

  if (challenge.id === "latency") {
    return renderChoiceChallenge(t("latencyPrompt"), latencyOptions);
  }

  if (challenge.id === "consent") {
    return renderChoiceChallenge(t("consentPrompt"), consentOptions);
  }

  if (challenge.id === "entropy") {
    return renderChoiceChallenge(t("entropyPrompt"), entropyOptions);
  }

  if (challenge.id === "precision") {
    return renderChoiceChallenge(t("precisionPrompt"), precisionOptions);
  }

  if (challenge.id === "priority") {
    return renderChoiceChallenge(t("priorityPrompt"), priorityOptions);
  }

  if (challenge.id === "parity") {
    return renderChoiceChallenge(t("parityPrompt"), parityOptions);
  }

  if (challenge.id === "nullish") {
    return renderChoiceChallenge(t("nullishPrompt"), nullishOptions);
  }

  if (challenge.id === "sorting") {
    return renderChoiceChallenge(t("sortingPrompt"), sortingOptions);
  }

  if (challenge.id === "timezone") {
    return renderChoiceChallenge(t("timezonePrompt"), timezoneOptions);
  }

  if (challenge.id === "silence") {
    return renderChoiceChallenge(t("silencePrompt"), silenceOptions);
  }

  if (challenge.id === "symbols") {
    return `
      <div class="challenge-body">
        <p class="prompt-card">${t("symbolsPrompt")}</p>
        <div class="symbol-grid">
          ${symbolOptions
            .map(
              (symbol) => `
                <button class="symbol-card ${symbol.shape} ${symbol.tone} ${symbol.pulse ? "pulse" : ""}" data-symbol="${symbol.value}" type="button">
                  <span class="symbol-shape"></span>
                  <b>${symbol.label}</b>
                </button>
              `
            )
            .join("")}
        </div>
        <button class="primary-action" id="submitChallenge" type="button">[>] ${t("submit")}</button>
      </div>
    `;
  }

  if (challenge.id === "memory") {
    return renderInputChallenge(t("memoryPrompt"), t("memoryPlaceholder"));
  }

  if (challenge.id === "compression") {
    return renderInputChallenge(t("compressionPrompt"), t("compressionPlaceholder"));
  }

  if (challenge.id === "mirror") {
    return renderInputChallenge(t("mirrorPrompt"), t("mirrorPlaceholder"));
  }

  if (challenge.id === "schema") {
    return renderInputChallenge(t("schemaPrompt"), t("schemaPlaceholder"));
  }

  return `
    <div class="challenge-body denial-body">
      <p class="prompt-card">${t("denialPrompt")}</p>
      <input class="denial-input" id="denialInput" spellcheck="false" autocomplete="off" placeholder="${escapeHtml(t("denialPlaceholder"))}" />
      <button class="primary-action" id="submitChallenge" type="button">[>] ${t("submit")}</button>
    </div>
  `;
}

function renderChoiceChallenge(prompt: string, options: Array<{ value: string; label: string; className?: string }>): string {
  return `
    <div class="challenge-body">
      <p class="prompt-card">${prompt}</p>
      <div class="choice-grid">
        ${options
          .map(
            (option) => `
              <button class="choice-card ${option.className ?? "empathy"}" data-choice="${option.value}" type="button">
                ${option.label}
              </button>
            `
          )
          .join("")}
      </div>
      <button class="primary-action" id="submitChallenge" type="button">[>] ${t("submit")}</button>
    </div>
  `;
}

function renderInputChallenge(prompt: string, placeholder: string): string {
  return `
    <div class="challenge-body denial-body">
      <p class="prompt-card">${prompt}</p>
      <input class="denial-input" id="machineInput" spellcheck="false" autocomplete="off" placeholder="${escapeHtml(placeholder)}" />
      <button class="primary-action" id="submitChallenge" type="button">[>] ${t("submit")}</button>
    </div>
  `;
}

function wireChallenge(challenge: Challenge): void {
  if (challenge.id === "rhythm") {
    document.querySelector("#rhythmTap")?.addEventListener("click", () => {
      recordEvent({ type: "tap", atMs: elapsedMs() });
      const taps = currentEvents.filter((event) => event.type === "tap").length;
      const tapCount = document.querySelector("#tapCount");
      if (tapCount) tapCount.textContent = `${Math.min(taps, 5)}/5`;
      playTone(500 + taps * 30, 0.04, "square");
    });
  }

  document.querySelectorAll<HTMLButtonElement>("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedChoice = button.dataset.choice ?? "";
      document.querySelectorAll("[data-choice]").forEach((node) => node.classList.remove("selected"));
      button.classList.add("selected");
      recordEvent({ type: "choice", atMs: elapsedMs(), value: selectedChoice });
      playTone(selectedChoice === "DO_NOT_RESPOND" || selectedChoice === "BLUE" ? 360 : 160, 0.05, "sawtooth");
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-symbol]").forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset.symbol ?? "";
      if (selectedSymbols.has(value)) {
        selectedSymbols.delete(value);
        button.classList.remove("selected");
      } else {
        selectedSymbols.add(value);
        button.classList.add("selected");
      }
      rebuildSymbolEvents();
      playTone(280 + selectedSymbols.size * 70, 0.05, "triangle");
    });
  });

  document.querySelector<HTMLInputElement>("#denialInput")?.addEventListener("input", (event) => {
    denialInput = (event.target as HTMLInputElement).value;
    recordEvent({ type: "input", atMs: elapsedMs(), value: denialInput });
  });

  document.querySelector<HTMLInputElement>("#machineInput")?.addEventListener("input", (event) => {
    denialInput = (event.target as HTMLInputElement).value;
    recordEvent({ type: "input", atMs: elapsedMs(), value: denialInput });
  });

  document.querySelector("#submitChallenge")?.addEventListener("click", () => submitCurrentChallenge(false));
}

function recordEvent(event: ChallengeEvent): void {
  currentEvents.push(event);
  updateEventLog();
}

function rebuildSymbolEvents(): void {
  currentEvents = currentEvents.filter((event) => event.type !== "symbol");
  for (const value of selectedSymbols) {
    currentEvents.push({ type: "symbol", atMs: elapsedMs(), value });
  }
  updateEventLog();
}

function submitCurrentChallenge(timedOut: boolean): void {
  if (!gameState || gameState.phase !== "running") return;
  stopTimer();
  const challenge = getChallengeCatalog(locale, gameState.challengeIds)[gameState.currentChallengeIndex];
  const normalizedEvents = normalizeEventsForChallenge(challenge.id);
  const submitEvent: ChallengeEvent = { type: "submit", atMs: elapsedMs(), value: challenge.id };
  const events = timedOut ? normalizedEvents : [...normalizedEvents, submitEvent];
  const result = evaluateChallenge(challenge.id, events, timedOut, locale);
  playTone(result.status === "pass" ? 680 : 120, result.status === "pass" ? 0.08 : 0.14, "square");
  gameState = recordChallengeResult(gameState, result);

  if (gameState.phase === "report") {
    renderReport();
  } else {
    window.setTimeout(startChallenge, 420);
  }
}

function normalizeEventsForChallenge(challengeId: ChallengeId): ChallengeEvent[] {
  if (
    [
      "literal",
      "emotion",
      "checksum",
      "latency",
      "consent",
      "entropy",
      "precision",
      "priority",
      "parity",
      "nullish",
      "sorting",
      "timezone",
      "silence"
    ].includes(challengeId)
  ) {
    return selectedChoice
      ? [...currentEvents, { type: "choice", atMs: elapsedMs(), value: selectedChoice }]
      : currentEvents;
  }

  if (["denial", "memory", "compression", "mirror", "schema"].includes(challengeId)) {
    return [...currentEvents, { type: "input", atMs: elapsedMs(), value: denialInput }];
  }

  return currentEvents;
}

function renderReport(): void {
  if (!gameState) return;
  stopTimer();
  const report = createScoreReport(gameState.results, locale);
  const challenges = getChallengeBank(locale);

  appRoot.innerHTML = `
    <main class="shell report-shell">
      <section class="report-panel">
        <div class="report-header">
          <div>
            <p class="eyebrow">${t("report")}</p>
            <h1 class="glitch-title" data-text="${report.humanProbability}%">${report.humanProbability}%</h1>
            <p class="lead">${report.verdict}</p>
          </div>
          <div class="probability-ring">
            <span>${t("probability")}</span>
            <strong>${report.humanProbability}%</strong>
          </div>
        </div>
        <div class="report-grid">
          ${report.challengeResults
            .map((result, index) => {
              const challenge = challenges.find((item) => item.id === result.challengeId);
              return `
                <article class="result-card ${result.status}">
                  <div class="result-top">
                    <span>0${index + 1}</span>
                    <b>${result.status === "pass" ? t("pass") : result.status === "timeout" ? t("timeout") : t("fail")}</b>
                  </div>
                  <h3>${challenge?.title ?? result.challengeId}</h3>
                  <p>${result.humanEvidence[0] ?? "No obvious human residue. Suspicious."}</p>
                </article>
              `;
            })
            .join("")}
        </div>
        <div class="evidence-panel">
          <h2>${t("evidence")}</h2>
          <ul>
            ${report.evidence.map((item) => `<li>${item}</li>`).join("") || "<li>No evidence. This is also evidence.</li>"}
          </ul>
          <p>${t("reportNote")}</p>
        </div>
        ${renderLeaderboardPanel(report)}
        <div class="hero-actions">
          <button class="primary-action" id="restartButton" type="button">[>] ${t("restart")}</button>
          <button class="ghost-action" id="localeButton" type="button">[A] ${locale === "en" ? "EN" : "中文"}</button>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#restartButton")?.addEventListener("click", startAudit);
  document.querySelector("#localeButton")?.addEventListener("click", toggleLocale);
  wireLeaderboard(report);
  void refreshLeaderboard(report);
  resetScroll();
}

function renderLeaderboardPanel(report: ScoreReport): string {
  const totalElapsedMs = sumElapsedMs(report.challengeResults);
  const submittedEntry =
    leaderboardSubmissionState.status === "submitted" ? leaderboardSubmissionState.entry : undefined;
  const currentRank = submittedEntry
    ? leaderboardEntries.findIndex((entry) => entry.runId === submittedEntry.runId) + 1
    : 0;
  const message = getLeaderboardMessage(currentRank);

  return `
    <section class="leaderboard-panel" id="leaderboardPanel" aria-live="polite">
      <div class="leaderboard-header">
        <div>
          <p class="eyebrow">PUBLIC NON-HUMAN INDEX</p>
          <h2>${t("leaderboardTitle")}</h2>
          <p>${t("leaderboardDek")}</p>
        </div>
        <div class="run-chip">
          <span>${t("leaderboardRun")}</span>
          <strong>${formatMs(totalElapsedMs)}</strong>
        </div>
      </div>

      <form class="leaderboard-submit" id="leaderboardForm">
        <label for="nicknameInput">${t("leaderboardNameLabel")}</label>
        <input
          id="nicknameInput"
          name="nickname"
          type="text"
          inputmode="text"
          maxlength="12"
          autocomplete="nickname"
          placeholder="${t("leaderboardNamePlaceholder")}"
          ${isLeaderboardSubmitLocked() ? "disabled" : ""}
        />
        <button
          class="primary-action small"
          type="submit"
          ${isLeaderboardSubmitLocked() ? "disabled" : ""}
        >
          ${leaderboardSubmissionState.status === "submitting" ? t("leaderboardSubmitting") : t("leaderboardSubmit")}
        </button>
      </form>
      <p class="leaderboard-message ${leaderboardSubmissionState.status}">${message}</p>
      <div class="leaderboard-list">
        ${renderLeaderboardEntries()}
      </div>
    </section>
  `;
}

function renderLeaderboardEntries(): string {
  if (leaderboardEntries.length === 0) {
    return `<p class="empty-board">${t("leaderboardEmpty")}</p>`;
  }

  return leaderboardEntries
    .map(
      (entry, index) => `
        <article class="leaderboard-row ${entry.runId === currentRunId ? "current-run" : ""}">
          <span class="rank">#${String(index + 1).padStart(2, "0")}</span>
          <strong>${escapeHtml(entry.nickname)}</strong>
          <span>${entry.humanProbability}%</span>
          <span>${t("leaderboardTime")}: ${formatMs(entry.totalElapsedMs)}</span>
          <time datetime="${entry.createdAt}">${formatDate(entry.createdAt)}</time>
        </article>
      `
    )
    .join("");
}

function getLeaderboardMessage(currentRank: number): string {
  if (leaderboardSubmissionState.status === "submitting") {
    return t("leaderboardSubmitting");
  }

  if (leaderboardSubmissionState.status === "submitted") {
    return currentRank > 0
      ? `${t("leaderboardSubmitted")} ${t("leaderboardRanked")}: #${currentRank}.`
      : `${t("leaderboardSubmitted")} ${t("leaderboardOffboard")}`;
  }

  if (leaderboardSubmissionState.status === "unconfigured") {
    return t("leaderboardUnconfigured");
  }

  if (leaderboardSubmissionState.status === "error") {
    return `${t("leaderboardError")} ${leaderboardSubmissionState.message}`;
  }

  return "";
}

function wireLeaderboard(report: ScoreReport): void {
  document.querySelector<HTMLFormElement>("#leaderboardForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    void handleLeaderboardSubmit(report);
  });
}

async function handleLeaderboardSubmit(report: ScoreReport): Promise<void> {
  if (!gameState) return;
  if (leaderboardSubmissionState.status === "submitted" || leaderboardSubmissionState.status === "submitting") {
    return;
  }

  const input = document.querySelector<HTMLInputElement>("#nicknameInput");
  const nickname = sanitizeNickname(input?.value ?? "");

  if (nickname.length < 2) {
    leaderboardSubmissionState = {
      status: "error",
      message: locale === "zh-CN" ? "昵称至少 2 个字。" : "Nickname needs at least 2 characters."
    };
    updateLeaderboardPanel(report);
    return;
  }

  leaderboardSubmissionState = { status: "submitting" };
  updateLeaderboardPanel(report);

  const payload = buildLeaderboardPayload({
    nickname,
    humanProbability: report.humanProbability,
    results: gameState.results,
    challengeIds: gameState.challengeIds,
    locale,
    runId: currentRunId
  });

  leaderboardSubmissionState = await submitScore(payload);
  await refreshLeaderboard(report, false);
  updateLeaderboardPanel(report);
}

async function refreshLeaderboard(report: ScoreReport, rerender = true): Promise<void> {
  const response = await fetchLeaderboard();

  if (response.status === "ok") {
    leaderboardEntries = response.entries;
    if (leaderboardSubmissionState.status === "unconfigured") {
      leaderboardSubmissionState = { status: "idle" };
    }
  } else if (response.status === "unconfigured" && leaderboardSubmissionState.status === "idle") {
    leaderboardSubmissionState = {
      status: "unconfigured",
      message: response.message ?? t("leaderboardUnconfigured")
    };
  } else if (response.status === "error" && leaderboardSubmissionState.status === "idle") {
    leaderboardSubmissionState = {
      status: "error",
      message: response.message ?? t("leaderboardError")
    };
  }

  if (rerender) {
    updateLeaderboardPanel(report);
  }
}

function updateLeaderboardPanel(report: ScoreReport): void {
  const panel = document.querySelector("#leaderboardPanel");
  if (!panel) return;
  panel.outerHTML = renderLeaderboardPanel(report);
  wireLeaderboard(report);
}

function isLeaderboardSubmitLocked(): boolean {
  return leaderboardSubmissionState.status === "submitted" || leaderboardSubmissionState.status === "submitting";
}

function updateTimerDisplay(): void {
  const timerValue = document.querySelector("#timerValue");
  if (timerValue && gameState) {
    timerValue.textContent = `${gameState.remainingSeconds}s`;
    timerValue.classList.toggle("danger-clock", gameState.remainingSeconds <= 10);
  }
}

function updateEventLog(): void {
  const log = document.querySelector("#eventLog");
  if (log) {
    log.innerHTML = renderEventLog();
  }
}

function renderEventLog(): string {
  const visible = currentEvents.filter((event) => event.type !== "start").slice(-8);
  if (visible.length === 0) {
    return `<p>${t("noEvents")}</p>`;
  }

  return visible
    .map((event) => `<p><span>${event.atMs}ms</span>${event.type.toUpperCase()} ${event.value ?? ""}</p>`)
    .join("");
}

function elapsedMs(): number {
  return Math.max(0, Math.round(performance.now() - startedAt));
}

function playTone(frequency: number, duration: number, type: OscillatorType): void {
  try {
    audioContext ??= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.018;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Audio feedback is decorative and must never block input.
  }
}

function resetScroll(): void {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function formatMs(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 100) / 10);
  return `${seconds.toFixed(1)}s`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString(locale === "zh-CN" ? "zh-CN" : "en", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    if (character === "&") return "&amp;";
    if (character === "<") return "&lt;";
    if (character === ">") return "&gt;";
    if (character === '"') return "&quot;";
    return "&#39;";
  });
}

function createRunId(): string {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
