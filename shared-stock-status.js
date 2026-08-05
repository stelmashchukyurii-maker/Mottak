"use strict";

(() => {
  if (window.__BAMA_SHARED_TOOLS_V2__) return;
  window.__BAMA_SHARED_TOOLS_V2__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const REFRESH_MS = 5000;
  const HOME_KEY_PREFIX = "bamavaremottak_home_return_v1:";
  const RAMPER = ["28", "29", "30", "31", "32", "33", "34"];

  const style = document.createElement("style");
  style.id = "bamaSharedToolsStyle";
  style.textContent = `
    #bamaSharedStock{margin:12px auto;padding:12px;border:2px solid #48d597;border-radius:16px;background:rgba(13,20,38,.96);color:#f5f7ff;font-family:Arial,Helvetica,sans-serif;box-shadow:0 10px 24px rgba(0,0,0,.18)}
    #bamaSharedStock .bss-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}
    #bamaSharedStock .bss-title{font-weight:950;color:#48d597;font-size:14px;letter-spacing:.03em}
    #bamaSharedStock .bss-time{color:#aab4ce;font-size:10px}
    #bamaSharedStock .bss-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px}
    #bamaSharedStock .bss-cell{padding:9px 7px;border:1px solid #303b59;border-radius:11px;background:#0b1020;text-align:center}
    #bamaSharedStock .bss-cell span{display:block;color:#aab4ce;font-size:9px;font-weight:900;line-height:1.25}
    #bamaSharedStock .bss-cell strong{display:block;margin-top:5px;font-size:15px;line-height:1.2}
    #bamaSharedStock .bss-cell.physical{border-color:#48d597}
    #bamaSharedStock .bss-cell.dispatched{border-color:#f6b94b}
    #bamaSharedStock .bss-error{display:none;margin-top:7px;color:#ff9c9c;font-size:10px;text-align:center}

    .bama-home-switch{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:62px;min-height:45px;padding:4px 6px;border:1px solid #303b59;border-radius:13px;background:#0d1426;color:#f5f7ff;font:800 9px/1.15 Arial,sans-serif;cursor:pointer;user-select:none}
    .bama-home-switch input{position:absolute;opacity:0;pointer-events:none}
    .bama-home-switch-track{position:relative;width:34px;height:19px;border-radius:999px;background:#5b647a;transition:.18s}
    .bama-home-switch-track::after{content:"";position:absolute;top:3px;left:3px;width:13px;height:13px;border-radius:50%;background:#fff;transition:.18s}
    .bama-home-switch input:checked + .bama-home-switch-track{background:#48d597}
    .bama-home-switch input:checked + .bama-home-switch-track::after{transform:translateX(15px)}
    .bama-home-switch-state{color:#aab4ce;font-size:8px}
    .bama-home-switch input:checked ~ .bama-home-switch-state{color:#48d597}
    .card-head:has(.bama-home-switch){grid-template-columns:minmax(0,1fr) auto auto auto!important}

    #bamaHomeReturn{position:fixed;left:max(10px,env(safe-area-inset-left));bottom:max(10px,env(safe-area-inset-bottom));z-index:99998;display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:9px 13px;border:1px solid #303b59;border-radius:12px;background:#0d1426;color:#f5f7ff;text-decoration:none;font:900 13px/1.2 Arial,sans-serif;box-shadow:0 8px 22px rgba(0,0,0,.32)}

    .bama-ramp-select{width:100%;min-height:48px;padding:10px 12px;border:1px solid #303b59;border-radius:12px;background:#0d1426;color:#f5f7ff;font:inherit;outline:none}
    .bama-ramp-select:focus{border-color:#f4c430;box-shadow:0 0 0 3px rgba(244,196,48,.12)}
    .bama-ramp-source{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;opacity:0!important;pointer-events:none!important;overflow:hidden!important}

    @media(min-width:760px){#bamaSharedStock .bss-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
    @media(max-width:560px){.bama-home-switch{min-width:56px;padding-inline:4px}.card-head:has(.bama-home-switch){grid-template-columns:minmax(0,1fr) auto auto auto!important;gap:5px!important}}
  `;
  document.head.appendChild(style);

  function targetKeyFromUrl(value) {
    try {
      const url = new URL(value, location.href);
      const file = url.pathname.split("/").filter(Boolean).pop() || "index.html";
      return `${file}${url.search}`;
    } catch {
      return String(value || "").trim();
    }
  }

  function currentTargetKey() {
    if (window.BAMA_HOME_TARGET) return targetKeyFromUrl(window.BAMA_HOME_TARGET);

    if (window.frameElement && document.referrer) {
      const parentKey = targetKeyFromUrl(document.referrer);
      if (parentKey && parentKey !== "index.html") return parentKey;
    }

    const direct = targetKeyFromUrl(location.href);
    if (direct === "mottak-live-v45.html") return "mottak-live-v2.html";
    return direct;
  }

  function homeStorageKey(target) {
    return `${HOME_KEY_PREFIX}${target}`;
  }

  function homeEnabled(target) {
    return localStorage.getItem(homeStorageKey(target)) !== "false";
  }

  function setHomeEnabled(target, enabled) {
    localStorage.setItem(homeStorageKey(target), enabled ? "true" : "false");
  }

  function isMainPage() {
    return !window.frameElement && ["index.html", ""].includes(location.pathname.split("/").pop() || "");
  }

  function isHomeHref(anchor) {
    try {
      return new URL(anchor.getAttribute("href"), location.href).pathname.endsWith("/index.html");
    } catch {
      return false;
    }
  }

  function applyHomeVisibility() {
    if (isMainPage()) return;
    const target = currentTargetKey();
    const enabled = homeEnabled(target);
    const links = [...document.querySelectorAll("a[href]")].filter(isHomeHref);

    links.forEach(link => {
      link.hidden = !enabled;
      link.setAttribute("aria-hidden", enabled ? "false" : "true");
    });

    let fallback = document.getElementById("bamaHomeReturn");
    if (!links.length && enabled) {
      if (!fallback) {
        fallback = document.createElement("a");
        fallback.id = "bamaHomeReturn";
        fallback.href = "index.html";
        fallback.target = "_top";
        fallback.textContent = "← Hovedmeny";
        document.body.appendChild(fallback);
      }
      fallback.hidden = false;
    } else if (fallback) {
      fallback.hidden = !enabled || links.length > 0;
    }
  }

  function syncSwitches(target) {
    document.querySelectorAll(`.bama-home-switch input[data-home-target="${CSS.escape(target)}"]`).forEach(input => {
      input.checked = homeEnabled(target);
      const state = input.closest(".bama-home-switch")?.querySelector(".bama-home-switch-state");
      if (state) state.textContent = input.checked ? "PÅ" : "AV";
    });
  }

  function installMainSwitches() {
    if (!isMainPage()) return;

    const version = document.querySelector("main.app > .version");
    if (version) version.textContent = "Hovedmeny v11 · Oppdatert 05.08.2026 kl. 10:49";
    const help = document.querySelector("main.app > .help");
    if (help) help.textContent = "Bruk bryteren HJEM ved hver side for å vise eller skjule knappen «Hovedmeny» bare på den valgte siden. Valgene lagres automatisk i denne nettleseren.";

    document.querySelectorAll(".page-card:not([data-bama-home-ready])").forEach(card => {
      const link = card.querySelector(".open-link[href]");
      const head = card.querySelector(".card-head");
      const pin = card.querySelector(".pin-button");
      if (!link || !head || !pin) return;

      const target = targetKeyFromUrl(link.getAttribute("href"));
      if (!target || target === "index.html") {
        card.dataset.bamaHomeReady = "skip";
        return;
      }

      const control = document.createElement("label");
      control.className = "bama-home-switch";
      control.title = "Vis eller skjul knappen «Hovedmeny» på denne siden";
      control.innerHTML = `
        <span>HJEM</span>
        <input type="checkbox" data-home-target="${target.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}">
        <span class="bama-home-switch-track" aria-hidden="true"></span>
        <span class="bama-home-switch-state"></span>
      `;
      const input = control.querySelector("input");
      input.checked = homeEnabled(target);
      control.querySelector(".bama-home-switch-state").textContent = input.checked ? "PÅ" : "AV";
      input.addEventListener("change", event => {
        event.stopPropagation();
        setHomeEnabled(target, input.checked);
        syncSwitches(target);
      });
      control.addEventListener("click", event => event.stopPropagation());
      head.insertBefore(control, pin);
      card.dataset.bamaHomeReady = "true";
    });
  }

  function installRampDropdowns() {
    const sources = [...document.querySelectorAll('input#ramp, input[name="ramp"]')];
    sources.forEach(source => {
      if (source.dataset.bamaRampReady === "true") return;
      const select = document.createElement("select");
      select.className = "bama-ramp-select";
      select.setAttribute("aria-label", "Velg rampe");
      select.innerHTML = `<option value="">Velg rampe</option>${RAMPER.map(ramp => `<option value="${ramp}">${ramp}</option>`).join("")}`;
      select.value = RAMPER.includes(String(source.value)) ? String(source.value) : "";

      source.insertAdjacentElement("beforebegin", select);
      source.classList.add("bama-ramp-source");
      source.tabIndex = -1;
      source.dataset.bamaRampReady = "true";

      const pushToSource = () => {
        source.value = select.value;
        source.dispatchEvent(new Event("input", { bubbles: true }));
        source.dispatchEvent(new Event("change", { bubbles: true }));
      };
      const pullFromSource = () => {
        const value = String(source.value || "");
        select.value = RAMPER.includes(value) ? value : "";
      };

      select.addEventListener("change", pushToSource);
      source.addEventListener("input", pullFromSource);
      source.addEventListener("change", pullFromSource);
      source.addEventListener("focus", () => select.focus());
    });
  }

  const managementObserver = new MutationObserver(() => {
    installMainSwitches();
    installRampDropdowns();
    applyHomeVisibility();
  });
  managementObserver.observe(document.documentElement, { childList: true, subtree: true });
  installMainSwitches();
  installRampDropdowns();
  applyHomeVisibility();
  setInterval(installRampDropdowns, 1200);
  setInterval(() => {
    document.querySelectorAll(".bama-ramp-source").forEach(source => {
      const select = source.previousElementSibling;
      if (!select?.classList.contains("bama-ramp-select")) return;
      const value = String(source.value || "");
      const next = RAMPER.includes(value) ? value : "";
      if (select.value !== next) select.value = next;
    });
  }, 500);

  window.addEventListener("storage", event => {
    if (!event.key?.startsWith(HOME_KEY_PREFIX)) return;
    const target = event.key.slice(HOME_KEY_PREFIX.length);
    syncSwitches(target);
    if (target === currentTargetKey()) applyHomeVisibility();
  });

  if (document.getElementById("bamaSharedStock")) return;

  const card = document.createElement("section");
  card.id = "bamaSharedStock";
  card.setAttribute("aria-live", "polite");
  card.innerHTML = `
    <div class="bss-head"><div class="bss-title">LAGER NÅ</div><div class="bss-time" id="bssTime">Laster…</div></div>
    <div class="bss-grid">
      <div class="bss-cell physical"><span>FYSISK</span><strong id="bssPhysical">—</strong></div>
      <div class="bss-cell"><span>TILGJENGELIG</span><strong id="bssAvailable">—</strong></div>
      <div class="bss-cell"><span>RESERVERT</span><strong id="bssReserved">—</strong></div>
      <div class="bss-cell"><span>PÅ RAMPE</span><strong id="bssStaged">—</strong></div>
      <div class="bss-cell dispatched"><span>SENDT</span><strong id="bssDispatched">—</strong></div>
    </div>
    <div class="bss-error" id="bssError"></div>
  `;

  const host = document.querySelector("main.app, .app, main, body");
  const anchor = host?.querySelector?.(".topbar, .top, .version") || null;
  if (anchor && anchor.parentElement === host) anchor.insertAdjacentElement("afterend", card);
  else if (host && host !== document.body) host.insertBefore(card, host.firstChild);
  else document.body.insertBefore(card, document.body.firstChild);

  const cleanStatus = value => value || "in_stock";
  const metric = rows => {
    const bunner = rows.filter(row => row.product === "bunner").length;
    const h30 = rows.filter(row => row.product === "hyller30").length;
    const h60 = rows.filter(row => row.product === "hyller60").length;
    return {
      bunnerRecords: bunner,
      h30Records: h30,
      h60Records: h60,
      totalBunner: bunner * 10 + h30 + h60,
      totalHyller: h30 * 30 + h60 * 60
    };
  };
  const text = value => `${value.totalBunner} B · ${value.totalHyller} H`;

  function updateLegacyProductTotals(physicalRows) {
    const legacyCard = document.getElementById("productTotalsCard");
    if (!legacyCard) return;
    const counts = metric(physicalRows);
    const bunner = physicalRows.filter(row => row.product === "bunner").length;
    const h30 = physicalRows.filter(row => row.product === "hyller30").length;
    const h60 = physicalRows.filter(row => row.product === "hyller60").length;
    const title = document.getElementById("productTotalsTitle");
    const bunnerTotal = document.getElementById("bunnerTotal");
    const h30Total = document.getElementById("hyller30Total");
    const h60Total = document.getElementById("hyller60Total");
    const totalLabel = document.getElementById("grandTotalLabel");
    const totalValue = document.getElementById("grandTotalValue");
    if (title) title.textContent = "Fysisk på lager";
    if (bunnerTotal) bunnerTotal.textContent = `${bunner} stabler × 10 = ${bunner * 10} stk.`;
    if (h30Total) h30Total.textContent = `${h30} sett × 30 = ${h30 * 30} hyller`;
    if (h60Total) h60Total.textContent = `${h60} sett × 60 = ${h60 * 60} hyller`;
    if (totalLabel) totalLabel.textContent = "Fysisk";
    if (totalValue) totalValue.textContent = `${counts.totalBunner} Bunner · ${counts.totalHyller} hyller`;
  }

  function updateKnownFields(values) {
    const html = value => `${value.totalBunner} Bunner<br>${value.totalHyller} hyller`;
    const plain = value => `${value.totalBunner} Bunner · ${value.totalHyller} hyller`;
    const mapping = [
      ["physicalStock", html(values.physical), true],
      ["availableStock", html(values.available), true],
      ["reservedStock", html(values.reserved), true],
      ["stagedStock", html(values.staged), true],
      ["dispatchedStock", html(values.dispatched), true],
      ["physicalValue", plain(values.physical), false],
      ["availableValue", plain(values.available), false]
    ];
    for (const [id, value, useHtml] of mapping) {
      const element = document.getElementById(id);
      if (!element) continue;
      if (useHtml) element.innerHTML = value;
      else element.textContent = value;
    }
  }

  async function loadStock() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/mottak_scans?select=product,status,stock_status&status=eq.verified&limit=10000`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: "application/json" },
      cache: "no-store"
    });
    const rows = await response.json().catch(() => []);
    if (!response.ok) throw new Error(rows?.message || `HTTP ${response.status}`);

    const by = status => rows.filter(row => cleanStatus(row.stock_status) === status);
    const availableRows = by("in_stock");
    const reservedRows = by("reserved");
    const stagedRows = by("staged");
    const dispatchedRows = by("dispatched");
    const physicalRows = rows.filter(row => ["in_stock", "reserved", "staged"].includes(cleanStatus(row.stock_status)));

    const values = {
      physical: metric(physicalRows),
      available: metric(availableRows),
      reserved: metric(reservedRows),
      staged: metric(stagedRows),
      dispatched: metric(dispatchedRows)
    };

    document.getElementById("bssPhysical").textContent = text(values.physical);
    document.getElementById("bssAvailable").textContent = text(values.available);
    document.getElementById("bssReserved").textContent = text(values.reserved);
    document.getElementById("bssStaged").textContent = text(values.staged);
    document.getElementById("bssDispatched").textContent = text(values.dispatched);
    document.getElementById("bssTime").textContent = `Oppdatert ${new Intl.DateTimeFormat("nb-NO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date())}`;
    document.getElementById("bssError").style.display = "none";

    updateLegacyProductTotals(physicalRows);
    updateKnownFields(values);
    window.dispatchEvent(new CustomEvent("bama-stock-updated", { detail: values }));
    return values;
  }

  async function refresh() {
    try {
      return await loadStock();
    } catch (error) {
      const box = document.getElementById("bssError");
      box.textContent = `Kunne ikke oppdatere lagerstatus: ${error.message || error}`;
      box.style.display = "block";
      throw error;
    }
  }

  window.refreshBamaStock = refresh;
  refresh().catch(() => {});
  setInterval(() => refresh().catch(() => {}), REFRESH_MS);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh().catch(() => {});
  });
})();