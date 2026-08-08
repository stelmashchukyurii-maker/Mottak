"use strict";

// TEST — UT Lager: confirmation and dispatch support for new count-based products.
// Version 1.0.0
// Updated: 08.08.2026 kl. 16:58 Europe/Oslo
(() => {
  if (window.__UT_TEST_EXTRA_PRODUCTS_V1__) return;
  window.__UT_TEST_EXTRA_PRODUCTS_V1__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const SUPPORTED = ["forlengere_korte", "forlengere_lange", "forlengere_plast"];

  const COPY = {
    nb: {
      title: "Nye produkter",
      note: "Bekreft disse varene uten etikett-skanning. Korte/lange forlengere registreres per vogn. Plast registreres per eske.",
      progress: (done,total) => `${done} av ${total} bekreftet`,
      korte: "Forlengere korte",
      lange: "Forlengere lange",
      plast: "Forlengere plast",
      vogn: "Vogn",
      eske: "Eske",
      of: "av",
      hyller: "Hyller",
      forlengere: "Forlengere",
      confirm: "Bekreft",
      save: "Lagre",
      clear: "Fjern",
      confirmed: "Bekreftet",
      staged: "På rampe",
      dispatched: "Sendt",
      locked: "Låst i denne statusen",
      needBoth: "Registrer både antall hyller og antall forlengere.",
      saving: "Lagrer TEST-bekreftelse…",
      saved: "TEST-bekreftelsen er lagret.",
      clearing: "Fjerner TEST-bekreftelsen…",
      cleared: "TEST-bekreftelsen er fjernet.",
      beforeRamp: "Alle enhetene må være bekreftet før «Klar på rampe».",
      error: "Kunne ikke oppdatere nye TEST-produkter."
    },
    pl: {
      title: "Nowe produkty",
      note: "Potwierdź te towary bez skanowania etykiety. Krótkie/długie przedłużki są rejestrowane dla każdego wózka, plastikowe dla każdego pudełka.",
      progress: (done,total) => `${done} z ${total} potwierdzono`,
      korte: "Przedłużki krótkie",
      lange: "Przedłużki długie",
      plast: "Przedłużki plastikowe",
      vogn: "Wózek",
      eske: "Pudełko",
      of: "z",
      hyller: "Półki",
      forlengere: "Przedłużki",
      confirm: "Potwierdź",
      save: "Zapisz",
      clear: "Usuń",
      confirmed: "Potwierdzono",
      staged: "Na rampie",
      dispatched: "Wysłano",
      locked: "Zablokowane w tym statusie",
      needBoth: "Wpisz liczbę półek i przedłużek.",
      saving: "Zapisuję potwierdzenie TEST…",
      saved: "Potwierdzenie TEST zapisane.",
      clearing: "Usuwam potwierdzenie TEST…",
      cleared: "Potwierdzenie TEST usunięte.",
      beforeRamp: "Wszystkie jednostki muszą być potwierdzone przed «Gotowe na rampie».",
      error: "Nie udało się zaktualizować nowych produktów TEST."
    },
    uk: {
      title: "Нові продукти",
      note: "Підтверджуйте ці товари без сканування бірки. Короткі/довгі подовжувачі реєструються окремо по кожному візку, пластикові — по кожному ящику.",
      progress: (done,total) => `${done} з ${total} підтверджено`,
      korte: "Подовжувачі короткі",
      lange: "Подовжувачі довгі",
      plast: "Подовжувачі пластикові",
      vogn: "Візок",
      eske: "Ящик",
      of: "з",
      hyller: "Полиці",
      forlengere: "Подовжувачі",
      confirm: "Підтвердити",
      save: "Зберегти",
      clear: "Зняти",
      confirmed: "Підтверджено",
      staged: "На рампі",
      dispatched: "Відправлено",
      locked: "Заблоковано у цьому статусі",
      needBoth: "Вкажіть і кількість полиць, і кількість подовжувачів.",
      saving: "Зберігаю TEST-підтвердження…",
      saved: "TEST-підтвердження збережено.",
      clearing: "Знімаю TEST-підтвердження…",
      cleared: "TEST-підтвердження знято.",
      beforeRamp: "Усі одиниці мають бути підтверджені перед «Готово на рампі».",
      error: "Не вдалося оновити нові TEST-продукти."
    }
  };

  let lastRows = [];
  let lastOrderId = null;
  let refreshToken = 0;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[char]);

  function lang() {
    const value = window.UT_LANG || localStorage.getItem("mottak_ut_language") || "nb";
    return value === "uk" || value === "pl" ? value : "nb";
  }

  function t() { return COPY[lang()] || COPY.nb; }

  function currentOrder() {
    try { return typeof window.current === "function" ? window.current() : null; }
    catch { return null; }
  }

  async function rpc(name, payload) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload || {}),
      cache: "no-store"
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) throw new Error(data?.message || data?.hint || text || `HTTP ${response.status}`);
    return data;
  }

  function ensureStyle() {
    if (document.getElementById("utTestExtraProductsStyle")) return;
    const style = document.createElement("style");
    style.id = "utTestExtraProductsStyle";
    style.textContent = `
      #utTestExtraProducts{margin-top:11px;padding:12px;border:2px solid #75b7ff;border-radius:15px;background:rgba(117,183,255,.055)}
      #utTestExtraProducts .uep-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap}
      #utTestExtraProducts .uep-head h3{margin:0;font-size:19px;color:#75b7ff}
      #utTestExtraProducts .uep-progress{padding:5px 8px;border:1px solid #303b59;border-radius:999px;color:#aab4ce;font-size:10px;font-weight:950}
      #utTestExtraProducts .uep-note{margin:7px 0 10px;color:#aab4ce;font-size:11px;line-height:1.45}
      #utTestExtraProducts .uep-group{margin-top:9px;padding:10px;border:1px solid #303b59;border-radius:13px;background:#0d1426}
      #utTestExtraProducts .uep-group-title{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:7px;font-weight:950}
      #utTestExtraProducts .uep-group-title span:last-child{color:#aab4ce;font-size:10px}
      #utTestExtraProducts .uep-unit{margin-top:7px;padding:9px;border:1px solid #303b59;border-radius:11px;background:#070b14}
      #utTestExtraProducts .uep-unit.ok{border-color:#48d597;background:rgba(72,213,151,.05)}
      #utTestExtraProducts .uep-unit.staged{border-color:#f4c430}
      #utTestExtraProducts .uep-unit.sent{border-color:#ff9d72}
      #utTestExtraProducts .uep-unit-head{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:7px;font-weight:900}
      #utTestExtraProducts .uep-state{font-size:10px;color:#aab4ce}
      #utTestExtraProducts .uep-unit.ok .uep-state{color:#48d597}
      #utTestExtraProducts .uep-unit.staged .uep-state{color:#f4c430}
      #utTestExtraProducts .uep-unit.sent .uep-state{color:#ff9d72}
      #utTestExtraProducts .uep-fields{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      #utTestExtraProducts .uep-field label{display:block;margin:0 0 4px;color:#aab4ce;font-size:9px;font-weight:850}
      #utTestExtraProducts .uep-field input{min-height:42px;padding:8px 10px;font-weight:900;text-align:center}
      #utTestExtraProducts .uep-actions{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:7px}
      #utTestExtraProducts .uep-actions.single{grid-template-columns:1fr}
      #utTestExtraProducts .uep-btn{min-height:42px;padding:8px 10px;border:0;border-radius:10px;font-weight:950}
      #utTestExtraProducts .uep-save{background:#48d597;color:#062418}
      #utTestExtraProducts .uep-clear{border:1px solid rgba(255,115,115,.4);background:rgba(255,115,115,.1);color:#ffb7b7}
      #utTestExtraProducts .uep-message{min-height:18px;margin-top:8px;color:#aab4ce;font-size:10px;text-align:center;line-height:1.35}
      #utTestExtraProducts .uep-message.ok{color:#48d597}
      #utTestExtraProducts .uep-message.bad{color:#ff7373}
      #utTestExtraProducts .uep-warning{margin-top:9px;padding:8px;border:1px dashed #f4c430;border-radius:10px;color:#f4c430;font-size:10px;line-height:1.4;text-align:center}
      @media(max-width:430px){#utTestExtraProducts .uep-fields{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureCard() {
    ensureStyle();
    let card = document.getElementById("utTestExtraProducts");
    if (card) return card;
    const anchor = document.getElementById("detailProducts");
    if (!anchor) return null;
    card = document.createElement("section");
    card.id = "utTestExtraProducts";
    card.hidden = true;
    anchor.insertAdjacentElement("afterend", card);
    return card;
  }

  function productName(id, copy) {
    return id === "forlengere_korte" ? copy.korte : id === "forlengere_lange" ? copy.lange : copy.plast;
  }

  function stateText(row, copy) {
    if (row.dispatched) return copy.dispatched;
    if (row.staged) return copy.staged;
    if (row.confirmed) return copy.confirmed;
    return "—";
  }

  function unitClass(row) {
    if (row.dispatched) return "sent";
    if (row.staged) return "staged";
    if (row.confirmed) return "ok";
    return "";
  }

  function groupRows(rows) {
    const map = new Map();
    for (const row of rows) {
      if (!SUPPORTED.includes(row.product_id)) continue;
      if (!map.has(row.product_id)) map.set(row.product_id, []);
      map.get(row.product_id).push(row);
    }
    return [...map.entries()].sort((a,b)=>(a[1][0]?.sort_order||999)-(b[1][0]?.sort_order||999));
  }

  function render(rows, order) {
    const card = ensureCard();
    if (!card) return;
    const copy = t();
    lastRows = Array.isArray(rows) ? rows : [];
    lastOrderId = order?.id || null;

    if (!order || !lastRows.length) {
      card.hidden = true;
      window.UT_EXTRA_PRODUCTS_COMPLETE = true;
      return;
    }

    const done = lastRows.filter(row => row.confirmed).length;
    const total = lastRows.length;
    const locked = ["staged","completed","cancelled"].includes(order.status);
    window.UT_EXTRA_PRODUCTS_COMPLETE = done === total;

    const groups = groupRows(lastRows).map(([productId,items]) => {
      const quantity = Number(items[0]?.ordered_quantity || items.length);
      const unitLabel = productId === "forlengere_plast" ? copy.eske : copy.vogn;
      const units = items.map(row => {
        const idx = Number(row.unit_index || 0);
        const state = stateText(row, copy);
        const rowLocked = locked || row.staged || row.dispatched;
        const isPlast = productId === "forlengere_plast";
        const fields = isPlast ? "" : `
          <div class="uep-fields">
            <div class="uep-field"><label>${esc(copy.hyller)}</label><input data-extra-hyller="${esc(productId)}:${idx}" type="number" min="0" step="1" inputmode="numeric" value="${row.hyller_count ?? ""}" ${rowLocked?"disabled":""}></div>
            <div class="uep-field"><label>${esc(copy.forlengere)}</label><input data-extra-forlengere="${esc(productId)}:${idx}" type="number" min="0" step="1" inputmode="numeric" value="${row.forlengere_count ?? ""}" ${rowLocked?"disabled":""}></div>
          </div>`;
        const canClear = row.confirmed && !rowLocked;
        const actionText = row.confirmed ? copy.save : copy.confirm;
        const actions = rowLocked ? `<div class="uep-message">${esc(copy.locked)}</div>` : `
          <div class="uep-actions ${canClear?"":"single"}">
            <button class="uep-btn uep-save" type="button" data-extra-save="${esc(productId)}:${idx}">${esc(actionText)}</button>
            ${canClear?`<button class="uep-btn uep-clear" type="button" data-extra-clear="${esc(productId)}:${idx}">${esc(copy.clear)}</button>`:""}
          </div>`;
        return `<div class="uep-unit ${unitClass(row)}">
          <div class="uep-unit-head"><span>${esc(unitLabel)} ${idx} ${esc(copy.of)} ${quantity}</span><span class="uep-state">${esc(state)}</span></div>
          ${fields}${actions}
        </div>`;
      }).join("");
      return `<div class="uep-group"><div class="uep-group-title"><span>${esc(productName(productId,copy))}</span><span>${quantity} ${esc(items[0]?.unit || "")}</span></div>${units}</div>`;
    }).join("");

    card.innerHTML = `
      <div class="uep-head"><h3>${esc(copy.title)}</h3><span class="uep-progress">${esc(copy.progress(done,total))}</span></div>
      <div class="uep-note">${esc(copy.note)}</div>
      ${groups}
      ${done<total?`<div class="uep-warning">${esc(copy.beforeRamp)}</div>`:""}
      <div class="uep-message" id="utExtraProductsMessage"></div>`;
    card.hidden = false;

    card.querySelectorAll("[data-extra-save]").forEach(button => {
      button.addEventListener("click", () => saveUnit(button.dataset.extraSave));
    });
    card.querySelectorAll("[data-extra-clear]").forEach(button => {
      button.addEventListener("click", () => clearUnit(button.dataset.extraClear));
    });
  }

  function message(text, type="") {
    const node = document.getElementById("utExtraProductsMessage");
    if (!node) return;
    node.textContent = text || "";
    node.className = `uep-message ${type}`;
  }

  function parseKey(key) {
    const [productId,indexRaw] = String(key || "").split(":");
    return { productId, unitIndex:Number(indexRaw) };
  }

  async function saveUnit(key) {
    const order = currentOrder();
    if (!order) return;
    const copy = t();
    const { productId, unitIndex } = parseKey(key);
    if (!SUPPORTED.includes(productId) || !unitIndex) return;

    let hyller = null;
    let forlengere = null;
    if (productId !== "forlengere_plast") {
      const h = document.querySelector(`[data-extra-hyller="${productId}:${unitIndex}"]`);
      const f = document.querySelector(`[data-extra-forlengere="${productId}:${unitIndex}"]`);
      if (!h || !f || h.value === "" || f.value === "") {
        message(copy.needBoth,"bad");
        return;
      }
      hyller = Number.parseInt(h.value,10);
      forlengere = Number.parseInt(f.value,10);
      if (!Number.isInteger(hyller) || hyller < 0 || !Number.isInteger(forlengere) || forlengere < 0) {
        message(copy.needBoth,"bad");
        return;
      }
    }

    message(copy.saving);
    try {
      await rpc("confirm_ut_extra_unit", {
        p_order_id: order.id,
        p_product_id: productId,
        p_unit_index: unitIndex,
        p_hyller_count: hyller,
        p_forlengere_count: forlengere
      });
      await refresh();
      message(copy.saved,"ok");
      window.UT_PRODUCTION_ENHANCE?.();
    } catch (error) {
      message(error.message || copy.error,"bad");
    }
  }

  async function clearUnit(key) {
    const order = currentOrder();
    if (!order) return;
    const copy = t();
    const { productId, unitIndex } = parseKey(key);
    if (!SUPPORTED.includes(productId) || !unitIndex) return;

    message(copy.clearing);
    try {
      await rpc("clear_ut_extra_unit", {
        p_order_id: order.id,
        p_product_id: productId,
        p_unit_index: unitIndex
      });
      await refresh();
      message(copy.cleared,"ok");
      window.UT_PRODUCTION_ENHANCE?.();
    } catch (error) {
      message(error.message || copy.error,"bad");
    }
  }

  async function refresh() {
    const token = ++refreshToken;
    const order = currentOrder();
    const card = ensureCard();
    if (!order) {
      if (card) card.hidden = true;
      lastRows=[];
      lastOrderId=null;
      window.UT_EXTRA_PRODUCTS_COMPLETE=true;
      return [];
    }
    try {
      const rows = await rpc("ut_extra_progress", { p_order_id: order.id });
      if (token !== refreshToken || currentOrder()?.id !== order.id) return rows || [];
      render(Array.isArray(rows) ? rows : [], order);
      return rows || [];
    } catch (error) {
      if (card) {
        card.hidden=false;
        card.innerHTML=`<div class="uep-message bad">${esc(error.message || t().error)}</div>`;
      }
      window.UT_EXTRA_PRODUCTS_COMPLETE=false;
      return [];
    }
  }

  // Extend the legacy completeness check without changing production files.
  if (typeof window.complete === "function" && !window.__UT_TEST_EXTRA_COMPLETE_PATCH__) {
    window.__UT_TEST_EXTRA_COMPLETE_PATCH__ = true;
    const baseComplete = window.complete;
    window.complete = function completeWithExtraProducts(order) {
      const legacy = baseComplete(order);
      if (!legacy) return false;
      if (!order || lastOrderId !== order.id) return legacy;
      return legacy && window.UT_EXTRA_PRODUCTS_COMPLETE !== false;
    };
  }

  window.UT_EXTRA_PRODUCTS_REFRESH = refresh;
  window.UT_EXTRA_PRODUCTS_VERSION = "1.0.0";
  ensureCard();
  refresh();
})();
