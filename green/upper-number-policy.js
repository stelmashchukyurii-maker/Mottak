"use strict";

(() => {
  if (window.__BAMA_UPPER_NUMBER_REMOVED__) return;
  window.__BAMA_UPPER_NUMBER_REMOVED__ = true;
  window.BAMA_SYSTEM_UPPER_NUMBER = "";

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
    if (!input) return;
    const container = input.closest(".result-box,.part,.field,.edit-cell,.form-group,.input-group");
    if (container) container.classList.add("bama-upper-hidden");
    const label = input.id
      ? Array.from(document.querySelectorAll("label[for]")).find(item => item.htmlFor === input.id)
      : null;
    if (label) label.classList.add("bama-upper-hidden");
  }

  function clearUpper(input) {
    if (!input) return;
    input.value = "";
    input.defaultValue = "";
    input.readOnly = true;
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    hideContainer(input);
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

  function maskLegacyMiddleSegment() {
    document.querySelectorAll("#rawPreview,.raw-preview,.scan-codes").forEach(element => {
      const text = element.textContent || "";
      const masked = text.replace(/([A-Z0-9]{12})[A-Z0-9]{6}([A-Z0-9]{6})/g, "$1••••••$2");
      if (masked !== text) element.textContent = masked;
    });
  }

  function apply() {
    upperIds.forEach(id => clearUpper(document.getElementById(id)));
    document.querySelectorAll('input[name*="upper" i],input[id*="upper" i],[data-edit-field="upper_number"]').forEach(clearUpper);
    hideTableColumns();
    maskLegacyMiddleSegment();
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
  document.addEventListener("click", queueApply, true);
  document.addEventListener("change", queueApply, true);
  document.addEventListener("input", queueApply, true);
  new MutationObserver(queueApply).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
