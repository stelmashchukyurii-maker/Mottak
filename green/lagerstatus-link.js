"use strict";

(() => {
  if (window.__BAMA_LAGERSTATUS_LINK__) return;
  window.__BAMA_LAGERSTATUS_LINK__ = true;

  const style = document.createElement("style");
  style.textContent = `
    #bamaSharedStock .bss-admin-link{
      min-height:46px;
      display:flex;
      align-items:center;
      justify-content:center;
      margin-top:10px;
      padding:10px 13px;
      border-radius:12px;
      background:#f4c430;
      color:#17130a;
      text-decoration:none;
      text-align:center;
      font:950 13px/1.25 Arial,Helvetica,sans-serif;
      box-shadow:0 7px 18px rgba(0,0,0,.22);
    }
  `;
  document.head.appendChild(style);

  function install() {
    const card = document.getElementById("bamaSharedStock");
    if (!card) return false;
    if (card.querySelector(".bss-admin-link")) return true;

    const link = document.createElement("a");
    link.className = "bss-admin-link";
    link.href = "lagerstatus.html";
    link.target = "_top";
    link.textContent = "Administrer lager og retur";
    card.appendChild(link);
    return true;
  }

  if (install()) return;
  const observer = new MutationObserver(() => {
    if (install()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
