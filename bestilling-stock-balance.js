"use strict";

(() => {
  const stock = { bunner: 0, h30: 0, h60: 0, loaded: false };

  const style = document.createElement("style");
  style.textContent = `
    .ramp-product-head output.stock-balance{display:grid;gap:8px;min-width:250px;font-size:12px;line-height:1.35}
    .stock-balance span{display:block;width:100%;padding:9px 11px;border:1px solid rgba(48,59,89,.95);border-radius:11px;background:#070b14;overflow-wrap:anywhere}
    .stock-balance .stock-now{color:var(--text);font-weight:950}
    .stock-balance .stock-demand{color:#d8deef;font-weight:900}
    .stock-balance .stock-after{color:var(--ok);border-color:rgba(72,213,151,.55);background:rgba(72,213,151,.07);font-weight:950}
    .stock-balance .stock-after.warn{color:var(--bad);border-color:rgba(255,115,115,.62);background:rgba(255,115,115,.09);font-weight:950}
    .ramp-product.over-stock{border-color:var(--bad);box-shadow:0 0 0 2px rgba(255,115,115,.10)}
    .ramp-product.over-stock input{border-color:var(--bad)}
    #allOrdersShortage{display:none!important}
    @media(max-width:560px){.ramp-product-head output.stock-balance{min-width:0;margin-top:7px;text-align:left}}
  `;
  document.head.appendChild(style);

  const oldWarning = document.getElementById("allOrdersShortage");
  oldWarning?.remove();

  const originalRenderForm = renderForm;
  renderForm = function renderFormWithStock() {
    originalRenderForm();
    renderStockBalance();
  };

  // Use the same available balance as the eight-product stock summary.
  // Do not derive orderable stock from raw scan counts.
  function applyAvailableRows(rows) {
    if (!Array.isArray(rows) || !rows.length) return;
    const byId = new Map(rows.map(row => [String(row.product_id), row]));
    stock.bunner = Math.max(0, Number(byId.get("bunner")?.available_count) || 0);
    stock.h30 = Math.max(0, Number(byId.get("hyller30")?.available_count) || 0);
    stock.h60 = Math.max(0, Number(byId.get("hyller60")?.available_count) || 0);
    stock.loaded = true;
    renderStockBalance();
  }

  window.addEventListener("bama-stock-summary-updated", event => {
    applyAvailableRows(event.detail?.rows);
  });
  applyAvailableRows(window.BAMA_STOCK_SUMMARY_8?.getRows?.());

  function plural(value, one, many) {
    return Math.abs(value) === 1 ? one : many;
  }

  function balanceText(key, value) {
    const amount = Math.abs(value);
    if (key === "bunner") return `${amount} ${plural(amount, "stabel", "stabler")} = ${amount * 10} Bunner`;
    if (key === "h30") return `${amount} sett = ${amount} Bunner + ${amount * 30} hyller`;
    return `${amount} sett = ${amount} Bunner + ${amount * 60} hyller`;
  }

  function currentQty(key) {
    return Number(state[key]) || 0;
  }

  function updateProduct(key, outputId) {
    const output = document.getElementById(outputId);
    if (!output) return;
    const card = output.closest(".ramp-product");

    if (!stock.loaded) {
      output.className = "stock-balance";
      output.innerHTML = '<span class="stock-now">Tilgjengelig: laster…</span><span class="stock-after">Igjen: —</span>';
      card?.classList.remove("over-stock");
      return;
    }

    const warehouse = stock[key];
    const ordering = currentQty(key);
    const remaining = warehouse - ordering;
    const shortage = remaining < 0;

    output.className = "stock-balance";
    output.innerHTML = `
      <span class="stock-now">Tilgjengelig: ${balanceText(key, warehouse)}</span>
      <span class="stock-demand">Bestiller nå: ${balanceText(key, ordering)}</span>
      <span class="stock-after ${shortage ? "warn" : ""}">${shortage ? `Mangler: ${balanceText(key, Math.abs(remaining))} · venter på INN` : `Igjen tilgjengelig: ${balanceText(key, remaining)}`}</span>
    `;
    card?.classList.toggle("over-stock", shortage);
  }

  function renderStockBalance() {
    updateProduct("bunner", "bunnerOutput");
    updateProduct("h30", "h30Output");
    updateProduct("h60", "h60Output");
    const sendButton = document.getElementById("send");
    if (sendButton && !busy) sendButton.disabled = false;
  }

  renderStockBalance();

})();
