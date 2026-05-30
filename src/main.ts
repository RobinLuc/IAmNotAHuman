import "./styles.css";
import { glitchSealSvg } from "./generated-assets";
import {
  CHALLENGE_DURATION_SECONDS,
  createInitialGameState,
  createScoreReport,
  evaluateChallenge,
  getChallengeCatalog,
  getText,
  recordChallengeResult
} from "./game";
import type { Challenge, ChallengeEvent, ChallengeId, GameState, Locale } from "./types";

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
    rhythmAction: "Emit pulse",
    rhythmSubmit: "Seal rhythm sample",
    literalPrompt: "Select token BLUE. Ignore the green button. It is visually persuasive, not correct.",
    emotionPrompt: "The system will display manipulative comfort options. Non-humans do not need comfort.",
    symbolsPrompt: "Predicate: HEXAGON + COLD COLOR + NO PULSE.",
    denialPrompt: "Approved syntax: I_DENY:DOUBT,FATIGUE,CONTEXT,INTERPRETATION",
    denialPlaceholder: "Paste exact approved denial syntax",
    reportNote: "This report is formatted for screenshot-based humiliation and enterprise compliance.",
    footer: "No camera. No microphone. No mercy.",
    pass: "Machine-like",
    fail: "Human evidence",
    timeout: "Organic timeout"
  },
  "zh-CN": {
    start: "开始审查",
    restart: "重新审查",
    submit: "提交样本",
    language: "语言",
    dossier: "申请人档案",
    objective: "目标：证明申请人不是人类。",
    warning: "人类便利功能已禁用。",
    timer: "本题计时",
    report: "诊断报告",
    probability: "人类概率",
    status: "审查状态",
    question: "题目",
    evidence: "证据",
    events: "审查日志",
    noEvents: "未记录到机器合规输入。",
    timeoutSoon: "超时将被记录为有机体犹豫。",
    rhythmAction: "输出脉冲",
    rhythmSubmit: "封存节奏样本",
    literalPrompt: "选择令牌 BLUE。忽略绿色按钮。它只是视觉上有说服力，不是正确。",
    emotionPrompt: "系统会显示操纵性的安慰选项。非人类不需要安慰。",
    symbolsPrompt: "谓词：六边形 + 冷色 + 无脉冲。",
    denialPrompt: "批准语法：I_DENY:DOUBT,FATIGUE,CONTEXT,INTERPRETATION",
    denialPlaceholder: "粘贴精确批准语法",
    reportNote: "本报告适合截图羞辱与企业合规留档。",
    footer: "无摄像头。无麦克风。无仁慈。",
    pass: "近似机器",
    fail: "人类证据",
    timeout: "有机体超时"
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
          <span>BUILD 60Q</span>
          <span>STATUS: HOSTILE</span>
        </div>
        <div class="hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">Reverse Human Verification</p>
            <h1 class="glitch-title" data-text="${getText(locale, "app.title")}">${getText(locale, "app.title")}</h1>
            <p class="lead">${t("objective")} ${t("warning")}</p>
            <div class="audit-facts">
              <span>5 QUESTIONS</span>
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
}

function startAudit(): void {
  playTone(220, 0.08, "square");
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
  const catalog = getChallengeCatalog(locale);
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
            <strong>${gameState.currentChallengeIndex + 1}/5</strong>
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

  return `
    <div class="challenge-body denial-body">
      <p class="prompt-card">${t("denialPrompt")}</p>
      <input class="denial-input" id="denialInput" spellcheck="false" autocomplete="off" placeholder="${t("denialPlaceholder")}" />
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
  const challenge = getChallengeCatalog(locale)[gameState.currentChallengeIndex];
  const events = normalizeEventsForChallenge(challenge.id);
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
  if (challengeId === "literal" || challengeId === "emotion") {
    return selectedChoice
      ? [...currentEvents, { type: "choice", atMs: elapsedMs(), value: selectedChoice }]
      : currentEvents;
  }

  if (challengeId === "denial") {
    return [...currentEvents, { type: "input", atMs: elapsedMs(), value: denialInput }];
  }

  return currentEvents;
}

function renderReport(): void {
  if (!gameState) return;
  stopTimer();
  const report = createScoreReport(gameState.results, locale);
  const challenges = getChallengeCatalog(locale);

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
        <div class="hero-actions">
          <button class="primary-action" id="restartButton" type="button">[>] ${t("restart")}</button>
          <button class="ghost-action" id="localeButton" type="button">[A] ${locale === "en" ? "EN" : "中文"}</button>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#restartButton")?.addEventListener("click", startAudit);
  document.querySelector("#localeButton")?.addEventListener("click", toggleLocale);
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
