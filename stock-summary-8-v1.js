"use strict";
(() => {
  if (window.__BAMA_STOCK_SUMMARY_8_V1__) return;
  window.__BAMA_STOCK_SUMMARY_8_V1__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const REFRESH_MS = 5000;
  const ORDER = ["bunner","hyller30","hyller60","forlengere_korte","forlengere_lange","forlengere_plast","vrak_bunner","vrak_hyller"];
  const SHORT = {
    bunner:"B",hyller30:"H×30",hyller60:"H×60",forlengere_korte:"F-K",forlengere_lange:"F-L",forlengere_plast:"F-P",vrak_bunner:"V-B",vrak_hyller:"V-H"
  };
  const NAMES = {
    nb:{bunner:"Bunner",hyller30:"Hyller x30",hyller60:"Hyller x60",forlengere_korte:"Forlengere korte",forlengere_lange:"Forlengere lange",forlengere_plast:"Forlengere plast",vrak_bunner:"Vrak bunner",vrak_hyller:"Vrak hyller"},
    uk:{bunner:"Bunner",hyller30:"Hyller x30",hyller60:"Hyller x60",forlengere_korte:"Подовжувачі короткі",forlengere_lange:"Подовжувачі довгі",forlengere_plast:"Подовжувачі пластикові",vrak_bunner:"Vrak bunner",vrak_hyller:"Vrak hyller"},
    pl:{bunner:"Bunner",hyller30:"Hyller x30",hyller60:"Hyller x60",forlengere_korte:"Przedłużki krótkie",forlengere_lange:"Przedłużki długie",forlengere_plast:"Przedłużki plastikowe",vrak_bunner:"Vrak bunner",vrak_hyller:"Vrak hyller"}
  };
  const COPY = {
    nb:{physical:"PÅ LAGER",available:"TILGJENGELIG · PÅ LAGER − BESTILLINGER",order:"ordre",missing:"mangler",loading:"Laster…",error:"Kunne ikke lese lager"},
    uk:{physical:"НА СКЛАДІ",available:"ДОСТУПНО · СКЛАД − ЗАМОВЛЕННЯ",order:"замовлено",missing:"бракує",loading:"Оновлюю…",error:"Не вдалося прочитати склад"},
    pl:{physical:"NA MAGAZYNIE",available:"DOSTĘPNE · MAGAZYN − ZAMÓWIENIA",order:"zamówiono",missing:"brakuje",loading:"Ładowanie…",error:"Nie można odczytać magazynu"}
  };
  let timer=0,busy=false,lastRows=[];

  const $=id=>document.getElementById(id);
  function lang(){
    try{if(typeof window.UT_LANG==="string"&&["nb","uk","pl"].includes(window.UT_LANG))return window.UT_LANG}catch{}
    try{if(typeof language==="string"&&["nb","uk","pl"].includes(language))return language}catch{}
    try{
      const u=localStorage.getItem("mottak_ut_language"); if(["nb","uk","pl"].includes(u))return u;
      const c=localStorage.getItem("mottak_cloud_v4_language"); if(["nb","uk","pl"].includes(c))return c;
    }catch{}
    return "nb";
  }
  function env(){
    try{if($("workBtn")?.classList.contains("active"))return "work";if($("testBtn")?.classList.contains("active"))return "test"}catch{}
    try{if(document.body?.dataset?.bamaEnv==="test")return "test";if(document.body?.dataset?.bamaEnv==="work")return "work"}catch{}
    try{if(window.BAMA_ENV_MODE==="test")return "test";if(window.BAMA_ENV_MODE==="work")return "work"}catch{}
    return "work";
  }
  function activeProduct(){
    try{const p=document.querySelector("#products [data-product].active,[data-product].active");if(p?.dataset.product&&ORDER.includes(p.dataset.product))return p.dataset.product}catch{}
    try{if(typeof product==="string"&&ORDER.includes(product))return product}catch{}
    return "";
  }
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

  function style(){
    if($("bamaStockSummary8Style"))return;
    const s=document.createElement("style");s.id="bamaStockSummary8Style";s.textContent=`
#bamaStockSummary8{width:100%;margin:12px 0 16px;padding:12px;border:2px solid #303b59;border-radius:22px;background:#0d1426;color:#f5f7ff;font-family:Arial,Helvetica,sans-serif;box-shadow:0 10px 24px rgba(0,0,0,.14)}
#bamaStockSummary8 *{box-sizing:border-box}.bs8-section+.bs8-section{margin-top:13px;padding-top:12px;border-top:1px solid #303b59}.bs8-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.bs8-title{color:#aab4ce;font-size:clamp(13px,3.8vw,19px);font-weight:1000;letter-spacing:.015em}.bs8-section.available .bs8-title{color:#48d597}.bs8-meta{flex:0 0 auto;color:#aab4ce;font-size:10px;font-weight:850}.bs8-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.bs8-item{min-width:0;padding:8px 4px 7px;border:1px solid #303b59;border-radius:13px;background:#0b1020;text-align:center}.bs8-item.active{border-color:#f4c430;box-shadow:0 0 0 1px rgba(244,196,48,.16)}.bs8-item.shortage{border-color:#ff7373;background:rgba(255,115,115,.07)}.bs8-code{color:#aab4ce;font-size:clamp(11px,3.2vw,15px);font-weight:1000;white-space:nowrap}.bs8-value{margin-top:3px;color:#f5f7ff;font-size:clamp(25px,7vw,38px);font-weight:1000;line-height:1}.available .bs8-value{color:#48d597}.available .bs8-item.shortage .bs8-value{color:#ff9d9d}.bs8-name{margin-top:4px;min-height:22px;color:#aab4ce;font-size:8px;font-weight:800;line-height:1.15;overflow-wrap:anywhere}.bs8-sub{margin-top:3px;min-height:11px;color:#dbe3f5;font-size:8px;font-weight:850;line-height:1.15}.bs8-item.shortage .bs8-sub{color:#ffb7b7}.bs8-error{padding:10px;color:#ffb7b7;font-size:11px;text-align:center}.bs8-loading{opacity:.66}
#bamaCompactStockCounter{display:none!important}#productTotalsCard{display:none!important}.office-stock-row.available-row{display:none!important}
@media(max-width:390px){#bamaStockSummary8{padding:9px;border-radius:18px}.bs8-grid{gap:5px}.bs8-item{padding:7px 2px 6px;border-radius:11px}.bs8-name{font-size:7px}.bs8-sub{font-size:7px}}
`;
    document.head.appendChild(s);
  }

  function anchor(){
    const old=$("bamaCompactStockCounter"); if(old)return {el:old,where:"beforebegin"};
    const totals=$("productTotalsCard"); if(totals)return {el:totals,where:"beforebegin"};
    const til=$("tilLagerStock"); if(til)return {el:til,where:"afterend"};
    const top=$("topStockLine"); if(top)return {el:top,where:"beforebegin"};
    const products=$("products"); if(products)return {el:products.closest(".card")||products,where:"afterend"};
    const h=document.querySelector("main.app h1,main h1,h1"); return h?{el:h,where:"afterend"}:null;
  }
  function ensure(){
    style();
    let c=$("bamaStockSummary8");if(c)return c;
    const a=anchor();if(!a)return null;
    c=document.createElement("section");c.id="bamaStockSummary8";
    c.innerHTML=`<div class="bs8-section physical"><div class="bs8-head"><div class="bs8-title" id="bs8PhysicalTitle"></div><div class="bs8-meta" id="bs8Meta">—</div></div><div class="bs8-grid" id="bs8PhysicalGrid"></div></div><div class="bs8-section available"><div class="bs8-head"><div class="bs8-title" id="bs8AvailableTitle"></div><div class="bs8-meta" id="bs8Env"></div></div><div class="bs8-grid" id="bs8AvailableGrid"></div></div>`;
    a.el.insertAdjacentElement(a.where,c);return c;
  }
  function hideLegacy(){
    const old=$("bamaCompactStockCounter");if(old)old.style.setProperty("display","none","important");
    const totals=$("productTotalsCard");if(totals)totals.style.setProperty("display","none","important");
    document.querySelectorAll(".office-stock-row.available-row").forEach(x=>x.style.setProperty("display","none","important"));
  }
  function packageText(row,n){
    const count=Number(n)||0;
    if(row.product_id==="bunner")return `${count*10} stk`;
    if(row.product_id==="hyller30"||row.product_id==="hyller60")return `${count*(Number(row.package_size)||0)} hyller`;
    if(row.product_id==="vrak_bunner"||row.product_id==="vrak_hyller")return `${count*(Number(row.package_size)||0)} stk`;
    if(row.product_id==="forlengere_plast")return `${count} esker`;
    return `${count} vogner`;
  }
  function tile(row,type,active){
    const l=lang(),copy=COPY[l]||COPY.nb,names=NAMES[l]||NAMES.nb;
    const physical=Number(row.physical_count)||0,available=Number(row.available_count)||0,remaining=Number(row.order_remaining)||0,shortage=Number(row.shortage_count)||0;
    const val=type==="physical"?physical:available;
    let sub=type==="physical"?packageText(row,physical):packageText(row,Math.max(0,available));
    if(type==="available"&&remaining>0)sub=`${copy.order}: −${remaining}`;
    if(type==="available"&&shortage>0)sub=`${copy.missing}: ${shortage}`;
    return `<div class="bs8-item ${active===row.product_id?"active":""} ${type==="available"&&shortage>0?"shortage":""}" data-bs8-product="${esc(row.product_id)}" title="${esc(names[row.product_id]||row.product_id)}"><div class="bs8-code">${esc(SHORT[row.product_id]||row.product_id)}</div><div class="bs8-value">${val}</div><div class="bs8-name">${esc(names[row.product_id]||row.product_id)}</div><div class="bs8-sub">${esc(sub)}</div></div>`;
  }
  function render(rows){
    const c=ensure();if(!c)return;hideLegacy();
    const l=lang(),copy=COPY[l]||COPY.nb,active=activeProduct();
    $("bs8PhysicalTitle").textContent=copy.physical;
    $("bs8AvailableTitle").textContent=copy.available;
    $("bs8Env").textContent=env().toUpperCase();
    const map=new Map((rows||[]).map(r=>[r.product_id,r]));
    const ordered=ORDER.map(id=>map.get(id)||{product_id:id,physical_count:0,on_ramp_count:0,order_remaining:0,available_count:0,shortage_count:0,unit:"",package_size:null});
    $("bs8PhysicalGrid").innerHTML=ordered.map(r=>tile(r,"physical",active)).join("");
    $("bs8AvailableGrid").innerHTML=ordered.map(r=>tile(r,"available",active)).join("");
    $("bs8Meta").textContent=new Date().toLocaleTimeString(l==="uk"?"uk-UA":l==="pl"?"pl-PL":"nb-NO",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  }
  async function fetchRows(){
    const e=env();
    const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/bama_stock_summary`,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,Accept:"application/json","Content-Type":"application/json","x-bama-environment":e},body:"{}",cache:"no-store"});
    const text=await r.text();let data;try{data=text?JSON.parse(text):[]}catch{data=[]}
    if(!r.ok)throw new Error(data?.message||data?.hint||text||`HTTP ${r.status}`);
    return Array.isArray(data)?data:[];
  }
  async function refresh(){
    const c=ensure();if(!c||busy)return;hideLegacy();busy=true;c.classList.add("bs8-loading");
    try{lastRows=await fetchRows();render(lastRows);window.dispatchEvent(new CustomEvent("bama-stock-summary-updated",{detail:{environment:env(),rows:lastRows}}));}
    catch(e){const l=lang(),copy=COPY[l]||COPY.nb;const grid=$("bs8AvailableGrid");if(grid)grid.innerHTML=`<div class="bs8-error" style="grid-column:1/-1">${esc(copy.error)}: ${esc(e.message||e)}</div>`;console.warn("Stock summary 8 refresh failed",e)}
    finally{busy=false;c.classList.remove("bs8-loading")}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(async()=>{await refresh();schedule()},REFRESH_MS)}

  document.addEventListener("click",e=>{
    if(e.target.closest?.("#products,[data-product],#testBtn,#workBtn,#send,#refresh,[data-storno],[data-edit],#yesBtn,#noBtn")){
      setTimeout(refresh,120);setTimeout(refresh,900);setTimeout(refresh,1800);
    }
  },true);
  window.addEventListener("bama-stock-updated",refresh);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});
  window.addEventListener("pageshow",refresh);

  ensure();hideLegacy();refresh();schedule();
  setTimeout(()=>{ensure();hideLegacy();refresh()},500);
  setTimeout(()=>{ensure();hideLegacy()},1500);
  window.BAMA_STOCK_SUMMARY_REFRESH=refresh;
  window.BAMA_COMPACT_STOCK_REFRESH=refresh;
  window.BAMA_STOCK_SUMMARY_8={refresh,getRows:()=>lastRows.slice(),version:"1.0.0"};
})();
