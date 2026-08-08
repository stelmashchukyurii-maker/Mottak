"use strict";

// Safe compact warehouse counter. V2 deliberately uses its own guard.
window.__BAMA_COMPACT_STOCK_COUNTER__ = true; // disables cached v1 if it appears later
(() => {
  if (window.__BAMA_COMPACT_STOCK_COUNTER_V2__) return;
  window.__BAMA_COMPACT_STOCK_COUNTER_V2__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  let busy = false;

  function langCode(){
    try{if(typeof language==="string"&&["nb","pl","uk"].includes(language))return language}catch{}
    try{if(typeof window.UT_LANG==="string"&&["nb","pl","uk"].includes(window.UT_LANG))return window.UT_LANG}catch{}
    try{const x=localStorage.getItem("mottak_ut_language");if(["nb","pl","uk"].includes(x))return x}catch{}
    return "nb";
  }
  function titleText(){const l=langCode();return l==="uk"?"НА СКЛАДІ · БЕЗ РАМПИ":l==="pl"?"NA MAGAZYNIE · POZA RAMPĄ":"PÅ LAGER · UTEN RAMPE"}
  function ensureStyle(){if(document.getElementById("bamaCompactStockStyleV2"))return;const s=document.createElement("style");s.id="bamaCompactStockStyleV2";s.textContent=`
#bamaCompactStockCounter{width:100%;max-width:100%;margin:12px 0 16px;padding:14px 16px 16px;border:2px solid #303b59;border-radius:24px;background:#0d1426;color:#f5f7ff;box-shadow:0 10px 24px rgba(0,0,0,.14);font-family:Arial,Helvetica,sans-serif}
#bamaCompactStockCounter .bcsc-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}
#bamaCompactStockCounter .bcsc-title{min-width:0;color:#aab4ce;font-size:clamp(14px,4vw,21px);font-weight:950;letter-spacing:.02em}
#bamaCompactStockCounter .bcsc-time{flex:0 0 auto;color:#aab4ce;font-size:clamp(12px,3.4vw,18px);font-weight:850}
#bamaCompactStockCounter .bcsc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
#bamaCompactStockCounter .bcsc-cell{min-width:0;min-height:116px;padding:14px 8px;border:2px solid #303b59;border-radius:20px;background:#0b1020;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center}
#bamaCompactStockCounter .bcsc-cell.active{border-color:#48d597;box-shadow:0 0 0 1px rgba(72,213,151,.14)}
#bamaCompactStockCounter .bcsc-label{color:#aab4ce;font-size:clamp(18px,5vw,27px);font-weight:950;line-height:1}
#bamaCompactStockCounter .bcsc-value{color:#f5f7ff;font-size:clamp(40px,11vw,62px);font-weight:1000;line-height:1}
@media(max-width:420px){#bamaCompactStockCounter{padding:12px 12px 14px;border-radius:20px}#bamaCompactStockCounter .bcsc-grid{gap:8px}#bamaCompactStockCounter .bcsc-cell{min-height:102px;border-radius:17px;padding:11px 5px}}
`;document.head.appendChild(s)}
  function anchor(){const p=document.getElementById("products");if(p)return p.closest(".card")||p;return document.querySelector("main.app h1,main h1,.app h1,h1")}
  function ensureCard(){let c=document.getElementById("bamaCompactStockCounter");if(c)return c;const a=anchor();if(!a)return null;ensureStyle();c=document.createElement("section");c.id="bamaCompactStockCounter";c.innerHTML=`<div class="bcsc-head"><div class="bcsc-title" id="bcscTitle"></div><div class="bcsc-time" id="bcscTime">—</div></div><div class="bcsc-grid"><div class="bcsc-cell" data-bcsc-product="bunner"><div class="bcsc-label">B</div><div class="bcsc-value" id="bcscB">—</div></div><div class="bcsc-cell" data-bcsc-product="hyller30"><div class="bcsc-label">H×30</div><div class="bcsc-value" id="bcscH30">—</div></div><div class="bcsc-cell" data-bcsc-product="hyller60"><div class="bcsc-label">H×60</div><div class="bcsc-value" id="bcscH60">—</div></div></div>`;a.insertAdjacentElement("afterend",c);return c}
  function activeProduct(){try{if(typeof product==="string"&&["bunner","hyller30","hyller60"].includes(product))return product}catch{}return "bunner"}
  function paint(){const c=ensureCard();if(!c)return;const t=document.getElementById("bcscTitle"),want=titleText();if(t&&t.textContent!==want)t.textContent=want;const ap=activeProduct();c.querySelectorAll("[data-bcsc-product]").forEach(x=>x.classList.toggle("active",x.dataset.bcscProduct===ap))}
  async function rows(){if(typeof request==="function")return await request("mottak_scans?select=product,status,stock_status&limit=10000")||[];if(typeof client!=="undefined"&&client?.from){const r=await client.from("mottak_scans").select("product,status,stock_status").limit(10000);if(r.error)throw r.error;return r.data||[]}const r=await fetch(`${SUPABASE_URL}/rest/v1/mottak_scans?select=product,status,stock_status&limit=10000`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,Accept:"application/json"},cache:"no-store"});const b=await r.json().catch(()=>[]);if(!r.ok)throw new Error(b?.message||`HTTP ${r.status}`);return Array.isArray(b)?b:[]}
  function set(id,v){const e=document.getElementById(id);if(e&&e.textContent!==String(v))e.textContent=String(v)}
  async function refresh(){paint();if(busy||!ensureCard())return;busy=true;try{const all=await rows(),s=all.filter(r=>r.status==="verified"&&(r.stock_status||"in_stock")==="in_stock");set("bcscB",s.filter(r=>r.product==="bunner").length);set("bcscH30",s.filter(r=>r.product==="hyller30").length);set("bcscH60",s.filter(r=>r.product==="hyller60").length);set("bcscTime",new Date().toLocaleTimeString("nb-NO",{hour:"2-digit",minute:"2-digit",second:"2-digit"}))}catch(e){set("bcscTime","—");console.warn("Compact stock v2 refresh failed",e)}finally{busy=false}}
  document.addEventListener("click",e=>{if(e.target.closest?.("#products,[data-language],#noBtn,#uaBtn,#utLanguageSwitch"))setTimeout(refresh,80)},true);
  window.addEventListener("bama-stock-updated",refresh);document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});
  paint();refresh();setInterval(refresh,5000);window.BAMA_COMPACT_STOCK_REFRESH=refresh;
})();
