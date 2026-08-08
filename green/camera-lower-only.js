"use strict";

(() => {
  if (window.__BAMA_CAMERA_LOWER_ONLY__) return;
  window.__BAMA_CAMERA_LOWER_ONLY__ = true;

  const lowerValid = value => /^[A-Z0-9]{6}$/.test(String(value || ""));

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
      }
    };
  }

  const observer = new MutationObserver(() => clearUpperUi());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  clearUpperUi();
  setTimeout(() => {
    try { renderResult(); } catch {}
    try { renderTable(); } catch {}
  }, 0);

  console.info("Camera lower-number-only mode active: upper_number is no longer used.");
})();
