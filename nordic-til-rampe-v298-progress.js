"use strict";
(() => {
  if (window.__NORDIC_TIL_RAMPE_V298__) return;
  window.__NORDIC_TIL_RAMPE_V298__ = true;

  const SUPABASE_URL="https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY="sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const ORDER=["bunner","hyller30","hyller60","forlengere_korte","forlengere_lange","forlengere_plast","vrak_bunner","vrak_hyller"];
  const NAMES={
    nb:{bunner:"Bunner",hyller30:"Hyller x30",hyller60:"Hyller x60",forlengere_korte:"Forlengere korte",forlengere_lange:"Forlengere lange",forlengere_plast:"Forlengere plast",vrak_bunner:"Vrak bunner",vrak_hyller:"Vrak hyller"},
    uk:{bunner:"Bunner",hyller30:"Hyller x30",hyller60:"Hyller x60",forlengere_korte:"Подовжувачі короткі",forlengere_lange:"Подовжувачі довгі",forlengere_plast:"Подовжувачі пластикові",vrak_bunner:"Vrak bunner",vrak_hyller:"Vrak hyller"},
    pl:{bunner:"Bunner",hyller30:"Hyller x30",hyller60:"Hyller x60",forlengere_korte:"Przedłużki krótkie",forlengere_lange:"Przedłużki długie",forlengere_plast:"Przedłużki plastikowe",vrak_bunner:"Vrak bunner",vrak_hyller:"Vrak hyller"}
  };
  const COPY={
    nb:{order:"BESTILLING",done:"utført",left:"gjenstår",next:"NESTE",scan:"Skann",all:"✅ ALT FERDIG — KLAR PÅ RAMPE",wait:"Alle bestilte varer må være ferdige før Klar på rampe."},
    uk:{order:"ЗАМОВЛЕННЯ",done:"виконано",left:"залишилось",next:"НАСТУПНЕ",scan:"Скануй",all:"✅ ВСЕ ВИКОНАНО — ГОТОВО НА РАМПІ",wait:"Усі замовлені товари мають бути виконані перед «Готово на рампі»."},
    pl:{order:"ZAMÓWIENIE",done:"wykonano",left:"zostało",next:"NASTĘPNE",scan:"Skanuj",all:"✅ WSZYSTKO GOTOWE — RAMPA GOTOWA",wait:"Wszystkie zamówione produkty muszą być gotowe przed potwierdzeniem rampy."}
  };
  let lastKey="",timer=0,busy=false;

  function outerMode(){return document.getElementById("workBtn")?.classList.contains("active")?"work":"test"}
  function coreFrame(){return document.getElementById("utCore")}
  function coreWin(){try{return coreFrame()?.contentWindow||null}catch{return null}}
  function coreDoc(){try{return coreFrame()?.contentDocument||null}catch{return null}}
  function order(){try{const w=coreWin();return typeof w?.current==="function"?w.current():null}catch{return null}}
  function lang(){try{const w=coreWin();const v=w?.UT_LANG||w?.localStorage?.getItem("mottak_ut_language")||"nb";return v==="uk"||v==="pl"?v:"nb"}catch{return"nb"}}
  function modalOpen(){try{const d=coreDoc();return !!d?.getElementById("nidModal")?.classList.contains("show")}catch{return false}}
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

  async function rpc(orderId){
    const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/bama_order_product_progress`,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,Accept:"application/json","Content-Type":"application/json","x-bama-environment":outerMode()},body:JSON.stringify({p_order_id:orderId}),cache:"no-store"});
    const text=await r.text();let data;try{data=text?JSON.parse(text):[]}catch{data=[]}
    if(!r.ok)throw new Error(data?.message||data?.hint||text||`HTTP ${r.status}`);return Array.isArray(data)?data:[];
  }
  function ensureStyle(d){
    if(!d||d.getElementById("nidV298Style"))return;
    const s=d.createElement("style");s.id="nidV298Style";s.textContent=`
#nidWorkPanel[data-v298="1"]{border-color:#75b7ff!important;background:rgba(117,183,255,.055)!important}#nidWorkPanel[data-v298="1"] .nwp-head{color:#75b7ff!important}.v298-wait{margin-top:8px;padding:8px;border:1px dashed #f4c430;border-radius:10px;color:#f4c430;font-size:10px;font-weight:850;line-height:1.35}.v298-chip{padding:4px 7px;border:1px solid #75b7ff;border-radius:999px;color:#75b7ff;font-size:9px;font-weight:1000}
`;d.head.appendChild(s);
  }
  function patchModalNames(d){
    const l=lang(),names=NAMES[l]||NAMES.nb;
    ["nidProduct","nidCountSummary"].forEach(id=>{const el=d?.getElementById(id);if(!el)return;for(const p of ["vrak_bunner","vrak_hyller"]){if(el.textContent.includes(p))el.textContent=el.textContent.replaceAll(p,names[p])}});
  }
  function readyButton(d){
    return [...(d?.querySelectorAll(".confirm-box button")||[])].find(b=>/readyRampButton|Готово на рампі|Klar på rampe|Gotowe na rampie/i.test(b.textContent||""))||null;
  }
  function setFinalGuard(d,blocked){
    const b=readyButton(d);if(!b)return;
    if(blocked){b.dataset.v298Blocked="1";b.disabled=true;b.style.opacity=".5";b.title=(COPY[lang()]||COPY.nb).wait}
    else if(b.dataset.v298Blocked==="1"){delete b.dataset.v298Blocked;b.disabled=false;b.style.opacity="";b.title=""}
  }
  function scrollPanel(d){
    try{const panel=d.getElementById("nidWorkPanel"),frame=coreFrame(),bar=document.getElementById("envBar");if(!panel||!frame)return;const top=scrollY+frame.getBoundingClientRect().top+panel.getBoundingClientRect().top-(bar?.getBoundingClientRect().bottom||0)-6;scrollTo({top:Math.max(0,top),behavior:"smooth"})}catch{}
  }
  async function refresh(forceScroll=false){
    if(busy)return;const o=order(),d=coreDoc();if(!o||!d)return;busy=true;
    try{
      ensureStyle(d);patchModalNames(d);
      const rows=await rpc(o.id);const l=lang(),c=COPY[l]||COPY.nb,names=NAMES[l]||NAMES.nb,panel=d.getElementById("nidWorkPanel");if(!panel)return;
      const map=new Map(rows.map(r=>[r.product_id,r]));const ordered=ORDER.map(id=>map.get(id)).filter(Boolean);
      let next=null;for(const r of ordered){if(Number(r.remaining_quantity)>0&&!next)next=r}
      const allDone=ordered.length>0&&!next;
      const key=`${o.id}|${outerMode()}|`+ordered.map(r=>`${r.product_id}:${r.done_quantity}/${r.ordered_quantity}`).join(";");
      const body=ordered.map(r=>{const done=Number(r.done_quantity)||0,total=Number(r.ordered_quantity)||0,left=Math.max(0,Number(r.remaining_quantity)||0);return `<div class="nwp-row"><div class="nwp-name">${esc(names[r.product_id]||r.product_id)}</div><div class="nwp-count">${done} / ${total}<small>${left?`${c.left}: ${left}`:c.done}</small></div></div>`}).join("");
      panel.hidden=false;panel.dataset.v298="1";
      panel.innerHTML=`<div class="nwp-head"><span>📋 RAMPE ${esc(o.ramp||"—")} · ${esc(c.order)}</span><span class="v298-chip">V2.9.8 · 8</span></div>${body}${allDone?`<div class="nwp-all">${esc(c.all)}</div>`:next?`<div class="nwp-next"><b>${esc(c.next)}:</b> ${esc(c.scan)} ${esc(names[next.product_id]||next.product_id)} · ${esc(c.left)} ${Number(next.remaining_quantity)||0}</div><div class="v298-wait">${esc(c.wait)}</div>`:""}`;
      setFinalGuard(d,!allDone);
      if((forceScroll||key!==lastKey)&&!modalOpen()&&next)scrollPanel(d);
      lastKey=key;
    }catch(e){console.warn("V2.9.8 progress refresh failed",e)}finally{busy=false}
  }
  function loop(){clearTimeout(timer);timer=setTimeout(async()=>{await refresh(false);loop()},900)}

  document.addEventListener("click",()=>{setTimeout(()=>refresh(true),180);setTimeout(()=>refresh(false),900)},true);
  window.addEventListener("pageshow",()=>setTimeout(()=>refresh(false),300));
  setTimeout(()=>refresh(false),700);loop();
  window.NORDIC_TIL_RAMPE_V298={refresh,version:"2.9.8"};
})();
