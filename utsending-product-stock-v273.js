"use strict";

(() => {
  if (window.__UT_PRODUCT_STOCK_V273__) return;
  window.__UT_PRODUCT_STOCK_V273__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";

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

  function ensureCard() {
    let card = document.getElementById("utProductStockV273");
    if (card) return card;
    card = document.createElement("section");
    card.id = "utProductStockV273";
    card.innerHTML = `
      <div class="ups-head"><span>PÅ LAGER · UTEN RAMPE</span><span id="upsTime">Laster…</span></div>
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

  async function load() {
    const card = ensureCard();
    if (!card) return;
    const error = document.getElementById("upsError");
    try {
      const url = `${SUPABASE_URL}/rest/v1/mottak_scans?select=product,stock_status&status=eq.verified&stock_status=in.(in_stock,reserved)&limit=10000`;
      const response = await fetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`},cache:"no-store"});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rows = await response.json();
      document.getElementById("upsB").textContent = String(rows.filter(r=>r.product==="bunner").length);
      document.getElementById("upsH30").textContent = String(rows.filter(r=>r.product==="hyller30").length);
      document.getElementById("upsH60").textContent = String(rows.filter(r=>r.product==="hyller60").length);
      document.getElementById("upsTime").textContent = new Intl.DateTimeFormat("nb-NO",{hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date());
      if (error) { error.textContent=""; error.classList.remove("show"); }
    } catch (e) {
      if (error) { error.textContent="Kunne ikke oppdatere lagerantall."; error.classList.add("show"); }
    }
  }

  window.UT_PRODUCT_STOCK_REFRESH = load;
  ensureCard();
  load();
})();
