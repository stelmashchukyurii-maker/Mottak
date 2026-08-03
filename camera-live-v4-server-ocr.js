"use strict";

// Camera Cloud v4.5 — protected server-side OCR.
// Gemini is the primary recognizer. OpenAI remains a separate reserve button.
(function installServerOcrV45() {
  const GEMINI_FUNCTION = "gemini-ocr";
  const OPENAI_FUNCTION = "clever-responder";

  const recognizeButton = document.getElementById("recognizeButton");
  const newPhotoButton = document.getElementById("newPhotoButton");
  const apiKeyField = document.getElementById("apiKey");
  const version = document.querySelector(".version");

  if (!recognizeButton || !newPhotoButton || !apiKeyField) return;
  if (document.getElementById("openaiBackupButton")) return;

  const keyCard = apiKeyField.closest(".card");
  const keyHeading = keyCard?.querySelector("h2");
  const keyNote = keyCard?.querySelector(".note");

  const COPY = {
    nb: {
      aiTitle: "2. AI-gjenkjenning — beskyttet server",
      aiNote: "Gemini er hovedmotoren. OpenAI er reserve. Begge nøklene ligger beskyttet i Supabase og skal ikke skrives inn på telefonen.",
      geminiButton: "Les med Gemini",
      openaiButton: "OpenAI reserve",
      geminiAnalyzing: "Gemini analyserer etiketten…",
      openaiAnalyzing: "OpenAI analyserer etiketten…",
      geminiRecognized: "Gemini har lest numrene. Kontroller eller korriger dem før lagring.",
      openaiRecognized: "OpenAI har lest numrene. Kontroller eller korriger dem før lagring.",
      geminiInvalid: "Gemini kunne ikke lese begge numrene sikkert. Bildet beholdes, og numrene kan skrives inn manuelt.",
      openaiInvalid: "OpenAI kunne ikke lese begge numrene sikkert. Bildet beholdes, og numrene kan skrives inn manuelt.",
      geminiError: "Gemini kunne ikke fullføre. Bildet og eventuelle innskrevne numre er beholdt.",
      openaiError: "OpenAI-reserven kunne ikke fullføre. Bildet og eventuelle innskrevne numre er beholdt."
    },
    pl: {
      aiTitle: "2. Rozpoznawanie AI — chroniony serwer",
      aiNote: "Gemini jest głównym silnikiem, a OpenAI rezerwą. Oba klucze są chronione w Supabase i nie wpisuje się ich w telefonie.",
      geminiButton: "Rozpoznaj przez Gemini",
      openaiButton: "Rezerwa OpenAI",
      geminiAnalyzing: "Gemini analizuje etykietę…",
      openaiAnalyzing: "OpenAI analizuje etykietę…",
      geminiRecognized: "Gemini odczytał numery. Sprawdź lub popraw je przed zapisem.",
      openaiRecognized: "OpenAI odczytał numery. Sprawdź lub popraw je przed zapisem.",
      geminiInvalid: "Gemini nie odczytał pewnie obu numerów. Zdjęcie pozostaje, a numery można wpisać ręcznie.",
      openaiInvalid: "OpenAI nie odczytał pewnie obu numerów. Zdjęcie pozostaje, a numery można wpisać ręcznie.",
      geminiError: "Gemini nie zakończył rozpoznawania. Zdjęcie i wpisane numery zostały zachowane.",
      openaiError: "Rezerwa OpenAI nie zakończyła rozpoznawania. Zdjęcie i wpisane numery zostały zachowane."
    },
    uk: {
      aiTitle: "2. AI-розпізнавання — захищений сервер",
      aiNote: "Gemini — основне розпізнавання, OpenAI — резерв. Обидва ключі захищені в Supabase, вводити їх на телефоні не потрібно.",
      geminiButton: "Розпізнати через Gemini",
      openaiButton: "Резерв OpenAI",
      geminiAnalyzing: "Gemini аналізує бірку…",
      openaiAnalyzing: "OpenAI аналізує бірку…",
      geminiRecognized: "Gemini прочитав номери. Перевірте або виправте їх перед збереженням.",
      openaiRecognized: "OpenAI прочитав номери. Перевірте або виправте їх перед збереженням.",
      geminiInvalid: "Gemini не зміг надійно прочитати обидва номери. Фото залишено на екрані, номери можна ввести вручну.",
      openaiInvalid: "OpenAI не зміг надійно прочитати обидва номери. Фото залишено на екрані, номери можна ввести вручну.",
      geminiError: "Gemini не завершив розпізнавання. Фото та вже введені номери не втрачено.",
      openaiError: "Резерв OpenAI не завершив розпізнавання. Фото та вже введені номери не втрачено."
    }
  };

  const style = document.createElement("style");
  style.textContent = `
    .server-ai-note {
      margin:0;
      padding:11px 12px;
      border:1px solid rgba(117,183,255,.45);
      border-radius:11px;
      color:#d9edff;
      background:rgba(117,183,255,.08);
      line-height:1.45;
      font-size:13px;
    }
    .openai-backup {
      color:#eafff6;
      background:#163c32;
      border:2px solid #48d597;
    }
    .openai-backup:not(:disabled):hover { filter:brightness(1.08); }
    .ocr-actions-v45 { grid-template-columns:repeat(3,1fr); }
    @media(max-width:760px) {
      .ocr-actions-v45 { grid-template-columns:1fr; }
    }
  `;
  document.head.appendChild(style);

  sessionStorage.removeItem("gemini_api_key");
  apiKeyField.value = "";
  apiKeyField.disabled = true;
  apiKeyField.hidden = true;
  apiKeyField.removeAttribute("data-placeholder");

  if (keyHeading) keyHeading.removeAttribute("data-t");
  if (keyNote) {
    keyNote.removeAttribute("data-t");
    keyNote.className = "server-ai-note";
  }

  recognizeButton.removeAttribute("data-t");

  const actions = recognizeButton.closest(".actions");
  if (actions) actions.classList.add("ocr-actions-v45");

  const openaiButton = document.createElement("button");
  openaiButton.type = "button";
  openaiButton.id = "openaiBackupButton";
  openaiButton.className = "openai-backup";
  openaiButton.disabled = true;
  recognizeButton.insertAdjacentElement("afterend", openaiButton);

  function copy() {
    return COPY[typeof language === "string" ? language : "nb"] || COPY.nb;
  }

  function updateText() {
    if (keyHeading) keyHeading.textContent = copy().aiTitle;
    if (keyNote) keyNote.textContent = copy().aiNote;
    recognizeButton.textContent = copy().geminiButton;
    openaiButton.textContent = copy().openaiButton;
    if (version) {
      version.innerHTML = "Kamera Cloud v4.5<br />Oppdatert 03.08.2026 kl. 22:47";
    }
  }

  function syncButtons() {
    const disabled = !imageData || busy;
    recognizeButton.disabled = disabled;
    openaiButton.disabled = disabled;
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

  async function recognizeWithServer(provider) {
    if (!imageData || busy) return;

    const isGemini = provider === "gemini";
    const functionName = isGemini ? GEMINI_FUNCTION : OPENAI_FUNCTION;
    const previousResult = result ? { ...result } : null;

    busy = true;
    window.cameraOcrProvider = provider;
    renderResult();
    syncButtons();
    show(isGemini ? copy().geminiAnalyzing : copy().openaiAnalyzing);

    try {
      const response = await client.functions.invoke(functionName, {
        body: { image: imageData.dataUrl }
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      result = validate({
        line1: response.data?.upper_number,
        line2: response.data?.lower_number,
        confidence: response.data?.confidence
      });

      show(
        result.valid
          ? (isGemini ? copy().geminiRecognized : copy().openaiRecognized)
          : (isGemini ? copy().geminiInvalid : copy().openaiInvalid),
        result.valid ? "ok" : "warn"
      );
    } catch (error) {
      result = previousResult;
      const detail = await extractFunctionError(error);
      show(
        `${isGemini ? copy().geminiError : copy().openaiError}\n${detail}`,
        "bad"
      );
    } finally {
      busy = false;
      renderResult();
      syncButtons();
    }
  }

  recognizeButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    recognizeWithServer("gemini");
  }, true);

  openaiButton.addEventListener("click", () => {
    recognizeWithServer("openai");
  });

  const originalRenderResult = renderResult;
  renderResult = function renderResultWithServerOcr() {
    originalRenderResult();
    syncButtons();
  };

  const originalApplyLanguage = applyLanguage;
  applyLanguage = function applyLanguageWithServerOcr() {
    originalApplyLanguage();
    updateText();
    syncButtons();
  };

  updateText();
  syncButtons();

  console.info("Camera Cloud v4.5 protected Gemini and OpenAI OCR are active.");
})();