"use strict";

(() => {
  if (window.__UT_COMPACT_CONNECTION_V275__) return;
  window.__UT_COMPACT_CONNECTION_V275__ = true;

  const style = document.createElement("style");
  style.id = "utCompactConnectionV275Style";
  style.textContent = `
    .connection-card.ut-compact-connection{padding:8px 10px!important;margin:9px 0!important;background:rgba(13,20,38,.78)!important}
    .connection-card.ut-compact-connection > .head,.connection-card.ut-compact-connection > .toolbar{display:none!important}
    #utCompactConnectionBar{min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:10px}
    #utCompactConnectionBar .connection{min-height:44px;display:flex!important;align-items:center;gap:7px;padding:0 6px;white-space:nowrap;font-size:12px!important;font-weight:900!important}
    #utCompactConnectionBar .dot{width:11px!important;height:11px!important;flex:0 0 auto}
    #utCompactConnectionBar #refresh{width:48px!important;min-width:48px!important;min-height:44px!important;height:44px!important;padding:0!important;border:1px solid #303b59!important;border-radius:11px!important;background:#0d1426!important;color:#f5f7ff!important;display:grid!important;place-items:center!important;font-size:25px!important;line-height:1!important;font-weight:950!important}
    @media(max-width:390px){#utCompactConnectionBar .connection{font-size:11px!important;padding-inline:3px}#utCompactConnectionBar #refresh{width:44px!important;min-width:44px!important}}
  `;
  document.head.appendChild(style);

  function onlineText() {
    const dot = document.getElementById("cloudDot");
    if (dot?.classList.contains("ok")) return "Online";
    if (dot?.classList.contains("bad")) return "Offline";
    return "…";
  }

  function install() {
    const card = document.querySelector(".connection-card");
    if (!card) return;
    const connection = card.querySelector(".connection");
    const toolbar = card.querySelector(".toolbar");
    const filter = document.getElementById("filter");
    const refresh = document.getElementById("refresh");
    if (!connection || !toolbar || !filter || !refresh) return;

    card.classList.add("ut-compact-connection");
    if (filter.value !== "active") {
      filter.value = "active";
      filter.dispatchEvent(new Event("change", {bubbles:true}));
    }

    let bar = document.getElementById("utCompactConnectionBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "utCompactConnectionBar";
      bar.append(connection, refresh);
      card.prepend(bar);
      refresh.textContent = "↻";
      refresh.setAttribute("aria-label","Oppdater");
      refresh.setAttribute("title","Oppdater");
    }
    const cloudText = document.getElementById("cloudText");
    if (cloudText) cloudText.textContent = onlineText();
  }

  window.UT_COMPACT_CONNECTION_REFRESH = install;
  install();
})();
