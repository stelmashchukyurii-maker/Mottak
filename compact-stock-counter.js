"use strict";

// Compact warehouse counter for WORKING/office compatibility.
// Rule: current in_stock minus the still-unscanned quantity of active ramp orders.
(() => {
  if (window.__BAMA_COMPACT_STOCK_COUNTER__) return;
  window.__BAMA_COMPACT_STOCK_COUNTER__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const REFRESH_MS = 5000;
  let busy = false;
  let timer = 0;

  function langCode(){
    try{if(typeof language==="string"&&["nb","pl","uk"].includes(language))return language}catch{}
    try{if(typeof window.UT_LANG==="string"&&["nb","pl","uk"].includes(window.UT_LANG))return window.UT_LANG}catch{}
    try{
      const u=localStorage.getItem("mottak_ut_language");if(["nb","pl","uk"].includes(u))return u;
      const c=localStorage.getItem("mottak_cloud_v4_language");if(["nb","pl","uk"].includes(c))return c;
    }catch{}
    return "nb";
  }
  function titleText(){const l=langCode();return l==="uk"?"НА СКЛАДІ · МІНУС РАМПИ":l==="pl"?"MAGAZYN · MINUS RAMPY":"PÅ LAGER · MINUS RAMPER"}

  function ensureStyle(){
    if(document.getElementById("bamaCompactStockStyle"))return;
    const s=document.createElement("style");s.id="bamaCompactStockStyle";s.textContent=`
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

  async function requestJson(path){
    if(typeof request==="function")return await request(path)||[];
    if(typeof client!=="undefined"&&client?.from){
      if(path.startsWith("mottak_scans?")){const r=await client.from("mottak_scans").select("product,status,stock_status,ut_order_id").limit(10000);if(r.error)throw r.error;return r.data||[]}
      if(path.startsWith("ut_orders?")){const r=await client.from("ut_orders").select("id,status,bunner_stacks,hyller30_sets,hyller60_sets").limit(1000);if(r.error)throw r.error;return r.data||[]}
    }
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,Accept:"application/json"},cache:"no-store"});
    const b=await r.json().catch(()=>[]);if(!r.ok)throw new Error(b?.message||`HTTP ${r.status}`);return Array.isArray(b)?b:[];
  }

  function qty(o,k){if(k==="bunner")return Number(o.bunner_stacks)||0;if(k==="hyller30")return Number(o.hyller30_sets)||0;return Number(o.hyller60_sets)||0}
  function calculate(scans,orders){
    const verified=(scans||[]).filter(r=>r.status==="verified");
    const active=(orders||[]).filter(o=>!["completed","cancelled"].includes(o.status));
    const inStock={
      bunner:verified.filter(r=>r.product==="bunner"&&(r.stock_status||"in_stock")==="in_stock").length,
      hyller30:verified.filter(r=>r.product==="hyller30"&&(r.stock_status||"in_stock")==="in_stock").length,
      hyller60:verified.filter(r=>r.product==="hyller60"&&(r.stock_status||"in_stock")==="in_stock").length
    };
    const stagedByOrder=new Map();
    verified.forEach(r=>{if(!r.ut_order_id||r.stock_status!=="staged")return;const id=String(r.ut_order_id);if(!stagedByOrder.has(id))stagedByOrder.set(id,{bunner:0,hyller30:0,hyller60:0});const b=stagedByOrder.get(id);if(Object.prototype.hasOwnProperty.call(b,r.product))b[r.product]+=1});
    const still={bunner:0,hyller30:0,hyller60:0};
    active.forEach(o=>{const used=stagedByOrder.get(String(o.id))||{bunner:0,hyller30:0,hyller60:0};still.bunner+=Math.max(0,qty(o,"bunner")-used.bunner);still.hyller30+=Math.max(0,qty(o,"hyller30")-used.hyller30);still.hyller60+=Math.max(0,qty(o,"hyller60")-used.hyller60)});
    return {bunner:Math.max(0,inStock.bunner-still.bunner),hyller30:Math.max(0,inStock.hyller30-still.hyller30),hyller60:Math.max(0,inStock.hyller60-still.hyller60)};
  }

  function set(id,v){const e=document.getElementById(id);if(e&&e.textContent!==String(v))e.textContent=String(v)}
  function patchOfficeAvailable(v){const box=document.querySelector(".office-stock-row.available-row .office-stock-products");if(!box)return;const html=`<span><b>Bunner:</b> ${v.bunner} ${v.bunner===1?"stabel":"stabler"}</span><span><b>Hyller x30:</b> ${v.hyller30} sett</span><span><b>Hyller x60:</b> ${v.hyller60} sett</span>`;if(box.innerHTML!==html)box.innerHTML=html}

  async function refresh(){
    paint();if(busy||!ensureCard())return;busy=true;
    try{
      const [scans,orders]=await Promise.all([requestJson("mottak_scans?select=product,status,stock_status,ut_order_id&limit=10000"),requestJson("ut_orders?select=id,status,bunner_stacks,hyller30_sets,hyller60_sets&limit=1000")]);
      const v=calculate(scans,orders);set("bcscB",v.bunner);set("bcscH30",v.hyller30);set("bcscH60",v.hyller60);set("bcscTime",new Date().toLocaleTimeString("nb-NO",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));patchOfficeAvailable(v);
    }catch(e){set("bcscTime","—");console.warn("Compact stock refresh failed",e)}finally{busy=false}
  }
  function loop(){clearTimeout(timer);timer=setTimeout(async()=>{await refresh();loop()},REFRESH_MS)}
  document.addEventListener("click",e=>{if(e.target.closest?.("#products,[data-language],#noBtn,#uaBtn,#utLanguageSwitch"))setTimeout(refresh,80)},true);
  window.addEventListener("bama-stock-updated",refresh);document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});
  paint();refresh();loop();window.BAMA_COMPACT_STOCK_REFRESH=refresh;
})();
