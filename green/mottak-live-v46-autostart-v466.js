"use strict";

// v4.6.6 TEST: automatic scanner arming and continuous A/B focus recovery.
// The user opens the page and can press the Nordic ID trigger immediately.
(function applyAutoStartV466() {
  const version = document.querySelector(".version");
  if (version) {
    version.innerHTML = "Nordic ID Cloud v4.6.6 TEST — AUTO<br />Oppdatert 04.08.2026 kl. 08:36";
  }

  const TEXT = {
    nb: {
      title: "AUTOMATISK SKANNING ER AKTIV",
      help: "Åpne siden og bruk utløseren på Nordic ID. Kanal A/B byttes automatisk. Ingen aktiveringsknapp er nødvendig.",
      ready: "Klar for skanning",
      paused: "Valg eller kontroll pågår"
    },
    pl: {
      title: "AUTOMATYCZNE SKANOWANIE JEST AKTYWNE",
      help: "Otwórz stronę i użyj spustu Nordic ID. Kanały A/B przełączają się automatycznie. Nie trzeba naciskać przycisku aktywacji.",
      ready: "Gotowy do skanowania",
      paused: "Trwa wybór lub kontrola"
    },
    uk: {
      title: "АВТОМАТИЧНЕ СКАНУВАННЯ АКТИВНЕ",
      help: "Відкрийте сторінку та натискайте курок Nordic ID. Канали A/B перемикаються автоматично. Кнопку активації натискати не потрібно.",
      ready: "Готово до сканування",
      paused: "Триває вибір або перевірка"
    }
  };

  const scanA = document.getElementById("scanA");
  const scanB = document.getElementById("scanB");
  const wakeInput = document.getElementById("wedgeWakeInput");
  const scanCard = document.getElementById("scanCard");
  if (!scanA || !scanB || !scanCard) return;

  [scanA, scanB, wakeInput].filter(Boolean).forEach(field => {
    field.setAttribute("inputmode", "none");
    field.setAttribute("autocomplete", "off");
    field.setAttribute("autocapitalize", "off");
    field.setAttribute("autocorrect", "off");
    field.setAttribute("spellcheck", "false");
  });

  const language = () => {
    const saved = localStorage.getItem("mottak_nordic_cloud_language");
    return TEXT[saved] ? saved : "nb";
  };
  const tx = () => TEXT[language()];

  const panel = document.createElement("div");
  panel.id = "autoScannerPanelV466";
  panel.style.cssText = "margin:0 0 12px;padding:14px 15px;border:2px solid #48d597;border-radius:16px;background:rgba(72,213,151,.10);color:#f5f7ff";
  panel.innerHTML = `
    <strong id="autoScannerTitleV466" style="display:block;color:#48d597;font-size:18px"></strong>
    <div id="autoScannerHelpV466" style="margin-top:6px;color:#d6e4df;line-height:1.45"></div>
    <div id="autoScannerStateV466" style="margin-top:9px;font-weight:900"></div>`;
  scanCard.insertAdjacentElement("afterbegin", panel);

  const titleNode = document.getElementById("autoScannerTitleV466");
  const helpNode = document.getElementById("autoScannerHelpV466");
  const stateNode = document.getElementById("autoScannerStateV466");

  let pauseUntil = 0;
  let bridgeTimer = null;

  function applyText() {
    titleNode.textContent = tx().title;
    helpNode.textContent = tx().help;
    updateState();
  }

  function operationOpen() {
    return operationCodes.size === 0;
  }

  function isScannerFieldFocused() {
    return document.activeElement === scanA || document.activeElement === scanB;
  }

  function isUserControlFocused() {
    const active = document.activeElement;
    if (!active) return false;
    if (active === scanA || active === scanB || active === wakeInput) return false;
    return active.matches?.("button, textarea, select, #serviceCode, #upperNumber, #lowerNumber, [contenteditable='true']") || false;
  }

  function updateState() {
    const ready = operationOpen() && (isScannerFieldFocused() || document.activeElement === wakeInput);
    stateNode.textContent = ready ? `● ${tx().ready}` : `○ ${tx().paused}`;
    stateNode.style.color = ready ? "#48d597" : "#f4c430";
  }

  function autoBridge(reason = "watchdog", delay = 0) {
    clearTimeout(bridgeTimer);
    bridgeTimer = setTimeout(() => {
      if (document.hidden || !operationOpen() || Date.now() < pauseUntil || isUserControlFocused()) {
        updateState();
        return;
      }

      const target = activeChannel === "B" ? "B" : "A";
      if (wakeInput) {
        try { wakeInput.focus({ preventScroll: true }); } catch { wakeInput.focus(); }
      }
      setTimeout(() => {
        if (!operationOpen() || Date.now() < pauseUntil || isUserControlFocused()) return;
        focusChannel(target, 0);
        addTechnical(`v4.6.6 AUTO ARM: channel ${target} focused (${reason}).`);
        updateState();
      }, wakeInput ? 180 : 0);
    }, delay);
  }

  function pauseForUser(milliseconds = 2500) {
    pauseUntil = Date.now() + milliseconds;
    updateState();
  }

  const originalResetOperationV466 = resetOperation;
  resetOperation = function resetOperationAutoV466(options) {
    scanA.value = "";
    scanB.value = "";
    if (wakeInput) wakeInput.value = "";
    pauseUntil = 0;
    originalResetOperationV466(options);
    autoBridge("new scan", 420);
  };

  const originalApplyLanguageV466 = applyLanguage;
  applyLanguage = function applyLanguageAutoV466() {
    originalApplyLanguageV466();
    applyText();
    autoBridge("language change", 450);
  };

  document.addEventListener("pointerdown", event => {
    if (event.target.closest?.("[data-v465-select]")) {
      pauseForUser(5000);
      return;
    }
    if (event.target.closest?.("button, textarea, select, #serviceCode, #upperNumber, #lowerNumber")) {
      pauseForUser(3000);
    }
  }, true);

  document.addEventListener("focusin", updateState);
  document.addEventListener("focusout", () => {
    updateState();
    if (operationOpen()) autoBridge("focus lost", 700);
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) autoBridge("page visible", 300);
  });
  window.addEventListener("pageshow", () => autoBridge("pageshow", 300));
  window.addEventListener("focus", () => autoBridge("window focus", 300));

  setInterval(() => {
    if (document.hidden || !operationOpen() || Date.now() < pauseUntil) {
      updateState();
      return;
    }
    if (!isScannerFieldFocused() && document.activeElement !== wakeInput && !isUserControlFocused()) {
      autoBridge("watchdog", 0);
    } else {
      updateState();
    }
  }, 1200);

  applyText();
  addTechnical("v4.6.6 loaded: automatic scanner start and A/B focus watchdog are active.");
  autoBridge("initial load", 250);
  setTimeout(() => autoBridge("initial retry", 0), 1100);
})();
