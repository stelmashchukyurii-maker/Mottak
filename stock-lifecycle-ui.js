"use strict";

// BaMavaremottak — visible warehouse lifecycle
// Agreed 09.08.2026: På lager -> På rampe -> Sendt.
// Updated 09.08.2026 00:45 Europe/Oslo: hide top LAGER NÅ summary card on camera pages.
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

  function hideSharedStockCard() {
    const card = document.getElementById("bamaSharedStock");
    if (!card) return;
    // Do not remove child nodes: shared-stock-status.js still updates them in the background.
    // Hiding the whole card keeps refresh safe and removes these figures from WORKING and GREEN UI.
    card.style.display = "none";
    card.setAttribute("aria-hidden", "true");
  }

  function apply() {
    applyCameraFilters();
    hideSharedStockCard();
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
