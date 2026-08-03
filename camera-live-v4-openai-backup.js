"use strict";

// Camera Cloud v4.4 — OpenAI OCR backup.
// Keeps Gemini unchanged and adds a separate server-side OpenAI button.
(function installOpenAIBackup() {
  const FUNCTION_NAME = "clever-responder";
  const recognizeButton = document.getElementById("recognizeButton");
  const newPhotoButton = document.getElementById("newPhotoButton");
  const apiKeyField = document.getElementById("apiKey");
  const version = document.querySelector(".version");

  if (!recognizeButton || !newPhotoButton || !apiKeyField) return;
  if (document.getElementById("openaiBackupButton")) return;

  const COPY = {
    nb: {
      button: "OpenAI reserve",
      note: "OpenAI-reserven bruker en beskyttet servernøkkel. Ingen OpenAI-nøkkel skal limes inn her.",
      analyzing: "OpenAI analyserer etiketten…",
      recognized: "OpenAI har lest numrene. Kontroller eller korriger dem før lagring.",
      invalid: "OpenAI kunne ikke lese begge numrene sikkert. Bildet beholdes, og numrene kan skrives inn manuelt.",
      error: "OpenAI-reserven kunne ikke fullføre. Bildet og eventuelle innskrevne numre er beholdt."
    },
    pl: {
      button: "Rezerwa OpenAI",
      note: "Rezerwa OpenAI używa chronionego klucza na serwerze. Nie wklejaj tutaj klucza OpenAI.",
      analyzing: "OpenAI analizuje etykietę…",
      recognized: "OpenAI odczytał numery. Sprawdź lub popraw je przed zapisem.",
      invalid: "OpenAI nie odczytał pewnie obu numerów. Zdjęcie pozostaje, a numery można wpisać ręcznie.",
      error: "Rezerwa OpenAI nie zakończyła pracy. Zdjęcie i wpisane numery zostały zachowane."
    },
    uk: {
      button: "Резерв OpenAI",
      note: "Резерв OpenAI використовує захищений ключ на сервері. Ключ OpenAI сюди вставляти не потрібно.",
      analyzing: "OpenAI аналізує бірку…",
      recognized: "OpenAI прочитав номери. Перевірте або виправте їх перед збереженням.",
      invalid: "OpenAI не зміг надійно прочитати обидва номери. Фото збережено на екрані, номери можна ввести вручну.",
      error: "Резерв OpenAI не завершив розпізнавання. Фото та вже введені номери не втрачено."
    }
  };

  const style = document.createElement("style");
  style.textContent = `
    .openai-backup {
      color:#eafff6;
      background:#163c32;
      border:2px solid #48d597;
    }
    .openai-backup:not(:disabled):hover { filter:brightness(1.08); }
    .openai-server-note {
      margin:10px 0 0;
      padding:10px 12px;
      border:1px solid rgba(72,213,151,.45);
      border-radius:11px;
      color:#bff5de;
      background:rgba(72,213,151,.07);
      line-height:1.4;
      font-size:13px;
    }
    .ocr-actions-v44 { grid-template-columns:repeat(3,1fr); }
    @media(max-width:760px) {
      .ocr-actions-v44 { grid-template-columns:1fr; }
    }
  `;
  document.head.appendChild(style);

  const actions = recognizeButton.closest(".actions");
  if (actions) actions.classList.add("ocr-actions-v44");

  const openaiButton = document.createElement("button");
  openaiButton.type = "button";
  openaiButton.id = "openaiBackupButton";
  openaiButton.className = "openai-backup";
  openaiButton.disabled = true;
  recognizeButton.insertAdjacentElement("afterend", openaiButton);

  const note = document.createElement("p");
  note.id = "openaiServerNote";
  note.className = "openai-server-note";
  apiKeyField.closest(".card")?.appendChild(note);

  function copy() {
    return COPY[typeof language === "string" ? language : "nb"] || COPY.nb;
  }

  function updateText() {
    openaiButton.textContent = copy().button;
    note.textContent = copy().note;
    if (version) {
      version.innerHTML = "Kamera Cloud v4.4<br />Oppdatert 03.08.2026 kl. 22:05";
    }
  }

  function syncButton() {
    openaiButton.disabled = !imageData || busy;
  }

  async function extractFunctionError(error) {
    let message = error?.message || String(error || "Unknown error");
    try {
      const response = error?.context;
      if (response && typeof response.clone === "function") {
        const payload = await response.clone().json();
        if (payload?.error) message = payload.error;
      }
    } catch (_) {
      // Keep the original error message.
    }
    return message;
  }

  async function recognizeWithOpenAI() {
    if (!imageData || busy) return;

    const previousResult = result ? { ...result } : null;
    busy = true;
    window.cameraOcrProvider = "openai";
    renderResult();
    syncButton();
    show(copy().analyzing);

    try {
      const response = await client.functions.invoke(FUNCTION_NAME, {
        body: { image: imageData.dataUrl }
      });

      if (response.error) {
        throw response.error;
      }
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      result = validate({
        line1: response.data?.upper_number,
        line2: response.data?.lower_number,
        confidence: response.data?.confidence
      });

      show(
        result.valid ? copy().recognized : copy().invalid,
        result.valid ? "ok" : "warn"
      );
    } catch (error) {
      result = previousResult;
      const detail = await extractFunctionError(error);
      show(`${copy().error}\n${detail}`, "bad");
    } finally {
      busy = false;
      renderResult();
      syncButton();
    }
  }

  openaiButton.addEventListener("click", recognizeWithOpenAI);

  const originalRenderResult = renderResult;
  renderResult = function renderResultWithOpenAIBackup() {
    originalRenderResult();
    syncButton();
  };

  const originalApplyLanguage = applyLanguage;
  applyLanguage = function applyLanguageWithOpenAIBackup() {
    originalApplyLanguage();
    updateText();
    syncButton();
  };

  updateText();
  syncButton();

  console.info("Camera Cloud v4.4 OpenAI OCR backup is active.");
})();