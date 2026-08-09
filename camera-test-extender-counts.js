"use strict";
(() => {
  if(window.__CAMERA_TEST_EXTENDER_COUNTS__)return;window.__CAMERA_TEST_EXTENDER_COUNTS__=true;
  const EXT={forlengere_korte:{nb:"Forlengere korte",pl:"Przedłużki krótkie",uk:"Подовжувачі короткі"},forlengere_lange:{nb:"Forlengere lange",pl:"Przedłużki długie",uk:"Подовжувачі довгі"}};
  function lng(){try{return language||localStorage.getItem("camera_cloud_v3_language")||"nb"}catch{return"nb"}}
  function name(id){return EXT[id]?.[lng()]||EXT[id]?.nb||id}
  function ensure(){
    try{PRODUCTS.forlengere_korte="Forlengere korte";PRODUCTS.forlengere_lange="Forlengere lange"}catch{}
    const host=document.getElementById("products");if(!host)return;
    Object.keys(EXT).forEach(id=>{if(host.querySelector(`[data-product="${id}"]`))return;const b=document.createElement("button");b.className="choice";b.dataset.product=id;b.textContent=name(id);host.appendChild(b)});
    let card=document.getElementById("cameraTestExtCounts");if(!card){card=document.createElement("section");card.id="cameraTestExtCounts";card.className="card";card.style.display="none";card.innerHTML=`<h2 id="cteTitle" style="margin-bottom:7px"></h2><p id="cteNote" class="note" style="margin:0 0 10px"></p><div class="grid2"><div><label id="cteHLabel" class="note"></label><input id="cteH" class="field" type="number" min="0" step="1" inputmode="numeric" placeholder="—"></div><div><label id="cteFLabel" class="note"></label><input id="cteF" class="field" type="number" min="0" step="1" inputmode="numeric" placeholder="—"></div></div>`;host.closest("section.card")?.insertAdjacentElement("afterend",card);document.getElementById("cteH")?.addEventListener("input",sync);document.getElementById("cteF")?.addEventListener("input",sync)}
    host.addEventListener("click",()=>setTimeout(render,0));render();
  }
  function texts(){if(lng()==="uk")return{title:"Необов’язкові дані Forlengere",note:"Можна заповнити обидва поля, тільки одне або залишити обидва порожніми. Відсутні дані можна доповнити при Utsending.",h:"Полиці",f:"Продовжувачі"};if(lng()==="pl")return{title:"Opcjonalne dane przedłużek",note:"Można wpisać oba pola, tylko jedno lub pozostawić puste. Brakujące dane można uzupełnić przy Utsending.",h:"Półki",f:"Przedłużki"};return{title:"Valgfrie Forlengere-data",note:"Du kan fylle begge feltene, bare ett eller la begge stå tomme. Manglende data kan fylles inn ved Utsending.",h:"Hyller",f:"Forlengere"}}
  function isExt(){try{return product==="forlengere_korte"||product==="forlengere_lange"}catch{return false}}
  function render(){const c=texts(),card=document.getElementById("cameraTestExtCounts");if(!card)return;document.querySelectorAll("#products [data-product]").forEach(b=>{if(EXT[b.dataset.product])b.textContent=name(b.dataset.product)});card.style.display=isExt()?"block":"none";document.getElementById("cteTitle").textContent=c.title;document.getElementById("cteNote").textContent=c.note;document.getElementById("cteHLabel").textContent=c.h;document.getElementById("cteFLabel").textContent=c.f;sync()}
  function val(id){const e=document.getElementById(id);if(!e||e.value==="")return null;const n=Number(e.value);return Number.isInteger(n)&&n>=0?n:null}
  function sync(){window.BAMA_TEST_EXTENDER_COUNTS=isExt()?{product:product,hyller_count:val("cteH"),forlengere_count:val("cteF")} : null}
  const saved=localStorage.getItem("camera_cloud_v3_product");if(saved&&EXT[saved]){try{product=saved}catch{}}
  ensure();
  const langHost=document.getElementById("languages");langHost?.addEventListener("click",()=>setTimeout(render,0));
  window.CAMERA_TEST_EXTENDER_COUNTS_REFRESH=render;
})();