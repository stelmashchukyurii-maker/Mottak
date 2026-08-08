"use strict";

// Shareable Nordic ID scanner journal.
// Important: never overwrite the version label of a newer host page such as v4.6.8.
(function applyShareableScannerJournalV467() {
  const version = document.querySelector(".version");
  if (version && !/v4\.6\.8/i.test(version.textContent || "")) {
    version.innerHTML = "Nordic ID Cloud v4.6.7 TEST — JOURNAL<br />Oppdatert 04.08.2026 kl. 08:46";
  }

  const scanA = document.getElementById("scanA");
  const scanB = document.getElementById("scanB");
  const wakeInput = document.getElementById("wedgeWakeInput");
  const scanCard = document.getElementById("scanCard");
  if (!scanA || !scanB || !scanCard) return;

  const textByLanguage = {
    nb: {
      title: "DELBAR SKANNERJOURNAL",
      help: "Skann 2–3 ganger. Kopier deretter journalen og send teksten i chatten.",
      copy: "KOPIER JOURNAL",
      clear: "TØM JOURNAL",
      copied: "Journalen er kopiert.",
      failed: "Kopiering ble blokkert. Marker teksten og kopier manuelt.",
      inner: "Fokus i appen",
      input: "Input",
      keys: "Taster"
    },
    pl: {
      title: "DZIENNIK SKANERA DO UDOSTĘPNIENIA",
      help: "Zeskanuj 2–3 razy. Następnie skopiuj dziennik i wyślij tekst na czacie.",
      copy: "KOPIUJ DZIENNIK",
      clear: "WYCZYŚĆ DZIENNIK",
      copied: "Dziennik skopiowano.",
      failed: "Kopiowanie zablokowane. Zaznacz tekst i skopiuj ręcznie.",
      inner: "Fokus aplikacji",
      input: "Input",
      keys: "Klawisze"
    },
    uk: {
      title: "ЖУРНАЛ СКАНЕРА ДЛЯ НАДСИЛАННЯ",
      help: "Проскануйте 2–3 рази. Потім скопіюйте журнал і надішліть текст у чат.",
      copy: "КОПІЮВАТИ ЖУРНАЛ",
      clear: "ОЧИСТИТИ ЖУРНАЛ",
      copied: "Журнал скопійовано.",
      failed: "Копіювання заблоковано. Виділіть текст і скопіюйте вручну.",
      inner: "Фокус у програмі",
      input: "Input",
      keys: "Клавіші"
    }
  };

  const language = () => {
    const saved = localStorage.getItem("mottak_nordic_cloud_language");
    return textByLanguage[saved] ? saved : "nb";
  };
  const tx = () => textByLanguage[language()];
  const targetName = target => target?.id || target?.tagName || "—";
  const compactValue = field => String(field?.value || "").replace(/\s+/g, "").toUpperCase();
  const clock = () => new Date().toLocaleTimeString("en-GB", { hour12: false });

  let entries = [];
  let inputCount = 0;
  let keyCount = 0;

  const panel = document.createElement("section");
  panel.id = "shareJournalPanelV467";
  panel.style.cssText = "margin:0 0 12px;padding:14px;border:2px solid #75b7ff;border-radius:16px;background:rgba(117,183,255,.10)";
  panel.innerHTML = `
    <strong id="journalTitleV467" style="display:block;color:#75b7ff;font-size:18px"></strong>
    <div id="journalHelpV467" style="margin-top:6px;color:#d8e8ff;line-height:1.45"></div>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px">
      <div class="stat"><span id="journalInnerLabelV467"></span><strong id="journalInnerV467" style="font-size:16px">—</strong></div>
      <div class="stat"><span id="journalInputLabelV467"></span><strong id="journalInputV467">0</strong></div>
      <div class="stat"><span id="journalKeysLabelV467"></span><strong id="journalKeysV467">0</strong></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
      <button id="journalClearV467" type="button" class="secondary"></button>
      <button id="journalCopyV467" type="button" class="primary"></button>
    </div>
    <div id="journalStateV467" style="min-height:20px;margin-top:7px;color:#aab4ce;font-weight:800"></div>
    <textarea id="journalTextV467" readonly spellcheck="false" style="width:100%;height:190px;margin-top:7px;padding:10px;border:1px solid #303b59;border-radius:12px;background:#070b14;color:#d8e8ff;font:700 12px/1.45 monospace;resize:vertical"></textarea>`;
  scanCard.insertAdjacentElement("afterbegin", panel);

  const titleNode = document.getElementById("journalTitleV467");
  const helpNode = document.getElementById("journalHelpV467");
  const innerNode = document.getElementById("journalInnerV467");
  const inputNode = document.getElementById("journalInputV467");
  const keysNode = document.getElementById("journalKeysV467");
  const clearButton = document.getElementById("journalClearV467");
  const copyButton = document.getElementById("journalCopyV467");
  const stateNode = document.getElementById("journalStateV467");
  const textarea = document.getElementById("journalTextV467");

  function focusName() {
    const active = document.activeElement;
    if (active === scanA) return "A ✓";
    if (active === scanB) return "B ✓";
    if (active === wakeInput) return "ACT";
    return targetName(active);
  }

  function render() {
    innerNode.textContent = focusName();
    inputNode.textContent = String(inputCount);
    keysNode.textContent = String(keyCount);
    textarea.value = entries.join("\n");
    textarea.scrollTop = textarea.scrollHeight;
  }

  function log(type, detail = "") {
    entries.push(`[${clock()}] ${type}${detail ? ` | ${detail}` : ""}`);
    if (entries.length > 400) entries = entries.slice(-400);
    render();
  }

  function applyText() {
    titleNode.textContent = tx().title;
    helpNode.textContent = tx().help;
    document.getElementById("journalInnerLabelV467").textContent = tx().inner;
    document.getElementById("journalInputLabelV467").textContent = tx().input;
    document.getElementById("journalKeysLabelV467").textContent = tx().keys;
    clearButton.textContent = tx().clear;
    copyButton.textContent = tx().copy;
  }

  [scanA, scanB, wakeInput].filter(Boolean).forEach(field => {
    field.addEventListener("beforeinput", event => {
      log("BEFOREINPUT", `target=${targetName(field)}; type=${event.inputType}; dataLen=${String(event.data || "").length}`);
    }, true);
    field.addEventListener("input", () => {
      inputCount += 1;
      const value = compactValue(field);
      log("INPUT", `target=${targetName(field)}; valueLen=${value.length}; value=${value.slice(0, 160)}`);
    }, true);
  });

  document.addEventListener("keydown", event => {
    keyCount += 1;
    log("KEYDOWN", `target=${targetName(event.target)}; key=${event.key}; code=${event.code}`);
  }, true);
  document.addEventListener("focusin", event => log("FOCUSIN", `target=${targetName(event.target)}; active=${focusName()}`), true);
  document.addEventListener("focusout", event => log("FOCUSOUT", `target=${targetName(event.target)}; related=${targetName(event.relatedTarget)}`), true);
  document.addEventListener("visibilitychange", () => log("VISIBILITY", document.visibilityState));
  window.addEventListener("focus", () => log("WINDOW FOCUS", focusName()));
  window.addEventListener("blur", () => log("WINDOW BLUR", focusName()));

  clearButton.addEventListener("click", () => {
    entries = [];
    inputCount = 0;
    keyCount = 0;
    stateNode.textContent = "";
    log("JOURNAL CLEARED", `focus=${focusName()}`);
  });

  copyButton.addEventListener("click", async () => {
    const header = [
      version?.textContent?.replace(/\s+/g, " ").trim() || "Nordic ID scanner journal",
      `Time: ${new Date().toISOString()}`,
      `UserAgent: ${navigator.userAgent}`,
      `Screen: ${screen.width}x${screen.height}`,
      "---"
    ].join("\n");
    const output = `${header}\n${entries.join("\n")}`;
    textarea.value = output;
    try {
      await navigator.clipboard.writeText(output);
      stateNode.textContent = tx().copied;
    } catch {
      textarea.removeAttribute("readonly");
      textarea.focus();
      textarea.select();
      let copied = false;
      try { copied = document.execCommand("copy"); } catch {}
      textarea.setAttribute("readonly", "readonly");
      stateNode.textContent = copied ? tx().copied : tx().failed;
    }
  });

  if (typeof applyLanguage === "function") {
    const originalApplyLanguage = applyLanguage;
    applyLanguage = function applyLanguageWithJournalV467() {
      originalApplyLanguage();
      applyText();
      render();
    };
  }

  applyText();
  log("LOAD", `journal active; host=${version?.textContent?.replace(/\s+/g, " ").trim() || "—"}; focus=${focusName()}`);
})();
