"use strict";

(() => {
  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const GEMINI_FUNCTION = "gemini-ocr";
  const OPENAI_FUNCTION = "clever-responder";

  const photoPanel = document.getElementById("photoPanel");
  const photoInput = document.getElementById("photoInput");
  const lowerInput = document.getElementById("lowerInput");
  const findButton = document.getElementById("findButton");
  if (!photoPanel || !photoInput || !lowerInput || !findButton || document.getElementById("utCameraAiBox")) return;

  const style = document.createElement("style");
  style.textContent = `
    .ut-camera-ai{margin-top:11px;padding:12px;border:1px solid rgba(117,183,255,.5);border-radius:14px;background:rgba(117,183,255,.07)}
    .ut-camera-ai-title{font-weight:950;color:#d9ecff;text-align:center}
    .ut-camera-ai-note{margin-top:5px;color:var(--muted);font-size:10px;line-height:1.4;text-align:center}
    .ut-camera-ai-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
    .ut-camera-ai-actions button{min-height:56px;border:0;border-radius:12px;font-weight:950;font-size:17px;cursor:pointer}
    .ut-camera-ai-actions button:disabled{opacity:.42;cursor:not-allowed}
    .ut-camera-gemini{background:var(--accent);color:#17130a}
    .ut-camera-openai{background:#163c32;color:#eafff6;border:2px solid var(--ok)!important}
    .ut-camera-ai-status{min-height:20px;margin-top:8px;color:var(--muted);font-size:11px;line-height:1.45;text-align:center;white-space:pre-wrap}
    .ut-camera-ai-status.ok{color:var(--ok)}.ut-camera-ai-status.warn{color:var(--warn)}.ut-camera-ai-status.bad{color:var(--bad)}
    @media(max-width:520px){.ut-camera-ai-actions{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const box = document.createElement("div");
  box.id = "utCameraAiBox";
  box.className = "ut-camera-ai";
  box.innerHTML = `
    <div class="ut-camera-ai-title">AI — захищене розпізнавання</div>
    <div class="ut-camera-ai-note">Gemini основний · OpenAI резерв. API-ключі зберігаються на сервері.</div>
    <div class="ut-camera-ai-actions">
      <button id="utCameraGemini" class="ut-camera-gemini" type="button" disabled>✨ Gemini</button>
      <button id="utCameraOpenAI" class="ut-camera-openai" type="button" disabled>OpenAI резерв</button>
    </div>
    <div id="utCameraAiStatus" class="ut-camera-ai-status"></div>`;
  photoPanel.appendChild(box);

  const gemini = document.getElementById("utCameraGemini");
  const openai = document.getElementById("utCameraOpenAI");
  const status = document.getElementById("utCameraAiStatus");
  let imageData = "";
  let busy = false;

  function setStatus(text, type="") {
    status.textContent = text;
    status.className = `ut-camera-ai-status ${type}`.trim();
  }

  function sync() {
    const disabled = !imageData || busy;
    gemini.disabled = disabled;
    openai.disabled = disabled;
  }

  function loadImage(file) {
    return new Promise((resolve,reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Не вдалося відкрити фото.")); };
      img.src = url;
    });
  }

  async function toDataUrl(file) {
    const img = await loadImage(file);
    const max = 1600;
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d", {alpha:false});
    ctx.fillStyle = "#fff"; ctx.fillRect(0,0,w,h); ctx.drawImage(img,0,0,w,h);
    return canvas.toDataURL("image/jpeg", .84);
  }

  async function invoke(fn) {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
      method:"POST",
      headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({image:imageData})
    });
    const data = await r.json().catch(()=>({}));
    if (!r.ok || data?.error) throw new Error(data?.error || data?.message || `HTTP ${r.status}`);
    return data;
  }

  function cleanLower(v) {
    return String(v||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
  }

  async function recognize(provider) {
    if (!imageData || busy) return;
    busy = true; sync();
    const isGemini = provider === "gemini";
    setStatus(isGemini ? "Gemini читає бірку…" : "OpenAI читає бірку…");
    try {
      const data = await invoke(isGemini ? GEMINI_FUNCTION : OPENAI_FUNCTION);
      const lower = cleanLower(data?.lower_number);
      const confidence = Number(data?.confidence);
      if (!/^[A-Z0-9]{6}$/.test(lower)) {
        throw new Error("AI не зміг надійно прочитати нижній номер. Спробуйте інший розпізнавач або нове фото.");
      }
      lowerInput.value = lower;
      lowerInput.dispatchEvent(new Event("input", {bubbles:true}));
      const pct = Number.isFinite(confidence) ? ` · ${Math.round(confidence*100)}%` : "";
      setStatus(`${isGemini?"Gemini":"OpenAI"}: ${lower}${pct}. Шукаю товар у базі…`, "ok");
      setTimeout(() => findButton.click(), 80);
    } catch (e) {
      setStatus(e.message || String(e), "bad");
    } finally {
      busy = false; sync();
    }
  }

  photoInput.addEventListener("change", async () => {
    const file = photoInput.files?.[0];
    imageData = ""; sync();
    if (!file) return;
    setStatus("Готуємо фото для AI…");
    try {
      imageData = await toDataUrl(file);
      setStatus("Фото готове. Натисніть Gemini; OpenAI використовуйте як резерв.", "ok");
    } catch (e) {
      setStatus(e.message || String(e), "bad");
    }
    sync();
  });

  gemini.addEventListener("click", () => recognize("gemini"));
  openai.addEventListener("click", () => recognize("openai"));
  sync();
})();
