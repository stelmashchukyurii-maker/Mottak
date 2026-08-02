"use strict";

// v4.6.4: explicit short capture window for one Bunner.
// RFID received outside the armed window is logged but never added to the operation.

(function applyV464CaptureWindow() {
  const diagnosticPanel = document.getElementById("wedgeDiagnosticPanel");
  const version = document.querySelector(".version");
  const recoverButton = document.getElementById("recoverWedgeButton");
  const clearButton = document.getElementById("clearOperationButton");

  if (!diagnosticPanel || typeof processRaw !== "function") return;

  if (version) {
    version.innerHTML = "Nordic ID Cloud v4.6.4 kandidat<br />Oppdatert 02.08.2026 kl. 22:02";
  }

  const TEXT = {
    nb: {
      title: "Kontrollert skannevindu",
      help: "Trykk knappen først. Bare RFID mottatt i det korte vinduet kan legges til.",
      arm: "Åpne skannevindu (3 sekunder)",
      closed: "LUKKET — trykk knappen før avtrekkeren",
      ready: "KLAR — trykk avtrekkeren én gang nå",
      captured: "LÅST — første riktige etikett er mottatt",
      timeout: "Ingen EPC mottatt. Flytt eller vri etiketten og prøv på nytt.",
      ignored: "RFID mottatt utenfor skannevinduet og ignorert.",
      newFirst: "Trykk «Ny skanning» før et nytt forsøk.",
      multiple: "Flere riktige etiketter kom i samme skannevindu. Lagring er blokkert."
    },
    pl: {
      title: "Kontrolowane okno skanowania",
      help: "Najpierw naciśnij przycisk. Tylko RFID odebrane w krótkim oknie może zostać dodane.",
      arm: "Otwórz okno skanowania (3 sekundy)",
      closed: "ZAMKNIĘTE — naciśnij przycisk przed spustem",
      ready: "GOTOWE — teraz naciśnij spust jeden raz",
      captured: "ZABLOKOWANE — odebrano pierwszą poprawną etykietę",
      timeout: "Nie odebrano EPC. Przesuń lub obróć etykietę i spróbuj ponownie.",
      ignored: "RFID odebrane poza oknem skanowania zostało pominięte.",
      newFirst: "Przed kolejną próbą naciśnij «Nowy skan».",
      multiple: "W jednym oknie odebrano kilka poprawnych etykiet. Zapis zablokowany."
    },
    uk: {
      title: "Контрольоване вікно сканування",
      help: "Спочатку натисніть кнопку. Додати можна лише RFID, отриманий у короткому відкритому вікні.",
      arm: "Відкрити сканування на 3 секунди",
      closed: "ЗАКРИТО — натисніть кнопку перед курком",
      ready: "ГОТОВО — зараз один раз натисніть курок",
      captured: "ЗАФІКСОВАНО — першу правильну бірку отримано",
      timeout: "EPC не отримано. Змініть положення або нахил бірки й спробуйте знову.",
      ignored: "RFID надійшов поза вікном сканування та був проігнорований.",
      newFirst: "Перед новою спробою натисніть «Нове сканування».",
      multiple: "В одному вікні надійшло кілька правильних бірок. Збереження заблоковано."
    }
  };

  const lang = () => {
    const value = localStorage.getItem("mottak_nordic_cloud_language");
    return TEXT[value] ? value : "nb";
  };
  const tx = () => TEXT[lang()];

  const panel = document.createElement("div");
  panel.id = "captureWindowPanel";
  panel.style.cssText = "margin-top:10px;padding:13px;border:2px solid #f4c430;border-radius:14px;background:#0d1426";
  panel.innerHTML = `
    <strong id="captureTitle" style="display:block;font-size:18px;margin-bottom:6px"></strong>
    <div id="captureHelp" style="color:#aab4ce;line-height:1.45;margin-bottom:9px"></div>
    <button id="armCaptureButton" type="button" class="primary" style="width:100%;font-size:18px"></button>
    <div id="captureState" style="margin-top:9px;padding:11px;border-radius:11px;background:#070b14;text-align:center;font-weight:900;line-height:1.35"></div>`;
  diagnosticPanel.insertAdjacentElement("afterend", panel);

  const titleNode = document.getElementById("captureTitle");
  const helpNode = document.getElementById("captureHelp");
  const armButton = document.getElementById("armCaptureButton");
  const stateNode = document.getElementById("captureState");

  const originalProcessRaw = processRaw;
  const originalResetOperation = resetOperation;
  const WINDOW_MS = 3500;

  let armed = false;
  let accepted = false;
  let deadline = 0;
  let closeTimer = null;
  let countdownTimer = null;
  let state = "closed";

  function stateText() {
    if (state === "ready") {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      return `${tx().ready}\n${remaining}`;
    }
    return tx()[state] || tx().closed;
  }

  function render() {
    titleNode.textContent = tx().title;
    helpNode.textContent = tx().help;
    armButton.textContent = tx().arm;
    stateNode.textContent = stateText();
    stateNode.style.color = state === "ready" ? "#48d597"
      : state === "captured" ? "#48d597"
      : state === "multiple" ? "#ff6b6b"
      : state === "timeout" ? "#f4c430"
      : "#aab4ce";
  }

  function stopTimers() {
    clearTimeout(closeTimer);
    clearInterval(countdownTimer);
    closeTimer = null;
    countdownTimer = null;
  }

  function closeWindow(nextState = "closed") {
    stopTimers();
    armed = false;
    state = nextState;
    render();
  }

  function armWindow() {
    if (operationCodes.size > 0 || accepted) {
      state = "newFirst";
      render();
      setOperationMessage(tx().newFirst, "warn");
      return;
    }

    stopTimers();
    armed = true;
    accepted = false;
    deadline = Date.now() + WINDOW_MS;
    state = "ready";
    render();
    addTechnical("v4.6.4: capture window opened for 3 seconds.");

    if (recoverButton) recoverButton.click();
    else focusChannel(activeChannel, 50);

    countdownTimer = setInterval(render, 150);
    closeTimer = setTimeout(() => {
      if (!armed) return;
      closeWindow("timeout");
      setOperationMessage(tx().timeout, "warn");
      addTechnical("v4.6.4: capture window timed out without a valid EPC.");
    }, WINDOW_MS);
  }

  processRaw = function processRawV464(raw, channel) {
    if (!armed || Date.now() > deadline) {
      addTechnical(`v4.6.4: ignored RFID outside capture window, channel ${channel}.`, raw);
      if (!operationCodes.size) setOperationMessage(tx().ignored, "warn");
      closeWindow(state === "captured" ? "captured" : "closed");
      return;
    }

    originalProcessRaw(raw, channel);

    if (operationCodes.size === 1) {
      accepted = true;
      closeWindow("captured");
      addTechnical("v4.6.4: first valid EPC captured; window locked.");
    } else if (operationCodes.size > 1) {
      accepted = true;
      closeWindow("multiple");
      setOperationMessage(tx().multiple, "bad");
      addTechnical("v4.6.4: multiple valid EPCs received in one capture window; save blocked.");
    }
  };

  resetOperation = function resetOperationV464(options = {}) {
    accepted = false;
    closeWindow("closed");
    return originalResetOperation(options);
  };

  armButton.addEventListener("click", armWindow);
  clearButton?.addEventListener("click", () => {
    accepted = false;
    closeWindow("closed");
  }, true);

  const previousApplyLanguage = applyLanguage;
  applyLanguage = function applyLanguageV464() {
    previousApplyLanguage();
    render();
  };

  render();
  addTechnical("v4.6.4 active: controlled 3-second capture window loaded.");
})();
