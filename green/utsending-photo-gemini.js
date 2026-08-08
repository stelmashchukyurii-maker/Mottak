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
  const reserveButton = $("reserveButton");

  if (!photoPanel || !photoInput || !upperInput || !lowerInput || !reserveButton) return;
  if ($("utServerOcrBox")) return;

  const style = document.createElement("style");
  style.textContent = `
    #upperInput{display:none!important}
    .pair{grid-template-columns:minmax(0,1fr) auto!important}
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
    .ut-suggestion{display:none;margin-top:9px;padding:12px;border:2px solid var(--warn);border-radius:13px;background:rgba(246,185,75,.09);line-height:1.45}
    .ut-suggestion.show{display:block}
    .ut-suggestion strong{color:var(--warn)}
    .ut-suggestion-actions{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}
    .returned-history{margin-top:9px;border:1px solid var(--line);border-radius:11px;background:#0a1020}
    .returned-history summary{padding:10px;color:var(--muted);font-weight:900;cursor:pointer}
    .returned-row{padding:10px;border-top:1px solid var(--line)}
    .returned-row strong{color:var(--muted)}
    .returned-state{margin-top:4px;color:var(--ok);font-size:10px;font-weight:900}
    @media(max-width:670px){.pair,.ut-ocr-actions,.ut-suggestion-actions{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);

  upperInput.value = "";
  upperInput.disabled = true;
  lowerInput.placeholder = "Нижній номер бірки · 6 символів";
  reserveButton.textContent = "Знайти та зарезервувати";

  const info = document.createElement("div");
  info.id = "utServerOcrBox";
  info.className = "ut-server-ocr";
  info.innerHTML = `
    <strong>AI-розпізнавання — захищений сервер</strong>
    <p>У UT використовується лише нижній шестисимвольний номер бірки. Gemini — основний розпізнавач, OpenAI — резерв. Ключі захищені в Supabase.</p>
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

  const suggestion = document.createElement("div");
  suggestion.id = "utLowerSuggestion";
  suggestion.className = "ut-suggestion";
  reserveButton.closest(".pair").insertAdjacentElement("afterend", suggestion);

  const geminiButton = $("utGeminiOcrButton");
  const openAiButton = $("utOpenAiOcrButton");
  const newPhotoButton = $("utNewPhotoButton");
  const status = $("utOcrStatus");

  let currentImage = null;
  let processing = false;
  let suggestedRow = null;

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

  function clearSuggestion() {
    suggestedRow = null;
    suggestion.classList.remove("show");
    suggestion.innerHTML = "";
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
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.82) };
  }

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
    processing = true;
    clearSuggestion();
    syncButtons();
    setStatus(isGemini ? "Gemini аналізує бірку…" : "OpenAI аналізує бірку…");

    try {
      const data = await invokeFunction(isGemini ? GEMINI_FUNCTION : OPENAI_FUNCTION, currentImage.dataUrl);
      const lower = cleanLower(data?.lower_number);
      const confidence = Number(data?.confidence);
      upperInput.value = "";
      lowerInput.value = lower;
      lowerInput.dispatchEvent(new Event("input", { bubbles: true }));

      if (/^[A-Z0-9]{6}$/.test(lower)) {
        const confidenceText = Number.isFinite(confidence) ? ` · впевненість ${Math.round(confidence * 100)} %` : "";
        setStatus(`${isGemini ? "Gemini" : "OpenAI"} прочитав номер ${lower}${confidenceText}. Перевірте його й натисніть «Знайти та зарезервувати».`, "ok");
      } else {
        setStatus(`${isGemini ? "Gemini" : "OpenAI"} не зміг прочитати нижній номер із 6 символів. Введіть його вручну або зробіть нове фото.`, "warn");
      }
    } catch (error) {
      setStatus(`${isGemini ? "Gemini" : "Резерв OpenAI"} не завершив розпізнавання. Фото й уже введений номер збережено.\n${error.message || error}`, "bad");
    } finally {
      processing = false;
      syncButtons();
    }
  }

  function hammingDistance(a, b) {
    if (a.length !== 6 || b.length !== 6) return 99;
    let distance = 0;
    for (let i = 0; i < 6; i += 1) if (a[i] !== b[i]) distance += 1;
    return distance;
  }

  function allowedProducts() {
    const order = current();
    if (!order) return new Set();
    const requested = requestQty(order);
    const scanned = scanQty();
    const allowed = new Set();
    if (scanned.b < requested.b) allowed.add("bunner");
    if (scanned.h30 < requested.h30) allowed.add("hyller30");
    if (scanned.h60 < requested.h60) allowed.add("hyller60");
    return allowed;
  }

  function searchableRows() {
    const allowed = allowedProducts();
    return stockRows.filter(row =>
      allowed.has(row.product) &&
      (row.stock_status || "in_stock") === "in_stock" &&
      /^[A-Z0-9]{6}$/.test(cleanLower(row.lower_number))
    );
  }

  function showSingleSuggestion(input, row) {
    suggestedRow = row;
    const candidate = cleanLower(row.lower_number);
    suggestion.innerHTML = `
      <strong>⚠ Точного збігу для ${esc(input)} немає.</strong><br>
      У доступному складі є лише один близький варіант: <b>${esc(productNames[row.product] || row.product)} · ${esc(candidate)}</b>.
      Відрізняється один символ. Перевірте бірку перед підтвердженням.
      <div class="ut-suggestion-actions">
        <button class="btn primary" id="utAcceptSuggestion" type="button">Використати ${esc(candidate)}</button>
        <button class="btn secondary" id="utRejectSuggestion" type="button">Не використовувати</button>
      </div>
    `;
    suggestion.classList.add("show");
    $("utAcceptSuggestion").onclick = async () => {
      const rowToUse = suggestedRow;
      clearSuggestion();
      if (!rowToUse) return;
      lowerInput.value = cleanLower(rowToUse.lower_number);
      await reserveKnownRow(rowToUse);
      lowerInput.value = "";
    };
    $("utRejectSuggestion").onclick = clearSuggestion;
  }

  async function reserveLowerNumber() {
    const input = cleanLower(lowerInput.value);
    clearSuggestion();
    if (!current()) return;
    if (!/^[A-Z0-9]{6}$/.test(input)) {
      message("scanMessage", "Нижній номер повинен містити рівно 6 букв або цифр.", "bad");
      lowerInput.focus();
      return;
    }

    const rows = searchableRows();
    const exact = rows.filter(row => cleanLower(row.lower_number) === input);
    if (exact.length === 1) {
      await reserveKnownRow(exact[0]);
      lowerInput.value = "";
      return;
    }
    if (exact.length > 1) {
      message("scanMessage", `Знайдено ${exact.length} товарів з номером ${input}. Для безпечного вибору використайте список або Nordic ID.`, "bad");
      return;
    }

    const near = rows.filter(row => hammingDistance(input, cleanLower(row.lower_number)) === 1);
    if (near.length === 1) {
      message("scanMessage", `Точного збігу для ${input} немає. Знайдено один можливий номер із відхиленням в один символ.`, "warn");
      showSingleSuggestion(input, near[0]);
      return;
    }
    if (near.length > 1) {
      const numbers = [...new Set(near.map(row => cleanLower(row.lower_number)))].slice(0, 5).join(", ");
      message("scanMessage", `Точного збігу немає. Є кілька близьких варіантів: ${numbers}. Зробіть нове фото або виберіть товар зі списку.`, "bad");
      return;
    }
    message("scanMessage", `У доступному складі не знайдено номера ${input} і немає безпечного збігу з відхиленням в один символ.`, "bad");
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
    clearSuggestion();
    setStatus("Зробіть нову фотографію бірки.");
    syncButtons();
  }

  photoInput.addEventListener("change", async () => {
    const file = photoInput.files?.[0];
    currentImage = null;
    clearSuggestion();
    syncButtons();
    if (!file) return;
    setStatus("Готуємо фотографію…");
    try {
      currentImage = await compress(file);
      syncButtons();
      message("scanMessage", "Фото готове. Розпізнайте нижній номер бірки.", "ok");
      setStatus("Фотографія готова. Спочатку використайте Gemini; OpenAI залишається резервом.", "ok");
    } catch (error) {
      setStatus(error.message || String(error), "bad");
    }
  });

  geminiButton.addEventListener("click", () => recognize("gemini"));
  openAiButton.addEventListener("click", () => recognize("openai"));
  newPhotoButton.addEventListener("click", resetPhoto);
  lowerInput.addEventListener("input", clearSuggestion);
  reserveButton.onclick = reserveLowerNumber;
  lowerInput.onkeydown = event => {
    if (event.key === "Enter") {
      event.preventDefault();
      reserveLowerNumber();
    }
  };

  const originalSetMode = setMode;
  setMode = function setModeLowerOnly(mode) {
    originalSetMode(mode);
    upperInput.value = "";
    upperInput.disabled = true;
    if (mode === "manual") lowerInput.focus();
  };

  pickerLabel = function pickerLabelLowerOnly(row) {
    const lower = cleanLower(row.lower_number) || "------";
    const epc = norm(row.scanner_code);
    return `${lower}${epc ? ` · EPC …${epc.slice(-8)}` : ""}`;
  };

  renderScanList = function renderScanListWithHistory(order) {
    const locked = (order.test_state || "active") !== "active" || ["staged", "completed", "cancelled"].includes(order.status);
    const active = selectedScans.filter(scan => !scan.released_at);
    const returned = selectedScans.filter(scan => scan.released_at);
    let html = "";

    if (!active.length) {
      html += '<div class="empty">Жодного активного товару не зарезервовано.</div>';
    } else {
      html += active.map(scan => {
        const lower = cleanLower(scan.lower_number) || "------";
        const epc = norm(scan.scanner_code);
        return `<div class="scan-item"><div><div class="scan-product">${esc(productNames[scan.product] || scan.product)}</div><div class="scan-codes">Номер: ${esc(lower)}${epc ? ` · EPC …${esc(epc.slice(-8))}` : ""}</div><div class="meta">${date(scan.scanned_at)}</div></div><button class="remove" data-remove="${esc(scan.mottak_scan_id)}" ${locked ? "disabled" : ""}>×</button></div>`;
      }).join("");
    }

    if (returned.length) {
      html += `<details class="returned-history"><summary>Історія повернень (${returned.length})</summary>${returned.map(scan => {
        const lower = cleanLower(scan.lower_number) || "------";
        return `<div class="returned-row"><strong>${esc(productNames[scan.product] || scan.product)} · ${esc(lower)}</strong><div class="returned-state">Повернуто на склад · товар знову доступний</div><div class="meta">${date(scan.released_at || scan.scanned_at)}</div></div>`;
      }).join("")}</details>`;
    }

    $("scanList").innerHTML = html;
    document.querySelectorAll("[data-remove]").forEach(button => {
      button.onclick = () => removeScan(button.dataset.remove);
    });
  };

  sessionStorage.removeItem("gemini_api_key");
  syncButtons();
  if (typeof renderDetail === "function" && current()) renderDetail();
})();
