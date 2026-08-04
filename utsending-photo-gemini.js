"use strict";

(() => {
  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const GEMINI_FUNCTION = "gemini-ocr";
  const OPENAI_FUNCTION = "clever-responder";

  const $ = (id) => document.getElementById(id);
  const photoPanel = $("photoPanel");
  const photoInput = $("photoInput");
  const photoPreview = $("photoPreview");
  const upperInput = $("upperInput");
  const lowerInput = $("lowerInput");

  if (!photoPanel || !photoInput || !upperInput || !lowerInput) return;
  if ($("utServerOcrBox")) return;

  const style = document.createElement("style");
  style.textContent = `
    .ut-server-ocr{margin:0 0 10px;padding:11px;border:1px solid rgba(117,183,255,.48);border-radius:12px;background:rgba(117,183,255,.08)}
    .ut-server-ocr strong{display:block;color:#d9edff;font-size:14px}
    .ut-server-ocr p{margin:6px 0 0;color:var(--muted);font-size:11px;line-height:1.45}
    .ut-ocr-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px}
    .ut-ocr-actions button{min-height:48px}
    .ut-openai{color:#eafff6;background:#163c32;border:2px solid #48d597}
    .ut-ocr-status{min-height:20px;margin-top:8px;color:var(--muted);font-size:11px;line-height:1.45;white-space:pre-wrap;text-align:center}
    .ut-ocr-status.ok{color:var(--ok)}
    .ut-ocr-status.bad{color:var(--bad)}
    .ut-ocr-status.warn{color:var(--warn)}
    @media(max-width:670px){.ut-ocr-actions{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const info = document.createElement("div");
  info.id = "utServerOcrBox";
  info.className = "ut-server-ocr";
  info.innerHTML = `
    <strong>AI-розпізнавання — захищений сервер</strong>
    <p>Gemini — основний розпізнавач, OpenAI — резерв. Ключі захищені в Supabase, вводити їх на телефоні не потрібно.</p>
  `;
  photoPanel.insertBefore(info, photoPanel.firstChild);

  const controls = document.createElement("div");
  controls.innerHTML = `
    <div class="ut-ocr-actions">
      <button class="btn primary" id="utGeminiOcrButton" type="button" disabled>Розпізнати через Gemini</button>
      <button class="btn ut-openai" id="utOpenAiOcrButton" type="button" disabled>Резерв OpenAI</button>
      <button class="btn secondary" id="utNewPhotoButton" type="button" disabled>Нове фото</button>
    </div>
    <div class="ut-ocr-status" id="utOcrStatus"></div>
  `;
  photoPanel.appendChild(controls);

  const geminiButton = $("utGeminiOcrButton");
  const openAiButton = $("utOpenAiOcrButton");
  const newPhotoButton = $("utNewPhotoButton");
  const status = $("utOcrStatus");

  let currentImage = null;
  let processing = false;

  function setStatus(text, type = "") {
    status.textContent = text;
    status.className = `ut-ocr-status ${type}`.trim();
  }

  function syncButtons() {
    const disabled = !currentImage || processing;
    geminiButton.disabled = disabled;
    openAiButton.disabled = disabled;
    newPhotoButton.disabled = !currentImage || processing;
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Не вдалося відкрити фотографію."));
      };
      image.src = url;
    });
  }

  async function compress(file) {
    const image = await loadImage(file);
    const max = 1600;
    const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    return { dataUrl };
  }

  const cleanUpper = (value) => String(value || "").replace(/[^0-9]/g, "").slice(0, 6);
  const cleanLower = (value) => String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

  async function invokeFunction(functionName, image) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ image })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || data?.message || `HTTP ${response.status}`);
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async function recognize(provider) {
    if (!currentImage || processing) return;

    const isGemini = provider === "gemini";
    const functionName = isGemini ? GEMINI_FUNCTION : OPENAI_FUNCTION;
    processing = true;
    syncButtons();
    setStatus(isGemini ? "Gemini аналізує бірку…" : "OpenAI аналізує бірку…");

    try {
      const data = await invokeFunction(functionName, currentImage.dataUrl);
      const upper = cleanUpper(data?.upper_number);
      const lower = cleanLower(data?.lower_number);
      const confidence = Number(data?.confidence);

      upperInput.value = upper;
      lowerInput.value = lower;
      upperInput.dispatchEvent(new Event("input", { bubbles: true }));
      lowerInput.dispatchEvent(new Event("input", { bubbles: true }));

      if (/^\d{6}$/.test(upper) && /^[A-Z0-9]{6}$/.test(lower)) {
        const confidenceText = Number.isFinite(confidence)
          ? ` · впевненість ${Math.round(confidence * 100)} %`
          : "";
        setStatus(
          `${isGemini ? "Gemini" : "OpenAI"} заповнив обидва номери${confidenceText}. Перевірте їх і натисніть «Знайти та зарезервувати».`,
          "ok"
        );
      } else {
        setStatus(
          `${isGemini ? "Gemini" : "OpenAI"} не зміг надійно прочитати обидва номери. Виправте поля вручну або використайте інший розпізнавач.`,
          "warn"
        );
      }
    } catch (error) {
      setStatus(
        `${isGemini ? "Gemini" : "Резерв OpenAI"} не завершив розпізнавання. Фото та вже введені номери збережено.\n${error.message || error}`,
        "bad"
      );
    } finally {
      processing = false;
      syncButtons();
    }
  }

  function resetPhoto() {
    currentImage = null;
    photoInput.value = "";
    if (photoPreview) {
      photoPreview.removeAttribute("src");
      photoPreview.classList.add("hidden");
    }
    upperInput.value = "";
    lowerInput.value = "";
    setStatus("Зробіть нову фотографію бірки.");
    syncButtons();
  }

  photoInput.addEventListener("change", async () => {
    const file = photoInput.files?.[0];
    currentImage = null;
    syncButtons();
    if (!file) return;

    setStatus("Готуємо фотографію…");
    try {
      currentImage = await compress(file);
      syncButtons();
      setStatus("Фотографія готова. Натисніть «Розпізнати через Gemini». Застосуйте OpenAI лише як резерв.", "ok");
    } catch (error) {
      setStatus(error.message || String(error), "bad");
    }
  });

  geminiButton.addEventListener("click", () => recognize("gemini"));
  openAiButton.addEventListener("click", () => recognize("openai"));
  newPhotoButton.addEventListener("click", resetPhoto);

  sessionStorage.removeItem("gemini_api_key");
  syncButtons();
})();
