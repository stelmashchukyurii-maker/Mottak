"use strict";

// Camera Cloud v4.8 — protected server-side OCR.
// Only the unique lower number is recognized. 078500 is a hidden system constant.
(function installServerOcrV48() {
  const GEMINI_FUNCTION = "gemini-ocr";
  const OPENAI_FUNCTION = "clever-responder";
  const SYSTEM_UPPER = "078500";

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
      aiNote: "AI leser bare det unike 6-tegnsnummeret. Systemnummeret lagres automatisk og vises ikke.",
      geminiButton: "Les nummer med Gemini",
      openaiButton: "OpenAI reserve",
      geminiAnalyzing: "Gemini leser det unike nummeret…",
      openaiAnalyzing: "OpenAI leser det unike nummeret…",
      geminiRecognized: "Nummeret er lest. Kontroller eller korriger det før lagring.",
      openaiRecognized: "Nummeret er lest. Kontroller eller korriger det før lagring.",
      geminiInvalid: "Gemini kunne ikke lese nummeret sikkert. Skriv det inn manuelt.",
      openaiInvalid: "OpenAI kunne ikke lese nummeret sikkert. Skriv det inn manuelt.",
      geminiError: "Gemini kunne ikke fullføre. Bildet er beholdt.",
      openaiError: "OpenAI-reserven kunne ikke fullføre. Bildet er beholdt."
    },
    pl: {
      aiTitle: "2. Rozpoznawanie AI — chroniony serwer",
      aiNote: "AI odczytuje tylko unikalny 6-znakowy numer. Numer systemowy jest zapisywany automatycznie i pozostaje ukryty.",
      geminiButton: "Odczytaj numer przez Gemini",
      openaiButton: "Rezerwa OpenAI",
      geminiAnalyzing: "Gemini odczytuje unikalny numer…",
      openaiAnalyzing: "OpenAI odczytuje unikalny numer…",
      geminiRecognized: "Numer został odczytany. Sprawdź go przed zapisem.",
      openaiRecognized: "Numer został odczytany. Sprawdź go przed zapisem.",
      geminiInvalid: "Gemini nie odczytał numeru pewnie. Wpisz go ręcznie.",
      openaiInvalid: "OpenAI nie odczytał numeru pewnie. Wpisz go ręcznie.",
      geminiError: "Gemini nie zakończył rozpoznawania. Zdjęcie zostało zachowane.",
      openaiError: "Rezerwa OpenAI nie zakończyła rozpoznawania. Zdjęcie zostało zachowane."
    },
    uk: {
      aiTitle: "2. AI-розпізнавання — захищений сервер",
      aiNote: "AI читає лише унікальний 6-символьний номер. Системний номер записується автоматично й не показується.",
      geminiButton: "Розпізнати номер через Gemini",
      openaiButton: "Резерв OpenAI",
      geminiAnalyzing: "Gemini читає унікальний номер…",
      openaiAnalyzing: "OpenAI читає унікальний номер…",
      geminiRecognized: "Номер розпізнано. Перевірте або виправте його перед збереженням.",
      openaiRecognized: "Номер розпізнано. Перевірте або виправте його перед збереженням.",
      geminiInvalid: "Gemini не зміг надійно прочитати номер. Введіть його вручну.",
      openaiInvalid: "OpenAI не зміг надійно прочитати номер. Введіть його вручну.",
      geminiError: "Gemini не завершив розпізнавання. Фото збережено на екрані.",
      openaiError: "Резерв OpenAI не завершив розпізнавання. Фото збережено на екрані."
    }
  };

  const style = document.createElement("style");
  style.textContent = `
    .server-ai-note{margin:0;padding:11px 12px;border:1px solid rgba(117,183,255,.45);border-radius:11px;color:#d9edff;background:rgba(117,183,255,.08);line-height:1.45;font-size:13px}
    .openai-backup{color:#eafff6;background:#163c32;border:2px solid #48d597}
    .openai-backup:not(:disabled):hover{filter:brightness(1.08)}
    .ocr-actions-v48{grid-template-columns:repeat(3,1fr)}
    @media(max-width:760px){.ocr-actions-v48{grid-template-columns:1fr}}
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
  if (actions) actions.classList.add("ocr-actions-v48");

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
    if (version) version.innerHTML = "Kamera Cloud v4.8 ETT NUMMER<br>Oppdatert 06.08.2026 kl. 15:27";
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
    } catch (_) {}
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
        line1: SYSTEM_UPPER,
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
      show(`${isGemini ? copy().geminiError : copy().openaiError}\n${detail}`, "bad");
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

  openaiButton.addEventListener("click", () => recognizeWithServer("openai"));

  const originalRenderResult = renderResult;
  renderResult = function renderResultWithServerOcr() {
    originalRenderResult();
    const upper = document.getElementById("upperValue");
    if (upper) upper.value = SYSTEM_UPPER;
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
  console.info("Camera Cloud v4.8 single-number OCR is active.");
})();