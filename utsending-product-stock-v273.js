"use strict";

// UT Lager compact stock counter.
// Business rule 09.08.2026:
// displayed = current verified in_stock - still-unscanned quantity on active ramp orders.
// Once an item is scanned to the ramp it becomes staged, leaves in_stock, and also fulfils
// one unit of that order, so the displayed balance is not subtracted twice.
(() => {
  if (window.__UT_PRODUCT_STOCK_V273__) return;
  window.__UT_PRODUCT_STOCK_V273__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const REFRESH_MS = 5000;
  let busy = false;

  const style = document.createElement("style");
  style.id = "utProductStockV273Style";
  style.textContent = `
    #utProductStockV273{margin:10px 0 12px;padding:10px;border:1px solid #303b59;border-radius:15px;background:#0d1426}
    #utProductStockV273 .ups-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;color:#aab4ce;font-size:10px;font-weight:850}
    #utProductStockV273 .ups-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
    #utProductStockV273 .ups-cell{min-width:0;padding:9px 6px;border:1px solid #303b59;border-radius:11px;background:#0b1020;text-align:center}
    #utProductStockV273 .ups-cell span{display:block;color:#aab4ce;font-size:10px;font-weight:950;line-height:1.1}
    #utProductStockV273 .ups-cell strong{display:block;margin-top:5px;color:#f5f7ff;font-size:24px;line-height:1;font-weight:950}
    #utProductStockV273 .ups-cell:first-child{border-color:#48d597}
    #utProductStockV273 .ups-error{display:none;margin-top:7px;color:#ff9c9c;font-size:10px;text-align:center}
    #utProductStockV273 .ups-error.show{display:block}
  `;
  document.head.appendChild(style);

  function language(){
    try { if (["nb","pl","uk"].includes(window.UT_LANG)) return window.UT_LANG; } catch {}
    try {
      const value = localStorage.getItem("mottak_ut_language");
      if (["nb","pl","uk"].includes(value)) return value;
    } catch {}
    return "nb";
  }

  function titleText(){
    const l = language();
    if (l === "uk") return "НА СКЛАДІ · МІНУС РАМПИ";
    if (l === "pl") return "MAGAZYN · MINUS RAMPY";
    return "PÅ LAGER · MINUS RAMPER";
  }

  function ensureCard() {
    let card = document.getElementById("utProductStockV273");
    if (card) return card;
    card = document.createElement("section");
    card.id = "utProductStockV273";
    card.innerHTML = `
      <div class="ups-head"><span id="upsTitle"></span><span id="upsTime">Laster…</span></div>
      <div class="ups-grid">
        <div class="ups-cell"><span>B</span><strong id="upsB">—</strong></div>
        <div class="ups-cell"><span>H×30</span><strong id="upsH30">—</strong></div>
        <div class="ups-cell"><span>H×60</span><strong id="upsH60">—</strong></div>
      </div>
      <div class="ups-error" id="upsError"></div>`;
    const ramps = document.querySelector(".ramps-card");
    if (ramps?.parentElement) ramps.parentElement.insertBefore(card, ramps);
    else document.querySelector("main.app, .app, main, body")?.appendChild(card);
    return card;
  }

  async function getJson(path){
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,Accept:"application/json"},
      cache:"no-store"
    });
    const body = await response.json().catch(() => []);
    if (!response.ok) throw new Error(body?.message || `HTTP ${response.status}`);
    return Array.isArray(body) ? body : [];
  }

  function qty(order,key){
    if (key === "bunner") return Number(order.bunner_stacks) || 0;
    if (key === "hyller30") return Number(order.hyller30_sets) || 0;
    return Number(order.hyller60_sets) || 0;
  }

  function calculate(scans,orders){
    const verified = (scans || []).filter(row => row.status === "verified");
    const activeOrders = (orders || []).filter(order => !["completed","cancelled"].includes(order.status));

    const inStock = {
      bunner: verified.filter(row => row.product === "bunner" && (row.stock_status || "in_stock") === "in_stock").length,
      hyller30: verified.filter(row => row.product === "hyller30" && (row.stock_status || "in_stock") === "in_stock").length,
      hyller60: verified.filter(row => row.product === "hyller60" && (row.stock_status || "in_stock") === "in_stock").length
    };

    const stagedByOrder = new Map();
    verified.forEach(row => {
      if (!row.ut_order_id || row.stock_status !== "staged") return;
      const id = String(row.ut_order_id);
      if (!stagedByOrder.has(id)) stagedByOrder.set(id,{bunner:0,hyller30:0,hyller60:0});
      const bucket = stagedByOrder.get(id);
      if (Object.prototype.hasOwnProperty.call(bucket,row.product)) bucket[row.product] += 1;
    });

    const outstanding = {bunner:0,hyller30:0,hyller60:0};
    activeOrders.forEach(order => {
      const staged = stagedByOrder.get(String(order.id)) || {bunner:0,hyller30:0,hyller60:0};
      outstanding.bunner += Math.max(0, qty(order,"bunner") - staged.bunner);
      outstanding.hyller30 += Math.max(0, qty(order,"hyller30") - staged.hyller30);
      outstanding.hyller60 += Math.max(0, qty(order,"hyller60") - staged.hyller60);
    });

    return {
      bunner: Math.max(0, inStock.bunner - outstanding.bunner),
      hyller30: Math.max(0, inStock.hyller30 - outstanding.hyller30),
      hyller60: Math.max(0, inStock.hyller60 - outstanding.hyller60)
    };
  }

  function set(id,value){
    const node = document.getElementById(id);
    if (node && node.textContent !== String(value)) node.textContent = String(value);
  }

  async function load() {
    const card = ensureCard();
    if (!card || busy) return;
    busy = true;
    const error = document.getElementById("upsError");
    try {
      set("upsTitle", titleText());
      const [scans,orders] = await Promise.all([
        getJson("mottak_scans?select=product,status,stock_status,ut_order_id&limit=10000"),
        getJson("ut_orders?select=id,status,bunner_stacks,hyller30_sets,hyller60_sets&limit=1000")
      ]);
      const values = calculate(scans,orders);
      set("upsB", values.bunner);
      set("upsH30", values.hyller30);
      set("upsH60", values.hyller60);
      set("upsTime", new Intl.DateTimeFormat("nb-NO",{hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date()));
      if (error) { error.textContent=""; error.classList.remove("show"); }
    } catch (e) {
      if (error) { error.textContent="Kunne ikke oppdatere lagerantall."; error.classList.add("show"); }
      console.warn("UT product stock refresh failed", e);
    } finally {
      busy = false;
    }
  }

  window.UT_PRODUCT_STOCK_REFRESH = load;
  document.addEventListener("click", event => {
    if (event.target.closest?.("#utLanguageSwitch,[data-lang],[data-language]")) setTimeout(load,80);
  }, true);
  ensureCard();
  load();
  setInterval(load, REFRESH_MS);
})();
