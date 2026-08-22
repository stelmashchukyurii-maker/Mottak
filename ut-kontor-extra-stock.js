"use strict";

(() => {
  if (window.__UT_KONTOR_EXTRA_STOCK__) return;
  window.__UT_KONTOR_EXTRA_STOCK__ = true;

  const FORLENGERE_IDS = ["forlengere_korte", "forlengere_lange", "forlengere_plast"];
  const VRAK_IDS = ["vrak_bunner", "vrak_hyller"];
  const ALL_IDS = [...FORLENGERE_IDS, ...VRAK_IDS];
  const VERSION = "1.2.0";
  const UPDATED_AT = "2026-08-22T10:35:00+02:00";
  let lastRows = [];

  const isUk = () => localStorage.getItem("mottak_ut_language") === "uk";
  const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

  function unitText(id, value) {
    if (id === "forlengere_plast") {
      if (isUk()) return value === 1 ? "ящик" : "ящиків";
      return value === 1 ? "eske" : "esker";
    }
    if (VRAK_IDS.includes(id)) {
      if (isUk()) return value === 1 ? "стопка" : "стопок";
      return value === 1 ? "stabel" : "stabler";
    }
    if (isUk()) return value === 1 ? "візок" : "візків";
    return value === 1 ? "vogn" : "vogner";
  }

  function amountText(id, value) {
    const count = Math.max(0, n(value));
    if (id === "vrak_bunner") {
      return isUk()
        ? `${count} ${unitText(id, count)} = ${count * 10} Vrak bunner`
        : `${count} ${unitText(id, count)} = ${count * 10} Vrak bunner`;
    }
    if (id === "vrak_hyller") {
      return isUk()
        ? `${count} ${unitText(id, count)} = ${count * 30} Vrak hyller`
        : `${count} ${unitText(id, count)} = ${count * 30} Vrak hyller`;
    }
    return `${count} ${unitText(id, count)}`;
  }

  function copy() {
    return isUk()
      ? { physical: "На складі", ordering: "Замовляєте зараз", remaining: "Залишиться на складі", missing: "Бракує", waiting: "чекає на INN" }
      : { physical: "På lager", ordering: "Bestiller nå", remaining: "Igjen på lager", missing: "Mangler", waiting: "venter på INN" };
  }

  function injectStyle() {
    if (document.getElementById("utExtraStockStyle")) return;
    const style = document.createElement("style");
    style.id = "utExtraStockStyle";
    style.textContent = `
      .ut-extra-product .ut-extra-unit,
      .ut-vrak-product .ut-vrak-unit{display:none!important}
      .ut-extra-product .ramp-product-head>div,
      .ut-vrak-product .ramp-product-head>div{width:100%}
      .ut-extra-product .ramp-product-head,
      .ut-vrak-product .ramp-product-head{align-items:flex-start}
      .ut-extra-product .ramp-product-head output.stock-balance,
      .ut-vrak-product .ramp-product-head output.stock-balance{display:grid;gap:8px;min-width:250px;font-size:12px;line-height:1.35;text-align:left}
      .ut-extra-product .stock-balance span,
      .ut-vrak-product .stock-balance span{display:block;width:100%;padding:9px 11px;border:1px solid rgba(48,59,89,.95);border-radius:11px;background:#070b14;overflow-wrap:anywhere}
      .ut-extra-product .stock-balance .stock-now,
      .ut-vrak-product .stock-balance .stock-now{color:var(--text);font-weight:950}
      .ut-extra-product .stock-balance .stock-demand,
      .ut-vrak-product .stock-balance .stock-demand{color:#d8deef;font-weight:900}
      .ut-extra-product .stock-balance .stock-after,
      .ut-vrak-product .stock-balance .stock-after{color:var(--ok);border-color:rgba(72,213,151,.55);background:rgba(72,213,151,.07);font-weight:950}
      .ut-extra-product .stock-balance .stock-after.warn,
      .ut-vrak-product .stock-balance .stock-after.warn{color:var(--bad);border-color:rgba(255,115,115,.62);background:rgba(255,115,115,.09);font-weight:950}
      .ut-extra-product.over-stock,
      .ut-vrak-product.over-stock{border-color:var(--bad)!important;box-shadow:0 0 0 2px rgba(255,115,115,.10)}
      .ut-extra-product.over-stock input,
      .ut-vrak-product.over-stock input{border-color:var(--bad)}
      @media(max-width:560px){
        .ut-extra-product .ramp-product-head,
        .ut-vrak-product .ramp-product-head{display:block}
        .ut-extra-product .ramp-product-head output.stock-balance,
        .ut-vrak-product .ramp-product-head output.stock-balance{min-width:0;width:100%;margin-top:7px;text-align:left}
      }
    `;
    document.head.appendChild(style);
  }

  function currentOrderQty(id) {
    if (FORLENGERE_IDS.includes(id)) {
      try {
        const state = window.BAMA_UT_KONTOR_PRODUCTS?.getExtraState?.();
        if (state && id in state) return Math.max(0, n(state[id]));
      } catch {}
    }
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
    const output = document.getElementById(`${id}Output`);
    if (!output) return;
    const card = output.closest(".ramp-product");
    const c = copy();
    const warehouse = Math.max(0, n(row?.physical_count));
    const ordering = currentOrderQty(id);
    const remaining = warehouse - ordering;
    const shortage = remaining < 0;

    output.className = "stock-balance";
    output.innerHTML = `
      <span class="stock-now">${c.physical}: ${amountText(id, warehouse)}</span>
      <span class="stock-demand">${c.ordering}: ${amountText(id, ordering)}</span>
      <span class="stock-after ${shortage ? "warn" : ""}">${shortage ? `${c.missing}: ${amountText(id, Math.abs(remaining))} · ${c.waiting}` : `${c.remaining}: ${amountText(id, remaining)}`}</span>
    `;
    card?.classList.toggle("over-stock", shortage);
  }

  function render() {
    injectStyle();
    document.querySelectorAll(".ut-extra-stock-info").forEach(el => el.remove());
    const map = new Map((rows() || []).map(row => [String(row.product_id), row]));
    ALL_IDS.forEach(id => renderOne(id, map.get(id) || { product_id: id, physical_count: 0 }));
  }

  window.addEventListener("bama-stock-summary-updated", event => {
    if (Array.isArray(event?.detail?.rows)) lastRows = event.detail.rows;
    render();
  });

  document.addEventListener("input", event => {
    if (event.target?.id && ALL_IDS.some(id => event.target.id === `${id}Qty`)) setTimeout(render, 0);
  }, true);

  document.addEventListener("change", event => {
    if (event.target?.id && ALL_IDS.some(id => event.target.id === `${id}Qty`)) setTimeout(render, 0);
  }, true);

  document.addEventListener("click", event => {
    if (event.target?.closest?.("[data-ut-extra-minus],[data-ut-extra-plus],[data-ut-extra-set],[data-vrak-minus],[data-vrak-plus],[data-vrak-set]")) setTimeout(render, 0);
  }, true);

  window.addEventListener("pageshow", () => setTimeout(render, 0));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(render, 0); });

  window.UT_KONTOR_EXTRA_STOCK = { version: VERSION, updatedAt: UPDATED_AT, render };

  render();
  setTimeout(render, 250);
  setTimeout(render, 1000);
})();
