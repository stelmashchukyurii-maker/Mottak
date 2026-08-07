(() => {
  "use strict";

  const STYLE_ID = "bama-mobile-camera-ui-style";
  const AI_KEY = "bama_camera_floating_ai_v1";
  const PANEL_ID = "bama-floating-camera";
  const STATUS_ID = "bama-floating-workflow-status";

  let selectedAi = localStorage.getItem(AI_KEY) === "openai" ? "openai" : "gemini";
  let dismissedDuplicateKey = "";
  let originalRecognizeClick = null;

  const COPY = {
    nb: { ai: "AI", gemini: "Gemini", openai: "OpenAI", back: "← Tilbake", close: "Lukk", closeLabel: "Lukk varsel", duplicateHint: "Denne etiketten finnes allerede. Velg hva du vil gjøre." },
    pl: { ai: "AI", gemini: "Gemini", openai: "OpenAI", back: "← Wróć", close: "Zamknij", closeLabel: "Zamknij ostrzeżenie", duplicateHint: "Ta etykieta już istnieje. Wybierz, co chcesz zrobić." },
    uk: { ai: "AI", gemini: "Gemini", openai: "OpenAI", back: "← Назад", close: "Закрити", closeLabel: "Закрити попередження", duplicateHint: "Така бірка вже існує. Виберіть, що робити далі." }
  };

  function lang() {
    try {
      return COPY[language] ? language : "nb";
    } catch (_) {
      return "nb";
    }
  }

  function t() {
    return COPY[lang()] || COPY.nb;
  }

  function currentCodeKey() {
    const upper = String(document.getElementById("upperValue")?.value || "").replace(/\D/g, "").slice(0, 6);
    const lower = String(document.getElementById("lowerValue")?.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    return `${upper}|${lower}`;
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      main.app > h1 + .subtitle {
        display: none !important;
      }

      #${PANEL_ID} .bama-floating-bar {
        grid-template-columns: auto auto minmax(118px, auto) auto !important;
      }

      #${PANEL_ID} .bama-ai-picker {
        display: grid;
        grid-template-rows: auto 1fr;
        min-width: 108px;
        min-height: 58px;
        padding: 4px;
        gap: 3px;
        border: 1px solid #303b59;
        border-radius: 12px;
        background: #10182b;
        pointer-events: auto;
      }

      #${PANEL_ID} .bama-ai-title {
        color: #aab4ce;
        font-size: 9px;
        font-weight: 900;
        line-height: 1;
        text-align: center;
        letter-spacing: .08em;
      }

      #${PANEL_ID} .bama-ai-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3px;
      }

      #${PANEL_ID} .bama-ai-choice {
        min-width: 0;
        min-height: 36px;
        padding: 4px 5px;
        border: 1px solid #303b59;
        border-radius: 8px;
        background: #151c30;
        color: #dbe4f7;
        font-size: 10px;
        font-weight: 900;
        line-height: 1;
        cursor: pointer;
      }

      #${PANEL_ID} .bama-ai-choice.active {
        border-color: #48d597;
        background: #164534;
        color: #ffffff;
        box-shadow: 0 0 0 2px rgba(72,213,151,.14);
      }

      #${PANEL_ID} .bama-workflow-status {
        position: relative;
      }

      #${PANEL_ID} .bama-duplicate-close-x {
        position: absolute;
        top: 5px;
        right: 6px;
        width: 32px;
        min-height: 32px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: #ff9aa4;
        font-size: 24px;
        font-weight: 900;
        line-height: 1;
        cursor: pointer;
      }

      #${PANEL_ID} .bama-duplicate-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 7px;
        margin-top: 9px;
      }

      #${PANEL_ID} .bama-duplicate-actions[hidden] {
        display: none;
      }

      #${PANEL_ID} .bama-duplicate-action {
        min-height: 42px;
        padding: 8px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 900;
        cursor: pointer;
      }

      #${PANEL_ID} .bama-duplicate-back {
        border: 1px solid #64748b;
        background: #151c30;
        color: #f5f7ff;
      }

      #${PANEL_ID} .bama-duplicate-close {
        border: 1px solid #ff7373;
        background: rgba(255,115,115,.15);
        color: #ffd9dd;
      }

      #${PANEL_ID}.collapsed .bama-ai-picker {
        display: none;
      }

      #${PANEL_ID}.collapsed .bama-floating-bar {
        grid-template-columns: auto auto auto !important;
      }

      @media (max-width: 430px) {
        #${PANEL_ID} .bama-floating-bar {
          grid-template-columns: auto 92px minmax(108px, auto) auto !important;
          gap: 5px !important;
          padding: 5px !important;
        }

        #${PANEL_ID} .bama-ai-picker {
          min-width: 92px;
        }

        #${PANEL_ID} .bama-ai-choice {
          padding-inline: 3px;
          font-size: 9px;
        }

        #${PANEL_ID} .bama-photo-button {
          padding-inline: 10px !important;
          font-size: 17px !important;
        }
      }

      @media (max-width: 360px) {
        #${PANEL_ID} .bama-floating-bar {
          grid-template-columns: auto 78px minmax(94px, auto) auto !important;
        }

        #${PANEL_ID} .bama-ai-picker {
          min-width: 78px;
        }

        #${PANEL_ID} .bama-ai-choice {
          font-size: 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function setAi(value) {
    selectedAi = value === "openai" ? "openai" : "gemini";
    localStorage.setItem(AI_KEY, selectedAi);
    document.querySelectorAll(`#${PANEL_ID} [data-ai-provider]`).forEach(button => {
      const active = button.dataset.aiProvider === selectedAi;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function installAiPicker(panel) {
    if (panel.querySelector(".bama-ai-picker")) return;

    const bar = panel.querySelector(".bama-floating-bar");
    const photoButton = panel.querySelector(".bama-photo-button");
    if (!bar || !photoButton) return;

    const picker = document.createElement("div");
    picker.className = "bama-ai-picker";
    picker.innerHTML = `
      <div class="bama-ai-title">AI</div>
      <div class="bama-ai-buttons">
        <button class="bama-ai-choice" type="button" data-ai-provider="gemini">Gemini</button>
        <button class="bama-ai-choice" type="button" data-ai-provider="openai">OpenAI</button>
      </div>
    `;
    bar.insertBefore(picker, photoButton);

    picker.addEventListener("click", event => {
      const button = event.target.closest("[data-ai-provider]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      setAi(button.dataset.aiProvider);
      if (navigator.vibrate) navigator.vibrate(18);
    });

    setAi(selectedAi);
  }

  function installAiRouting() {
    const recognizeButton = document.getElementById("recognizeButton");
    const openaiButton = document.getElementById("openaiBackupButton");
    if (!recognizeButton || !openaiButton || originalRecognizeClick) return Boolean(recognizeButton && openaiButton);

    originalRecognizeClick = recognizeButton.click.bind(recognizeButton);
    recognizeButton.click = function routedRecognizeClick() {
      if (selectedAi === "openai" && !openaiButton.disabled) {
        openaiButton.click();
        return;
      }
      originalRecognizeClick();
    };
    return true;
  }

  function resetToNewPhoto() {
    dismissedDuplicateKey = "";
    const newPhotoButton = document.getElementById("newPhotoButton");
    if (newPhotoButton && !newPhotoButton.disabled) {
      newPhotoButton.click();
      return;
    }
    try {
      if (typeof resetPhoto === "function") resetPhoto();
    } catch (_) {}
  }

  function installDuplicateActions(status) {
    if (status.querySelector(".bama-duplicate-actions")) return;

    const closeX = document.createElement("button");
    closeX.type = "button";
    closeX.className = "bama-duplicate-close-x";
    closeX.textContent = "×";
    closeX.hidden = true;

    const actions = document.createElement("div");
    actions.className = "bama-duplicate-actions";
    actions.hidden = true;
    actions.innerHTML = `
      <button type="button" class="bama-duplicate-action bama-duplicate-back"></button>
      <button type="button" class="bama-duplicate-action bama-duplicate-close"></button>
    `;

    status.append(closeX, actions);

    const back = actions.querySelector(".bama-duplicate-back");
    const close = actions.querySelector(".bama-duplicate-close");

    const dismiss = () => {
      dismissedDuplicateKey = currentCodeKey();
      status.hidden = true;
    };

    closeX.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      dismiss();
    });

    close.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      dismiss();
    });

    back.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      resetToNewPhoto();
    });
  }

  function syncDuplicateUi(status) {
    if (!status) return;
    installDuplicateActions(status);

    const isDuplicate = status.classList.contains("warn") && !status.hidden;
    const closeX = status.querySelector(".bama-duplicate-close-x");
    const actions = status.querySelector(".bama-duplicate-actions");
    const back = status.querySelector(".bama-duplicate-back");
    const close = status.querySelector(".bama-duplicate-close");
    const detail = status.querySelector("span");

    if (back) back.textContent = t().back;
    if (close) close.textContent = t().close;
    if (closeX) closeX.setAttribute("aria-label", t().closeLabel);

    if (closeX) closeX.hidden = !isDuplicate;
    if (actions) actions.hidden = !isDuplicate;

    if (isDuplicate && detail && !detail.dataset.bamaDuplicateHint) {
      detail.dataset.bamaDuplicateHint = "1";
      detail.dataset.originalText = detail.textContent || "";
      detail.textContent = `${detail.textContent || ""}${detail.textContent ? "\n" : ""}${t().duplicateHint}`;
      detail.style.whiteSpace = "pre-line";
    }

    if (!isDuplicate && detail?.dataset.bamaDuplicateHint) {
      detail.textContent = detail.dataset.originalText || detail.textContent;
      delete detail.dataset.bamaDuplicateHint;
      delete detail.dataset.originalText;
    }

    if (isDuplicate && dismissedDuplicateKey && dismissedDuplicateKey === currentCodeKey()) {
      status.hidden = true;
    }
  }

  function start(attempt = 0) {
    const panel = document.getElementById(PANEL_ID);
    const status = document.getElementById(STATUS_ID);

    if (!panel || !status || !document.getElementById("openaiBackupButton")) {
      if (attempt < 60) setTimeout(() => start(attempt + 1), 150);
      return;
    }

    if (document.getElementById(STYLE_ID)) return;

    addStyles();
    installAiPicker(panel);
    installAiRouting();
    installDuplicateActions(status);
    syncDuplicateUi(status);

    const observer = new MutationObserver(() => syncDuplicateUi(status));
    observer.observe(status, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "hidden"]
    });

    [document.getElementById("upperValue"), document.getElementById("lowerValue")].filter(Boolean).forEach(input => {
      input.addEventListener("input", () => {
        if (currentCodeKey() !== dismissedDuplicateKey) dismissedDuplicateKey = "";
      });
    });

    const languageContainer = document.getElementById("languages");
    languageContainer?.addEventListener("click", () => setTimeout(() => syncDuplicateUi(status), 50));

    console.info("Camera Cloud mobile UI optimizer is active.");
  }

  start();
})();
