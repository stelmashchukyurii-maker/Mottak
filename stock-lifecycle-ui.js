"use strict";

// BaMavaremottak — visible warehouse lifecycle
// Agreed 09.08.2026: På lager -> På rampe -> Sendt.
(() => {
  if (window.__BAMA_THREE_STOCK_STATES_UI__) return;
  window.__BAMA_THREE_STOCK_STATES_UI__ = true;

  const labels = () => {
    let l = "nb";
    try { l = typeof language !== "undefined" ? language : (window.UT_LANG || localStorage.getItem("mottak_ut_language") || "nb"); } catch {}
    if (l === "uk") return { stock: "На складі", ramp: "На рампі", sent: "Відправлено", title: "Складський статус" };
    if (l === "pl") return { stock: "Na magazynie", ramp: "Na rampie", sent: "Wysłane", title: "Status magazynowy" };
    return { stock: "På lager", ramp: "På rampe", sent: "Sendt", title: "Lagerstatus" };
  };

  function replaceButtonLabel(button, value) {
    if (!button) return;
    const strong = button.querySelector("strong");
    const count = strong?.textContent || "0";
    button.innerHTML = `${value}<strong>${count}</strong>`;
  }

  function applyCameraFilters() {
    const wrap = document.getElementById("cameraStockFilterWrap");
    if (!wrap) return;
    const physical = wrap.querySelector('[data-stock-filter="physical"]');
    const inStock = wrap.querySelector('[data-stock-filter="in_stock"]');
    if (physical?.classList.contains("active") && inStock && !inStock.classList.contains("active")) {
      inStock.click();
      return;
    }
    physical?.remove();
    wrap.querySelector('[data-stock-filter="reserved"]')?.remove();
    const grid = wrap.querySelector(".camera-stock-filters");
    if (grid) grid.style.gridTemplateColumns = "repeat(3,minmax(125px,1fr))";
    const c = labels();
    replaceButtonLabel(wrap.querySelector('[data-stock-filter="in_stock"]'), c.stock);
    replaceButtonLabel(wrap.querySelector('[data-stock-filter="staged"]'), c.ramp);
    replaceButtonLabel(wrap.querySelector('[data-stock-filter="dispatched"]'), c.sent);
    const title = wrap.querySelector(".camera-stock-filter-title");
    if (title) title.textContent = c.title;
  }

  function applySharedCard() {
    const card = document.getElementById("bamaSharedStock");
    if (!card) return;

    // Keep legacy nodes in the DOM because shared-stock-status.js refreshes them every 5s.
    // Hide them instead of removing them, otherwise refresh throws "Cannot set properties of null".
    const physicalCell = document.getElementById("bssPhysical")?.closest(".bss-cell");
    const reservedCell = document.getElementById("bssReserved")?.closest(".bss-cell");
    if (physicalCell) physicalCell.style.display = "none";
    if (reservedCell) reservedCell.style.display = "none";

    const grid = card.querySelector(".bss-grid");
    if (grid) grid.style.gridTemplateColumns = "repeat(3,minmax(0,1fr))";
    const c = labels();
    const stock = document.getElementById("bssAvailable")?.closest(".bss-cell");
    const ramp = document.getElementById("bssStaged")?.closest(".bss-cell");
    const sent = document.getElementById("bssDispatched")?.closest(".bss-cell");
    if (stock?.querySelector("span")) stock.querySelector("span").textContent = c.stock.toUpperCase();
    if (ramp?.querySelector("span")) ramp.querySelector("span").textContent = c.ramp.toUpperCase();
    if (sent?.querySelector("span")) sent.querySelector("span").textContent = c.sent.toUpperCase();
  }

  function apply() {
    applyCameraFilters();
    applySharedCard();
  }

  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  };

  new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("click", () => setTimeout(apply, 0), true);
  window.addEventListener("bama-stock-updated", apply);
  apply();
})();
