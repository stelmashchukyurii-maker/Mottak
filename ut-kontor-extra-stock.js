"use strict";

(() => {
  if (window.__UT_KONTOR_EXTRA_STOCK__) return;
  window.__UT_KONTOR_EXTRA_STOCK__ = true;

  const EXTRA_IDS = ["forlengere_korte", "forlengere_lange", "forlengere_plast"];
  const VERSION = "1.0.0";
  const UPDATED_AT = "2026-08-22T05:40:00+02:00";
  let lastRows = [];

  const isUk = () => localStorage.getItem("mottak_ut_language") === "uk";
  const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function unitText(id, value) {
    if (id === "forlengere_plast") {
      if (isUk()) return value === 1 ? "ящик" : "ящиків";
      return value === 1 ? "eske" : "esker";
    }
    if (isUk()) return value === 1 ? "візок" : "візків";
    return value === 1 ? "vogn" : "vogner";
  }

  function amountText(id, value) {
    const count = Math.max(0, n(value));
    return `${count} ${unitText(id, count)}`;
  }

  function copy() {
    return isUk()
      ? {
          physical: "На складі",
          available: "Доступно зараз",
          ordering: "Замовляєте зараз",
          remaining: "Залишиться на складі",
          missing: "Бракує",
          waiting: "чекає на INN",
        }
      : {
          physical: "På lager",
          available: "Tilgjengelig nå",
          ordering: "Bestiller nå",
          remaining: "Igjen på lager",
          missing: "Mangler",
          waiting: "venter på INN",
        };
  }

  function injectStyle() {
    if (document.getElementById("utExtraStockStyle")) return;
    const style = document.createElement("style");
    style.id = "utExtraStockStyle";
    style.textContent = `
      .ut-extra-stock-info{display:grid;gap:8px;margin:10px 0 8px}
      .ut-extra-stock-line{padding:10px 12px;border:1px solid #303b59;border-radius:13px;background:#0b1020;color:#e8edf8;font-size:12px;font-weight:850;line-height:1.35}
      .ut-extra-stock-line strong{font-weight:1000}
      .ut-extra-stock-line.available{border-color:rgba(117,183,255,.48);color:#cce4ff}
      .ut-extra-stock-line.good{border-color:rgba(72,213,151,.55);background:rgba(72,213,151,.07);color:#63dca5}
      .ut-extra-stock-line.bad{border-color:rgba(255,107,107,.72);background:rgba(255,107,107,.09);color:#ff8e8e}
      .ut-extra-stock-line.reserve{font-size:11px}
    `;
    document.head.appendChild(style);
  }

  function ensureBlocks() {
    injectStyle();
    EXTRA_IDS.forEach(id => {
      const card = document.querySelector(`[data-ut-product-id="${id}"]`);
      if (!card || card.querySelector(`[data-ut-extra-stock="${id}"]`)) return;
      const block = document.createElement("div");
      block.className = "ut-extra-stock-info";
      block.dataset.utExtraStock = id;
      const note = card.querySelector(".ut-extra-note");
      if (note) note.insertAdjacentElement("beforebegin", block);
      else card.querySelector(".ramp-product-head")?.insertAdjacentElement("afterend", block);
    });
  }

  function currentOrderQty(id) {
    try {
      const state = window.BAMA_UT_KONTOR_PRODUCTS?.getExtraState?.();
      if (state && id in state) return Math.max(0, n(state[id]));
    } catch {}
    return Math.max(0, n(document.getElementById(`${id}Qty`)?.value));
  }

  function rows() {
    try {
      const live = window.BAMA_STOCK_SUMMARY_8?.getRows?.();
      if (Array.isArray(live) && live.length) return live;
    } catch {}
    return lastRows;
  }

  function renderOne(id, row) {
    const block = document.querySelector(`[data-ut-extra-stock="${id}"]`);
    if (!block) return;

    const c = copy();
    const physical = Math.max(0, n(row?.physical_count));
    const available = Math.max(0, n(row?.available_count ?? row?.physical_count));
    const ordering = currentOrderQty(id);
    const remaining = available - ordering;
    const shortage = Math.max(0, -remaining);

    const reserveLine = available !== physical
      ? `<div class="ut-extra-stock-line available reserve">${esc(c.available)}: <strong>${esc(amountText(id, available))}</strong></div>`
      : "";

    const resultLine = shortage > 0
      ? `<div class="ut-extra-stock-line bad">${esc(c.missing)}: <strong>${esc(amountText(id, shortage))}</strong> · ${esc(c.waiting)}</div>`
      : `<div class="ut-extra-stock-line good">${esc(c.remaining)}: <strong>${esc(amountText(id, remaining))}</strong></div>`;

    block.innerHTML = `
      <div class="ut-extra-stock-line">${esc(c.physical)}: <strong>${esc(amountText(id, physical))}</strong></div>
      ${reserveLine}
      <div class="ut-extra-stock-line">${esc(c.ordering)}: <strong>${esc(amountText(id, ordering))}</strong></div>
      ${resultLine}`;
  }

  function render() {
    ensureBlocks();
    const map = new Map((rows() || []).map(row => [String(row.product_id), row]));
    EXTRA_IDS.forEach(id => renderOne(id, map.get(id) || { product_id: id, physical_count: 0, available_count: 0 }));
  }

  window.addEventListener("bama-stock-summary-updated", event => {
    if (Array.isArray(event?.detail?.rows)) lastRows = event.detail.rows;
    render();
  });

  document.addEventListener("input", event => {
    if (event.target?.id && EXTRA_IDS.some(id => event.target.id === `${id}Qty`)) setTimeout(render, 0);
  }, true);

  document.addEventListener("change", event => {
    if (event.target?.id && EXTRA_IDS.some(id => event.target.id === `${id}Qty`)) setTimeout(render, 0);
  }, true);

  document.addEventListener("click", event => {
    if (event.target?.closest?.("[data-ut-extra-minus],[data-ut-extra-plus],[data-ut-extra-set]")) setTimeout(render, 0);
  }, true);

  window.addEventListener("pageshow", () => setTimeout(render, 0));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(render, 0); });

  window.UT_KONTOR_EXTRA_STOCK = { version: VERSION, updatedAt: UPDATED_AT, render };

  render();
  setTimeout(render, 250);
  setTimeout(render, 1000);
})();
