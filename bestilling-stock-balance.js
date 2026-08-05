"use strict";

(() => {
  const stock = { bunner: 0, h30: 0, h60: 0, loaded: false };

  const style = document.createElement("style");
  style.textContent = `
    .ramp-product-head output.stock-balance{display:grid;gap:3px;min-width:250px;font-size:12px;line-height:1.35}
    .stock-balance .stock-now{color:var(--text);font-weight:900}
    .stock-balance .stock-demand{color:var(--muted);font-weight:850}
    .stock-balance .stock-after{color:var(--ok);font-weight:950}
    .stock-balance .stock-after.warn{color:var(--bad);font-size:13px}
    .ramp-product.over-stock{border-color:var(--bad);box-shadow:0 0 0 2px rgba(255,115,115,.10)}
    .ramp-product.over-stock input{border-color:var(--bad)}
    #allOrdersShortage{display:none;margin:12px 0 0;padding:11px 12px;border:2px solid var(--bad);border-radius:13px;background:rgba(255,115,115,.10);color:#ffc0c0;font-weight:950;line-height:1.45;white-space:pre-line}
    #allOrdersShortage.show{display:block}
    @media(max-width:560px){.ramp-product-head output.stock-balance{min-width:0;margin-top:7px;text-align:left}}
  `;
  document.head.appendChild(style);

  const actions = document.querySelector(".actions");
  if (actions && !document.getElementById("allOrdersShortage")) {
    const warning = document.createElement("div");
    warning.id = "allOrdersShortage";
    actions.insertAdjacentElement("beforebegin", warning);
  }

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
      const physical = rows.filter((row) =>
        row.status === "verified" && ["in_stock", "reserved", "staged"].includes(row.stock_status || "in_stock")
      );
      stock.bunner = physical.filter((row) => row.product === "bunner").length;
      stock.h30 = physical.filter((row) => row.product === "hyller30").length;
      stock.h60 = physical.filter((row) => row.product === "hyller60").length;
      stock.loaded = true;
      renderStockBalance();
    } catch {
      stock.loaded = false;
      renderStockBalance();
    }
  };

  const originalLoadUt = loadUt;
  loadUt = async function loadUtWithStock() {
    await originalLoadUt();
    renderStockBalance();
  };

  function plural(value, one, many) {
    return Math.abs(value) === 1 ? one : many;
  }

  function balanceText(key, value) {
    const amount = Math.abs(value);
    if (key === "bunner") {
      return `${amount} ${plural(amount, "stabel", "stabler")} = ${amount * 10} Bunner`;
    }
    if (key === "h30") {
      return `${amount} sett = ${amount} Bunner + ${amount * 30} hyller`;
    }
    return `${amount} sett = ${amount} Bunner + ${amount * 60} hyller`;
  }

  function orderDemand() {
    const demand = { bunner: 0, h30: 0, h60: 0 };
    const list = Array.isArray(orders) ? orders : [];

    list.forEach((order) => {
      const isActive = typeof active === "function"
        ? active(order)
        : !["completed", "cancelled"].includes(order.status);
      if (!isActive) return;
      if (editingId && String(order.id) === String(editingId)) return;

      demand.bunner += Number(order.bunner_stacks) || 0;
      demand.h30 += Number(order.hyller30_sets) || 0;
      demand.h60 += Number(order.hyller60_sets) || 0;
    });

    demand.bunner += Number(state.bunner) || 0;
    demand.h30 += Number(state.h30) || 0;
    demand.h60 += Number(state.h60) || 0;
    return demand;
  }

  function updateProduct(key, outputId, demand) {
    const output = document.getElementById(outputId);
    if (!output) return null;
    const card = output.closest(".ramp-product");

    if (!stock.loaded) {
      output.className = "stock-balance";
      output.innerHTML = '<span class="stock-now">Fysisk på lager: laster…</span><span class="stock-after">Prognose: —</span>';
      card?.classList.remove("over-stock");
      return null;
    }

    const physical = stock[key];
    const remaining = physical - demand;
    const shortage = remaining < 0;
    const forecast = shortage
      ? `Prognose: −${balanceText(key, remaining)} · Mangler ${balanceText(key, remaining)}`
      : `Etter alle bestillinger: ${balanceText(key, remaining)}`;

    output.className = "stock-balance";
    output.innerHTML = `
      <span class="stock-now">Fysisk på lager: ${balanceText(key, physical)}</span>
      <span class="stock-demand">Bestilt totalt: ${balanceText(key, demand)}</span>
      <span class="stock-after ${shortage ? "warn" : ""}">${forecast}</span>
    `;
    card?.classList.toggle("over-stock", shortage);
    return shortage ? Math.abs(remaining) : 0;
  }

  function renderStockBalance() {
    const demand = orderDemand();
    const shortages = {
      bunner: updateProduct("bunner", "bunnerOutput", demand.bunner),
      h30: updateProduct("h30", "h30Output", demand.h30),
      h60: updateProduct("h60", "h60Output", demand.h60)
    };

    const warning = document.getElementById("allOrdersShortage");
    if (warning) {
      const lines = [];
      if (shortages.bunner > 0) lines.push(`Bunner: mangler ${balanceText("bunner", shortages.bunner)}`);
      if (shortages.h30 > 0) lines.push(`Hyller x30: mangler ${balanceText("h30", shortages.h30)}`);
      if (shortages.h60 > 0) lines.push(`Hyller x60: mangler ${balanceText("h60", shortages.h60)}`);
      warning.textContent = lines.length
        ? `MANGEL FOR ALLE AKTIVE BESTILLINGER\n${lines.join("\n")}\nBestillingen kan fortsatt sendes.`
        : "";
      warning.classList.toggle("show", lines.length > 0);
    }

    const sendButton = document.getElementById("send");
    if (sendButton && !busy) sendButton.disabled = false;
  }

  renderStockBalance();
  Promise.all([loadInn(), loadUt()]).catch(() => {});
})();