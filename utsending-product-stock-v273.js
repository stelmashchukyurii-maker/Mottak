"use strict";

// UT Lager compact stock counter.
// Canonical rule 24.08.2026:
// use bama_stock_summary() so manual quantity overlay and active-order demand are
// calculated exactly like UT Kontor. Do not count raw RFID rows independently.
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
    #utProductStockV273 .ups-cell.shortage{border-color:#ff7373;background:rgba(255,115,115,.06)}
    #utProductStockV273 .ups-cell.shortage strong{color:#ff9d9d}
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
    if (l === "uk") return "ДОСТУПНО · СКЛАД − ЗАМОВЛЕННЯ";
    if (l === "pl") return "DOSTĘPNE · MAGAZYN − ZAMÓWIENIA";
    return "TILGJENGELIG · PÅ LAGER − BESTILLINGER";
  }

  function ensureCard() {
    let card = document.getElementById("utProductStockV273");
    if (card) return card;
    card = document.createElement("section");
    card.id = "utProductStockV273";
    card.innerHTML = `
      <div class="ups-head"><span id="upsTitle"></span><span id="upsTime">Laster…</span></div>
      <div class="ups-grid">
        <div class="ups-cell" data-ups-cell="bunner"><span>B</span><strong id="upsB">—</strong></div>
        <div class="ups-cell" data-ups-cell="hyller30"><span>H×30</span><strong id="upsH30">—</strong></div>
        <div class="ups-cell" data-ups-cell="hyller60"><span>H×60</span><strong id="upsH60">—</strong></div>
      </div>
      <div class="ups-error" id="upsError"></div>`;
    const ramps = document.querySelector(".ramps-card");
    if (ramps?.parentElement) ramps.parentElement.insertBefore(card, ramps);
    else document.querySelector("main.app, .app, main, body")?.appendChild(card);
    return card;
  }

  async function fetchSummary(){
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bama_stock_summary`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-bama-environment": "work"
      },
      body: "{}",
      cache: "no-store"
    });
    const body = await response.json().catch(() => []);
    if (!response.ok) throw new Error(body?.message || `HTTP ${response.status}`);
    return Array.isArray(body) ? body : [];
  }

  function set(id,value){
    const node = document.getElementById(id);
    if (node && node.textContent !== String(value)) node.textContent = String(value);
  }

  function applyCell(productId, value, shortage){
    const cell = document.querySelector(`[data-ups-cell="${productId}"]`);
    cell?.classList.toggle("shortage", Number(shortage) > 0 || Number(value) < 0);
  }

  async function load() {
    const card = ensureCard();
    if (!card || busy) return;
    busy = true;
    const error = document.getElementById("upsError");
    try {
      set("upsTitle", titleText());
      const rows = await fetchSummary();
      const map = new Map(rows.map(row => [String(row.product_id), row]));
      const b = map.get("bunner") || {};
      const h30 = map.get("hyller30") || {};
      const h60 = map.get("hyller60") || {};
      set("upsB", Number(b.available_count) || 0);
      set("upsH30", Number(h30.available_count) || 0);
      set("upsH60", Number(h60.available_count) || 0);
      applyCell("bunner", b.available_count, b.shortage_count);
      applyCell("hyller30", h30.available_count, h30.shortage_count);
      applyCell("hyller60", h60.available_count, h60.shortage_count);
      set("upsTime", new Intl.DateTimeFormat("nb-NO",{hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date()));
      if (error) { error.textContent=""; error.classList.remove("show"); }
      window.dispatchEvent(new CustomEvent("ut-canonical-stock-updated", { detail: { rows } }));
    } catch (e) {
      if (error) { error.textContent="Kunne ikke oppdatere lagerantall."; error.classList.add("show"); }
      console.warn("UT canonical product stock refresh failed", e);
    } finally {
      busy = false;
    }
  }

  window.UT_PRODUCT_STOCK_REFRESH = load;
  window.UT_PRODUCT_STOCK_CANONICAL = { refresh: load, version: "2.74" };
  document.addEventListener("click", event => {
    if (event.target.closest?.("#utLanguageSwitch,[data-lang],[data-language]")) setTimeout(load,80);
  }, true);
  window.addEventListener("focus", load);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
  ensureCard();
  load();
  setInterval(load, REFRESH_MS);
})();
