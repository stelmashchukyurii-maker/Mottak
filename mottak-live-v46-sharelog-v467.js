"use strict";

// v4.6.7 TEST: shareable scanner journal for focus, Wedge and input diagnostics.
(function applyShareableScannerJournalV467() {
  const version = document.querySelector(".version");
  if (version) {
    version.innerHTML = "Nordic ID Cloud v4.6.7 TEST — JOURNAL<br />Oppdatert 04.08.2026 kl. 08:46";
  }

  const scanA = document.getElementById("scanA");
  const scanB = document.getElementById("scanB");
  const wakeInput = document.getElementById("wedgeWakeInput");
  const scanCard = document.getElementById("scanCard");
  if (!scanA || !scanB || !scanCard) return;

  const TEXT = {
    nb: {
      title: "DELbar SKANNERJOURNAL",
      help: "Skann 2–3 ganger. Trykk deretter «Kopier journal» og send teksten i chatten.",
      copy: "KOPIER JOURNAL",
      clear: "TØM JOURNAL",
      snapshot: "TA STATUSBILDE",
      copied: "Journalen er kopiert.",
      fallback: "Kopiering ble blokkert. Teksten er markert — bruk Kopier.",
      inner: "Fokus i appen",
      outer: "Fokus utenfor",
      inputs: "Input",
      keys: "Taster"
    },
    pl: {
      title: "DZIENNIK SKANERA DO UDOSTĘPNIENIA",
      help: "Zeskanuj 2–3 razy. Następnie naciśnij «Kopiuj dziennik» i wyślij tekst na czacie.",
      copy: "KOPIUJ DZIENNIK",
      clear: "WYCZYŚĆ DZIENNIK",
      snapshot: "ZAPISZ STAN",
      copied: "Dziennik skopiowano.",
      fallback: "Kopiowanie zablokowane. Tekst zaznaczono — użyj Kopiuj.",
      inner: "Fokus aplikacji",
      outer: "Fokus zewnętrzny",
      inputs: "Input",
      keys: "Klawisze"
    },
    uk: {
      title: "ЖУРНАЛ СКАНЕРА ДЛЯ НАДСИЛАННЯ",
      help: "Проскануйте 2–3 рази. Потім натисніть «Копіювати журнал» і надішліть текст у чат.",
      copy: "КОПІЮВАТИ ЖУРНАЛ",
      clear: "ОЧИСТИТИ ЖУРНАЛ",
      snapshot: "ЗАПИСАТИ СТАН",
      copied: "Журнал скопійовано.",
      fallback: "Копіювання заблоковано. Текст виділено — скористайтеся командою Копіювати.",
      inner: "Фокус у програмі",
      outer: "Зовнішній фокус",
      inputs: "Input",
      keys: "Клавіші"
    }
  };

  const language = () => {
    const saved = localStorage.getItem("mottak_nordic_cloud_language");
    return TEXT[saved] ? saved : "nb";
  };
  const tx = () => TEXT[language()];

  const panel = document.createElement("section");
  panel.id = "shareJournalPanelV467";
  panel.style.cssText = "margin:0 0 12px;padding:14px;border:2px solid #75b7ff;border-radius:16px;background:rgba(117,183,255,.10)";
  panel.innerHTML = `
    <strong id="shareJournalTitleV467" style="display:block;color:#75b7ff;font-size:18px"></strong>
    <div id="shareJournalHelpV467" style="margin-top:6px;color:#d8e8ff;line-height:1.45"></div>
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:10px">
      <div class="stat"><span id="journalInnerLabelV467"></span><strong id="journalInnerV467" style="font-size:16px">—</strong></div>
      <div class="stat"><span id="journalOuterLabelV467"></span><strong id="journalOuterV467" style="font-size:16px">—</strong></div>
      <div class="stat"><span id="journalInputsLabelV467"></span><strong id="journalInputsV467">0</strong></div>
      <div class="stat"><span id="journalKeysLabelV467"></span><strong id="journalKeysV467">0</strong></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
      <button id="journalSnapshotV467" type="button" class="secondary"></button>
      <button id="journalClearV467" type="button" class="secondary"></button>
    </div>
    <button id="journalCopyV467" type="button" class="primary" style="width:100%;margin-top:8px;min-height:58px"></button>
    <div id="journalCopyStateV467" style="min-height:20px;margin-top:7px;color:#aab4ce;font-weight:800"></div>
    <textarea id="journalTextV467" readonly spellcheck="false" style="width:100%;height:210px;margin-top:7px;padding:10px;border:1px solid #303b59;border-radius:12px;background:#070b14;color:#d8e8ff;font:700 12px/1.45 monospace;resize:vertical"></textarea>`;

  const autoPanel = document.getElementById("autoScannerPanelV466");
  if (autoPanel) autoPanel.insertAdjacentElement("afterend", panel);
  else scanCard.insertAdjacentElement("afterbegin", panel);

  const titleNode = document.getElementById("shareJournalTitleV467");
  const helpNode = document.getElementById("shareJournalHelpV467");
  const innerNode = document.getElementById("journalInnerV467");
  const outerNode = document.getElementById("journalOuterV467");
  const inputsNode = document.getElementById("journalInputsV467");
  const keysNode = document.getElementById("journalKeysV467");
  const textarea = document.getElementById("journalTextV467");
  const copyButton = document.getElementById("journalCopyV467");
  const clearButton = document.getElementById("journalClearV467");
  const snapshotButton = document.getElementById("journalSnapshotV467");
  const copyState = document.getElementById("journalCopyStateV467");

  let entries = [];
  let inputCount = 0;
  let keyCount = 0;
  let lastStateKey = "";

  const clock = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
  const targetName = target => target?.id || target?.tagName || "—";

  function parentFocusName() {
    try {
      const active = window.parent.document.activeElement;
      if (active === window.frameElement) return "IFRAME ✓";
      return targetName(active);
    } catch {
      return "NO ACCESS";
    }
  }

  function innerFocusName() {
    const active = document.activeElement;
    if (active === scanA) return "A ✓";
    if (active === scanB) return "B ✓";
    if (active === wakeInput) return "ACT";
    return targetName(active);
  }

  function stateSummary() {
    return `visible=${document.visibilityState}; hasFocus=${document.hasFocus()}; inner=${innerFocusName()}; outer=${parentFocusName()}; activeChannel=${typeof activeChannel !== "undefined" ? activeChannel : "?"}; operation=${typeof operationCodes !== "undefined" ? operationCodes.size : "?"}`;
  }

  function render() {
    innerNode.textContent = innerFocusName();
    outerNode.textContent = parentFocusName();
    inputsNode.textContent = String(inputCount);
    keysNode.textContent = String(keyCount);
    textarea.value = entries.join("\n");
    textarea.scrollTop = textarea.scrollHeight;
  }

  function log(type, detail = "") {
    const line = `[${clock()}] ${type}${detail ? ` | ${detail}` : ""}`;
    entries.push(line);
    if (entries.length > 500) entries = entries.slice(-500);
    render();
  }

  function logSnapshot(reason) {
    log(`STATUS ${reason}`, stateSummary());
  }

  function applyText() {
    titleNode.textContent = tx().title;
    helpNode.textContent = tx().help;
    document.getElementById("journalInnerLabelV467").textContent = tx().inner;
    document.getElementById("journalOuterLabelV467").textContent = tx().outer;
    document.getElementById("journalInputsLabelV467").textContent = tx().inputs;
    document.getElementById("journalKeysLabelV467").textContent = tx().keys;
    copyButton.textContent = tx().copy;
    clearButton.textContent = tx().clear;
    snapshotButton.textContent = tx().snapshot;
  }

  async function copyJournal() {
    logSnapshot("BEFORE COPY");
    const header = [
      "Nordic ID v4.6.7 scanner journal",
      `Time: ${new Date().toISOString()}`,
      `UserAgent: ${navigator.userAgent}`,
      `Screen: ${screen.width}x${screen.height}`,
      "---"
    ].join("\n");
    const text = `${header}\n${entries.join("\n")}`;
    textarea.value = text;

    try {
      await navigator.clipboard.writeText(text);
      copyState.textContent = tx().copied;
      log("COPY", "navigator.clipboard success");
    } catch (error) {
      textarea.removeAttribute("readonly");
      textarea.focus();
      textarea.select();
      let copied = false;
      try { copied = document.execCommand("copy"); } catch {}
      textarea.setAttribute("readonly", "readonly");
      copyState.textContent = copied ? tx().copied : tx().fallback;
      log("COPY FALLBACK", error?.message || String(error));
    }
  }

  [scanA, scanB, wakeInput].filter(Boolean).forEach(field => {
    field.addEventListener("beforeinput", event => {
      log("BEFOREINPUT", `target=${targetName(field)}; type=${event.inputType}; dataLen=${String(event.data || "").length}; valueLen=${compact(field.value).length}`);
    }, true);
    field.addEventListener("input", () => {
      inputCount += 1;
      log("INPUT", `target=${targetName(field)}; valueLen=${compact(field.value).length}; value=${compact(field.value).slice(0, 144)}`);
    }, true);
  });

  document.addEventListener("keydown", event => {
    keyCount += 1;
    log("KEYDOWN", `target=${targetName(event.target)}; key=${event.key}; code=${event.code}; repeat=${event.repeat}`);
  }, true);

  document.addEventListener("focusin", event => log("FOCUSIN", `target=${targetName(event.target)}; ${stateSummary()}`), true);
  document.addEventListener("focusout", event => log("FOCUSOUT", `target=${targetName(event.target)}; related=${targetName(event.relatedTarget)}`), true);
  document.addEventListener("visibilitychange", () => logSnapshot("VISIBILITYCHANGE"));
  window.addEventListener("focus", () => logSnapshot("WINDOW FOCUS"));
  window.addEventListener("blur", () => logSnapshot("WINDOW BLUR"));
  window.addEventListener("pageshow", event => log("PAGESHOW", `persisted=${event.persisted}; ${stateSummary()}`));

  copyButton.addEventListener("click", copyJournal);
  clearButton.addEventListener("click", () => {
    entries = [];
    inputCount = 0;
    keyCount = 0;
    copyState.textContent = "";
    logSnapshot("JOURNAL CLEARED");
  });
  snapshotButton.addEventListener("click", () => logSnapshot("MANUAL"));

  const originalApplyLanguageV467 = applyLanguage;
  applyLanguage = function applyLanguageShareJournalV467() {
    originalApplyLanguageV467();
    applyText();
    logSnapshot("LANGUAGE APPLIED");
  };

  setInterval(() => {
    const key = stateSummary();
    render();
    if (key !== lastStateKey) {
      lastStateKey = key;
      log("STATE CHANGE", key);
    }
  }, 800);

  applyText();
  log("LOAD", `v4.6.7 journal active; iframe=${window !== window.top}; ${stateSummary()}`);
  setTimeout(() => logSnapshot("+0.5s"), 500);
  setTimeout(() => logSnapshot("+1.5s"), 1500);
  setTimeout(() => logSnapshot("+3s"), 3000);
})();
