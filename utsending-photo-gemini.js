"use strict";

(() => {
  const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
  const GEMINI_MODEL = "gemini-3.6-flash";
  const SESSION_KEY = "gemini_api_key";

  const $ = (id) => document.getElementById(id);
  const photoPanel = $("photoPanel");
  const photoInput = $("photoInput");
  const upperInput = $("upperInput");
  const lowerInput = $("lowerInput");

  if (!photoPanel || !photoInput || !upperInput || !lowerInput) return;

  const style = document.createElement("style");
  style.textContent = `
    .ut-gemini-box{margin-top:10px;padding:11px;border:1px solid rgba(244,196,48,.45);border-radius:12px;background:rgba(244,196,48,.06)}
    .ut-gemini-label{display:block;margin-bottom:6px;color:var(--muted);font-size:11px;font-weight:900}
    .ut-gemini-key-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px}
    .ut-gemini-key-row input{min-height:46px}
    .ut-gemini-key-row button{min-height:46px}
    .ut-gemini-note{margin-top:6px;color:var(--muted);font-size:10px;line-height:1.4}
    .ut-gemini-status{min-height:18px;margin-top:7px;color:var(--muted);font-size:11px;white-space:pre-wrap}
    .ut-gemini-status.ok{color:var(--ok)}
    .ut-gemini-status.bad{color:var(--bad)}
    .ut-gemini-status.warn{color:var(--warn)}
    @media(max-width:670px){.ut-gemini-key-row{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const box = document.createElement("div");
  box.className = "ut-gemini-box";
  box.innerHTML = `
    <label class="ut-gemini-label" for="utGeminiKey">Gemini API-nøkkel</label>
    <div class="ut-gemini-key-row">
      <input id="utGeminiKey" type="password" autocomplete="off" placeholder="Lim inn Gemini API-nøkkelen">
      <button class="btn primary" id="utRecognizeButton" type="button" disabled>Les av numrene</button>
    </div>
    <div class="ut-gemini-note">Nøkkelen lagres bare i denne nettleserfanen. Bildet brukes kun til å finne en eksisterende INN-post.</div>
    <div class="ut-gemini-status" id="utGeminiStatus"></div>
  `;
  photoPanel.appendChild(box);

  const keyInput = $("utGeminiKey");
  const recognizeButton = $("utRecognizeButton");
  const status = $("utGeminiStatus");
  let currentImage = null;
  let processing = false;

  keyInput.value = sessionStorage.getItem(SESSION_KEY) || "";
  keyInput.addEventListener("input", () => {
    sessionStorage.setItem(SESSION_KEY, keyInput.value.trim());
  });

  function setStatus(text, type = "") {
    status.textContent = text;
    status.className = `ut-gemini-status ${type}`.trim();
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
        reject(new Error("Bildet kunne ikke åpnes."));
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
    return { base64: dataUrl.split(",")[1], mimeType: "image/jpeg" };
  }

  function extractText(data) {
    if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
    const output = [];
    for (const step of data.steps || []) {
      for (const content of step.content || []) {
        if (content.type === "text" && typeof content.text === "string") output.push(content.text);
      }
    }
    return output.join("").trim();
  }

  const cleanUpper = (value) => String(value || "").replace(/[^0-9]/g, "").slice(0, 6);
  const cleanLower = (value) => String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

  photoInput.addEventListener("change", async () => {
    const file = photoInput.files?.[0];
    currentImage = null;
    recognizeButton.disabled = true;
    if (!file) return;
    setStatus("Forbereder bildet…");
    try {
      currentImage = await compress(file);
      recognizeButton.disabled = false;
      setStatus("Bildet er klart. Trykk «Les av numrene».", "ok");
    } catch (error) {
      setStatus(error.message || String(error), "bad");
    }
  });

  recognizeButton.addEventListener("click", async () => {
    if (processing) return;
    const key = keyInput.value.trim();
    if (!key) {
      setStatus("Lim inn Gemini API-nøkkelen først.", "bad");
      keyInput.focus();
      return;
    }
    if (!currentImage) {
      setStatus("Ta et bilde av etiketten først.", "bad");
      return;
    }

    processing = true;
    recognizeButton.disabled = true;
    setStatus("Gemini leser etiketten…");

    const prompt = "Find the small warehouse label in the photo. Read exactly the two printed lines immediately above the QR code. line1 must be exactly 6 digits. line2 must be exactly 6 uppercase A-Z or 0-9 characters. Ignore logos, all other text, and do not decode the QR code. Do not invent characters. Return only JSON.";
    const body = {
      model: GEMINI_MODEL,
      store: false,
      input: [
        { type: "text", text: prompt },
        { type: "image", data: currentImage.base64, mime_type: currentImage.mimeType }
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: {
          type: "object",
          properties: {
            line1: { type: "string" },
            line2: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 }
          },
          required: ["line1", "line2", "confidence"],
          additionalProperties: false
        }
      },
      generation_config: { max_output_tokens: 120, thinking_level: "minimal" }
    };

    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(body)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error?.message || `HTTP ${response.status}`);

      const parsed = JSON.parse(extractText(data));
      const upper = cleanUpper(parsed.line1);
      const lower = cleanLower(parsed.line2);
      const confidence = Number(parsed.confidence);

      upperInput.value = upper;
      lowerInput.value = lower;
      upperInput.dispatchEvent(new Event("input", { bubbles: true }));
      lowerInput.dispatchEvent(new Event("input", { bubbles: true }));

      if (/^\d{6}$/.test(upper) && /^[A-Z0-9]{6}$/.test(lower)) {
        const percent = Number.isFinite(confidence) ? ` · sikkerhet ${Math.round(confidence * 100)} %` : "";
        setStatus(`Numrene er fylt inn${percent}. Kontroller dem før reservasjon.`, "ok");
      } else {
        setStatus("Gemini kunne ikke lese begge numrene sikkert. Korriger feltene manuelt.", "warn");
      }
    } catch (error) {
      setStatus(`Kunne ikke lese etiketten.\n${error.message || error}`, "bad");
    } finally {
      processing = false;
      recognizeButton.disabled = !currentImage;
    }
  });
})();
