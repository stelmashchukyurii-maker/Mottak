"use strict";

(() => {
  if (window.__BAMA_GREEN_MARKER__) return;
  window.__BAMA_GREEN_MARKER__ = true;

  const UPDATED = "08.08.2026 kl. 16:07";
  const PREFIX = "GREEN — ";

  if (!document.title.startsWith(PREFIX)) {
    document.title = `${PREFIX}${document.title || "BaMavaremottak"}`;
  }

  const style = document.createElement("style");
  style.id = "bamaGreenMarkerCss";
  style.textContent = `
    #bamaGreenMarker{
      position:fixed;top:0;left:0;right:0;z-index:2147483647;
      min-height:30px;padding:5px 10px;box-sizing:border-box;
      display:flex;align-items:center;justify-content:center;
      background:#0f3d2e;color:#eafff6;border-bottom:2px solid #48d597;
      font:950 11px/1.2 Arial,Helvetica,sans-serif;letter-spacing:.03em;
      text-align:center;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.35)
    }
    #bamaGreenBorder{
      position:fixed;inset:0;z-index:2147483646;pointer-events:none;
      border:3px solid #48d597;box-sizing:border-box
    }
    body.bama-green-offset{padding-top:32px!important}
    body.bama-green-offset .ibell{top:46px!important}
    #app.bama-green-fullframe{margin-top:30px!important;height:calc(100% - 30px)!important}
    #utCore.bama-green-fullframe{margin-top:30px!important;min-height:calc(100vh - 30px)!important}
  `;
  document.head.appendChild(style);

  const banner = document.createElement("div");
  banner.id = "bamaGreenMarker";
  banner.setAttribute("role", "status");
  banner.setAttribute("aria-label", `GREEN arbeidskopi med produksjonsdata. Oppdatert ${UPDATED}`);
  banner.textContent = "🟢 GREEN — ARBEIDSKOPI · PROD-DATA";

  const border = document.createElement("div");
  border.id = "bamaGreenBorder";
  border.setAttribute("aria-hidden", "true");

  document.body.append(banner, border);

  const fullFrame = document.querySelector("#app, #utCore");
  if (fullFrame) {
    fullFrame.classList.add("bama-green-fullframe");
  } else {
    document.body.classList.add("bama-green-offset");
  }
})();
