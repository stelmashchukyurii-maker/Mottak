"use strict";

// v4.6.8 TEST: focus one real Wedge field once and leave it stable.
// No ACT/B watchdog loop. A/B changes only after a real input is processed.
(function applyStableFocusV468() {
  const version = document.querySelector(".version");
  if (version) {
    version.innerHTML = "Nordic ID Cloud v4.6.8 TEST — STABILT FELT<br />Oppdatert 04.08.2026 kl. 09:05";
  }

  const scanA = document.getElementById("scanA");
  const scanB = document.getElementById("scanB");
  const scanCard = document.getElementById("scanCard");
  const activateButton = document.getElementById("activateScanButton");
  const restartButton = document.getElementById("restartFieldsButton");
  if (!scanA || !scanB || !scanCard) return;

  const TEXT = {
    nb: {
      title: "STABILT SKANNERFELT",
      help: "Siden fokuserer ett felt én gang. Bruk Nordic ID-utløseren direkte. Feltet byttes først etter at data faktisk er mottatt.",
      ready: "Klar — kanal {channel}",
      lost: "Fokus mangler — trykk i dette grønne feltet én gang"
    },
    pl: {
      title: "STABILNE POLE SKANERA",
      help: "Strona ustawia fokus tylko raz. Użyj bezpośrednio spustu Nordic ID. Pole zmienia się dopiero po faktycznym odebraniu danych.",
      ready: "Gotowy — kanał {channel}",
      lost: "Brak fokusu — dotknij raz tego zielonego pola"
    },
    uk: {
      title: "СТАБІЛЬНЕ ПОЛЕ СКАНЕРА",
      help: "Сторінка один раз ставить фокус у поле. Одразу використовуйте курок Nordic ID. Поле зміниться лише після фактичного отримання даних.",
      ready: "Готово — канал {channel}",
      lost: "Фокус відсутній — один раз торкніться цього зеленого поля"
    }
  };

  const language = () => {
    const saved = localStorage.getItem("mottak_nordic_cloud_language");
    return TEXT[saved] ? saved : "nb";
  };
  const tx = () => TEXT[language()];
  const format = (text, values) => String(text).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");

  [scanA, scanB].forEach(field => {
    field.setAttribute("inputmode", "none");
    field.setAttribute("autocomplete", "off");
    field.setAttribute("autocapitalize", "off");
    field.setAttribute("autocorrect", "off");
    field.setAttribute("spellcheck", "false");
  });

  if (activateButton) activateButton.style.display = "none";
  if (restartButton) restartButton.style.display = "none";

  const panel = document.createElement("div");
  panel.id = "stableFocusPanelV468";
  panel.tabIndex = 0;
  panel.style.cssText = "margin:0 0 12px;padding:15px;border:3px solid #48d597;border-radius:16px;background:rgba(72,213,151,.11);outline:none";
  panel.innerHTML = `
    <strong id="stableFocusTitleV468" style="display:block;color:#48d597;font-size:19px"></strong>
    <div id="stableFocusHelpV468" style="margin-top:6px;color:#d6e4df;line-height:1.45"></div>
    <div id="stableFocusStateV468" style="margin-top:10px;font-size:21px;font-weight:900"></div>`;
  scanCard.insertAdjacentElement("afterbegin", panel);

  const titleNode = document.getElementById("stableFocusTitleV468");
  const helpNode = document.getElementById("stableFocusHelpV468");
  const stateNode = document.getElementById("stableFocusStateV468");

  function scannerFieldFocused() {
    return document.activeElement === scanA || document.activeElement === scanB;
  }

  function updatePanel() {
    titleNode.textContent = tx().title;
    helpNode.textContent = tx().help;
    const focused = scannerFieldFocused();
    const channel = document.activeElement === scanB ? "B" : activeChannel === "B" ? "B" : "A";
    stateNode.textContent = focused ? `● ${format(tx().ready, { channel })}` : `○ ${tx().lost}`;
    stateNode.style.color = focused ? "#48d597" : "#f4c430";
  }

  function focusStable(name = "A", reason = "manual", delay = 0) {
    setTimeout(() => {
      const field = name === "B" ? scanB : scanA;
      activeChannel = name === "B" ? "B" : "A";
      try { field.focus({ preventScroll: true }); } catch { field.focus(); }
      try { field.setSelectionRange(field.value.length, field.value.length); } catch {}
      addTechnical(`v4.6.8 STABLE FOCUS: channel ${activeChannel} (${reason}).`);
      updateFocusStatus();
      updatePanel();
    }, delay);
  }

  panel.addEventListener("click", () => focusStable(activeChannel === "B" ? "B" : "A", "green panel tap", 0));
  panel.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      focusStable(activeChannel === "B" ? "B" : "A", "green panel key", 0);
    }
  });

  [scanA, scanB].forEach(field => {
    field.addEventListener("focus", updatePanel);
    field.addEventListener("blur", () => setTimeout(updatePanel, 0));
    field.addEventListener("input", () => setTimeout(updatePanel, 0), true);
  });

  const originalResetOperationV468 = resetOperation;
  resetOperation = function resetOperationStableV468(options) {
    originalResetOperationV468({ ...(options || {}), focus: false });
    scanA.value = "";
    scanB.value = "";
    activeChannel = "A";
    focusStable("A", "new scan", 250);
  };

  const originalApplyLanguageV468 = applyLanguage;
  applyLanguage = function applyLanguageStableV468() {
    originalApplyLanguageV468();
    updatePanel();
  };

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && operationCodes.size === 0) focusStable(activeChannel === "B" ? "B" : "A", "page visible", 250);
  });
  window.addEventListener("pageshow", () => {
    if (operationCodes.size === 0) focusStable("A", "pageshow", 250);
  });

  updatePanel();
  addTechnical("v4.6.8 loaded: one stable Wedge field; no automatic focus watchdog.");
  focusStable("A", "initial load", 350);
})();
