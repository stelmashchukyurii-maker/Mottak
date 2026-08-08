"use strict";

(() => {
  if (window.__UT_MOBILE_CLEANUP_V28__) return;
  window.__UT_MOBILE_CLEANUP_V28__ = true;

  const STOCK_KEY = "ut_lager_stock_collapsed_v28";
  const SEARCH_KEY = "ut_lager_search_open_v28";

  const style = document.createElement("style");
  style.id = "utMobileCleanupV28Style";
  style.textContent = `
    body.ut-clean-v28 .subtitle{display:none!important}
    body.ut-clean-v28 > .app, body.ut-clean-v28 .app{padding-top:10px!important}
    body.ut-clean-v28 .top > .version{display:none!important}
    body.ut-clean-v28 .ut-v28-badge{margin-left:auto;color:#aab4ce;font-size:10px;line-height:1.35;text-align:right}

    body.ut-clean-v28 .connection-card{padding:10px 12px!important;margin:9px 0!important}
    body.ut-clean-v28 .connection-card .head{align-items:center!important;margin:0!important}
    body.ut-clean-v28 .connection-card .head h2{display:none!important}
    body.ut-clean-v28 .connection-card .connection{font-size:11px!important;margin-left:auto!important}
    body.ut-clean-v28 .connection-card .toolbar{display:grid!important;grid-template-columns:minmax(0,1fr) 52px 52px!important;gap:7px!important;margin-top:8px!important}
    body.ut-clean-v28 .connection-card #filter{grid-column:1!important;min-height:44px!important}
    body.ut-clean-v28 .connection-card #refresh{grid-column:3!important;grid-row:1!important;min-height:44px!important;padding:7px!important;font-size:0!important}
    body.ut-clean-v28 .connection-card #refresh::before{content:"↻";font-size:25px!important;line-height:1}
    body.ut-clean-v28 #utSearchToggle{grid-column:2!important;grid-row:1!important;min-height:44px!important;border:1px solid var(--line)!important;border-radius:12px!important;background:var(--dark)!important;color:var(--text)!important;font-size:20px!important;font-weight:900!important}
    body.ut-clean-v28 .connection-card #search{grid-column:1/-1!important;grid-row:2!important;min-height:44px!important;margin:0!important}
    body.ut-clean-v28 .connection-card #search.ut-search-hidden{display:none!important}

    body.ut-clean-v28 .stock-card{display:none!important}
    body.ut-clean-v28 .ramps-card{margin-top:9px!important;padding:13px!important}
    body.ut-clean-v28 .ramps-card .head{align-items:center!important}
    body.ut-clean-v28 .ramps-card .head h2{font-size:23px!important}

    #bamaSharedStock.ut-stock-collapsible{padding:10px 12px!important;margin:8px auto 10px!important}
    #bamaSharedStock.ut-stock-collapsible .bss-head{cursor:pointer;user-select:none;min-height:38px}
    #bamaSharedStock .ut-stock-summary{display:none;margin-left:auto;color:#f5f7ff;font-size:12px;font-weight:900}
    #bamaSharedStock .ut-stock-chevron{width:32px;height:32px;display:grid;place-items:center;border:1px solid #303b59;border-radius:9px;background:#0b1020;color:#f5f7ff;font-weight:950;transition:transform .18s}
    #bamaSharedStock.ut-stock-collapsed .bss-grid,
    #bamaSharedStock.ut-stock-collapsed .bss-error,
    #bamaSharedStock.ut-stock-collapsed .bss-admin,
    #bamaSharedStock.ut-stock-collapsed a,
    #bamaSharedStock.ut-stock-collapsed button:not(.ut-stock-chevron){display:none!important}
    #bamaSharedStock.ut-stock-collapsed .ut-stock-summary{display:block!important}
    #bamaSharedStock.ut-stock-collapsed .ut-stock-chevron{transform:rotate(-90deg)}
    #bamaSharedStock.ut-stock-collapsed{border-color:#303b59!important}

    @media(max-width:560px){
      body.ut-clean-v28 h1{font-size:clamp(34px,10vw,46px)!important;margin:10px 0 6px!important}
      body.ut-clean-v28 .top{margin-bottom:2px!important}
      body.ut-clean-v28 .connection-card .toolbar{grid-template-columns:minmax(0,1fr) 48px 48px!important}
      body.ut-clean-v28 .ramps-card{padding:12px!important}
      #bamaSharedStock .bss-title{font-size:13px!important}
      #bamaSharedStock .bss-time{font-size:9px!important}
    }
  `;
  document.head.appendChild(style);
  document.body.classList.add("ut-clean-v28");

  function localGet(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch { return fallback; }
  }
  function localSet(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }

  function compactHeader() {
    const title = document.querySelector("main.app > h1, .app > h1, h1");
    if (title && title.textContent !== "UT — Ramper") title.textContent = "UT — Ramper";

    const top = document.querySelector(".top");
    if (top && !top.querySelector(".ut-v28-badge")) {
      const badge = document.createElement("div");
      badge.className = "ut-v28-badge";
      badge.innerHTML = "UT Lager v28 RYDDIG<br>07.08.2026 kl. 20:01";
      top.appendChild(badge);
    }
  }

  function compactConnection() {
    const card = document.querySelector(".connection-card");
    const toolbar = card?.querySelector(".toolbar");
    const search = document.getElementById("search");
    if (!card || !toolbar || !search) return;

    let toggle = document.getElementById("utSearchToggle");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.id = "utSearchToggle";
      toggle.type = "button";
      toggle.textContent = "🔍";
      toggle.setAttribute("aria-label", "Søk rampe eller UT-nummer");
      toolbar.insertBefore(toggle, document.getElementById("refresh") || null);
      toggle.addEventListener("click", () => {
        const hidden = search.classList.toggle("ut-search-hidden");
        localSet(SEARCH_KEY, hidden ? "false" : "true");
        if (!hidden) setTimeout(() => search.focus(), 20);
      });
    }

    const open = localGet(SEARCH_KEY, "false") === "true";
    search.classList.toggle("ut-search-hidden", !open);
  }

  function stockSummary(card) {
    const value = card.querySelector("#bssAvailable")?.textContent?.trim();
    return value && value !== "—" ? `${value} tilgjengelig` : "Lagerstatus";
  }

  function makeStockCollapsible() {
    const card = document.getElementById("bamaSharedStock");
    if (!card) return;
    card.classList.add("ut-stock-collapsible");
    const head = card.querySelector(".bss-head");
    if (!head) return;

    let summary = head.querySelector(".ut-stock-summary");
    if (!summary) {
      summary = document.createElement("span");
      summary.className = "ut-stock-summary";
      const time = head.querySelector(".bss-time");
      if (time) time.insertAdjacentElement("beforebegin", summary);
      else head.appendChild(summary);
    }
    summary.textContent = stockSummary(card);

    let chevron = head.querySelector(".ut-stock-chevron");
    if (!chevron) {
      chevron = document.createElement("button");
      chevron.type = "button";
      chevron.className = "ut-stock-chevron";
      chevron.textContent = "⌄";
      chevron.setAttribute("aria-label", "Vis eller skjul lagerstatus");
      head.appendChild(chevron);
      head.addEventListener("click", event => {
        if (event.target.closest("a")) return;
        const collapsed = !card.classList.contains("ut-stock-collapsed");
        card.classList.toggle("ut-stock-collapsed", collapsed);
        localSet(STOCK_KEY, collapsed ? "true" : "false");
      });
    }

    const collapsed = localGet(STOCK_KEY, "true") !== "false";
    card.classList.toggle("ut-stock-collapsed", collapsed);

    [...card.children].forEach(child => {
      if (child.classList.contains("bss-head") || child.classList.contains("bss-grid") || child.classList.contains("bss-error")) return;
      child.classList.add("bss-admin");
    });
  }

  function cleanup() {
    compactHeader();
    compactConnection();
    makeStockCollapsible();
  }

  const observer = new MutationObserver(() => requestAnimationFrame(cleanup));
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  cleanup();
  setTimeout(cleanup, 300);
  setTimeout(cleanup, 1000);
  setInterval(() => {
    const card = document.getElementById("bamaSharedStock");
    const summary = card?.querySelector(".ut-stock-summary");
    if (card && summary) {
      const next = stockSummary(card);
      if (summary.textContent !== next) summary.textContent = next;
    }
  }, 1500);
})();
