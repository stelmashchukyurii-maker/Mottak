"use strict";
(()=>{
  if(window.__NORDIC_TIL_RAMPE_EXT_COUNT_DISPLAY_V1__)return;
  window.__NORDIC_TIL_RAMPE_EXT_COUNT_DISPLAY_V1__=true;

  const LABELS={
    forlengere_korte:["forlengere korte","przedłużki krótkie","подовжувачі короткі"],
    forlengere_lange:["forlengere lange","przedłużki długie","подовжувачі довгі"]
  };
  let seq=0;

  function inner(){
    const f=document.getElementById("utCore");
    if(!f)return null;
    try{return {f,w:f.contentWindow,d:f.contentDocument}}catch{return null}
  }

  function findRow(d,productId){
    const names=LABELS[productId]||[];
    for(const row of d.querySelectorAll("#nidWorkPanel .nwp-row")){
      const name=row.querySelector(".nwp-name");
      const text=String(name?.textContent||"").trim().toLowerCase();
      if(names.some(x=>text.includes(x)))return row;
    }
    return null;
  }

  function setQty(row,value){
    if(!row)return;
    const name=row.querySelector(".nwp-name");
    if(!name)return;
    let el=name.querySelector(".nid-ext-stk");
    if(value==null){el?.remove();return;}
    if(!el){
      el=document.createElement("small");
      el.className="nid-ext-stk";
      el.style.cssText="display:block;margin-top:3px;color:#48d597;font-size:12px;font-weight:1000;line-height:1.2";
      name.appendChild(el);
    }
    el.textContent=`${value} stk.`;
  }

  async function decorate(){
    const ticket=++seq;
    const x=inner();
    if(!x?.d?.body)return;
    const box=x.d.getElementById("nidWorkPanel");
    if(!box||box.hidden)return;
    let order=null;
    try{order=typeof x.w.current==="function"?x.w.current():null}catch{}
    if(!order?.id||typeof x.w.rpc!=="function")return;

    let data=[];
    try{data=await x.w.rpc("ut_extra_progress",{p_order_id:order.id})||[]}catch{return}
    if(ticket!==seq)return;

    for(const productId of ["forlengere_korte","forlengere_lange"]){
      const units=(Array.isArray(data)?data:[]).filter(r=>r?.product_id===productId && r.forlengere_count!=null && Number.isFinite(Number(r.forlengere_count)));
      const total=units.length?units.reduce((sum,r)=>sum+Number(r.forlengere_count||0),0):null;
      setQty(findRow(x.d,productId),total);
    }
  }

  function hook(){
    const original=window.refreshWorkPanel;
    if(typeof original==="function"&&!original.__NID_EXT_COUNT_HOOKED__){
      const wrapped=async function(...args){
        const result=await original.apply(this,args);
        setTimeout(decorate,0);
        return result;
      };
      wrapped.__NID_EXT_COUNT_HOOKED__=true;
      window.refreshWorkPanel=wrapped;
    }
    decorate();
  }

  hook();
  setTimeout(hook,250);
  setTimeout(hook,900);
  setInterval(decorate,2500);
})();
