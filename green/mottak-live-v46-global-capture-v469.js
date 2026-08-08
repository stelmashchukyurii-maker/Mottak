"use strict";

// v4.6.9 TEST: receive Nordic ID Wedge characters at document level.
// A large manual-focus field remains available as a fallback.
(function applyGlobalKeyCaptureV469() {
  const version = document.querySelector(".version");
  if (version) {
    version.innerHTML = "Nordic ID Cloud v4.6.9 TEST — GLOBAL CAPTURE<br />Oppdatert 04.08.2026 kl. 09:42";
  }

  const scanA = document.getElementById("scanA");
  const scanB = document.getElementById("scanB");
  const scanCard = document.getElementById("scanCard");
  const scanConsole = document.getElementById("scanConsole");
  const activateButton = document.getElementById("activateScanButton");
  const restartButton = document.getElementById("restartFieldsButton");
  const clearButton = document.getElementById("clearOperationButton");
  const serviceCode = document.getElementById("serviceCode");
  const upperNumber = document.getElementById("upperNumber");
  const lowerNumber = document.getElementById("lowerNumber");
  if (!scanCard || !scanConsole || !serviceCode || !upperNumber || !lowerNumber) return;

  const TEXT = {
    nb: {
      title: "GLOBALT SKANNERMOTTAK",
      help: "Åpne siden og bruk Nordic ID-utløseren uten å trykke i et felt. Siden samler tegn fra hele nettlesersiden.",
      ready: "● Klar — skann direkte",
      receiving: "● Mottar tegn…",
      fallbackTitle: "Hvis etiketten ikke vises",
      fallbackHelp: "Trykk én gang i feltet under og skann på nytt.",
      fallbackPlaceholder: "TRYKK HER OG SKANN",
      copy: "KOPIER JOURNAL",
      clearLog: "TØM JOURNAL",
      keys: "Taster",
      chars: "Tegn i strøm",
      valid: "Gyldige EPC",
      source: "Siste kilde",
      global: "GLOBAL",
      fallback: "MANUELT FELT",
      bad: "Ingen gyldig 24-tegns Bunner-EPC ble funnet i signalet.",
      locked: "Kontrollfeltene åpnes etter at én etikett er valgt."
    },
    pl: {
      title: "GLOBALNY ODBIÓR SKANERA",
      help: "Otwórz stronę i użyj spustu Nordic ID bez klikania w pole. Strona zbiera znaki z całej strony przeglądarki.",
      ready: "● Gotowy — skanuj bezpośrednio",
      receiving: "● Odbieranie znaków…",
      fallbackTitle: "Jeśli etykieta się nie pojawi",
      fallbackHelp: "Kliknij raz w pole poniżej i zeskanuj ponownie.",
      fallbackPlaceholder: "KLIKNIJ TUTAJ I SKANUJ",
      copy: "KOPIUJ DZIENNIK",
      clearLog: "WYCZYŚĆ DZIENNIK",
      keys: "Klawisze",
      chars: "Znaki w strumieniu",
      valid: "Poprawne EPC",
      source: "Ostatnie źródło",
      global: "GLOBALNE",
      fallback: "POLE RĘCZNE",
      bad: "W sygnale nie znaleziono poprawnego 24-znakowego EPC Bunner.",
      locked: "Pola kontrolne zostaną otwarte po wybraniu jednej etykiety."
    },
    uk: {
      title: "ГЛОБАЛЬНЕ ПРИЙМАННЯ СКАНЕРА",
      help: "Відкрийте сторінку й одразу використовуйте курок Nordic ID, не натискаючи жодного поля. Сторінка збирає символи з усього браузера.",
      ready: "● Готово — скануйте одразу",
      receiving: "● Отримання символів…",
      fallbackTitle: "Якщо бірка не з’явилася",
      fallbackHelp: "Один раз торкніться поля нижче та проскануйте повторно.",
      fallbackPlaceholder: "ТОРКНІТЬСЯ СЮДИ Й ПРОСКАНУЙТЕ",
      copy: "КОПІЮВАТИ ЖУРНАЛ",
      clearLog: "ОЧИСТИТИ ЖУРНАЛ",
      keys: "Клавіші",
      chars: "Символи в потоці",
      valid: "Правильні EPC",
      source: "Останнє джерело",
      global: "ГЛОБАЛЬНО",
      fallback: "РУЧНЕ ПОЛЕ",
      bad: "У сигналі не знайдено правильного 24-символьного EPC Bunner.",
      locked: "Поля перевірки відкриються після вибору однієї бірки."
    }
  };

  const language = () => {
    const saved = localStorage.getItem("mottak_nordic_cloud_language");
    return TEXT[saved] ? saved : "nb";
  };
  const tx = () => TEXT[language()];

  // Disable the old A/B focus mechanism on this test page.
  [scanA, scanB].filter(Boolean).forEach(field => {
    field.value = "";
    field.disabled = true;
    field.tabIndex = -1;
  });
  if (activateButton) activateButton.style.display = "none";
  if (restartButton) restartButton.style.display = "none";
  if (clearButton?.parentElement) clearButton.parentElement.style.gridTemplateColumns = "1fr";

  focusChannel = function focusChannelGlobalV469() {};
  activateScanner = function activateScannerGlobalV469() {};
  restartFields = function restartFieldsGlobalV469() {};
  scannerHasFocus = function scannerHasFocusGlobalV469() { return true; };
  updateFocusStatus = function updateFocusStatusGlobalV469() {
    scanConsole.classList.add("ready");
    const channelNode = document.getElementById("activeChannel");
    if (channelNode) channelNode.textContent = "GLOBAL";
  };

  const panel = document.createElement("section");
  panel.id = "globalCapturePanelV469";
  panel.style.cssText = "margin:0 0 14px;padding:15px;border:3px solid #48d597;border-radius:18px;background:rgba(72,213,151,.10)";
  panel.innerHTML = `
    <strong id="globalTitleV469" style="display:block;color:#48d597;font-size:21px"></strong>
    <div id="globalHelpV469" style="margin-top:7px;color:#e5fff3;font-weight:750;line-height:1.45"></div>
    <div id="globalStateV469" style="margin-top:11px;color:#48d597;font-size:21px;font-weight:950"></div>
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px">
      <div class="stat"><span id="globalKeysLabelV469"></span><strong id="globalKeysV469">0</strong></div>
      <div class="stat"><span id="globalCharsLabelV469"></span><strong id="globalCharsV469">0</strong></div>
      <div class="stat"><span id="globalValidLabelV469"></span><strong id="globalValidV469">0</strong></div>
      <div class="stat"><span id="globalSourceLabelV469"></span><strong id="globalSourceV469" style="font-size:15px">—</strong></div>
    </div>
    <div style="margin-top:14px;padding:13px;border:2px dashed #f4c430;border-radius:15px;background:#0d1426">
      <strong id="fallbackTitleV469" style="display:block;color:#f4c430;font-size:19px"></strong>
      <div id="fallbackHelpV469" style="margin-top:5px;color:#d9dfef;line-height:1.4"></div>
      <textarea id="fallbackInputV469" inputmode="none" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"
        style="width:100%;min-height:82px;margin-top:10px;padding:13px;border:4px solid #f4c430;border-radius:14px;background:#070b14;color:#fff;font:900 18px/1.35 monospace;resize:none"></textarea>
    </div>
    <div id="globalNoteV469" style="margin-top:9px;color:#aab4ce;font-weight:800"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
      <button id="globalClearLogV469" type="button" class="secondary"></button>
      <button id="globalCopyLogV469" type="button" class="primary"></button>
    </div>
    <textarea id="globalLogV469" readonly spellcheck="false" style="width:100%;height:170px;margin-top:9px;padding:10px;border:1px solid #303b59;border-radius:12px;background:#070b14;color:#d8e8ff;font:700 12px/1.45 monospace;resize:vertical"></textarea>`;
  scanCard.insertAdjacentElement("afterbegin", panel);

  const globalTitle = document.getElementById("globalTitleV469");
  const globalHelp = document.getElementById("globalHelpV469");
  const globalState = document.getElementById("globalStateV469");
  const keysNode = document.getElementById("globalKeysV469");
  const charsNode = document.getElementById("globalCharsV469");
  const validNode = document.getElementById("globalValidV469");
  const sourceNode = document.getElementById("globalSourceV469");
  const fallbackInput = document.getElementById("fallbackInputV469");
  const logArea = document.getElementById("globalLogV469");
  const copyLogButton = document.getElementById("globalCopyLogV469");
  const clearLogButton = document.getElementById("globalClearLogV469");

  let keyEvents = 0;
  let streamChars = 0;
  let validTotal = 0;
  let globalBuffer = "";
  let globalQuietTimer = null;
  let globalMaxTimer = null;
  let fallbackTimer = null;
  let entries = [];

  const clock = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
  function log(type, detail = "") {
    entries.push(`[${clock()}] ${type}${detail ? ` | ${detail}` : ""}`);
    if (entries.length > 250) entries = entries.slice(-250);
    logArea.value = entries.join("\n");
    logArea.scrollTop = logArea.scrollHeight;
  }

  function applyText() {
    globalTitle.textContent = tx().title;
    globalHelp.textContent = tx().help;
    document.getElementById("globalKeysLabelV469").textContent = tx().keys;
    document.getElementById("globalCharsLabelV469").textContent = tx().chars;
    document.getElementById("globalValidLabelV469").textContent = tx().valid;
    document.getElementById("globalSourceLabelV469").textContent = tx().source;
    document.getElementById("fallbackTitleV469").textContent = tx().fallbackTitle;
    document.getElementById("fallbackHelpV469").textContent = tx().fallbackHelp;
    fallbackInput.placeholder = tx().fallbackPlaceholder;
    copyLogButton.textContent = tx().copy;
    clearLogButton.textContent = tx().clearLog;
    document.getElementById("globalNoteV469").textContent = tx().locked;
    if (!globalBuffer) globalState.textContent = tx().ready;
  }

  function setStats(source = null) {
    keysNode.textContent = String(keyEvents);
    charsNode.textContent = String(streamChars);
    validNode.textContent = String(validTotal);
    if (source) sourceNode.textContent = source;
  }

  function extractValidEpcs(raw) {
    const cleaned = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const found = [];
    const seen = new Set();
    let from = 0;
    while (from <= cleaned.length - EPC_LENGTH) {
      const index = cleaned.indexOf(REQUIRED_PREFIX, from);
      if (index < 0) break;
      const candidate = cleaned.slice(index, index + EPC_LENGTH);
      if (EPC_PATTERN.test(candidate) && !seen.has(candidate)) {
        seen.add(candidate);
        found.push(candidate);
      }
      from = index + 1;
    }
    return { cleaned, found };
  }

  function processCaptured(raw, source) {
    const { cleaned, found } = extractValidEpcs(raw);
    streamChars += cleaned.length;
    validTotal += found.length;
    setStats(source);
    log("CAPTURE", `source=${source}; rawChars=${cleaned.length}; valid=${found.length}; data=${cleaned.slice(0, 240)}`);

    if (!found.length) {
      lastRawLength = cleaned.length;
      lastNotice = { error: tx().bad, foreign: 0, duplicates: 0 };
      addTechnical(`v4.6.9 ${source}: no valid EPC extracted from ${cleaned.length} alphanumeric characters.`, cleaned);
      renderOperation();
      setOperationMessage(tx().bad, "bad");
      return;
    }

    processRaw(found.join(""), source);
  }

  function flushGlobal(reason) {
    clearTimeout(globalQuietTimer);
    clearTimeout(globalMaxTimer);
    if (!globalBuffer) return;
    const raw = globalBuffer;
    globalBuffer = "";
    globalState.textContent = tx().ready;
    processCaptured(raw, `${tx().global}:${reason}`);
  }

  function appendGlobalCharacter(character) {
    if (!globalBuffer) {
      globalMaxTimer = setTimeout(() => flushGlobal("max-window"), 1900);
      log("GLOBAL START", `focus=${document.activeElement?.id || document.activeElement?.tagName || "—"}`);
    }
    globalBuffer += character.toUpperCase();
    globalState.textContent = tx().receiving;
    clearTimeout(globalQuietTimer);
    globalQuietTimer = setTimeout(() => flushGlobal("quiet"), 650);
  }

  function isProtectedControl(target) {
    if (!target) return false;
    if (target === fallbackInput) return true;
    if (target === serviceCode || target === upperNumber || target === lowerNumber) return true;
    if (target === logArea) return true;
    return Boolean(target.closest?.("button,select,[contenteditable='true']"));
  }

  document.addEventListener("keydown", event => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (isProtectedControl(event.target)) return;

    keyEvents += 1;
    setStats();

    if (event.key.length === 1 && /^[A-Za-z0-9]$/.test(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      appendGlobalCharacter(event.key);
      return;
    }

    if ((event.key === "Enter" || event.key === "Tab") && globalBuffer) {
      event.preventDefault();
      event.stopPropagation();
      setTimeout(() => flushGlobal(event.key), 40);
    }
  }, true);

  fallbackInput.addEventListener("focus", () => {
    sourceNode.textContent = tx().fallback;
    log("FALLBACK FOCUS", "manual field focused");
  });

  fallbackInput.addEventListener("input", () => {
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => {
      const raw = fallbackInput.value;
      fallbackInput.value = "";
      processCaptured(raw, tx().fallback);
    }, 650);
  });

  fallbackInput.addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === "Tab") && fallbackInput.value) {
      event.preventDefault();
      clearTimeout(fallbackTimer);
      const raw = fallbackInput.value;
      fallbackInput.value = "";
      processCaptured(raw, tx().fallback);
    }
  });

  const originalRenderPartStateV469 = renderPartState;
  renderPartState = function renderPartStateGlobalV469() {
    originalRenderPartStateV469();
    const unlocked = operationCodes.size === 1;
    [serviceCode, upperNumber, lowerNumber].forEach(field => {
      field.readOnly = !unlocked;
      field.tabIndex = unlocked ? 0 : -1;
      field.setAttribute("aria-disabled", unlocked ? "false" : "true");
    });
  };

  [serviceCode, upperNumber, lowerNumber].forEach(field => {
    field.addEventListener("pointerdown", event => {
      if (operationCodes.size !== 1) {
        event.preventDefault();
        fallbackInput.focus({ preventScroll: true });
      }
    }, true);
  });

  clearLogButton.addEventListener("click", () => {
    entries = [];
    keyEvents = 0;
    streamChars = 0;
    validTotal = 0;
    setStats("—");
    log("LOG CLEARED");
  });

  copyLogButton.addEventListener("click", async () => {
    const header = [
      "Nordic ID v4.6.9 GLOBAL CAPTURE journal",
      `Time: ${new Date().toISOString()}`,
      `UserAgent: ${navigator.userAgent}`,
      `Screen: ${screen.width}x${screen.height}`,
      `Focus: ${document.activeElement?.id || document.activeElement?.tagName || "—"}`,
      "---"
    ].join("\n");
    const text = `${header}\n${entries.join("\n")}`;
    logArea.value = text;
    try {
      await navigator.clipboard.writeText(text);
      log("COPY", "clipboard success");
    } catch (error) {
      logArea.removeAttribute("readonly");
      logArea.focus();
      logArea.select();
      try { document.execCommand("copy"); } catch {}
      logArea.setAttribute("readonly", "readonly");
      log("COPY FALLBACK", error?.message || String(error));
    }
  });

  const originalApplyLanguageV469 = applyLanguage;
  applyLanguage = function applyLanguageGlobalV469() {
    originalApplyLanguageV469();
    applyText();
  };

  const originalResetOperationV469 = resetOperation;
  resetOperation = function resetOperationGlobalV469(options) {
    globalBuffer = "";
    fallbackInput.value = "";
    originalResetOperationV469({ ...(options || {}), focus: false });
    renderPartState();
    globalState.textContent = tx().ready;
  };

  applyText();
  renderPartState();
  updateFocusStatus();
  const scanStatus = document.getElementById("scanStatus");
  if (scanStatus && !operationCodes.size) scanStatus.textContent = "GLOBAL";
  addTechnical("v4.6.9 loaded: global key capture and manual fallback field are active.");
  log("LOAD", `v4.6.9 active; focus=${document.activeElement?.id || document.activeElement?.tagName || "—"}`);
})();
