"use strict";

(() => {
  if (window.__BAMA_UT_KONTOR_PRODUCTS__) return;
  window.__BAMA_UT_KONTOR_PRODUCTS__ = true;

  const registry = window.parent?.BAMA_PRODUCTS || window.BAMA_PRODUCTS;
  if (!registry || typeof request !== "function") {
    console.error("[UT Kontor TEST] products registry or request() is missing.");
    return;
  }

  const VERSION = "1.1.0";
  const UPDATED_AT = "2026-08-08T13:50:00+02:00";
  const EXTRA_IDS = ["forlengere_korte", "forlengere_lange", "forlengere_plast"];
  const extState = {
    forlengere_korte: 0,
    forlengere_lange: 0,
    forlengere_plast: 0,
  };
  let orderItems = [];
  let itemsByOrder = new Map();

  const language = () => localStorage.getItem("mottak_ut_language") === "uk" ? "uk" : "no";
  const isUk = () => language() === "uk";
  const productName = (id) => registry.getProductName(id, language()) || id;
  const qty = (value) => {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  function injectStyle() {
    if (document.getElementById("utKontorProductsStyle")) return;
    const style = document.createElement("style");
    style.id = "utKontorProductsStyle";
    style.textContent = `
      .ut-extra-product{border-color:rgba(117,183,255,.58)!important;background:rgba(117,183,255,.045)!important}
      .ut-extra-product .ut-extra-note{margin-top:7px;color:var(--muted);font-size:11px;font-weight:700;line-height:1.45}
      .ut-extra-product .ut-extra-unit{display:inline-flex;margin-top:6px;padding:4px 7px;border:1px solid rgba(117,183,255,.45);border-radius:999px;color:#cce4ff;font-size:10px;font-weight:950}
      .ut-extra-summary{color:#cce4ff}
      .ut-extra-history{margin-top:7px;padding:8px 10px;border:1px solid rgba(117,183,255,.38);border-radius:10px;background:rgba(117,183,255,.055);color:#ddecff;font-size:12px;font-weight:850;line-height:1.5}
      .ut-extra-ramp-total{margin-top:4px;color:#cce4ff;font-size:11px;font-weight:850}
      .compact-summary .total-line.ut-total-line{display:block!important;padding-top:12px!important}
      .compact-summary .total-line.ut-total-line>span{display:block;margin-bottom:9px;font-weight:900}
      #sumTotal.ut-total-stack{display:grid!important;width:100%;gap:0;color:#48d597;text-align:left;font-size:13px;line-height:1.25}
      #sumTotal .ut-total-row{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:7px 0;border-top:1px solid rgba(48,59,89,.72)}
      #sumTotal .ut-total-row:first-child{border-top:0}
      #sumTotal .ut-total-label{color:#d8dfef;font-weight:800}
      #sumTotal .ut-total-value{color:#48d597;font-weight:1000;text-align:right;white-space:nowrap}
      #sumTotal .ut-total-row.cc-post .ut-total-label,#sumTotal .ut-total-row.cc-post .ut-total-value{color:#f4c430}
    `;
    document.head.appendChild(style);
  }

  function extraCopy(id) {
    if (id === "forlengere_plast") {
      return isUk()
        ? { unit: "ящиків", note: "1 одиниця = 1 ящик. Без Bunner і Hyller." }
        : { unit: "esker", note: "1 enhet = 1 eske. Ingen Bunner eller Hyller." };
    }
    return isUk()
      ? { unit: "візків", note: "1 візок = 1 Bunner. Кількість Hyller і Forlengere вводиться окремо при UT-підтвердженні." }
      : { unit: "vogner", note: "1 vogn = 1 Bunner. Antall Hyller og Forlengere registreres per vogn ved UT-bekreftelse." };
  }

  function createExtraCard(id) {
    const p = registry.getProductById(id);
    const copy = extraCopy(id);
    const article = document.createElement("article");
    article.className = "ramp-product ut-extra-product";
    article.dataset.utProductId = id;
    article.innerHTML = `
      <div class="ramp-product-head">
        <div><strong>${esc(productName(id))}</strong><div class="ut-extra-unit">${copy.unit}</div></div>
        <output id="${id}Output">0 ${copy.unit}</output>
      </div>
      <div class="ut-extra-note">${copy.note}</div>
      <div class="qty compact">
        <button class="step" type="button" data-ut-extra-minus="${id}">−</button>
        <input id="${id}Qty" type="number" min="0" value="0" inputmode="numeric">
        <button class="step" type="button" data-ut-extra-plus="${id}">+</button>
      </div>
      <div class="quick">
        <button type="button" data-ut-extra-set="${id}:0">0</button>
        <button type="button" data-ut-extra-set="${id}:1">1</button>
        <button type="button" data-ut-extra-set="${id}:3">3</button>
        <button type="button" data-ut-extra-set="${id}:10">10</button>
      </div>`;
    if (!p?.active) article.style.display = "none";
    return article;
  }

  function installExtraCards() {
    const host = document.querySelector(".ramp-products");
    if (!host || document.querySelector('[data-ut-product-id="forlengere_korte"]')) return;
    EXTRA_IDS.forEach((id) => host.appendChild(createExtraCard(id)));

    EXTRA_IDS.forEach((id) => {
      const input = document.getElementById(`${id}Qty`);
      input?.addEventListener("input", () => setExtra(id, input.value));
      input?.addEventListener("change", () => setExtra(id, input.value));
    });
    document.querySelectorAll("[data-ut-extra-minus]").forEach((button) => button.addEventListener("click", () => {
      const id = button.dataset.utExtraMinus;
      setExtra(id, extState[id] - 1);
    }));
    document.querySelectorAll("[data-ut-extra-plus]").forEach((button) => button.addEventListener("click", () => {
      const id = button.dataset.utExtraPlus;
      setExtra(id, extState[id] + 1);
    }));
    document.querySelectorAll("[data-ut-extra-set]").forEach((button) => button.addEventListener("click", () => {
      const [id, value] = button.dataset.utExtraSet.split(":");
      setExtra(id, value);
    }));
  }

  function installSummaryRows() {
    const summary = document.querySelector(".compact-summary");
    const total = summary?.querySelector(".total-line");
    if (!summary || !total || document.getElementById("sumForlengereKorte")) return;
    const rows = [
      ["forlengere_korte", "sumForlengereKorte"],
      ["forlengere_lange", "sumForlengereLange"],
      ["forlengere_plast", "sumForlengerePlast"],
    ];
    rows.forEach(([id, outputId]) => {
      const row = document.createElement("div");
      row.className = "summary-row ut-extra-summary";
      row.innerHTML = `<span>${esc(productName(id))}</span><strong id="${outputId}">0</strong>`;
      summary.insertBefore(row, total);
    });
    total.classList.add("ut-total-line");
  }

  function setExtra(id, value, rerender = true) {
    extState[id] = Math.max(0, qty(value));
    const input = document.getElementById(`${id}Qty`);
    if (input) input.value = String(extState[id]);
    if (rerender) renderExtra();
  }

  function resetExtra() {
    EXTRA_IDS.forEach((id) => setExtra(id, 0, false));
    renderExtra();
  }

  function unitText(value, singularNo, pluralNo, singularUk, pluralUk) {
    if (isUk()) return value === 1 ? singularUk : pluralUk;
    return value === 1 ? singularNo : pluralNo;
  }

  function renderTotal(total, knownBunners, hyller, short, long, plast) {
    const ccPosts = knownBunners * 4;
    const shortUnit = unitText(short, "vogn", "vogner", "візок", "візків");
    const longUnit = unitText(long, "vogn", "vogner", "візок", "візків");
    const plastUnit = unitText(plast, "eske", "esker", "ящик", "ящиків");
    const labels = isUk()
      ? { bunner: "Bunner", hyller: "Hyller", short: "Подовжувачі короткі", long: "Подовжувачі довгі", plast: "Подовжувачі пластикові", posts: "CC Post" }
      : { bunner: "Bunner", hyller: "Hyller", short: "Forlengere korte", long: "Forlengere lange", plast: "Forlengere plast", posts: "CC Post" };
    total.classList.add("ut-total-stack");
    total.innerHTML = [
      [labels.bunner, String(knownBunners), ""],
      [labels.hyller, String(hyller), ""],
      [labels.short, `${short} ${shortUnit}`, ""],
      [labels.long, `${long} ${longUnit}`, ""],
      [labels.plast, `${plast} ${plastUnit}`, ""],
      [labels.posts, String(ccPosts), "cc-post"],
    ].map(([label, value, cls]) => `<span class="ut-total-row ${cls}"><span class="ut-total-label">${label}</span><span class="ut-total-value">${value}</span></span>`).join("");
  }

  function renderExtra() {
    EXTRA_IDS.forEach((id) => {
      const copy = extraCopy(id);
      const value = extState[id];
      const out = document.getElementById(`${id}Output`);
      if (out) out.textContent = `${value} ${copy.unit}`;
    });

    const short = extState.forlengere_korte;
    const long = extState.forlengere_lange;
    const plast = extState.forlengere_plast;
    const fixedBunners = short + long;

    const sumShort = document.getElementById("sumForlengereKorte");
    const sumLong = document.getElementById("sumForlengereLange");
    const sumPlast = document.getElementById("sumForlengerePlast");
    if (sumShort) sumShort.textContent = `${short} ${unitText(short, "vogn", "vogner", "візок", "візків")}`;
    if (sumLong) sumLong.textContent = `${long} ${unitText(long, "vogn", "vogner", "візок", "візків")}`;
    if (sumPlast) sumPlast.textContent = `${plast} ${unitText(plast, "eske", "esker", "ящик", "ящиків")}`;

    const total = document.getElementById("sumTotal");
    if (total && typeof totals === "function") {
      const old = totals();
      const knownBunners = old.bunner + fixedBunners;
      renderTotal(total, knownBunners, old.hyller, short, long, plast);
    }
  }

  function orderUnit(id) {
    if (id === "bunner") return "stabel";
    const p = registry.getProductById(id);
    return p?.shipment?.orderUnit || p?.unit || "stk";
  }

  function metadataFor(id) {
    const p = registry.getProductById(id);
    const data = {};
    if (p?.shipment) data.shipment = p.shipment;
    if (p?.package) data.package = p.package;
    return data;
  }

  function collectItems() {
    const candidates = [
      ["bunner", qty(document.getElementById("bunnerQty")?.value)],
      ["hyller30", qty(document.getElementById("h30Qty")?.value)],
      ["hyller60", qty(document.getElementById("h60Qty")?.value)],
      ["forlengere_korte", extState.forlengere_korte],
      ["forlengere_lange", extState.forlengere_lange],
      ["forlengere_plast", extState.forlengere_plast],
    ];
    return candidates
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const p = registry.getProductById(productId);
        return {
          product_id: productId,
          quantity,
          unit: orderUnit(productId),
          sort_order: Number(p?.sortOrder) || 999,
          metadata: metadataFor(productId),
        };
      });
  }

  function itemText(item) {
    const p = registry.getProductById(item.product_id);
    const name = registry.getProductName(p || item.product_id, language());
    const unit = item.unit === "vogn"
      ? (isUk() ? "візків" : "vogner")
      : item.unit === "eske"
        ? (isUk() ? "ящиків" : "esker")
        : item.unit === "stabel"
          ? (isUk() ? "стопок" : "stabler")
          : item.unit;
    return `${name}: ${item.quantity} ${unit}`;
  }

  function extraItemsForOrder(id) {
    return (itemsByOrder.get(String(id)) || []).filter((item) => EXTRA_IDS.includes(item.product_id));
  }

  function rebuildItemMap(rows) {
    itemsByOrder = new Map();
    (rows || []).forEach((item) => {
      const key = String(item.order_id);
      if (!itemsByOrder.has(key)) itemsByOrder.set(key, []);
      itemsByOrder.get(key).push(item);
    });
    itemsByOrder.forEach((items) => items.sort((a, b) => (Number(a.sort_order) || 999) - (Number(b.sort_order) || 999)));
  }

  async function loadOrderItems() {
    try {
      orderItems = await request("ut_order_items?select=order_id,product_id,quantity,unit,sort_order,metadata&order=sort_order.asc&limit=5000") || [];
      rebuildItemMap(orderItems);
    } catch (error) {
      console.error("[UT Kontor TEST] could not load order items", error);
      orderItems = [];
      rebuildItemMap([]);
    }
  }

  function decorateHistory() {
    document.querySelectorAll("#history .order").forEach((card) => {
      const id = card.querySelector("[data-storno]")?.dataset.storno || card.querySelector("[data-edit]")?.dataset.edit;
      if (!id) return;
      card.querySelector(".ut-extra-history")?.remove();
      const extras = extraItemsForOrder(id);
      if (!extras.length) return;
      const div = document.createElement("div");
      div.className = "ut-extra-history";
      div.innerHTML = extras.map((item) => esc(itemText(item))).join("<br>");
      card.querySelector(".amount")?.insertAdjacentElement("afterend", div);
    });

    document.querySelectorAll("#history .ramp-card").forEach((rampCard) => {
      rampCard.querySelector(".ut-extra-ramp-total")?.remove();
      const ids = [...rampCard.querySelectorAll("[data-storno]")].map((b) => b.dataset.storno);
      const extras = ids.flatMap((id) => extraItemsForOrder(id));
      const carts = extras.filter((x) => ["forlengere_korte", "forlengere_lange"].includes(x.product_id)).reduce((sum, x) => sum + Number(x.quantity || 0), 0);
      const boxes = extras.filter((x) => x.product_id === "forlengere_plast").reduce((sum, x) => sum + Number(x.quantity || 0), 0);
      if (!carts && !boxes) return;
      const el = document.createElement("div");
      el.className = "ut-extra-ramp-total";
      el.textContent = [carts ? `${carts} ${isUk() ? "візків Forlengere" : "Forlengere-vogner"}` : "", boxes ? `${boxes} ${isUk() ? "ящиків" : "esker"}` : ""].filter(Boolean).join(" · ");
      rampCard.querySelector(".ramp-card-head > div")?.appendChild(el);
    });
  }

  const baseRenderForm = window.renderForm;
  window.renderForm = function renderFormWithProducts() {
    if (typeof baseRenderForm === "function") baseRenderForm();
    renderExtra();
  };

  const baseRenderHistory = window.renderHistory;
  window.renderHistory = function renderHistoryWithProducts() {
    if (typeof baseRenderHistory === "function") baseRenderHistory();
    decorateHistory();
  };

  const baseLoadUt = window.loadUt;
  window.loadUt = async function loadUtWithProducts() {
    if (typeof baseLoadUt === "function") await baseLoadUt();
    await loadOrderItems();
    decorateHistory();
  };

  const baseStartEdit = window.startEdit;
  window.startEdit = function startEditWithProducts(id) {
    if (typeof baseStartEdit === "function") baseStartEdit(id);
    const items = itemsByOrder.get(String(id)) || [];
    EXTRA_IDS.forEach((productId) => {
      const item = items.find((x) => x.product_id === productId);
      setExtra(productId, Number(item?.quantity) || 0, false);
    });
    renderExtra();
  };

  const baseClearForm = window.clearForm;
  window.clearForm = function clearFormWithProducts(...args) {
    if (typeof baseClearForm === "function") baseClearForm(...args);
    resetExtra();
  };

  async function saveWholeOrder() {
    const ramp = normalizeRamp(document.getElementById("ramp")?.value);
    const items = collectItems();
    if (!ramp) {
      msg(isUk() ? "Виберіть рампу." : "Velg rampe.", "bad");
      document.getElementById("ramp")?.focus();
      return;
    }
    if (!items.length) {
      msg(isUk() ? "Додайте щонайменше один продукт." : "Legg minst én varetype til rampen.", "bad");
      return;
    }
    if (busy) return;

    busy = true;
    const sendButton = document.getElementById("send");
    if (sendButton) sendButton.disabled = true;
    document.getElementById("receipt")?.classList.remove("show");

    try {
      msg(isUk() ? "Зберігаю все TEST-замовлення…" : "Lagrer hele TEST-bestillingen…");
      const body = {
        p_order_id: editingId || null,
        p_order_number: editingId ? null : orderNumber(),
        p_ramp: ramp,
        p_recipient: document.getElementById("mottaker")?.value.trim() || null,
        p_transporter: document.getElementById("transporter")?.value.trim() || null,
        p_office_note: document.getElementById("officeNote")?.value.trim() || null,
        p_items: items,
      };
      const result = await request("rpc/save_ut_order_with_items", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const row = Array.isArray(result) ? result[0] : result;
      if (!row?.id) throw new Error("TEST-databasen returnerte ingen ordre.");

      const wasEdit = Boolean(editingId);
      if (!wasEdit) {
        const receipt = document.getElementById("receipt");
        const receiptNo = document.getElementById("receiptNo");
        const receiptText = document.getElementById("receiptText");
        if (receiptNo) receiptNo.textContent = `${row.order_number} · TEST`;
        if (receiptText) receiptText.textContent = items.map(itemText).join(" · ");
        receipt?.classList.add("show");
      }

      window.clearForm(false, !wasEdit);
      msg(wasEdit
        ? (isUk() ? "TEST-замовлення оновлено." : "TEST-bestillingen er oppdatert.")
        : (isUk() ? "TEST-замовлення надіслано складу." : "TEST-bestillingen er sendt til lageret."), "ok");
      await Promise.all([loadInn(), window.loadUt()]);
    } catch (error) {
      msg(`${isUk() ? "Не вдалося зберегти TEST-замовлення" : "Kunne ikke lagre TEST-bestillingen"}.\n${error.message || error}`, "bad");
    } finally {
      busy = false;
      const button = document.getElementById("send");
      if (button) button.disabled = false;
    }
  }

  function replaceActionButtons() {
    const oldSend = document.getElementById("send");
    if (oldSend && !oldSend.dataset.utProductsHandler) {
      const fresh = oldSend.cloneNode(true);
      fresh.dataset.utProductsHandler = "1";
      oldSend.replaceWith(fresh);
      fresh.addEventListener("click", saveWholeOrder);
    }

    const oldReset = document.getElementById("reset");
    if (oldReset && !oldReset.dataset.utProductsHandler) {
      const fresh = oldReset.cloneNode(true);
      fresh.dataset.utProductsHandler = "1";
      oldReset.replaceWith(fresh);
      fresh.addEventListener("click", () => window.clearForm());
    }
  }

  async function start() {
    injectStyle();
    installExtraCards();
    installSummaryRows();
    replaceActionButtons();
    renderExtra();
    await loadOrderItems();
    decorateHistory();

    const version = document.querySelector(".version");
    if (version) version.innerHTML = "TEST UT Kontor v2.8 · TOTAL COLUMN<br>Oppdatert 08.08.2026 kl. 13:50";

    window.BAMA_UT_KONTOR_PRODUCTS = {
      version: VERSION,
      updatedAt: UPDATED_AT,
      collectItems,
      loadOrderItems,
      getExtraState: () => ({ ...extState }),
    };
  }

  start().catch((error) => {
    console.error("[UT Kontor TEST] product extension failed", error);
    msg(`TEST produktmodul: ${error.message || error}`, "bad");
  });
})();