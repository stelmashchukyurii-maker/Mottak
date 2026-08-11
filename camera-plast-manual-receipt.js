"use strict";
(() => {
  if (window.__BAMA_CAMERA_PLAST_RECEIPT__) return;
  window.__BAMA_CAMERA_PLAST_RECEIPT__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const PRODUCT_ID = "forlengere_plast";
  let busy = false;

  const $ = id => document.getElementById(id);
  function lang(){
    try{if(typeof language==="string"&&["nb","uk","pl"].includes(language))return language}catch{}
    try{const v=localStorage.getItem("mottak_cloud_v4_language");if(["nb","uk","pl"].includes(v))return v}catch{}
    return "nb";
  }
  const COPY={
    nb:{title:"Forlengere plast · manuelt mottak",note:"Ingen RFID. Registrer bare antall esker som fysisk kom inn på lager.",current:"På lager nå",qty:"Antall esker inn",add:"LEGG PÅ LAGER",saving:"Lagrer…",ok:n=>`✅ ${n} esker lagt på lager.`,bad:"Kunne ikke registrere mottaket.",need:"Skriv inn minst 1 eske."},
    uk:{title:"Подовжувачі пластикові · ручний прихід",note:"Без RFID. Вкажіть тільки кількість ящиків, які фізично прийшли на склад.",current:"Зараз на складі",qty:"Ящиків прийшло",add:"ДОДАТИ НА СКЛАД",saving:"Зберігаю…",ok:n=>`✅ ${n} ящиків додано на склад.`,bad:"Не вдалося записати прихід.",need:"Вкажіть щонайменше 1 ящик."},
    pl:{title:"Przedłużki plastikowe · przyjęcie ręczne",note:"Bez RFID. Wpisz tylko liczbę pudełek fizycznie przyjętych do magazynu.",current:"Teraz w magazynie",qty:"Pudełka przyjęte",add:"DODAJ DO MAGAZYNU",saving:"Zapisuję…",ok:n=>`✅ Dodano ${n} pudełek do magazynu.`,bad:"Nie udało się zapisać przyjęcia.",need:"Wpisz co najmniej 1 pudełko."}
  };
  function t(){return COPY[lang()]||COPY.nb}

  function addStyle(){
    if($("cameraPlastReceiptStyle"))return;
    const s=document.createElement("style");s.id="cameraPlastReceiptStyle";s.textContent=`
#cameraPlastReceipt{margin:14px 0;padding:13px;border:2px solid #75b7ff;border-radius:18px;background:rgba(117,183,255,.06);color:#f5f7ff;font-family:Arial,Helvetica,sans-serif}
#cameraPlastReceipt .cpr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.cpr-title{color:#75b7ff;font-size:17px;font-weight:1000;line-height:1.2}.cpr-stock{flex:0 0 auto;padding:5px 8px;border:1px solid #303b59;border-radius:999px;color:#f5f7ff;font-size:11px;font-weight:950}.cpr-note{margin:7px 0 10px;color:#aab4ce;font-size:11px;line-height:1.4}.cpr-controls{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}.cpr-field label{display:block;margin:0 0 5px;color:#aab4ce;font-size:10px;font-weight:900}.cpr-field input{width:100%;min-height:56px;padding:9px 11px;border:1px solid #303b59;border-radius:12px;background:#0b1020;color:#f5f7ff;font-size:25px;font-weight:1000;text-align:center;outline:none}.cpr-field input:focus{border-color:#75b7ff;box-shadow:0 0 0 3px rgba(117,183,255,.12)}.cpr-quick{display:flex;gap:6px;margin-top:7px}.cpr-quick button{min-height:38px;min-width:48px;border:1px solid #303b59;border-radius:9px;background:#151c30;color:#f5f7ff;font-weight:900}.cpr-add{min-height:56px;padding:9px 14px;border:0;border-radius:12px;background:#48d597;color:#062418;font-size:14px;font-weight:1000}.cpr-add:disabled{opacity:.55}.cpr-msg{min-height:18px;margin-top:8px;color:#aab4ce;font-size:10px;font-weight:800;text-align:center}.cpr-msg.ok{color:#48d597}.cpr-msg.bad{color:#ff8f8f}@media(max-width:410px){.cpr-controls{grid-template-columns:1fr}.cpr-add{width:100%}}
`;
    document.head.appendChild(s);
  }

  function anchor(){return $("bamaStockSummary8")||$("productTotalsCard")||document.querySelector("main .card,#products")}
  function ensure(){
    addStyle();let card=$("cameraPlastReceipt");if(card)return card;const a=anchor();if(!a)return null;
    card=document.createElement("section");card.id="cameraPlastReceipt";
    card.innerHTML=`<div class="cpr-head"><div class="cpr-title" id="cprTitle"></div><div class="cpr-stock" id="cprStock">—</div></div><div class="cpr-note" id="cprNote"></div><div class="cpr-controls"><div class="cpr-field"><label id="cprLabel" for="cprQty"></label><input id="cprQty" type="number" min="1" max="500" step="1" inputmode="numeric" value="1"><div class="cpr-quick"><button type="button" data-cpr-set="1">1</button><button type="button" data-cpr-set="5">5</button><button type="button" data-cpr-set="10">10</button></div></div><button class="cpr-add" id="cprAdd" type="button"></button></div><div class="cpr-msg" id="cprMsg"></div>`;
    a.insertAdjacentElement("afterend",card);
    card.querySelectorAll("[data-cpr-set]").forEach(b=>b.addEventListener("click",()=>{$("cprQty").value=b.dataset.cprSet;}));
    $("cprAdd").addEventListener("click",receive);
    paint();return card;
  }
  function paint(){
    const c=t();if(!ensure())return;
    $("cprTitle").textContent=c.title;$("cprNote").textContent=c.note;$("cprLabel").textContent=c.qty;$("cprAdd").textContent=c.add;
  }
  function setMessage(text,type=""){$("cprMsg").textContent=text||"";$("cprMsg").className=`cpr-msg ${type}`}

  async function rpc(name,body){
    const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,Accept:"application/json","Content-Type":"application/json","x-bama-environment":"work"},body:JSON.stringify(body||{}),cache:"no-store"});
    const text=await r.text();let data;try{data=text?JSON.parse(text):null}catch{data=text}
    if(!r.ok)throw new Error(data?.message||data?.hint||text||`HTTP ${r.status}`);return data;
  }
  async function refreshStock(){
    ensure();try{
      const rows=await rpc("bama_stock_summary",{});const row=Array.isArray(rows)?rows.find(x=>x.product_id===PRODUCT_ID):null;
      const n=Number(row?.physical_count)||0;$("cprStock").textContent=`${t().current}: ${n}`;
    }catch{$("cprStock").textContent=`${t().current}: —`}
  }
  async function receive(){
    if(busy)return;const qty=Math.trunc(Number($("cprQty")?.value));const c=t();
    if(!Number.isFinite(qty)||qty<1||qty>500){setMessage(c.need,"bad");return}
    busy=true;$("cprAdd").disabled=true;setMessage(c.saving);
    try{
      await rpc("receive_mottak_quantity_stock",{p_product_id:PRODUCT_ID,p_quantity:qty,p_source:"camera_manual"});
      $("cprQty").value="1";setMessage(c.ok(qty),"ok");
      await refreshStock();
      window.dispatchEvent(new CustomEvent("bama-stock-updated",{detail:{product_id:PRODUCT_ID,quantity:qty,source:"camera_manual"}}));
      await window.BAMA_STOCK_SUMMARY_REFRESH?.();
      setTimeout(()=>$("cameraPlastReceipt")?.scrollIntoView({behavior:"smooth",block:"center"}),80);
    }catch(e){setMessage(`${c.bad} ${e.message||e}`,"bad")}
    finally{busy=false;$("cprAdd").disabled=false}
  }

  window.addEventListener("bama-stock-summary-updated",e=>{const row=e.detail?.rows?.find?.(x=>x.product_id===PRODUCT_ID);if(row&&$("cprStock"))$("cprStock").textContent=`${t().current}: ${Number(row.physical_count)||0}`});
  document.addEventListener("click",e=>{if(e.target.closest?.("[data-language],#languages"))setTimeout(()=>{paint();refreshStock()},80)},true);
  ensure();paint();refreshStock();
  window.CAMERA_PLAST_RECEIPT={refresh:refreshStock,version:"1.0.0"};
})();
