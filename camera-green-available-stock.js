"use strict";

// GREEN Camera — show AVAILABLE stock from isolated ut_test_stock.
// Version 1.0.0
// Updated: 2026-08-08 22:02 Europe/Oslo
(() => {
  if (window.__BAMA_CAMERA_GREEN_AVAILABLE_STOCK__) return;
  window.__BAMA_CAMERA_GREEN_AVAILABLE_STOCK__ = true;

  const n = value => Number(value) || 0;

  function apply(values) {
    const available = values?.available;
    if (!available) return;

    const bunner = n(available.bunnerRecords);
    const h30 = n(available.h30Records);
    const h60 = n(available.h60Records);
    const totalBunner = n(available.totalBunner);
    const totalHyller = n(available.totalHyller);

    const title = document.getElementById("productTotalsTitle");
    const bunnerTotal = document.getElementById("bunnerTotal");
    const h30Total = document.getElementById("hyller30Total");
    const h60Total = document.getElementById("hyller60Total");
    const totalLabel = document.getElementById("grandTotalLabel");
    const totalValue = document.getElementById("grandTotalValue");

    if (title) title.textContent = "Tilgjengelig · uten rampe";
    if (bunnerTotal) bunnerTotal.textContent = `${bunner} stabler × 10 = ${bunner * 10} stk.`;
    if (h30Total) h30Total.textContent = `${h30} sett × 30 = ${h30 * 30} hyller`;
    if (h60Total) h60Total.textContent = `${h60} sett × 60 = ${h60 * 60} hyller`;
    if (totalLabel) totalLabel.textContent = "Tilgjengelig";
    if (totalValue) totalValue.textContent = `${totalBunner} Bunner · ${totalHyller} hyller`;
  }

  window.addEventListener("bama-stock-updated", event => apply(event.detail));

  // shared-stock-status.js dispatches bama-stock-updated after each refresh.
  // Trigger one fresh pass after this GREEN override has been attached.
  setTimeout(() => window.refreshBamaStock?.().catch?.(() => {}), 50);

  window.BAMA_CAMERA_GREEN_AVAILABLE_STOCK = {
    version: "1.0.0",
    source: "ut_test_stock via green-ut-api.js",
    display: "available/in_stock only",
    updatedAt: "2026-08-08T22:02:00+02:00"
  };
})();
