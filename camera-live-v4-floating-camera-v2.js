(() => {
  "use strict";

  const PANEL_ID = "bama-floating-camera";
  const STYLE_ID = "bama-floating-camera-v2-style";
  const COLLAPSED_KEY = "bama_camera_floating_collapsed_v1";
  const PRODUCT_LABELS = {
    bunner: "B",
    hyller30: "H-30",
    hyller60: "H-60",
    forlengere_korte: "F-K",
    forlengere_lange: "F-L",
    vrak_bunner: "VB",
    vrak_hyller: "VH"
  };
  const PRODUCT_NAMES = {
    bunner: "Bunner",
    hyller30: "Hyller x30",
    hyller60: "Hyller x60",
    forlengere_korte: "Forlengere korte",
    forlengere_lange: "Forlengere lange",
    vrak_bunner: "Vrak bunner",
    vrak_hyller: "Vrak hyller"
  };

  function findProductButtons() {
    return [...document.querySelectorAll("#products [data-product]")]
      .filter(button => PRODUCT_LABELS[button.dataset.product]);
  }
  function currentProduct(buttons) {
    const active = buttons.find(button => button.classList.contains("active") || button.getAttribute("aria-pressed") === "true");
    if (active?.dataset.product && PRODUCT_LABELS[active.dataset.product]) return active.dataset.product;
    const keys=["camera_cloud_v3_product","camera_live_product","camera_live_v4_product","ai_scanner_mottak_v2_selected_product"];
    for(const key of keys){const value=localStorage.getItem(key);if(PRODUCT_LABELS[value])return value;}
    try { if (PRODUCT_LABELS[product]) return product; } catch {}
    return "bunner";
  }
  function addStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
      #${PANEL_ID}{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:calc(12px + env(safe-area-inset-bottom));z-index:2147483000;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-family:Arial,Helvetica,sans-serif;pointer-events:none}
      #${PANEL_ID} *{box-sizing:border-box}#${PANEL_ID} button{pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
      #${PANEL_ID} .bama-floating-options{display:grid;grid-template-columns:repeat(3,minmax(62px,1fr));gap:7px;width:min(350px,calc(100vw - 24px));padding:9px;border:2px solid #f4c430;border-radius:16px;background:rgba(13,20,38,.97);box-shadow:0 12px 32px rgba(0,0,0,.48);backdrop-filter:blur(10px)}
      #${PANEL_ID} .bama-floating-options[hidden]{display:none}#${PANEL_ID} .bama-option{min-height:48px;padding:7px 5px;border:2px solid #303b59;border-radius:12px;background:#151c30;color:#f5f7ff;font-size:13px;font-weight:900}#${PANEL_ID} .bama-option.active{border-color:#48d597;background:#0f3427}
      #${PANEL_ID} .bama-floating-bar{display:grid;grid-template-columns:auto minmax(126px,auto) auto;align-items:stretch;gap:7px;padding:7px;border:2px solid #f4c430;border-radius:18px;background:rgba(13,20,38,.96);box-shadow:0 12px 34px rgba(0,0,0,.52);backdrop-filter:blur(12px);pointer-events:auto}
      #${PANEL_ID} .bama-product-button,#${PANEL_ID} .bama-photo-button,#${PANEL_ID} .bama-collapse-button{border:0;border-radius:12px;font-weight:900}
      #${PANEL_ID} .bama-product-button{min-width:68px;min-height:58px;padding:8px;background:#48d597;color:#062418;font-size:18px}#${PANEL_ID} .bama-photo-button{min-height:58px;padding:9px 18px;background:#f4c430;color:#17130a;font-size:20px;white-space:nowrap}#${PANEL_ID} .bama-collapse-button{width:42px;min-height:58px;border:1px solid #303b59;background:#151c30;color:#f5f7ff;font-size:20px}
      #${PANEL_ID}.collapsed .bama-floating-options{display:none}#${PANEL_ID}.collapsed .bama-floating-bar{grid-template-columns:auto auto auto;gap:5px;padding:5px}#${PANEL_ID}.collapsed .bama-product-button{min-width:48px;min-height:48px;padding:5px;font-size:14px}#${PANEL_ID}.collapsed .bama-photo-button{min-width:54px;min-height:48px;padding:5px 10px;font-size:0}#${PANEL_ID}.collapsed .bama-photo-button::before{content:"📷";font-size:23px}#${PANEL_ID}.collapsed .bama-collapse-button{width:36px;min-height:48px;font-size:17px}
      @media(max-width:390px){#${PANEL_ID} .bama-floating-options{grid-template-columns:repeat(2,minmax(80px,1fr));width:min(330px,calc(100vw - 18px))}#${PANEL_ID} .bama-floating-bar{grid-template-columns:auto minmax(108px,auto) auto}#${PANEL_ID} .bama-photo-button{padding-inline:12px;font-size:18px}}
    `;document.head.appendChild(s);
  }
  function start(attempt=0){
    if(document.getElementById(PANEL_ID))return;
    const photoInput=document.getElementById("photoInput"),buttons=findProductButtons();
    if(!photoInput||!buttons.length){if(attempt<40)setTimeout(()=>start(attempt+1),150);return;}
    addStyles();
    const panel=document.createElement("div");panel.id=PANEL_ID;panel.classList.toggle("collapsed",localStorage.getItem(COLLAPSED_KEY)==="1");
    panel.innerHTML=`<div class="bama-floating-options" hidden aria-label="Velg produkt">${buttons.map(b=>`<button class="bama-option" type="button" data-floating-product="${b.dataset.product}">${PRODUCT_LABELS[b.dataset.product]}</button>`).join("")}</div><div class="bama-floating-bar"><button class="bama-product-button" type="button" aria-label="Velg produkt" aria-expanded="false">B</button><button class="bama-photo-button" type="button" aria-label="Ta bilde">📷 FOTO</button><button class="bama-collapse-button" type="button" aria-label="Minimer">−</button></div>`;
    document.body.appendChild(panel);
    const options=panel.querySelector(".bama-floating-options"),productButton=panel.querySelector(".bama-product-button"),photoButton=panel.querySelector(".bama-photo-button"),collapse=panel.querySelector(".bama-collapse-button");
    function sync(){const p=currentProduct(buttons);panel.dataset.product=p;productButton.textContent=PRODUCT_LABELS[p]||p;productButton.title=PRODUCT_NAMES[p]||p;productButton.setAttribute("aria-label",`Valgt produkt: ${PRODUCT_NAMES[p]||p}. Trykk for å endre.`);panel.querySelectorAll("[data-floating-product]").forEach(b=>{const on=b.dataset.floatingProduct===p;b.classList.toggle("active",on);b.setAttribute("aria-pressed",on?"true":"false")});}
    function close(){options.hidden=true;productButton.setAttribute("aria-expanded","false")}
    function collapseUi(){const c=panel.classList.contains("collapsed");collapse.textContent=c?"↗":"−";if(c)close();}
    productButton.addEventListener("click",e=>{e.stopPropagation();if(panel.classList.contains("collapsed")){panel.classList.remove("collapsed");localStorage.setItem(COLLAPSED_KEY,"0");collapseUi();return;}options.hidden=!options.hidden;productButton.setAttribute("aria-expanded",options.hidden?"false":"true")});
    options.addEventListener("click",e=>{const o=e.target.closest("[data-floating-product]");if(!o)return;buttons.find(b=>b.dataset.product===o.dataset.floatingProduct)?.click();close();setTimeout(sync,40)});
    photoButton.addEventListener("click",()=>{close();try{navigator.vibrate?.(25)}catch{}photoInput.click()});
    collapse.addEventListener("click",()=>{const c=!panel.classList.contains("collapsed");panel.classList.toggle("collapsed",c);localStorage.setItem(COLLAPSED_KEY,c?"1":"0");collapseUi()});
    document.addEventListener("click",e=>{if(!panel.contains(e.target))close()});buttons.forEach(b=>b.addEventListener("click",()=>setTimeout(sync,40)));
    const observer=new MutationObserver(()=>setTimeout(sync,0));observer.observe(document.getElementById("products"),{subtree:true,attributes:true,attributeFilter:["class","aria-pressed"]});
    sync();collapseUi();
  }
  start();
})();
