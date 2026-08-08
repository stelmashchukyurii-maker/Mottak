"use strict";

// v4.6.5 TEST: when several valid RFID tags arrive, show the first three
// in arrival order with large numbers and require an explicit user choice.
(function applyCandidateSelectionV465() {
  const version = document.querySelector(".version");
  if (version) {
    version.innerHTML = "Nordic ID Cloud v4.6.5 TEST<br />Oppdatert 03.08.2026 kl. 09:53";
  }

  const TEXT = {
    nb: {
      choose: "Flere etiketter ble lest. Velg riktig etikett blant de tre første.",
      select: "VELG DENNE ETIKETTEN",
      first: "1. mottatt",
      second: "2. mottatt",
      third: "3. mottatt",
      more: "Ytterligere {count} etikett(er) er skjult i denne testen.",
      selected: "Valgt etikett er låst. Andre og senere RFID-signaler blir ignorert.",
      auto: "Bare én etikett kom i første gyldige avlesning. Den ble låst automatisk.",
      late: "En etikett er allerede valgt. Senere RFID-signal ble ignorert."
    },
    pl: {
      choose: "Odczytano kilka etykiet. Wybierz właściwą spośród pierwszych trzech.",
      select: "WYBIERZ TĘ ETYKIETĘ",
      first: "1. odebrana",
      second: "2. odebrana",
      third: "3. odebrana",
      more: "W tym teście ukryto jeszcze {count} etykiet(y).",
      selected: "Wybrana etykieta została zablokowana. Pozostałe i późniejsze sygnały RFID są pomijane.",
      auto: "W pierwszym poprawnym odczycie przyszła tylko jedna etykieta. Została zablokowana automatycznie.",
      late: "Etykieta jest już wybrana. Późniejszy sygnał RFID został pominięty."
    },
    uk: {
      choose: "Зчитано кілька бірок. Виберіть правильну серед перших трьох.",
      select: "ВИБРАТИ ЦЮ БІРКУ",
      first: "1-ша отримана",
      second: "2-га отримана",
      third: "3-тя отримана",
      more: "У цьому тесті приховано ще {count} бірок.",
      selected: "Вибрану бірку зафіксовано. Решта та пізніші RFID-сигнали ігноруються.",
      auto: "У першому правильному зчитуванні була лише одна бірка. Її зафіксовано автоматично.",
      late: "Бірку вже вибрано. Пізніший RFID-сигнал проігноровано."
    }
  };

  let selectionLocked = false;
  let selectedCandidate = "";

  const lang = () => {
    const saved = localStorage.getItem("mottak_nordic_cloud_language");
    return TEXT[saved] ? saved : "nb";
  };
  const tx = () => TEXT[lang()];
  const format = (text, values) => String(text).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");

  const style = document.createElement("style");
  style.textContent = `
    .candidate-wrap{display:grid;gap:13px;padding:4px 0}
    .candidate-card{padding:15px;border:2px solid #f4c430;border-radius:16px;background:#0d1426;text-align:left}
    .candidate-order{color:#f4c430;font-size:16px;font-weight:900;text-transform:uppercase}
    .candidate-upper{margin-top:7px;color:#aab4ce;font:800 22px/1.1 Arial,sans-serif;letter-spacing:.08em}
    .candidate-lower{margin:6px 0 13px;color:#fff;font:900 clamp(39px,12vw,58px)/1 Arial,sans-serif;letter-spacing:.06em;word-break:break-all}
    .candidate-button{width:100%;min-height:62px;padding:12px;border:0;border-radius:13px;background:#48d597;color:#062418;font:900 18px/1.2 Arial,sans-serif}
    .candidate-more{padding:10px 12px;border:1px solid #303b59;border-radius:12px;color:#aab4ce;background:#151c30;font-weight:800;text-align:center}
    .candidate-selected{border-color:#48d597;background:rgba(72,213,151,.10)}
    .candidate-selected .candidate-lower{color:#48d597}
  `;
  document.head.appendChild(style);

  const originalRenderOperationTable = renderOperationTable;
  renderOperationTable = function renderCandidateTableV465() {
    const rows = [...operationCodes.values()];
    if (rows.length <= 1) {
      originalRenderOperationTable();
      return;
    }

    const labels = [tx().first, tx().second, tx().third];
    const candidates = rows.slice(0, 3);
    const cards = candidates.map((code, index) => {
      const parts = splitEpc(code);
      return `<div class="candidate-card">
        <div class="candidate-order">${esc(labels[index])}</div>
        <div class="candidate-upper">${esc(parts.upperNumber)}</div>
        <div class="candidate-lower">${esc(parts.lowerNumber)}</div>
        <button class="candidate-button" type="button" data-v465-select="${esc(code)}">${esc(tx().select)}</button>
      </div>`;
    }).join("");

    const hidden = rows.length - candidates.length;
    const more = hidden > 0
      ? `<div class="candidate-more">${esc(format(tx().more, { count: hidden }))}</div>`
      : "";

    $("operationBody").innerHTML = `<tr><td colspan="5"><div class="candidate-wrap">${cards}${more}</div></td></tr>`;
  };

  const originalProcessRawV465 = processRaw;
  processRaw = function processRawCandidateV465(raw, channel) {
    if (selectionLocked) {
      lastRawLength = raw.length;
      addTechnical(`v4.6.5 SELECTION LOCK: late channel ${channel} signal ignored (${raw.length} characters).`, raw);
      setOperationMessage(tx().late, "warn");
      renderPartState();
      updateFocusStatus();
      return;
    }

    const before = operationCodes.size;
    originalProcessRawV465(raw, channel);

    if (before === 0 && operationCodes.size === 1) {
      selectedCandidate = [...operationCodes.keys()][0];
      selectionLocked = true;
      addTechnical("v4.6.5 AUTO LOCK: first valid input contained exactly one unique EPC.", selectedCandidate);
      setOperationMessage(tx().auto, "ok");
    } else if (operationCodes.size > 1) {
      setOperationMessage(tx().choose, "warn");
    }
  };

  const originalResetOperationV465 = resetOperation;
  resetOperation = function resetCandidateSelectionV465(options) {
    selectionLocked = false;
    selectedCandidate = "";
    originalResetOperationV465(options);
  };

  $("operationBody").addEventListener("click", event => {
    const button = event.target.closest("[data-v465-select]");
    if (!button || selectionLocked) return;

    const code = button.dataset.v465Select;
    if (!operationCodes.has(code)) return;

    operationCodes.clear();
    operationCodes.set(code, code);
    selectedRaw = code;
    selectedCandidate = code;
    selectionLocked = true;
    lastNotice = null;

    addTechnical("v4.6.5 MANUAL SELECTION: user selected one EPC and discarded the remaining candidates.", code);
    renderOperation();
    setOperationMessage(tx().selected, "ok");
    renderPartState();
    updateFocusStatus();
  });

  addTechnical("v4.6.5 loaded: first three RFID candidates are shown with large manual selection buttons.");
})();
