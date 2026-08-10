"use strict";
(() => {
  if (window.__BAMA_UT_KONTOR_VRAK__) return;
  window.__BAMA_UT_KONTOR_VRAK__ = true;

  const VRAK_IDS = ["vrak_bunner", "vrak_hyller"];
  const LABELS = { vrak_bunner: "Vrak bunner", vrak_hyller: "Vrak hyller" };
  const NOTES = { vrak_bunner: "1 stabel = 10 Vrak bunner.", vrak_hyller: "1 stabel = 30 Vrak hyller." };
  const state = { vrak_bunner: 0, vrak_hyller: 0 };
  let itemsByOrder = new Map();

  const qty = value => {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const html = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

  function registry() { return window.parent?.BAMA_PRODUCTS || window.BAMA_PRODUCTS; }
  function productName(id) { return registry()?.getProductName?.(id, "no") || LABELS[id] || id; }

  function addStyle() {
    if (document.getElementById("utKontorVrakStyle")) return;
    const s = document.createElement("style");
    s.id = "utKontorVrakStyle";
    s.textContent = `
      .ut-vrak-product{border-color:rgba(255,115,115,.58)!important;background:rgba(255,115,115,.045)!important}
      .ut-vrak-product .ut-vrak-unit{display:inline-flex;margin-top:6px;padding:4px 7px;border:1px solid rgba(255,115,115,.45);border-radius:999px;color:#ffcaca;font-size:10px;font-weight:950}
      .ut-vrak-note{margin-top:7px;color:var(--muted);font-size:11px;font-weight:750;line-height:1.4}
      .ut-vrak-summary{color:#ffcaca}
      .ut-vrak-history{margin-top:7px;padding:8px 10px;border:1px solid rgba(255,115,115,.38);border-radius:10px;background:rgba(255,115,115,.05);color:#ffdada;font-size:12px;font-weight:850;line-height:1.45}
    `;
    document.head.appendChild(s);
  }

  function card(id) {
    const article = document.createElement("article");
    article.className = "ramp-product ut-vrak-product";
    article.dataset.utVrakProductId = id;
    article.innerHTML = `
      <div class="ramp-product-head">
        <div><strong>${html(productName(id))}</strong><div class="ut-vrak-unit">stabler</div></div>
        <output id="${id}Output">0 stabler</output>
      </div>
      <div class="ut-vrak-note">${html(NOTES[id])}</div>
      <div class="qty compact">
        <button class="step" type="button" data-vrak-minus="${id}">−</button>
        <input id="${id}Qty" type="number" min="0" value="0" inputmode="numeric">
        <button class="step" type="button" data-vrak-plus="${id}">+</button>
      </div>
      <div class="quick">
        <button type="button" data-vrak-set="${id}:0">0</button>
        <button type="button" data-vrak-set="${id}:1">1</button>
        <button type="button" data-vrak-set="${id}:3">3</button>
        <button type="button" data-vrak-set="${id}:10">10</button>
      </div>`;
    return article;
  }

  function installCards() {
    const host = document.querySelector(".ramp-products");
    if (!host || document.querySelector('[data-ut-vrak-product-id="vrak_bunner"]')) return;
    VRAK_IDS.forEach(id => host.appendChild(card(id)));
    VRAK_IDS.forEach(id => {
      const input = document.getElementById(`${id}Qty`);
      input?.addEventListener("input", () => setValue(id, input.value));
      input?.addEventListener("change", () => setValue(id, input.value));
    });
    document.querySelectorAll("[data-vrak-minus]").forEach(b => b.addEventListener("click", () => setValue(b.dataset.vrakMinus, state[b.dataset.vrakMinus] - 1)));
    document.querySelectorAll("[data-vrak-plus]").forEach(b => b.addEventListener("click", () => setValue(b.dataset.vrakPlus, state[b.dataset.vrakPlus] + 1)));
    document.querySelectorAll("[data-vrak-set]").forEach(b => b.addEventListener("click", () => {
      const [id, value] = b.dataset.vrakSet.split(":"); setValue(id, value);
    }));
  }

  function installSummary() {
    const summary = document.querySelector(".compact-summary");
    const total = summary?.querySelector(".total-line");
    if (!summary || !total || document.getElementById("sumVrakBunner")) return;
    [["vrak_bunner","sumVrakBunner"],["vrak_hyller","sumVrakHyller"]].forEach(([id,outId]) => {
      const row = document.createElement("div");
      row.className = "summary-row ut-vrak-summary";
      row.innerHTML = `<span>${html(productName(id))}</span><strong id="${outId}">0 stabler</strong>`;
      summary.insertBefore(row, total);
    });
  }

  function setValue(id, value, render = true) {
    state[id] = Math.max(0, qty(value));
    const input = document.getElementById(`${id}Qty`);
    if (input) input.value = String(state[id]);
    if (render) renderState();
  }
  function reset() { VRAK_IDS.forEach(id => setValue(id, 0, false)); renderState(); }
  function renderState() {
    VRAK_IDS.forEach(id => {
      const out = document.getElementById(`${id}Output`);
      if (out) out.textContent = `${state[id]} ${state[id] === 1 ? "stabel" : "stabler"}`;
    });
    const a = document.getElementById("sumVrakBunner");
    const b = document.getElementById("sumVrakHyller");
    if (a) a.textContent = `${state.vrak_bunner} ${state.vrak_bunner === 1 ? "stabel" : "stabler"}`;
    if (b) b.textContent = `${state.vrak_hyller} ${state.vrak_hyller === 1 ? "stabel" : "stabler"}`;
  }

  function vrakItems() {
    const reg = registry();
    return VRAK_IDS.filter(id => state[id] > 0).map(id => ({
      product_id: id,
      quantity: state[id],
      unit: "stabel",
      sort_order: Number(reg?.getProductById?.(id)?.sortOrder) || (id === "vrak_bunner" ? 70 : 80),
      metadata: { stack_size: id === "vrak_bunner" ? 10 : 30, rfid: true }
    }));
  }

  function itemText(item) {
    const q = Number(item.quantity) || 0;
    return `${productName(item.product_id)}: ${q} ${q === 1 ? "stabel" : "stabler"}`;
  }

  async function loadItems() {
    try {
      const rows = await request("ut_order_items?select=order_id,product_id,quantity,unit,sort_order,metadata&order=sort_order.asc&limit=5000") || [];
      itemsByOrder = new Map();
      rows.filter(row => VRAK_IDS.includes(row.product_id)).forEach(row => {
        const key = String(row.order_id);
        if (!itemsByOrder.has(key)) itemsByOrder.set(key, []);
        itemsByOrder.get(key).push(row);
      });
    } catch (error) {
      console.error("[UT Kontor Vrak] load items failed", error);
      itemsByOrder = new Map();
    }
  }

  function decorateHistory() {
    document.querySelectorAll("#history .order").forEach(card => {
      const id = card.querySelector("[data-storno]")?.dataset.storno || card.querySelector("[data-edit]")?.dataset.edit;
      if (!id) return;
      card.querySelector(".ut-vrak-history")?.remove();
      const items = itemsByOrder.get(String(id)) || [];
      if (!items.length) return;
      const div = document.createElement("div");
      div.className = "ut-vrak-history";
      div.innerHTML = items.map(item => html(itemText(item))).join("<br>");
      card.querySelector(".amount")?.insertAdjacentElement("afterend", div);
    });
  }

  function loadEdit(id) {
    const items = itemsByOrder.get(String(id)) || [];
    VRAK_IDS.forEach(productId => {
      const item = items.find(x => x.product_id === productId);
      setValue(productId, Number(item?.quantity) || 0, false);
    });
    renderState();
  }

  async function saveWholeOrder() {
    if (typeof request !== "function") return;
    const ramp = normalizeRamp(document.getElementById("ramp")?.value);
    const baseItems = window.BAMA_UT_KONTOR_PRODUCTS?.collectItems?.() || [];
    const items = [...baseItems, ...vrakItems()].sort((a,b)=>(Number(a.sort_order)||999)-(Number(b.sort_order)||999));
    if (!ramp) { msg("Velg rampe.", "bad"); document.getElementById("ramp")?.focus(); return; }
    if (!items.length) { msg("Legg minst én varetype til rampen.", "bad"); return; }
    if (busy) return;

    busy = true;
    const send = document.getElementById("send");
    if (send) send.disabled = true;
    document.getElementById("receipt")?.classList.remove("show");
    try {
      msg("Lagrer hele bestillingen…");
      const body = {
        p_order_id: editingId || null,
        p_order_number: editingId ? null : orderNumber(),
        p_ramp: ramp,
        p_recipient: document.getElementById("mottaker")?.value.trim() || null,
        p_transporter: document.getElementById("transporter")?.value.trim() || null,
        p_office_note: document.getElementById("officeNote")?.value.trim() || null,
        p_items: items,
      };
      const result = await request("rpc/save_ut_order_with_items", { method: "POST", body: JSON.stringify(body) });
      const row = Array.isArray(result) ? result[0] : result;
      if (!row?.id) throw new Error("Databasen returnerte ingen ordre.");
      const wasEdit = Boolean(editingId);
      if (!wasEdit) {
        const receipt = document.getElementById("receipt");
        const receiptNo = document.getElementById("receiptNo");
        const receiptText = document.getElementById("receiptText");
        if (receiptNo) receiptNo.textContent = row.order_number;
        if (receiptText) receiptText.textContent = items.map(item => VRAK_IDS.includes(item.product_id) ? itemText(item) : `${productName(item.product_id)}: ${item.quantity} ${item.unit}`).join(" · ");
        receipt?.classList.add("show");
      }
      window.clearForm(false, !wasEdit);
      reset();
      msg(wasEdit ? "Bestillingen er oppdatert." : "Bestillingen er sendt til lageret.", "ok");
      await Promise.all([loadInn(), window.loadUt()]);
    } catch (error) {
      msg(`Kunne ikke lagre bestillingen.\n${error.message || error}`, "bad");
    } finally {
      busy = false;
      const button = document.getElementById("send");
      if (button) button.disabled = false;
    }
  }

  function replaceSend() {
    const old = document.getElementById("send");
    if (!old || old.dataset.utVrakHandler === "1") return;
    const fresh = old.cloneNode(true);
    fresh.dataset.utVrakHandler = "1";
    old.replaceWith(fresh);
    fresh.addEventListener("click", saveWholeOrder);
  }

  const baseLoadUt = window.loadUt;
  window.loadUt = async function loadUtWithVrak() {
    if (typeof baseLoadUt === "function") await baseLoadUt();
    await loadItems();
    decorateHistory();
  };
  const baseRenderHistory = window.renderHistory;
  window.renderHistory = function renderHistoryWithVrak() {
    if (typeof baseRenderHistory === "function") baseRenderHistory();
    decorateHistory();
  };
  const baseClearForm = window.clearForm;
  window.clearForm = function clearFormWithVrak(...args) {
    if (typeof baseClearForm === "function") baseClearForm(...args);
    reset();
  };

  document.addEventListener("click", event => {
    const edit = event.target.closest("[data-edit]");
    if (edit?.dataset.edit) setTimeout(() => loadEdit(edit.dataset.edit), 80);
    if (event.target.closest("#reset")) setTimeout(reset, 0);
  }, true);

  async function start() {
    addStyle();
    installCards();
    installSummary();
    renderState();
    replaceSend();
    await loadItems();
    decorateHistory();
    console.info("UT Kontor Vrak products active: vrak_bunner, vrak_hyller");
  }
  start().catch(error => console.error("[UT Kontor Vrak] start failed", error));
})();
