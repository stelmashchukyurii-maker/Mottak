"use strict";
(() => {
  if (window.__BAMA_CAMERA_EXTRA_RFID_PRODUCTS__) return;
  window.__BAMA_CAMERA_EXTRA_RFID_PRODUCTS__ = true;

  const EXTRA = [
    ["forlengere_korte", "Forlengere korte"],
    ["forlengere_lange", "Forlengere lange"],
    ["vrak_bunner", "Vrak bunner"],
    ["vrak_hyller", "Vrak hyller"],
  ];

  try {
    EXTRA.forEach(([id, name]) => { PRODUCTS[id] = name; });
  } catch (error) {
    console.error("Camera extra products: PRODUCTS registry unavailable", error);
    return;
  }

  const host = document.getElementById("products");
  if (!host) return;

  EXTRA.forEach(([id, name]) => {
    if (host.querySelector(`[data-product="${id}"]`)) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.dataset.product = id;
    button.textContent = name;
    host.appendChild(button);
  });

  const style = document.createElement("style");
  style.textContent = `
    @media(max-width:760px){
      #products.grid3{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      #products .choice{min-height:54px;padding:8px 6px;font-size:13px}
    }
  `;
  document.head.appendChild(style);

  try { renderChoices(); } catch {}
  console.info("Camera RFID fallback products active:", EXTRA.map(([id]) => id).join(", "));
})();
