"use strict";
(() => {
  const HISTORY_ID = "history";

  function ensureStyle() {
    if (document.getElementById("utNoScanStageStyle")) return;
    const s = document.createElement("style");
    s.id = "utNoScanStageStyle";
    s.textContent = `
      .ut-stage-all-noscan{background:#f4c430!important;color:#17130a!important;border-color:#f4c430!important;font-weight:950!important}
      .ut-stage-all-noscan:disabled{opacity:.55!important;cursor:not-allowed!important}
    `;
    document.head.appendChild(s);
  }

  function orderSummary(card) {
    const number = card.querySelector(".order-number")?.textContent?.trim() || "ordre";
    const amount = card.querySelector(".amount")?.textContent?.trim() || "alle bestilte varer";
    return { number, amount };
  }

  async function stageOrder(orderId, button, card) {
    const { number, amount } = orderSummary(card);
    const ok = confirm(
      `FLYTT HELE ORDREN TIL RAMPE · UTEN SKANNING\n\n${number}\n${amount}\n\nKun varer i denne ordren flyttes. Ingenting annet på lageret berøres.\n\nBekreft?`
    );
    if (!ok) return;

    button.disabled = true;
    const old = button.textContent;
    button.textContent = "FLYTTER…";
    try {
      if (typeof request !== "function") throw new Error("UT API er ikke klar.");
      const result = await request("rpc/office_stage_order_without_scanning", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ p_order_id: orderId }),
      });
      const row = Array.isArray(result) ? result[0] : result;
      alert(`✓ ORDREN ER PÅ RAMPE${row?.ramp ? ` ${row.ramp}` : ""}\n\nKun denne ordren ble flyttet.`);
      if (typeof loadUt === "function") await loadUt();
      if (typeof loadInn === "function") await loadInn();
      if (typeof BAMA_STOCK_SUMMARY_REFRESH === "function") await BAMA_STOCK_SUMMARY_REFRESH();
    } catch (e) {
      alert(`Kunne ikke flytte ordren uten skanning:\n${e?.message || e}`);
      button.disabled = false;
      button.textContent = old;
    }
  }

  function decorate() {
    ensureStyle();
    const root = document.getElementById(HISTORY_ID);
    if (!root) return;
    root.querySelectorAll("article.order").forEach(card => {
      if (card.querySelector(".ut-stage-all-noscan")) return;
      const edit = card.querySelector("[data-edit]");
      const storno = card.querySelector("[data-storno]");
      const actions = card.querySelector(".order-actions");
      if (!edit || !storno || !actions) return; // only NEW, untouched orders
      const orderId = edit.dataset.edit || storno.dataset.storno;
      if (!orderId) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "order-action ut-stage-all-noscan";
      b.textContent = "FLYTT HELE ORDREN TIL RAMPE · UTEN SKANNING";
      b.addEventListener("click", () => stageOrder(orderId, b, card));
      actions.insertBefore(b, actions.firstChild);
    });
  }

  const root = document.getElementById(HISTORY_ID);
  if (root) new MutationObserver(decorate).observe(root, { childList: true, subtree: true });
  decorate();
  window.UT_KONTOR_STAGE_ALL_NO_SCAN = { decorate };
})();
