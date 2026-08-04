"use strict";

(() => {
  const stock = { bunner: 0, h30: 0, h60: 0, loaded: false };

  const style = document.createElement("style");
  style.textContent = `
    .ramp-product-head output.stock-balance{display:grid;gap:3px;min-width:230px;font-size:12px;line-height:1.3}
    .stock-balance .stock-now{color:var(--text);font-weight:900}
    .stock-balance .stock-after{color:var(--ok);font-weight:950}
    .stock-balance .stock-after.warn{color:var(--bad)}
    .ramp-product.over-stock{border-color:var(--bad);box-shadow:0 0 0 2px rgba(255,115,115,.10)}
    .ramp-product.over-stock input{border-color:var(--bad)}
    @media(max-width:560px){.ramp-product-head output.stock-balance{min-width:0;margin-top:7px;text-align:left}}
  `;
  document.head.appendChild(style);

  const originalRenderForm = renderForm;
  renderForm = function renderFormWithStock() {
    originalRenderForm();
    renderStockBalance();
  };

  const originalLoadInn = loadInn;
  loadInn = async function loadInnWithStock() {
    await originalLoadInn();
    try {
      const rows = await request("mottak_scans?select=product,status,stock_status&limit=10000") || [];
      const available = rows.filter((row) =>
        row.status === "verified" && (row.stock_status || "in_stock") === "in_stock"
      );
      stock.bunner = available.filter((row) => row.product === "bunner").length;
      stock.h30 = available.filter((row) => row.product === "hyller30").length;
      stock.h60 = available.filter((row) => row.product === "hyller60").length;
      stock.loaded = true;
      renderStockBalance();
    } catch (error) {
      stock.loaded = false;
      renderStockBalance();
    }
  };

  function plural(value, one, many) {
    return value === 1 ? one : many;
  }

  function balanceText(key, value) {
    if (key === "bunner") {
      return `${value} ${plural(value, "stabel", "stabler")} = ${value * 10} Bunner`;
    }
    if (key === "h30") {
      return `${value} sett = ${value} Bunner + ${value * 30} hyller`;
    }
    return `${value} sett = ${value} Bunner + ${value * 60} hyller`;
  }

  function updateProduct(key, outputId, quantity) {
    const output = document.getElementById(outputId);
    if (!output) return false;
    const card = output.closest(".ramp-product");

    if (!stock.loaded) {
      output.className = "stock-balance";
      output.innerHTML = '<span class="stock-now">På lager: laster…</span><span class="stock-after">Etter bestilling: —</span>';
      card?.classList.remove("over-stock");
      return false;
    }

    const available = stock[key];
    const remaining = available - quantity;
    const over = remaining < 0;
    output.className = "stock-balance";
    output.innerHTML = `
      <span class="stock-now">På lager: ${balanceText(key, available)}</span>
      <span class="stock-after ${over ? "warn" : ""}">${over ? `Mangler: ${balanceText(key, Math.abs(remaining))}` : `Etter bestilling: ${balanceText(key, remaining)}`}</span>
    `;
    card?.classList.toggle("over-stock", over);
    return over;
  }

  function renderStockBalance() {
    const overBunner = updateProduct("bunner", "bunnerOutput", Number(state.bunner) || 0);
    const overH30 = updateProduct("h30", "h30Output", Number(state.h30) || 0);
    const overH60 = updateProduct("h60", "h60Output", Number(state.h60) || 0);
    const over = overBunner || overH30 || overH60;
    const sendButton = document.getElementById("send");
    if (sendButton && !busy) sendButton.disabled = over;
  }

  document.getElementById("send")?.addEventListener("click", (event) => {
    if (!stock.loaded) return;
    const problems = [];
    if ((Number(state.bunner) || 0) > stock.bunner) problems.push(`Bunner: på lager ${stock.bunner} stabler`);
    if ((Number(state.h30) || 0) > stock.h30) problems.push(`Hyller x30: på lager ${stock.h30} sett`);
    if ((Number(state.h60) || 0) > stock.h60) problems.push(`Hyller x60: på lager ${stock.h60} sett`);
    if (!problems.length) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    msg(`Bestillingen er større enn tilgjengelig lager.\n${problems.join("\n")}`, "bad");
    document.querySelector(".ramp-product.over-stock")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, true);

  renderStockBalance();
})();
