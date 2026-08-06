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

  function hideContainer(input) {
    const container = input.closest(".result-box,.part,.field,.edit-cell,.form-group,.input-group");
    if (container) container.classList.add("bama-upper-hidden");
    const label = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
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
        if (dataKey === "upper" || upperText.test(text)) {
          header.classList.add("bama-upper-column");
          table.querySelectorAll("tr").forEach(row => {
            const cell = row.children[index];
            if (cell) cell.classList.add("bama-upper-column");
          });
        }
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

  function protectNordicInput() {
    const scanInput = document.getElementById("scanInput");
    if (!scanInput || scanInput.dataset.upperPolicyBound) return;
    scanInput.dataset.upperPolicyBound = "1";

    scanInput.addEventListener("input", event => {
      const raw = String(scanInput.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (raw.length < 24) return;
      const code = raw.slice(-24);
      if (code.slice(12, 18) === SYSTEM_UPPER) return;

      event.stopImmediatePropagation();
      const message = document.getElementById("message");
      if (message) {
        message.textContent = "Ukjent RFID-struktur: systemdelen stemmer ikke. Skann etiketten på nytt.";
        message.className = "message bad";
      }
      const save = document.getElementById("saveScanButton");
      if (save) save.disabled = true;
    }, true);
  }

  function apply() {
    upperIds.forEach(id => forceUpper(document.getElementById(id)));
    document.querySelectorAll('input[name*="upper" i],input[id*="upper" i]').forEach(forceUpper);
    hideTableColumns();
    maskRawCodes();
    protectNordicInput();
  }

  apply();
  document.addEventListener("DOMContentLoaded", apply, { once: true });
  new MutationObserver(apply).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(apply, 500);
})();
