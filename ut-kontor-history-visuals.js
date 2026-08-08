"use strict";

// BaMavaremottak — TEST UT Kontor unified order summary
// Version 1.7.0
// Updated: 2026-08-08 19:43 Europe/Oslo
// Same visual structure is used while ordering and after the order is created.
// Confirmed Hyller/Forlengere from UT Lager are shown ONLY in Totalt.
(() => {
  if (window.__UT_KONTOR_HISTORY_VISUALS__) return;
  window.__UT_KONTOR_HISTORY_VISUALS__ = true;

  const isUk = () => localStorage.getItem("mottak_ut_language") === "uk";
  const n = (value) => Number(value) || 0;
  const html = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const progressByOrder = new Map();

  function installStyle() {
    if (document.getElementById("utHistoryVisualStyle")) return;
    const style = document.createElement("style");
    style.id = "utHistoryVisualStyle";
    style.textContent = `
      #history .amount.ut-visual-amount{display:block;margin-top:9px;color:inherit;font-weight:inherit}
      #history .ut-extra-history{display:none!important}
      #history .ut-extra-ramp-total{display:none!important}

      .ut-unified-summary{margin-top:8px;padding:8px 10px;border:1px solid #303b59;border-radius:13px;background:#0d1426}
      .ut-unified-row{display:grid;grid-template-columns:minmax(110px,42%) minmax(0,1fr);gap:12px;align-items:start;padding:8px 0;border-top:1px solid rgba(48,59,89,.82);font-size:13px;line-height:1.3}
      .ut-unified-row:first-child{border-top:0}
      .ut-unified-label{color:#aab4ce;font-weight:700}
      .ut-unified-value{color:#f5f7ff;font-weight:900;text-align:right;overflow-wrap:anywhere}
      .ut-unified-section{padding-top:10px;margin-top:2px;border-top:1px solid #303b59}
      .ut-unified-section-title{margin-bottom:5px;color:#d8dfef;font-size:13px;font-weight:1000}
      .ut-unified-total-row{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:7px 0;border-top:1px solid rgba(48,59,89,.72);font-size:12px;line-height:1.25}
      .ut-unified-total-row:first-of-type{border-top:0}
      .ut-unified-total-label{color:#d8dfef;font-weight:800}
      .ut-unified-total-value{color:#48d597;font-weight:1000;text-align:right;white-space:nowrap}
      .ut-unified-total-row.cc-post .ut-unified-total-label,.ut-unified-total-row.cc-post .ut-unified-total-value{color:#f4c430}

      .ut-ramp-total-panel{margin:10px 0 12px;padding:10px 12px;border:1px solid rgba(72,213,151,.42);border-radius:13px;background:rgba(72,213,151,.055)}
      .ut-ramp-total-title{margin-bottom:5px;color:#f5f7ff;font-size:13px;font-weight:1000}
      .ut-ramp-total-row{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:6px 0;border-top:1px solid rgba(48,59,89,.72);font-size:12px;line-height:1.25}
      .ut-ramp-total-row:first-child{border-top:0}
      .ut-ramp-total-label{color:#d8dfef;font-weight:800}
      .ut-ramp-total-value{color:#48d597;font-weight:1000;text-align:right;white-space:nowrap}
      .ut-ramp-total-row.cc-post .ut-ramp-total-label,.ut-ramp-total-row.cc-post .ut-ramp-total-value{color:#f4c430}

      @media(max-width:520px){
        .ut-unified-summary{padding:7px 9px}
        .ut-unified-row{grid-template-columns:minmax(105px,41%) minmax(0,1fr);gap:9px;padding:7px 0;font-size:12.5px}
        .ut-unified-total-row,.ut-ramp-total-row{font-size:11.5px}
        .ut-ramp-total-panel{padding:9px 10px}
      }
    `;
    document.head.appendChild(style);
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

  function stackUnit(value) {
    return isUk() ? ukWord(value, "стопка", "стопки", "стопок") : (value === 1 ? "stabel" : "stabler");
  }
  function setUnit(value) {
    return isUk() ? ukWord(value, "комплект", "комплекти", "комплектів") : "sett";
  }
  function cartUnit(value) {
    return isUk() ? ukWord(value, "візок", "візки", "візків") : (value === 1 ? "vogn" : "vogner");
  }
  function boxUnit(value) {
    return isUk() ? ukWord(value, "ящик", "ящики", "ящиків") : (value === 1 ? "eske" : "esker");
  }

  function labels() {
    return isUk() ? {
      ramp: "Рампа", bunner: "Основи", h30: "Полиці x30", h60: "Полиці x60",
      short: "Подовжувачі короткі", long: "Подовжувачі довгі", plast: "Подовжувачі пластикові",
      total: "Всього", totalRamp: "Всього на рампі", hyller: "Hyller", post: "CC Post"
    } : {
      ramp: "Rampe", bunner: "Bunner", h30: "Hyller x30", h60: "Hyller x60",
      short: "Forlengere korte", long: "Forlengere lange", plast: "Forlengere plast",
      total: "Totalt", totalRamp: "Totalt på rampe", hyller: "Hyller", post: "CC Post"
    };
  }

  function bunnerText(stacks) {
    return `${stacks} ${stackUnit(stacks)} = ${stacks * 10} Bunner`;
  }
  function hyllerText(count, size) {
    return isUk()
      ? `${count} ${setUnit(count)} = ${count * size} полиць`
      : `${count} sett = ${count * size} hyller`;
  }

  function parseExtraBox(card) {
    const result = { short: 0, long: 0, plast: 0 };
    const text = card.querySelector(".ut-extra-history")?.textContent || "";
    const patterns = {
      short: ["Forlengere korte", "Подовжувачі короткі"],
      long: ["Forlengere lange", "Подовжувачі довгі"],
      plast: ["Forlengere plast", "Подовжувачі пластикові"],
    };
    Object.entries(patterns).forEach(([key, names]) => {
      names.some((name) => {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const match = text.match(new RegExp(`${escaped}:\\s*(\\d+)`, "i"));
        if (!match) return false;
        result[key] = n(match[1]);
        return true;
      });
    });
    return result;
  }

  function emptyActual() {
    return {
      short: { complete: false, hyller: 0, forlengere: 0, ordered: 0, confirmed: 0 },
      long: { complete: false, hyller: 0, forlengere: 0, ordered: 0, confirmed: 0 },
      plast: { complete: false, hyller: 0, forlengere: 0, ordered: 0, confirmed: 0 },
    };
  }

  function summarizeProgress(rows) {
    const grouped = {
      forlengere_korte: [],
      forlengere_lange: [],
      forlengere_plast: [],
    };
    (rows || []).forEach((row) => {
      if (grouped[row.product_id]) grouped[row.product_id].push(row);
    });

    const one = (id) => {
      const list = grouped[id] || [];
      if (!list.length) return { complete: false, hyller: 0, forlengere: 0, ordered: 0, confirmed: 0 };
      const ordered = Math.max(0, ...list.map((row) => n(row.ordered_quantity)));
      const confirmedRows = list.filter((row) => row.confirmed === true);
      const complete = ordered > 0 && confirmedRows.length === ordered;
      return {
        complete,
        ordered,
        confirmed: confirmedRows.length,
        hyller: complete ? confirmedRows.reduce((sum, row) => sum + n(row.hyller_count), 0) : 0,
        forlengere: complete ? confirmedRows.reduce((sum, row) => sum + n(row.forlengere_count), 0) : 0,
      };
    };

    return {
      short: one("forlengere_korte"),
      long: one("forlengere_lange"),
      plast: one("forlengere_plast"),
    };
  }

  function actualFor(orderId) {
    return progressByOrder.get(String(orderId)) || emptyActual();
  }

  async function refreshProgress() {
    if (typeof request !== "function") return;
    const ids = [...document.querySelectorAll("#history .order")]
      .map((card) => card.querySelector("[data-storno]")?.dataset.storno || card.querySelector("[data-edit]")?.dataset.edit)
      .filter(Boolean);

    if (!ids.length) {
      progressByOrder.clear();
      return;
    }

    const live = new Set(ids.map(String));
    [...progressByOrder.keys()].forEach((key) => {
      if (!live.has(key)) progressByOrder.delete(key);
    });

    await Promise.all(ids.map(async (id) => {
      try {
        const rows = await request("rpc/ut_extra_progress", {
          method: "POST",
          body: JSON.stringify({ p_order_id: id }),
        });
        progressByOrder.set(String(id), summarizeProgress(rows));
      } catch (error) {
        console.warn("[UT Kontor TEST] could not load confirmed extra totals", id, error);
        progressByOrder.delete(String(id));
      }
    }));
  }

  function extraTotalText(carts, actual) {
    const base = `${carts} ${cartUnit(carts)}`;
    if (!actual?.complete) return base;
    return isUk()
      ? `${base} · ${n(actual.forlengere)} шт.`
      : `${base} · ${n(actual.forlengere)} stk.`;
  }

  function totalRows(totalBunner, totalHyller, short, long, plast, actual = emptyActual()) {
    const l = labels();
    const rows = [
      ["Bunner", totalBunner, ""],
      [l.hyller, totalHyller, ""],
      [l.short, extraTotalText(short, actual.short), ""],
      [l.long, extraTotalText(long, actual.long), ""],
      [l.plast, `${plast} ${boxUnit(plast)}`, ""],
      [l.post, totalBunner * 4, "cc-post"],
    ];
    return rows.map(([label, value, cls]) => `<div class="ut-unified-total-row ${cls}"><span class="ut-unified-total-label">${html(label)}</span><span class="ut-unified-total-value">${html(value)}</span></div>`).join("");
  }

  function orderSummary(order, extras) {
    const l = labels();
    const b = n(order.bunner_stacks);
    const h30 = n(order.hyller30_sets);
    const h60 = n(order.hyller60_sets);
    const short = n(extras.short);
    const long = n(extras.long);
    const plast = n(extras.plast);
    const actual = actualFor(order.id);
    const totalBunner = b * 10 + h30 + h60 + short + long;
    const confirmedExtraHyller =
      (actual.short?.complete ? n(actual.short.hyller) : 0) +
      (actual.long?.complete ? n(actual.long.hyller) : 0);
    const totalHyller = h30 * 30 + h60 * 60 + confirmedExtraHyller;
    const ramp = String(order.ramp || "—").trim() || "—";

    const rows = [
      [l.ramp, ramp],
      [l.bunner, bunnerText(b)],
      [l.h30, hyllerText(h30, 30)],
      [l.h60, hyllerText(h60, 60)],
      [l.short, `${short} ${cartUnit(short)}`],
      [l.long, `${long} ${cartUnit(long)}`],
      [l.plast, `${plast} ${boxUnit(plast)}`],
    ];

    return `<div class="ut-unified-summary">${rows.map(([label, value]) => `<div class="ut-unified-row"><span class="ut-unified-label">${html(label)}</span><span class="ut-unified-value">${html(value)}</span></div>`).join("")}<div class="ut-unified-section"><div class="ut-unified-section-title">${html(l.total)}</div>${totalRows(totalBunner, totalHyller, short, long, plast, actual)}</div></div>`;
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

    if (sumB) sumB.textContent = bunnerText(b);
    if (sum30) sum30.textContent = hyllerText(h30, 30);
    if (sum60) sum60.textContent = hyllerText(h60, 60);
    if (sumShort) sumShort.textContent = `${short} ${cartUnit(short)}`;
    if (sumLong) sumLong.textContent = `${long} ${cartUnit(long)}`;
  }

  function decorateRampTotals() {
    if (typeof orders === "undefined" || !Array.isArray(orders)) return;
    const l = labels();

    document.querySelectorAll("#history .ramp-card").forEach((rampCard) => {
      rampCard.querySelector(".ut-ramp-total-panel")?.remove();
      rampCard.querySelector(".ut-extra-ramp-total")?.remove();

      const cards = [...rampCard.querySelectorAll(".order")];
      if (cards.length <= 1) return;

      let bunner = 0, hyller = 0, short = 0, long = 0, plast = 0;
      let shortActual = 0, longActual = 0;
      let shortExpected = 0, shortComplete = 0, longExpected = 0, longComplete = 0;

      cards.forEach((card) => {
        const id = card.querySelector("[data-storno]")?.dataset.storno || card.querySelector("[data-edit]")?.dataset.edit;
        const order = orders.find((item) => String(item.id) === String(id));
        if (!order) return;
        const ext = parseExtraBox(card);
        const actual = actualFor(id);
        const b = n(order.bunner_stacks), h30 = n(order.hyller30_sets), h60 = n(order.hyller60_sets);
        bunner += b * 10 + h30 + h60 + ext.short + ext.long;
        hyller += h30 * 30 + h60 * 60;
        if (actual.short?.complete) hyller += n(actual.short.hyller);
        if (actual.long?.complete) hyller += n(actual.long.hyller);
        short += ext.short; long += ext.long; plast += ext.plast;

        if (ext.short > 0) {
          shortExpected += 1;
          if (actual.short?.complete) {
            shortComplete += 1;
            shortActual += n(actual.short.forlengere);
          }
        }
        if (ext.long > 0) {
          longExpected += 1;
          if (actual.long?.complete) {
            longComplete += 1;
            longActual += n(actual.long.forlengere);
          }
        }
      });

      const aggregateActual = emptyActual();
      aggregateActual.short.complete = shortExpected > 0 && shortComplete === shortExpected;
      aggregateActual.short.forlengere = shortActual;
      aggregateActual.long.complete = longExpected > 0 && longComplete === longExpected;
      aggregateActual.long.forlengere = longActual;

      const panel = document.createElement("div");
      panel.className = "ut-ramp-total-panel";
      panel.innerHTML = `<div class="ut-ramp-total-title">${html(l.totalRamp)}</div>${totalRows(bunner, hyller, short, long, plast, aggregateActual).replaceAll("ut-unified-total-row", "ut-ramp-total-row").replaceAll("ut-unified-total-label", "ut-ramp-total-label").replaceAll("ut-unified-total-value", "ut-ramp-total-value")}`;
      rampCard.querySelector(".ramp-orders")?.insertAdjacentElement("beforebegin", panel);
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
      const extras = parseExtraBox(card);
      amount.classList.add("ut-visual-amount");
      amount.innerHTML = orderSummary(order, extras);
    });

    decorateRampTotals();
  }

  function updateVersionLabel() {
    const version = document.querySelector(".version");
    if (!version) return;
    version.innerHTML = `TEST UT Kontor v2.12 · RAMP TOTALS<br>${isUk() ? "Оновлено" : "Oppdatert"} 08.08.2026 kl. 19:43`;
  }

  function decorate() {
    decorateHistory();
    decorateSummary();
    updateVersionLabel();
  }

  const previousRenderHistory = window.renderHistory;
  window.renderHistory = function renderHistoryUnified() {
    if (typeof previousRenderHistory === "function") previousRenderHistory();
    decorate();
  };

  const previousRenderForm = window.renderForm;
  window.renderForm = function renderFormUnified() {
    if (typeof previousRenderForm === "function") previousRenderForm();
    decorateSummary();
    updateVersionLabel();
  };

  const previousLoadUt = window.loadUt;
  if (typeof previousLoadUt === "function") {
    window.loadUt = async function loadUtWithConfirmedTotals(...args) {
      const result = await previousLoadUt.apply(this, args);
      await refreshProgress();
      decorate();
      return result;
    };
  }

  ["bunnerQty", "h30Qty", "h60Qty", "forlengere_korteQty", "forlengere_langeQty", "forlengere_plastQty"].forEach((id) => {
    const input = document.getElementById(id);
    input?.addEventListener("input", () => setTimeout(decorateSummary, 0));
    input?.addEventListener("change", () => setTimeout(decorateSummary, 0));
  });
  document.querySelector(".ramp-products")?.addEventListener("click", () => setTimeout(decorateSummary, 0));

  window.UT_KONTOR_HISTORY_VISUALS = {
    version: "1.7.0",
    updatedAt: "2026-08-08T19:43:00+02:00",
    decorate,
    refreshProgress: async () => {
      await refreshProgress();
      decorate();
    },
  };

  decorate();
  refreshProgress().then(decorate).catch((error) => console.warn("[UT Kontor TEST] initial confirmed totals refresh failed", error));
})();
