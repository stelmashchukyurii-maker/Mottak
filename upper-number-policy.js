"use strict";

(() => {
  const SYSTEM_UPPER = "078500";
  window.BAMA_SYSTEM_UPPER_NUMBER = SYSTEM_UPPER;

  const style = document.createElement("style");
  style.textContent = `
    .bama-upper-hidden{display:none!important}
    table .bama-upper-column{display:none!important}
  `;
  document.head.appendChild(style);

  const upperIds = ["upperValue", "upperNumber", "upperInput"];
  const upperText = /^(upper|upper number|øvre nummer|górny numer|верхній номер)$/i;
  let applyQueued = false;

  function hideContainer(input) {
    const container = input.closest(".result-box,.part,.field,.edit-cell,.form-group,.input-group");
    if (container) container.classList.add("bama-upper-hidden");
    const label = input.id ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`) : null;
    if (label) label.classList.add("bama-upper-hidden");
  }

  function forceUpper(input) {
    if (!input) return;
    const changed = input.value !== SYSTEM_UPPER;
    input.value = SYSTEM_UPPER;
    input.defaultValue = SYSTEM_UPPER;
    input.readOnly = true;
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    hideContainer(input);
    if (changed) input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function hideTableColumns() {
    document.querySelectorAll("table").forEach(table => {
      const headers = Array.from(table.querySelectorAll("thead th"));
      headers.forEach((header, index) => {
        const dataKey = String(header.dataset.t || "").toLowerCase();
        const text = header.textContent.trim();
        if (dataKey !== "upper" && !upperText.test(text)) return;
        header.classList.add("bama-upper-column");
        table.querySelectorAll("tr").forEach(row => {
          const cell = row.children[index];
          if (cell) cell.classList.add("bama-upper-column");
        });
      });
    });
  }

  function maskRawCodes() {
    document.querySelectorAll("#rawPreview,.raw-preview,.scan-codes").forEach(element => {
      const text = element.textContent || "";
      const masked = text.replace(/([A-Z0-9]{12})078500([A-Z0-9]{6})/g, "$1••••••$2");
      if (masked !== text) element.textContent = masked;
    });
  }

  function showNordicStructureError() {
    const message = document.getElementById("message");
    if (message) {
      message.textContent = "Ukjent RFID-struktur: systemdelen stemmer ikke. Skann etiketten på nytt.";
      message.className = "message bad";
    }
    const save = document.getElementById("saveScanButton");
    if (save) save.disabled = true;
  }

  function rawNordicCode(input) {
    const raw = String(input?.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    return raw.length >= 24 ? raw.slice(-24) : "";
  }

  function hasValidSystemPart(input) {
    const code = rawNordicCode(input);
    return !code || code.slice(12, 18) === SYSTEM_UPPER;
  }

  function protectNordicInput() {
    const scanInput = document.getElementById("scanInput");
    if (!scanInput || scanInput.dataset.upperPolicyBound) return;
    scanInput.dataset.upperPolicyBound = "1";

    scanInput.addEventListener("input", event => {
      if (hasValidSystemPart(scanInput)) return;
      event.stopImmediatePropagation();
      showNordicStructureError();
    }, true);

    scanInput.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== "Tab") return;
      if (hasValidSystemPart(scanInput)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showNordicStructureError();
    }, true);

    const splitButton = document.getElementById("splitButton");
    splitButton?.addEventListener("click", event => {
      if (hasValidSystemPart(scanInput)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showNordicStructureError();
    }, true);
  }

  function apply() {
    upperIds.forEach(id => forceUpper(document.getElementById(id)));
    document.querySelectorAll('input[name*="upper" i],input[id*="upper" i]').forEach(forceUpper);
    hideTableColumns();
    maskRawCodes();
    protectNordicInput();
  }

  function queueApply() {
    if (applyQueued) return;
    applyQueued = true;
    requestAnimationFrame(() => {
      applyQueued = false;
      apply();
    });
  }

  apply();
  document.addEventListener("DOMContentLoaded", apply, { once: true });
  new MutationObserver(queueApply).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
