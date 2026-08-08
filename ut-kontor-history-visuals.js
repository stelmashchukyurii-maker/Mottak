"use strict";

// BaMavaremottak — TEST UT Kontor history visuals
// Version 1.5.0
// Updated: 2026-08-08 14:12 Europe/Oslo
// Bundled Bunner/CC Post are counted in Totalt only, including ramp totals.
(() => {
  if (window.__UT_KONTOR_HISTORY_VISUALS__) return;
  window.__UT_KONTOR_HISTORY_VISUALS__ = true;

  const isUk = () => localStorage.getItem("mottak_ut_language") === "uk";
  const n = (value) => Number(value) || 0;

  function installStyle() {
    if (document.getElementById("utHistoryVisualStyle")) return;
    const style = document.createElement("style");
    style.id = "utHistoryVisualStyle";
    style.textContent = `
      #history .amount.ut-visual-amount{display:grid;gap:8px;margin-top:9px;color:inherit;font-weight:inherit}
      .ut-product-line{display:grid;grid-template-columns:52px minmax(0,1fr);gap:10px;align-items:center;padding:9px 10px;border:1px solid #303b59;border-radius:12px;background:#0d1426}
      .ut-product-copy{min-width:0}.ut-product-title{font-size:14px;font-weight:1000;line-height:1.2;color:#f5f7ff}.ut-product-detail{margin-top:4px;font-size:12px;font-weight:850;line-height:1.35;color:#d8dfef}.ut-product-detail strong{color:#f4c430;font-weight:1000}
      .ut-product-iconbox{width:48px;height:48px;display:flex;align-items:center;justify-content:center;border:1px solid #303b59;border-radius:50%;background:#0a1120;position:relative;overflow:visible}
      .ut-product-mark{position:relative;display:block;width:31px;height:34px;color:#cbd4e4}
      .ut-product-mark::after{content:"";position:absolute;left:50%;bottom:-5px;transform:translateX(-50%);width:5px;height:9px;border-radius:2px;background:#f4c430;box-shadow:0 0 0 1px rgba(244,196,48,.35)}
      .ut-product-mark.bunner{height:27px;width:33px;border-left:2px solid currentColor;border-right:2px solid currentColor;background:repeating-linear-gradient(to bottom,transparent 0 3px,currentColor 3px 5px,transparent 5px 7px)}
      .ut-product-mark.bunner::before{content:"";position:absolute;left:3px;right:3px;bottom:-2px;height:5px;background:radial-gradient(circle at 3px 2px,#a78348 0 2px,transparent 2.5px),radial-gradient(circle at calc(100% - 3px) 2px,#a78348 0 2px,transparent 2.5px)}
      .ut-product-mark.rack{border:2px solid currentColor;border-top-width:2px;border-bottom-width:3px;border-radius:1px}
      .ut-product-mark.rack::before{content:"";position:absolute;inset:3px 4px;background:repeating-linear-gradient(to bottom,currentColor 0 1.4px,transparent 1.4px 5px)}
      .ut-product-mark.rack60::before{background:repeating-linear-gradient(to bottom,currentColor 0 1.2px,transparent 1.2px 3px)}
      .ut-ramp-total-panel{margin:10px 0 12px;padding:10px 12px;border:1px solid rgba(72,213,151,.42);border-radius:12px;background:rgba(72,213,151,.055)}
      .ut-ramp-total-title{margin-bottom:5px;color:#f5f7ff;font-size:13px;font-weight:1000}
      .ut-ramp-total-grid{display:grid;gap:0}
      .ut-ramp-total-row{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:6px 0;border-top:1px solid rgba(48,59,89,.72);font-size:12px;line-height:1.25}
      .ut-ramp-total-row:first-child{border-top:0}.ut-ramp-total-label{color:#d8dfef;font-weight:800}.ut-ramp-total-value{color:#48d597;font-weight:1000;text-align:right;white-space:nowrap}
      .ut-ramp-total-row.cc-post .ut-ramp-total-label,.ut-ramp-total-row.cc-post .ut-ramp-total-value{color:#f4c430}
      @media(max-width:520px){.ut-product-line{grid-template-columns:46px minmax(0,1fr);gap:8px;padding:8px}.ut-product-iconbox{width:43px;height:43px}.ut-product-title{font-size:13px}.ut-product-detail{font-size:11.5px}.ut-ramp-total-panel{padding:9px 10px}.ut-ramp-total-row{font-size:11.5px}}
    `;
    document.head.appendChild(style);
  }

  function row(type, title, detailHtml) {
    return `<div class="ut-product-line"><span class="ut-product-iconbox" aria-hidden="true"><span class="ut-product-mark ${type}"></span></span><div class="ut-product-copy"><div class="ut-product-title">${title}</div><div class="ut-product-detail">${detailHtml}</div></div></div>`;
  }

  function detailBunner(count) {
    const total = count * 10;
    return isUk()
      ? `${count} ${count === 1 ? "стопка" : "стопок"} = <strong>${total} Bunner</strong>`
      : `${count} ${count === 1 ? "stabel" : "stabler"} = <strong>${total} Bunner</strong>`;
  }

  function detailHyller(count, size) {
    const hyller = count * size;
    return isUk()
      ? `${count} ${count === 1 ? "комплект" : "комплектів"} = <strong>${hyller} полиць</strong>`
      : `${count} sett = <strong>${hyller} hyller</strong>`;
  }

  function forlengereSummaryText(count) {
    return isUk()
      ? `${count} ${count === 1 ? "візок" : "візків"}`
      : `${count} ${count === 1 ? "vogn" : "vogner"}`;
  }

  function ukWord(value, one, few, many) {
    const abs = Math.abs(Number(value) || 0);
    const mod100 = abs % 100;
    const mod10 = abs % 10;
    if (mod100 >= 11 && mod100 <= 19) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
  }

  function cartUnit(value) {
    return isUk() ? ukWord(value, "візок", "візки", "візків") : (value === 1 ? "vogn" : "vogner");
  }

  function boxUnit(value) {
    return isUk() ? ukWord(value, "ящик", "ящики", "ящиків") : (value === 1 ? "eske" : "esker");
  }

  function decorateSummary() {
    const b = n(document.getElementById("bunnerQty")?.value);
    const h30 = n(document.getElementById("h30Qty")?.value);
    const h60 = n(document.getElementById("h60Qty")?.value);
    const short = n(document.getElementById("forlengere_korteQty")?.value);
    const long = n(document.getElementById("forlengere_langeQty")?.value);
    const sumB = document.getElementById("sumBunner");
    const sum30 = document.getElementById("sumH30");
    const sum60 = document.getElementById("sumH60");
    const sumShort = document.getElementById("sumForlengereKorte");
    const sumLong = document.getElementById("sumForlengereLange");

    if (sumB) {
      const bases = b * 10;
      sumB.textContent = isUk()
        ? `${b} ${b === 1 ? "стопка" : "стопок"} = ${bases} Bunner`
        : `${b} ${b === 1 ? "stabel" : "stabler"} = ${bases} Bunner`;
    }
    if (sum30) {
      sum30.textContent = isUk()
        ? `${h30} ${h30 === 1 ? "комплект" : "комплектів"} = ${h30 * 30} полиць`
        : `${h30} sett = ${h30 * 30} hyller`;
    }
    if (sum60) {
      sum60.textContent = isUk()
        ? `${h60} ${h60 === 1 ? "комплект" : "комплектів"} = ${h60 * 60} полиць`
        : `${h60} sett = ${h60 * 60} hyller`;
    }
    if (sumShort) sumShort.textContent = forlengereSummaryText(short);
    if (sumLong) sumLong.textContent = forlengereSummaryText(long);
  }

  function decorateForlengereHistory() {
    document.querySelectorAll("#history .ut-extra-history").forEach((box) => {
      const lines = (box.innerText || "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return;
      box.innerHTML = lines.map((line) => line
        .replace(/\s*=\s*\d+\s+Bunner(?:\s*\+\s*\d+\s+CC Post)?\s*$/i, "")
        .replace(/\s*\+\s*\d+\s+CC Post\s*$/i, "")
      ).join("<br>");
    });
  }

  function extraCount(rampCard, type) {
    const patterns = {
      short: ["Forlengere korte", "Подовжувачі короткі"],
      long: ["Forlengere lange", "Подовжувачі довгі"],
      plast: ["Forlengere plast", "Подовжувачі пластикові"],
    }[type] || [];
    let total = 0;
    rampCard.querySelectorAll(".ut-extra-history").forEach((box) => {
      const text = box.textContent || "";
      patterns.forEach((label) => {
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const match = text.match(new RegExp(`${escaped}:\\s*(\\d+)`, "i"));
        if (match) total += n(match[1]);
      });
    });
    return total;
  }

  function decorateRampTotals() {
    if (typeof orders === "undefined" || !Array.isArray(orders)) return;
    document.querySelectorAll("#history .ramp-card").forEach((rampCard) => {
      rampCard.querySelector(".ut-ramp-total-panel")?.remove();
      rampCard.querySelector(".ut-extra-ramp-total")?.remove();

      const ids = [...rampCard.querySelectorAll("[data-storno]")].map((button) => String(button.dataset.storno));
      const rampOrders = ids.map((id) => orders.find((order) => String(order.id) === id)).filter(Boolean);
      if (!rampOrders.length) return;

      const base = rampOrders.reduce((sum, order) => {
        const stacks = n(order.bunner_stacks);
        const h30 = n(order.hyller30_sets);
        const h60 = n(order.hyller60_sets);
        sum.bunner += stacks * 10 + h30 + h60;
        sum.hyller += h30 * 30 + h60 * 60;
        return sum;
      }, { bunner: 0, hyller: 0 });

      const short = extraCount(rampCard, "short");
      const long = extraCount(rampCard, "long");
      const plast = extraCount(rampCard, "plast");
      const bunner = base.bunner + short + long;
      const ccPosts = bunner * 4;

      const oldSummary = rampCard.querySelector(".ramp-card-head .field-help");
      if (oldSummary) oldSummary.textContent = isUk()
        ? `Всього: ${bunner} Bunner · ${base.hyller} полиць`
        : `Totalt: ${bunner} Bunner · ${base.hyller} hyller`;

      const labels = isUk()
        ? { title: "Всього на рампі", bunner: "Bunner", hyller: "Hyller", short: "Подовжувачі короткі", long: "Подовжувачі довгі", plast: "Подовжувачі пластикові", post: "CC Post" }
        : { title: "Totalt på rampe", bunner: "Bunner", hyller: "Hyller", short: "Forlengere korte", long: "Forlengere lange", plast: "Forlengere plast", post: "CC Post" };

      const rows = [
        [labels.bunner, String(bunner), ""],
        [labels.hyller, String(base.hyller), ""],
        [labels.short, `${short} ${cartUnit(short)}`, ""],
        [labels.long, `${long} ${cartUnit(long)}`, ""],
        [labels.plast, `${plast} ${boxUnit(plast)}`, ""],
        [labels.post, String(ccPosts), "cc-post"],
      ];

      const panel = document.createElement("div");
      panel.className = "ut-ramp-total-panel";
      panel.innerHTML = `<div class="ut-ramp-total-title">${labels.title}</div><div class="ut-ramp-total-grid">${rows.map(([label, value, cls]) => `<div class="ut-ramp-total-row ${cls}"><span class="ut-ramp-total-label">${label}</span><span class="ut-ramp-total-value">${value}</span></div>`).join("")}</div>`;
      const ordersHost = rampCard.querySelector(".ramp-orders");
      if (ordersHost) ordersHost.insertAdjacentElement("beforebegin", panel);
      else rampCard.querySelector(".ramp-card-head")?.insertAdjacentElement("afterend", panel);
    });
  }

  function decorateHistory() {
    installStyle();
    if (typeof orders === "undefined" || !Array.isArray(orders)) return;

    document.querySelectorAll("#history .order").forEach((card) => {
      const id = card.querySelector("[data-storno]")?.dataset.storno || card.querySelector("[data-edit]")?.dataset.edit;
      if (!id) return;
      const order = orders.find((item) => String(item.id) === String(id));
      if (!order) return;
      const amount = card.querySelector(".amount");
      if (!amount) return;

      const b = n(order.bunner_stacks);
      const h30 = n(order.hyller30_sets);
      const h60 = n(order.hyller60_sets);
      const rows = [];
      if (b) rows.push(row("bunner", "Bunner", detailBunner(b)));
      if (h30) rows.push(row("rack rack30", "Hyller x30", detailHyller(h30, 30)));
      if (h60) rows.push(row("rack rack60", "Hyller x60", detailHyller(h60, 60)));
      if (!rows.length) rows.push(`<div class="ut-product-detail">${isUk() ? "Немає товарів" : "Ingen varer"}</div>`);
      amount.classList.add("ut-visual-amount");
      amount.innerHTML = rows.join("");
    });

    decorateForlengereHistory();
    decorateRampTotals();
  }

  function decorate() {
    decorateHistory();
    decorateSummary();
  }

  const previousRenderHistory = window.renderHistory;
  window.renderHistory = function renderHistoryWithVisuals() {
    if (typeof previousRenderHistory === "function") previousRenderHistory();
    decorate();
  };

  const previousRenderForm = window.renderForm;
  window.renderForm = function renderFormWithCleanBundleDisplay() {
    if (typeof previousRenderForm === "function") previousRenderForm();
    decorateSummary();
  };

  ["bunnerQty", "h30Qty", "h60Qty", "forlengere_korteQty", "forlengere_langeQty"].forEach((id) => {
    const input = document.getElementById(id);
    input?.addEventListener("input", () => setTimeout(decorateSummary, 0));
    input?.addEventListener("change", () => setTimeout(decorateSummary, 0));
  });
  document.querySelector(".ramp-products")?.addEventListener("click", () => setTimeout(decorateSummary, 0));

  window.UT_KONTOR_HISTORY_VISUALS = { version: "1.5.0", decorate };
  decorate();
})();