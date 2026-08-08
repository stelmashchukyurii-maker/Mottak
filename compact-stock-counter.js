"use strict";

// Compact warehouse counter shared by WORKING and GREEN.
// Business rule: "På lager · uten rampe" = verified rows where stock_status=in_stock.
// A new order alone does NOT reduce this counter. Only scanning onto a ramp (in_stock -> staged) removes it.
(() => {
  if (window.__BAMA_COMPACT_STOCK_COUNTER__) return;
  window.__BAMA_COMPACT_STOCK_COUNTER__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const REFRESH_MS = 5000;
  let busy = false;

  function langCode() {
    try {
      if (typeof language === "string" && ["nb", "pl", "uk"].includes(language)) return language;
    } catch {}
    try {
      if (typeof window.UT_LANG === "string" && ["nb", "pl", "uk"].includes(window.UT_LANG)) return window.UT_LANG;
    } catch {}
    try {
      const ut = localStorage.getItem("mottak_ut_language");
      if (["nb", "pl", "uk"].includes(ut)) return ut;
      const camera = localStorage.getItem("mottak_cloud_v4_language");
      if (["nb", "pl", "uk"].includes(camera)) return camera;
    } catch {}
    return "nb";
  }

  function text() {
    const l = langCode();
    if (l === "uk") return "НА СКЛАДІ · БЕЗ РАМПИ";
    if (l === "pl") return "NA MAGAZYNIE · POZA RAMPĄ";
    return "PÅ LAGER · UTEN RAMPE";
  }

  function ensureStyle() {
    if (document.getElementById("bamaCompactStockStyle")) return;
    const style = document.createElement("style");
    style.id = "bamaCompactStockStyle";
    style.textContent = `
      #bamaCompactStockCounter{width:100%;max-width:100%;margin:12px 0 16px;padding:14px 16px 16px;border:2px solid #303b59;border-radius:24px;background:#0d1426;color:#f5f7ff;box-shadow:0 10px 24px rgba(0,0,0,.14);font-family:Arial,Helvetica,sans-serif}
      #bamaCompactStockCounter .bcsc-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}
      #bamaCompactStockCounter .bcsc-title{min-width:0;color:#aab4ce;font-size:clamp(14px,4vw,21px);font-weight:950;letter-spacing:.02em}
      #bamaCompactStockCounter .bcsc-time{flex:0 0 auto;color:#aab4ce;font-size:clamp(12px,3.4vw,18px);font-weight:850}
      #bamaCompactStockCounter .bcsc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      #bamaCompactStockCounter .bcsc-cell{min-width:0;min-height:116px;padding:14px 8px;border:2px solid #303b59;border-radius:20px;background:#0b1020;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center}
      #bamaCompactStockCounter .bcsc-cell.active{border-color:#48d597;box-shadow:0 0 0 1px rgba(72,213,151,.14)}
      #bamaCompactStockCounter .bcsc-label{color:#aab4ce;font-size:clamp(18px,5vw,27px);font-weight:950;line-height:1}
      #bamaCompactStockCounter .bcsc-value{color:#f5f7ff;font-size:clamp(40px,11vw,62px);font-weight:1000;line-height:1}
      #bamaCompactStockCounter.bcsc-error .bcsc-time{color:#ff9c9c}
      @media(max-width:420px){#bamaCompactStockCounter{padding:12px 12px 14px;border-radius:20px}#bamaCompactStockCounter .bcsc-grid{gap:8px}#bamaCompactStockCounter .bcsc-cell{min-height:102px;border-radius:17px;padding:11px 5px}}
    `;
    document.head.appendChild(style);
  }

  function anchor() {
    const products = document.getElementById("products");
    if (products) return products.closest(".card") || products;
    return document.querySelector("main.app h1, main h1, .app h1, h1");
  }

  function ensureCard() {
    let card = document.getElementById("bamaCompactStockCounter");
    if (card) return card;
    const point = anchor();
    if (!point) return null;
    ensureStyle();
    card = document.createElement("section");
    card.id = "bamaCompactStockCounter";
    card.setAttribute("aria-live", "polite");
    card.innerHTML = `
      <div class="bcsc-head"><div class="bcsc-title" id="bcscTitle"></div><div class="bcsc-time" id="bcscTime">—</div></div>
      <div class="bcsc-grid">
        <div class="bcsc-cell" data-bcsc-product="bunner"><div class="bcsc-label">B</div><div class="bcsc-value" id="bcscB">—</div></div>
        <div class="bcsc-cell" data-bcsc-product="hyller30"><div class="bcsc-label">H×30</div><div class="bcsc-value" id="bcscH30">—</div></div>
        <div class="bcsc-cell" data-bcsc-product="hyller60"><div class="bcsc-label">H×60</div><div class="bcsc-value" id="bcscH60">—</div></div>
      </div>`;
    point.insertAdjacentElement("afterend", card);
    return card;
  }

  function activeProduct() {
    try {
      if (typeof product === "string" && ["bunner", "hyller30", "hyller60"].includes(product)) return product;
    } catch {}
    return "bunner";
  }

  function paint() {
    const card = ensureCard();
    if (!card) return;
    const title = document.getElementById("bcscTitle");
    const wanted = text();
    if (title && title.textContent !== wanted) title.textContent = wanted;
    const active = activeProduct();
    card.querySelectorAll("[data-bcsc-product]").forEach(cell => cell.classList.toggle("active", cell.dataset.bcscProduct === active));
  }

  async function fetchRows() {
    if (typeof request === "function") return await request("mottak_scans?select=product,status,stock_status&limit=10000") || [];
    if (typeof client !== "undefined" && client?.from) {
      const result = await client.from("mottak_scans").select("product,status,stock_status").limit(10000);
      if (result.error) throw result.error;
      return result.data || [];
    }
    const response = await fetch(`${SUPABASE_URL}/rest/v1/mottak_scans?select=product,status,stock_status&limit=10000`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: "application/json" }, cache: "no-store"
    });
    const body = await response.json().catch(() => []);
    if (!response.ok) throw new Error(body?.message || `HTTP ${response.status}`);
    return Array.isArray(body) ? body : [];
  }

  function setValue(id, value) { const el = document.getElementById(id); if (el && el.textContent !== String(value)) el.textContent = String(value); }
  function nowText() { try { return new Intl.DateTimeFormat("nb-NO", { hour:"2-digit", minute:"2-digit", second:"2-digit" }).format(new Date()); } catch { return new Date().toLocaleTimeString(); } }

  async function refresh() {
    paint();
    const card = ensureCard();
    if (!card || busy) return;
    busy = true;
    try {
      const rows = await fetchRows();
      const stock = rows.filter(row => row.status === "verified" && (row.stock_status || "in_stock") === "in_stock");
      setValue("bcscB", stock.filter(row => row.product === "bunner").length);
      setValue("bcscH30", stock.filter(row => row.product === "hyller30").length);
      setValue("bcscH60", stock.filter(row => row.product === "hyller60").length);
      setValue("bcscTime", nowText());
      card.classList.remove("bcsc-error");
    } catch (error) {
      setValue("bcscTime", "—");
      card.classList.add("bcsc-error");
      console.warn("Compact stock counter refresh failed", error);
    } finally { busy = false; }
  }

  document.addEventListener("click", event => {
    if (event.target.closest?.("#products,[data-language],#noBtn,#uaBtn,#utLanguageSwitch")) setTimeout(refresh, 80);
  }, true);
  window.addEventListener("bama-stock-updated", refresh);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });

  paint();
  refresh();
  setInterval(refresh, REFRESH_MS);
  window.BAMA_COMPACT_STOCK_REFRESH = refresh;
})();
