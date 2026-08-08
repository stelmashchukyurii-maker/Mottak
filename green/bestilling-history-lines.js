"use strict";

(() => {
  const style = document.createElement("style");
  style.textContent = `
    .amount.product-lines{display:grid;gap:8px;margin-top:12px}
    .product-line{display:grid;grid-template-columns:minmax(120px,.6fr) minmax(0,1fr);gap:12px;align-items:baseline;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:rgba(21,28,48,.55)}
    .product-line-name{font-size:17px;font-weight:950;color:var(--accent)}
    .product-line-value{font-size:17px;font-weight:900;line-height:1.35}
    @media(max-width:560px){.product-line{grid-template-columns:1fr;gap:3px}.product-line-name,.product-line-value{font-size:16px}}
  `;
  document.head.appendChild(style);

  function productLines(order) {
    const rows = [];
    const b = Number(order.bunner_stacks) || 0;
    const h30 = Number(order.hyller30_sets) || 0;
    const h60 = Number(order.hyller60_sets) || 0;

    if (b) rows.push(["Bunner", `${b} ${b === 1 ? "stabel" : "stabler"} × 10 = ${b * 10} Bunner`]);
    if (h30) rows.push(["Hyller x30", `${h30} ${h30 === 1 ? "sett" : "sett"} = ${h30} Bunner + ${h30 * 30} hyller`]);
    if (h60) rows.push(["Hyller x60", `${h60} ${h60 === 1 ? "sett" : "sett"} = ${h60} Bunner + ${h60 * 60} hyller`]);

    if (!rows.length) return '<div class="product-line"><span class="product-line-name">Produkter</span><span class="product-line-value">Ingen varer</span></div>';

    return rows.map(([name, value]) => `
      <div class="product-line">
        <span class="product-line-name">${esc(name)}</span>
        <span class="product-line-value">${esc(value)}</span>
      </div>
    `).join("");
  }

  renderHistory = function renderHistoryWithProductLines() {
    const groups = groupActiveByRamp();
    $("historyCount").textContent = String(groups.length);
    if (!groups.length) {
      $("history").innerHTML = '<div class="empty">Ingen aktive ramper.</div>';
      return;
    }

    $("history").innerHTML = groups.map(([ramp, rampOrders]) => {
      const aggregate = rampOrders.reduce((sum, order) => ({
        b: sum.b + (Number(order.bunner_stacks) || 0),
        h30: sum.h30 + (Number(order.hyller30_sets) || 0),
        h60: sum.h60 + (Number(order.hyller60_sets) || 0),
      }), { b: 0, h30: 0, h60: 0 });
      const total = totals({ bunner: aggregate.b, h30: aggregate.h30, h60: aggregate.h60 });
      const legacy = rampOrders.length > 1 ? `<div class="field-help">${rampOrders.length} eldre aktive poster ligger under samme rampe. Nye dubletter blokkeres.</div>` : "";
      const cards = rampOrders.map((order) => {
        const canEdit = order.status === "new";
        return `<article class="order">
          <div class="order-top"><div class="order-number">${esc(order.order_number || order.id)}</div><strong>${esc(statusLabel(order))}</strong></div>
          <div class="amount product-lines">${productLines(order)}</div>
          <div class="meta">${date(order.created_at)}${order.office_note ? ` · ${esc(order.office_note)}` : ""}</div>
          <div class="order-actions">
            ${canEdit ? `<button class="order-action edit-action" data-edit="${esc(order.id)}">Rediger rampen</button>` : ""}
            <button class="order-action storno-action" data-storno="${esc(order.id)}">Storner</button>
          </div>
        </article>`;
      }).join("");
      return `<section class="ramp-card">
        <div class="ramp-card-head"><div><div class="ramp-title">RAMPE ${esc(ramp)}</div><div class="field-help">Samlet: ${total.bunner} Bunner · ${total.hyller} hyller</div></div><span class="ramp-state">${rampOrders.length} oppdrag</span></div>
        ${legacy}<div class="ramp-orders">${cards}</div>
      </section>`;
    }).join("");

    document.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => startEdit(button.dataset.edit)));
    document.querySelectorAll("[data-storno]").forEach((button) => button.addEventListener("click", () => stornOrder(button.dataset.storno)));
  };

  renderHistory();
})();
