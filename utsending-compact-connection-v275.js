"use strict";

(() => {
  if (window.__UT_COMPACT_CONNECTION_V275__) return;
  window.__UT_COMPACT_CONNECTION_V275__ = true;

  const style = document.createElement("style");
  style.id = "utCompactConnectionV275Style";
  style.textContent = `
    .connection-card.ut-compact-connection{
      padding:9px 10px!important;
      margin:9px 0!important;
      background:rgba(13,20,38,.78)!important;
    }
    .connection-card.ut-compact-connection > .head,
    .connection-card.ut-compact-connection > .toolbar{display:none!important}
    #utCompactConnectionBar{
      display:grid;
      grid-template-columns:auto minmax(0,1fr) 46px 46px;
      align-items:center;
      gap:7px;
    }
    #utCompactConnectionBar .connection{
      min-height:44px;
      display:flex!important;
      align-items:center;
      gap:6px;
      padding:0 5px;
      white-space:nowrap;
      font-size:11px!important;
      font-weight:900!important;
    }
    #utCompactConnectionBar .dot{width:10px!important;height:10px!important;flex:0 0 auto}
    #utCompactConnectionBar select{
      min-width:0;
      min-height:44px!important;
      padding:8px 9px!important;
      border-radius:11px!important;
    }
    #utConnectionSearchToggle,
    #utCompactConnectionBar #refresh{
      width:46px!important;
      min-width:46px!important;
      min-height:44px!important;
      height:44px!important;
      padding:0!important;
      border:1px solid #303b59!important;
      border-radius:11px!important;
      background:#0d1426!important;
      color:#f5f7ff!important;
      display:grid!important;
      place-items:center!important;
      font-size:20px!important;
      font-weight:950!important;
    }
    #utCompactConnectionBar #refresh{font-size:25px!important;line-height:1!important}
    #utCompactSearchRow{margin-top:7px}
    #utCompactSearchRow.hidden{display:none!important}
    #utCompactSearchRow #search{min-height:44px!important;margin:0!important}
    @media(max-width:390px){
      #utCompactConnectionBar{grid-template-columns:auto minmax(0,1fr) 43px 43px;gap:5px}
      #utCompactConnectionBar .connection{font-size:10px!important;padding-inline:2px}
      #utConnectionSearchToggle,#utCompactConnectionBar #refresh{width:43px!important;min-width:43px!important}
    }
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
    const search = document.getElementById("search");
    const refresh = document.getElementById("refresh");
    if (!connection || !toolbar || !filter || !search || !refresh) return;

    card.classList.add("ut-compact-connection");

    let bar = document.getElementById("utCompactConnectionBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "utCompactConnectionBar";

      const searchToggle = document.createElement("button");
      searchToggle.id = "utConnectionSearchToggle";
      searchToggle.type = "button";
      searchToggle.textContent = "🔍";
      searchToggle.setAttribute("aria-label", "Søk rampe eller UT-nummer");

      bar.append(connection, filter, searchToggle, refresh);
      card.prepend(bar);

      const searchRow = document.createElement("div");
      searchRow.id = "utCompactSearchRow";
      searchRow.className = "hidden";
      searchRow.appendChild(search);
      bar.insertAdjacentElement("afterend", searchRow);

      searchToggle.addEventListener("click", () => {
        const hidden = searchRow.classList.toggle("hidden");
        if (!hidden) setTimeout(() => search.focus(), 30);
      });

      refresh.textContent = "↻";
      refresh.setAttribute("aria-label", "Oppdater");
    }

    const cloudText = document.getElementById("cloudText");
    if (cloudText) cloudText.textContent = onlineText();
  }

  const observer = new MutationObserver(() => requestAnimationFrame(install));
  observer.observe(document.body, { childList: true, subtree: true });
  install();
  setTimeout(install, 300);
  setTimeout(install, 1000);
  setInterval(() => {
    install();
    const cloudText = document.getElementById("cloudText");
    if (cloudText) cloudText.textContent = onlineText();
  }, 1200);
})();
