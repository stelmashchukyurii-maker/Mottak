"use strict";
(() => {
  if(window.__CAMERA_TEST_EXTENDER_COUNTS__)return;
  window.__CAMERA_TEST_EXTENDER_COUNTS__=true;
  const EXT={forlengere_korte:{nb:"Forlengere korte",pl:"Przedłużki krótkie",uk:"Подовжувачі короткі"},forlengere_lange:{nb:"Forlengere lange",pl:"Przedłużki długie",uk:"Подовжувачі довгі"}};
  function lng(){try{return language||localStorage.getItem("camera_cloud_v3_language")||"nb"}catch{return"nb"}}
  function name(id){return EXT[id]?.[lng()]||EXT[id]?.nb||id}
  function render(){document.querySelectorAll("#products [data-product]").forEach(b=>{if(EXT[b.dataset.product])b.textContent=name(b.dataset.product)});window.BAMA_TEST_EXTENDER_COUNTS=null}
  function ensure(){
    try{PRODUCTS.forlengere_korte="Forlengere korte";PRODUCTS.forlengere_lange="Forlengere lange"}catch{}
    const host=document.getElementById("products");if(!host)return;
    Object.keys(EXT).forEach(id=>{if(host.querySelector(`[data-product="${id}"]`))return;const b=document.createElement("button");b.className="choice";b.dataset.product=id;b.textContent=name(id);host.appendChild(b)});
    render();
  }
  const saved=localStorage.getItem("camera_cloud_v3_product");if(saved&&EXT[saved]){try{product=saved}catch{}}
  ensure();
  document.getElementById("languages")?.addEventListener("click",()=>setTimeout(render,0));
  document.getElementById("products")?.addEventListener("click",()=>setTimeout(render,0));
  window.CAMERA_TEST_EXTENDER_COUNTS_REFRESH=render;
})();