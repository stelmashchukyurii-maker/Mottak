"use strict";

(() => {
  if (window.__BAMA_CAMERA_LOWER_ONLY__) return;
  window.__BAMA_CAMERA_LOWER_ONLY__ = true;

  const lowerValid = value => /^[A-Z0-9]{6}$/.test(String(value || ""));
  const FLOW_STYLE_ID = "bama-lower-only-mobile-table";

  const FLOW_COPY = {
    nb: { photo: "📷 FOTO", recognize: "🔍 LES NUMMER", save: "💾 LAGRE", correct: "✏️ SKRIV NUMMER", processing: "⏳ BEHANDLER…" },
    pl: { photo: "📷 FOTO", recognize: "🔍 ODCZYTAJ NUMER", save: "💾 ZAPISZ", correct: "✏️ WPISZ NUMER", processing: "⏳ PRZETWARZANIE…" },
    uk: { photo: "📷 ФОТО", recognize: "🔍 РОЗПІЗНАТИ", save: "💾 ЗБЕРЕГТИ", correct: "✏️ ВВЕСТИ НОМЕР", processing: "⏳ ОБРОБКА…" }
  };

  function flowText() {
    try { return FLOW_COPY[language] || FLOW_COPY.nb; }
    catch { return FLOW_COPY.nb; }
  }

  function installMobileLowerTable() {
    if (document.getElementById(FLOW_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = FLOW_STYLE_ID;
    style.textContent = `
      @media(max-width:760px){
        .table-wrap table{min-width:760px!important}
        .table-wrap th:nth-child(4),.table-wrap td:nth-child(4),
        .table-wrap th:nth-child(5),.table-wrap td:nth-child(5){display:none!important}
        .table-wrap th:nth-child(6),.table-wrap td:nth-child(6){min-width:118px!important;font-weight:950!important}
      }
    `;
    document.head.appendChild(style);
  }

  function syncFloatingLower() {
    const panel = document.getElementById("bama-floating-camera");
    const action = panel?.querySelector(".bama-photo-button");
    if (!panel || !action) return;

    let isBusy = false;
    let hasImage = false;
    try { isBusy = Boolean(busy); } catch {}
    try { hasImage = Boolean(imageData); } catch {}

    const lowerInput = document.getElementById("lowerValue");
    const lower = normalizeLower(lowerInput?.value || "");
    const c = flowText();
    let state = "photo", label = c.photo, icon = "📷";

    if (isBusy) {
      state = "busy"; label = c.processing; icon = "⏳";
    } else if (!hasImage) {
      state = "photo"; label = c.photo; icon = "📷";
    } else if (lowerValid(lower)) {
      state = "save"; label = c.save; icon = "💾";
    } else if (lower) {
      state = "correct"; label = c.correct; icon = "✏️";
    } else {
      state = "recognize"; label = c.recognize; icon = "🔍";
    }

    panel.dataset.workflowState = state;
    action.dataset.workflowAction = state;
    action.dataset.workflowIcon = icon;
    action.textContent = label;
    action.disabled = isBusy;
    action.setAttribute("aria-label", label.replace(/^[^A-Za-zА-Яа-яЇїІіЄєŁł]+/u, "").trim());

    // The old floating workflow could stay visually stuck on "processing"
    // after lower-only replaced renderResult(). Once the base flow is no
    // longer busy and the photo has been reset, clear that stale status.
    if (!isBusy && !hasImage) {
      const status = document.getElementById("bama-floating-workflow-status");
      if (status) status.hidden = true;
    }
  }

  function scheduleFloatingSync() {
    setTimeout(syncFloatingLower, 0);
    setTimeout(syncFloatingLower, 80);
    setTimeout(syncFloatingLower, 300);
  }

  function clearUpperUi() {
    const upper = document.getElementById("upperValue");
    if (upper) {
      upper.value = "";
      upper.defaultValue = "";
      upper.readOnly = true;
      upper.tabIndex = -1;
      upper.closest(".result-box")?.classList.add("bama-upper-hidden");
    }
    document.querySelectorAll('[data-edit-field="upper_number"]').forEach(input => {
      input.value = "";
      input.defaultValue = "";
      input.readOnly = true;
      input.closest(".edit-cell")?.classList.add("bama-upper-hidden");
    });
  }

  if (typeof validNumbers === "function") {
    validNumbers = function lowerOnlyValidNumbers(_upper, lower) {
      return lowerValid(normalizeLower(lower));
    };
  }

  if (typeof readResultInputs === "function") {
    readResultInputs = function readLowerOnlyResult() {
      const lower = normalizeLower(document.getElementById("lowerValue")?.value || "");
      const upper = document.getElementById("upperValue");
      if (upper) upper.value = "";
      if (document.getElementById("lowerValue")) document.getElementById("lowerValue").value = lower;
      if (!result) result = { line1: "", line2: lower, confidence: 0, valid: false };
      result.line1 = "";
      result.line2 = lower;
      result.valid = lowerValid(lower);
      return result;
    };
  }

  if (typeof validate === "function") {
    validate = function validateLowerOnly(value) {
      const lower = normalizeLower(value?.line2 || value?.lower_number || "");
      const confidence = Number(value?.confidence);
      return {
        line1: "",
        line2: lower,
        confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0,
        valid: lowerValid(lower)
      };
    };
  }

  if (typeof renderResult === "function") {
    renderResult = function renderLowerOnlyResult() {
      clearUpperUi();
      const lower = normalizeLower(result?.line2 || "");
      if (result) {
        result.line1 = "";
        result.line2 = lower;
        result.valid = lowerValid(lower);
      }
      const lowerInput = document.getElementById("lowerValue");
      if (lowerInput && document.activeElement !== lowerInput) lowerInput.value = lower;
      const confidence = document.getElementById("confidence");
      if (confidence) {
        confidence.textContent = result?.confidence
          ? `${t().confidence}: ${Math.round(result.confidence * 100)}%. ${t().manualHint}`
          : t().manualHint;
      }
      const save = document.getElementById("saveButton");
      if (save) save.disabled = !(imageData && lowerValid(lower)) || busy;
      lowerInput?.classList.toggle("invalid-field", Boolean(lower) && !lowerValid(lower));
      scheduleFloatingSync();
    };
  }

  if (typeof duplicateExists === "function") {
    duplicateExists = async function duplicateLowerOnly(id, _upper, lower) {
      const query = await client.from(TABLE)
        .select("id")
        .eq("lower_number", normalizeLower(lower))
        .neq("id", id)
        .limit(1);
      if (query.error) throw query.error;
      return (query.data || []).length > 0;
    };
  }

  if (typeof saveEdit === "function") {
    saveEdit = async function saveLowerOnlyEdit(id) {
      if (busy) return;
      const rowElement = document.querySelector(`[data-edit-row="${CSS.escape(id)}"]`);
      if (!rowElement) return;
      const productValue = rowElement.querySelector('[data-edit-field="product"]')?.value || product;
      const scannerCode = rowElement.querySelector('[data-edit-field="scanner_code"]')?.value.trim() || "";
      const lowerField = rowElement.querySelector('[data-edit-field="lower_number"]');
      const lower = normalizeLower(lowerField?.value || "");
      if (lowerField) {
        lowerField.value = lower;
        lowerField.classList.toggle("invalid-field", !lowerValid(lower));
      }
      if (!lowerValid(lower)) {
        show(t().invalid, "bad");
        return;
      }

      busy = true;
      show(t().updating);
      scheduleFloatingSync();
      try {
        const duplicate = await client.from(TABLE)
          .select("id")
          .eq("lower_number", lower)
          .neq("id", id)
          .limit(1);
        if (duplicate.error) throw duplicate.error;
        if ((duplicate.data || []).length) throw new Error(t().duplicate);

        const response = await client.from(TABLE)
          .update({ product: productValue, scanner_code: scannerCode, upper_number: "", lower_number: lower })
          .eq("id", id)
          .select("id")
          .maybeSingle();
        if (response.error) throw response.error;
        if (!response.data?.id) throw new Error(t().permissionBlocked);
        editingId = null;
        await loadTable(false);
        show(t().updated, "ok");
      } catch (error) {
        show(`${t().updateError}\n${error.message || error}`, "bad");
      } finally {
        busy = false;
        scheduleFloatingSync();
      }
    };
  }

  const observer = new MutationObserver(() => clearUpperUi());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  installMobileLowerTable();
  ["lowerValue", "photoInput", "recognizeButton", "saveButton", "newPhotoButton"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", scheduleFloatingSync);
    document.getElementById(id)?.addEventListener("change", scheduleFloatingSync);
    document.getElementById(id)?.addEventListener("click", scheduleFloatingSync);
  });

  setTimeout(() => {
    try { renderResult(); } catch {}
    try { renderTable(); } catch {}
    scheduleFloatingSync();
  }, 0);

  console.info("Camera lower-number-only mode active: workflow reset + mobile lower-number table enabled.");
})();
