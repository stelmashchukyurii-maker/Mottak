"use strict";

// v4.6.2: recovery bridge + visible Wedge diagnostics.
// The page must distinguish scanner beeps from actual browser input events.

(function applyV462WedgeRecovery() {
  const scanA = document.getElementById("scanA");
  const scanB = document.getElementById("scanB");
  const scanConsole = document.getElementById("scanConsole");
  const scanActions = document.querySelector(".scan-actions");
  const version = document.querySelector(".version");

  if (!scanA || !scanB || !scanConsole || !scanActions) return;

  if (version) {
    version.innerHTML = "Nordic ID Cloud v4.6.2 kandidat<br />Oppdatert 02.08.2026 kl. 21:40";
  }

  const languageText = {
    nb: {
      title: "Wedge-kontroll",
      help: "Hvis skanneren piper, men Input forblir 0, sendte Wedge ingen tegn til nettleseren.",
      recover: "Gjenopprett skannerkanal",
      input: "Input-hendelser",
      last: "Siste felt / tegn",
      focus: "Nettleserfokus",
      wake: "Aktiveringsfelt"
    },
    pl: {
      title: "Kontrola Wedge",
      help: "Jeśli skaner piszczy, ale Input nadal wynosi 0, Wedge nie wysłał znaków do przeglądarki.",
      recover: "Przywróć kanał skanera",
      input: "Zdarzenia input",
      last: "Ostatnie pole / znaki",
      focus: "Fokus przeglądarki",
      wake: "Pole aktywacji"
    },
    uk: {
      title: "Контроль Wedge",
      help: "Якщо сканер пищить, але Input залишається 0, Wedge не передав браузеру жодного символу.",
      recover: "Відновити канал сканера",
      input: "Події input",
      last: "Останнє поле / символи",
      focus: "Фокус браузера",
      wake: "Поле активації"
    }
  };

  const currentLanguage = () => {
    const saved = localStorage.getItem("mottak_nordic_cloud_language");
    return languageText[saved] ? saved : "nb";
  };

  const panel = document.createElement("div");
  panel.id = "wedgeDiagnosticPanel";
  panel.style.cssText = "margin-top:10px;padding:12px;border:1px solid #303b59;border-radius:14px;background:#0d1426";
  panel.innerHTML = `
    <strong id="wedgeDiagTitle" style="display:block;margin-bottom:7px"></strong>
    <div id="wedgeDiagHelp" style="color:#aab4ce;line-height:1.45;margin-bottom:9px"></div>
    <input id="wedgeWakeInput" type="text" inputmode="none" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"
      style="width:100%;min-height:50px;padding:10px;border:3px solid #f4c430;border-radius:12px;background:#070b14;color:#fff;font:800 17px Arial,sans-serif" />
    <button id="recoverWedgeButton" type="button" class="primary" style="width:100%;margin-top:8px"></button>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:9px">
      <div class="stat"><span id="wedgeInputLabel"></span><strong id="wedgeInputCount">0</strong></div>
      <div class="stat"><span id="wedgeLastLabel"></span><strong id="wedgeLastValue" style="font-size:18px">— / 0</strong></div>
      <div class="stat"><span id="wedgeFocusLabel"></span><strong id="wedgeFocusValue" style="font-size:16px">—</strong></div>
    </div>`;
  scanActions.insertAdjacentElement("beforebegin", panel);

  const wakeInput = document.getElementById("wedgeWakeInput");
  const recoverButton = document.getElementById("recoverWedgeButton");
  const inputCountNode = document.getElementById("wedgeInputCount");
  const lastValueNode = document.getElementById("wedgeLastValue");
  const focusValueNode = document.getElementById("wedgeFocusValue");

  let inputEvents = 0;

  function applyDiagnosticLanguage() {
    const text = languageText[currentLanguage()];
    document.getElementById("wedgeDiagTitle").textContent = text.title;
    document.getElementById("wedgeDiagHelp").textContent = text.help;
    document.getElementById("wedgeInputLabel").textContent = text.input;
    document.getElementById("wedgeLastLabel").textContent = text.last;
    document.getElementById("wedgeFocusLabel").textContent = text.focus;
    wakeInput.placeholder = text.wake;
    recoverButton.textContent = text.recover;
  }

  function focusName() {
    if (document.activeElement === scanA) return "A";
    if (document.activeElement === scanB) return "B";
    if (document.activeElement === wakeInput) return "ACT";
    return document.activeElement?.id || document.activeElement?.tagName || "—";
  }

  function refreshDiagnostic() {
    inputCountNode.textContent = String(inputEvents);
    focusValueNode.textContent = focusName();
  }

  function focusAndSelect(field) {
    try { field.focus({ preventScroll: true }); } catch { field.focus(); }
    try { field.setSelectionRange(0, field.value.length); } catch {}
    refreshDiagnostic();
  }

  focusChannel = function focusChannelV462(name, delay = 0) {
    clearTimeout(focusChannel.timer);
    focusChannel.timer = setTimeout(() => {
      activeChannel = name;
      focusAndSelect(fieldFor(name));
      updateFocusStatus();
    }, delay);
  };

  function recoveryBridge(targetName = "A") {
    // A real activation field is focused first, as in the successful Minimal v6 test.
    focusAndSelect(wakeInput);
    setTimeout(() => focusChannel(targetName, 0), 180);
  }

  moveToOtherField = function moveToOtherFieldV462(fromName) {
    const fromField = fieldFor(fromName);
    const nextName = otherChannel(fromName);

    focusChannel(nextName, 70);
    setTimeout(() => {
      if (document.activeElement !== fromField) fromField.value = "";
    }, 180);
  };

  restartFields = function restartFieldsV462() {
    clearTimeout(fieldTimers.A);
    clearTimeout(fieldTimers.B);
    const nextName = otherChannel(activeChannel);
    addTechnical(v().fieldsRestarted);
    setOperationMessage(v().fieldsRestarted, "warn");
    recoveryBridge(nextName);
  };

  resetOperation = function resetOperationV462({ focus = true, clearUserMessage = true } = {}) {
    clearTimeout(fieldTimers.A);
    clearTimeout(fieldTimers.B);
    operationCodes.clear();
    selectedRaw = "";
    lastRawLength = 0;
    lastNotice = null;
    clearParts();
    if (clearUserMessage) show("");
    renderOperation();
    setOperationMessage(v().operationCleared, "");
    if (focus) recoveryBridge(activeChannel);
  };

  function recordInput(name, field) {
    inputEvents += 1;
    const length = compact(field.value).length;
    inputCountNode.textContent = String(inputEvents);
    lastValueNode.textContent = `${name} / ${length}`;
    refreshDiagnostic();
    addTechnical(`INPUT ${inputEvents}: channel ${name}, ${length} characters`, compact(field.value));
  }

  scanA.addEventListener("input", () => recordInput("A", scanA), true);
  scanB.addEventListener("input", () => recordInput("B", scanB), true);
  wakeInput.addEventListener("input", () => {
    inputEvents += 1;
    const length = compact(wakeInput.value).length;
    inputCountNode.textContent = String(inputEvents);
    lastValueNode.textContent = `ACT / ${length}`;
    addTechnical(`INPUT ${inputEvents}: activation field, ${length} characters`, compact(wakeInput.value));
    setTimeout(() => recoveryBridge(activeChannel), 80);
  }, true);

  document.addEventListener("focusin", refreshDiagnostic);
  recoverButton.addEventListener("click", () => recoveryBridge(otherChannel(activeChannel)));

  // The original restart listener stored the old function reference.
  // Capture the click first so only the safe v4.6.2 restart runs.
  document.getElementById("restartFieldsButton")?.addEventListener("click", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    restartFields();
  }, true);

  const originalApplyLanguage = applyLanguage;
  applyLanguage = function applyLanguageV462() {
    originalApplyLanguage();
    applyDiagnosticLanguage();
    refreshDiagnostic();
  };

  applyDiagnosticLanguage();
  refreshDiagnostic();
  addTechnical("v4.6.2 active: recovery bridge and input diagnostics loaded.");
  setTimeout(() => recoveryBridge("A"), 300);
})();