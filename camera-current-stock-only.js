"use strict";

// Camera current quantity: ONLY verified rows with stock_status=in_stock.
// Agreed warehouse lifecycle 09.08.2026: in_stock -> staged -> dispatched.
(() => {
  if (window.__BAMA_CAMERA_CURRENT_STOCK_ONLY__) return;
  window.__BAMA_CAMERA_CURRENT_STOCK_ONLY__ = true;

  const copy = () => {
    let l = "nb";
    try { l = typeof language !== "undefined" ? language : "nb"; } catch {}
    if (l === "uk") return {
      title: "Поточна кількість · На складі",
      bunner: n => `${n} стопок × 10 = ${n * 10} шт.`,
      h30: n => `${n} Bunner × 30 = ${n * 30} hyller`,
      h60: n => `${n} Bunner × 60 = ${n * 60} hyller`,
      totalLabel: "Всього на складі",
      total: (b, h) => `${b} Bunner · ${h} hyller`
    };
    if (l === "pl") return {
      title: "Aktualna ilość · Na magazynie",
      bunner: n => `${n} stosów × 10 = ${n * 10} szt.`,
      h30: n => `${n} Bunner × 30 = ${n * 30} półek`,
      h60: n => `${n} Bunner × 60 = ${n * 60} półek`,
      totalLabel: "Razem na magazynie",
      total: (b, h) => `${b} Bunner · ${h} półek`
    };
    return {
      title: "Nåværende antall · På lager",
      bunner: n => `${n} stabler × 10 = ${n * 10} stk.`,
      h30: n => `${n} Bunner × 30 = ${n * 30} hyller`,
      h60: n => `${n} Bunner × 60 = ${n * 60} hyller`,
      totalLabel: "Totalt på lager",
      total: (b, h) => `${b} Bunner · ${h} hyller`
    };
  };

  function apply() {
    let source = [];
    try { source = Array.isArray(rows) ? rows : []; } catch {}
    const current = source.filter(row => row.status === "verified" && (row.stock_status || "in_stock") === "in_stock");
    const counts = {
      bunner: current.filter(row => row.product === "bunner").length,
      h30: current.filter(row => row.product === "hyller30").length,
      h60: current.filter(row => row.product === "hyller60").length
    };
    const totalBunner = counts.bunner * 10 + counts.h30 + counts.h60;
    const totalHyller = counts.h30 * 30 + counts.h60 * 60;
    const c = copy();
    const values = [
      ["productTotalsTitle", c.title],
      ["bunnerTotal", c.bunner(counts.bunner)],
      ["hyller30Total", c.h30(counts.h30)],
      ["hyller60Total", c.h60(counts.h60)],
      ["grandTotalLabel", c.totalLabel],
      ["grandTotalValue", c.total(totalBunner, totalHyller)]
    ];
    values.forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el && el.textContent !== value) el.textContent = value;
    });
  }

  let queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  }

  new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  document.addEventListener("click", () => setTimeout(apply, 0), true);
  window.addEventListener("bama-stock-updated", () => setTimeout(apply, 0));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) apply(); });
  setInterval(apply, 1200);
  setTimeout(apply, 0);

  window.BAMA_CAMERA_CURRENT_STOCK_ONLY_REFRESH = apply;
})();
