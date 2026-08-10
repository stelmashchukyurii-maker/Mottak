"use strict";
(() => {
  if (window.__BAMA_UT_TEST_API__) return;
  window.__BAMA_UT_TEST_API__ = true;

  const ORIGIN = "https://hzjsatehehhpgpskckfi.supabase.co";
  const nativeFetch = window.fetch.bind(window);
  const allowedTables = new Set([
    "mottak_scans","ut_orders","ut_order_items","ut_order_scans","ut_extra_confirmations"
  ]);
  const allowedRpcs = new Set([
    "ut_physical_stock","reserve_ut_scan_by_id","reserve_ut_scan","remove_ut_scan",
    "reserve_ut_scans_bulk","stage_ut_order","test_dispatch_ut_order","confirm_ut_dispatch",
    "return_ut_test_order","cancel_ut_order","office_edit_unsent_ut_order",
    "update_ut_order_before_dispatch","register_ut_scan_only","register_and_reserve_ut_scan",
    "save_ut_order_with_items","ut_extra_progress","confirm_ut_extra_unit","clear_ut_extra_unit",
    "change_mottak_stock_status","nordic_preview","nordic_auto_scan","nordic_confirm_extra"
  ]);

  const names={nb:{bunner:"Bunner",hyller30:"Hyller x30",hyller60:"Hyller x60",forlengere_korte:"Forlengere korte",forlengere_lange:"Forlengere lange",forlengere_plast:"Forlengere plast"},pl:{bunner:"Bunner",hyller30:"Hyller x30",hyller60:"Hyller x60",forlengere_korte:"Przedłużki krótkie",forlengere_lange:"Przedłużki długie",forlengere_plast:"Przedłużki plastikowe"},uk:{bunner:"Bunner",hyller30:"Hyller x30",hyller60:"Hyller x60",forlengere_korte:"Подовжувачі короткі",forlengere_lange:"Подовжувачі довгі",forlengere_plast:"Подовжувачі пластикові"}};
  const copy={nb:{needExtras:"Registrer først Hyller og Forlengere for korte/lange forlengere før «Klar på rampe»."},pl:{needExtras:"Najpierw wpisz liczbę półek i przedłużek przed «Gotowe na rampie»."},uk:{needExtras:"Спочатку введіть Hyller і Forlengere перед «Готово на рампі»."}};

  function env(){return window.BAMA_ENV_MODE==="work"?"work":"test"}
  function lang(){const v=window.UT_LANG||localStorage.getItem("mottak_ut_language")||"nb";return v==="pl"||v==="uk"?v:"nb"}
  function tx(){return copy[lang()]||copy.nb}
  function method(input,init){return String(init?.method||input?.method||"GET").toUpperCase()}
  function raw(input){return typeof input==="string"||input instanceof URL?String(input):input.url}
  function jsonError(message,status=409){return new Response(JSON.stringify({message}),{status,headers:{"Content-Type":"application/json"}})}

  function validate(urlText){
    const u=new URL(urlText,location.href);
    if(u.origin!==ORIGIN||!u.pathname.startsWith("/rest/v1/"))return;
    const path=u.pathname.slice(9),slash=path.indexOf("/"),first=slash===-1?path:path.slice(0,slash);
    if(first==="rpc"){
      const name=path.slice(4);
      if(!allowedRpcs.has(name))throw new Error(`ENV SAFETY: RPC '${name}' is not allowed on the TEST/WORK mirror.`);
      return;
    }
    if(!allowedTables.has(first))throw new Error(`ENV SAFETY: table '${first}' is not allowed on the TEST/WORK mirror.`);
  }

  async function guardStage(input,init,urlText){
    let u;try{u=new URL(urlText,location.href)}catch{return null}
    if(u.origin!==ORIGIN||u.pathname!=="/rest/v1/rpc/stage_ut_order"||method(input,init)!=="POST")return null;
    if(window.UT_EXTRA_PRODUCTS_COMPLETE===false)return jsonError(tx().needExtras);
    return null;
  }

  function withEnvironment(input,init,urlText){
    const u=new URL(urlText,location.href);
    if(u.origin!==ORIGIN||!u.pathname.startsWith("/rest/v1/"))return {input,init};
    const h=new Headers(init?.headers||(input instanceof Request?input.headers:undefined));
    h.set("x-bama-environment",env());
    if(input instanceof Request){return {input:new Request(input,{headers:h}),init:{...init,headers:h}}}
    return {input,init:{...init,headers:h}};
  }

  window.fetch=async function(input,init={}){
    const urlText=raw(input);
    const g=await guardStage(input,init,urlText);if(g)return g;
    try{validate(urlText)}catch(e){console.error("[ENV-SAFETY] blocked",method(input,init),urlText,e);return Promise.reject(e)}
    const next=withEnvironment(input,init,urlText);
    if(new URL(urlText,location.href).origin===ORIGIN && new URL(urlText,location.href).pathname.startsWith("/rest/v1/")){
      console.info("[BAMA-ENV]",env().toUpperCase(),method(input,init),urlText);
    }
    return nativeFetch(next.input,next.init);
  };

  window.BAMA_UT_TEST_API={
    mode:env(),sharedTables:true,isolatedByEnvironment:true,
    tables:[...allowedTables],rpcs:[...allowedRpcs],
    version:"2.0.0",updatedAt:"2026-08-10T10:43:00+02:00"
  };
})();