"use strict";

(() => {
  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const REFRESH_MS = 5000;

  if (document.getElementById("bamaSharedStock")) return;

  const style = document.createElement("style");
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
    @media(min-width:760px){#bamaSharedStock .bss-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);

  const card = document.createElement("section");
  card.id = "bamaSharedStock";
  card.setAttribute("aria-live", "polite");
  card.innerHTML = `
    <div class="bss-head"><div class="bss-title">СКЛАД ЗАРАЗ / LAGER NÅ</div><div class="bss-time" id="bssTime">Завантаження…</div></div>
    <div class="bss-grid">
      <div class="bss-cell physical"><span>ФІЗИЧНО / FYSISK</span><strong id="bssPhysical">—</strong></div>
      <div class="bss-cell"><span>ДОСТУПНО / LEDIG</span><strong id="bssAvailable">—</strong></div>
      <div class="bss-cell"><span>ЗАРЕЗЕРВОВАНО</span><strong id="bssReserved">—</strong></div>
      <div class="bss-cell"><span>НА РАМПІ</span><strong id="bssStaged">—</strong></div>
      <div class="bss-cell dispatched"><span>ТЕСТОВО СПИСАНО</span><strong id="bssDispatched">—</strong></div>
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
    const card = document.getElementById("productTotalsCard");
    if (!card) return;
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
    if (title) title.textContent = "Фізично на складі / Fysisk på lager";
    if (bunnerTotal) bunnerTotal.textContent = `${bunner} стопок × 10 = ${bunner * 10} шт.`;
    if (h30Total) h30Total.textContent = `${h30} Bunner × 30 = ${h30 * 30} hyller`;
    if (h60Total) h60Total.textContent = `${h60} Bunner × 60 = ${h60 * 60} hyller`;
    if (totalLabel) totalLabel.textContent = "Фізично";
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
    document.getElementById("bssTime").textContent = `Оновлено ${new Intl.DateTimeFormat("uk-UA", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date())}`;
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
      box.textContent = `Не вдалося оновити залишок: ${error.message || error}`;
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
