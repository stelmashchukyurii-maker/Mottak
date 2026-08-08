"use strict";

// GREEN shared legacy-stock availability calculation.
// Version 1.0.0
// Updated: 2026-08-08 22:35 Europe/Oslo
//
// Source of truth: scanned legacy stock only (Bunner / Hyller x30 / Hyller x60).
// Forlengere korte/lange/plast NEVER reduce this warehouse balance.
// Rule matches GREEN UT Kontor:
// available = in_stock - max(0, active order qty - already reserved/staged for that order)
(() => {
  if (window.__BAMA_GREEN_LEGACY_AVAILABLE_STOCK__) return;
  window.__BAMA_GREEN_LEGACY_AVAILABLE_STOCK__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const REFRESH_MS = 4000;
  const PRODUCTS = ["bunner", "hyller30", "hyller60"];
  let refreshing = null;

  const activeStatus = status => !["completed", "cancelled"].includes(String(status || ""));
  const cleanStockStatus = value => value || "in_stock";
  const qty = (order, product) => {
    if (product === "bunner") return Number(order?.bunner_stacks) || 0;
    if (product === "hyller30") return Number(order?.hyller30_sets) || 0;
    if (product === "hyller60") return Number(order?.hyller60_sets) || 0;
    return 0;
  };

  async function get(path) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json"
      },
      cache: "no-store"
    });
    const body = await response.json().catch(() => []);
    if (!response.ok) throw new Error(body?.message || `HTTP ${response.status}`);
    return Array.isArray(body) ? body : [];
  }

  function compute(scans, allOrders) {
    const verified = (scans || []).filter(row => row.status === "verified" && PRODUCTS.includes(row.product));
    const activeOrders = (allOrders || []).filter(order => activeStatus(order.status));

    const free = { bunner: 0, hyller30: 0, hyller60: 0 };
    verified.forEach(row => {
      if (cleanStockStatus(row.stock_status) === "in_stock" && Object.prototype.hasOwnProperty.call(free, row.product)) {
        free[row.product] += 1;
      }
    });

    const linked = new Map();
    verified.forEach(row => {
      if (!row.ut_order_id || !["reserved", "staged"].includes(cleanStockStatus(row.stock_status))) return;
      const id = String(row.ut_order_id);
      if (!linked.has(id)) linked.set(id, { bunner: 0, hyller30: 0, hyller60: 0 });
      if (Object.prototype.hasOwnProperty.call(linked.get(id), row.product)) linked.get(id)[row.product] += 1;
    });

    const stillToAllocate = { bunner: 0, hyller30: 0, hyller60: 0 };
    activeOrders.forEach(order => {
      const used = linked.get(String(order.id)) || { bunner: 0, hyller30: 0, hyller60: 0 };
      PRODUCTS.forEach(product => {
        stillToAllocate[product] += Math.max(0, qty(order, product) - used[product]);
      });
    });

    const available = {
      bunner: Math.max(0, free.bunner - stillToAllocate.bunner),
      hyller30: Math.max(0, free.hyller30 - stillToAllocate.hyller30),
      hyller60: Math.max(0, free.hyller60 - stillToAllocate.hyller60)
    };

    const component = values => ({
      totalBunner: values.bunner * 10 + values.hyller30 + values.hyller60,
      totalHyller: values.hyller30 * 30 + values.hyller60 * 60
    });

    return {
      free,
      linked,
      stillToAllocate,
      available,
      availableComponents: component(available),
      activeOrders: activeOrders.length
    };
  }

  function applyCamera(result) {
    const { available, availableComponents } = result;
    const title = document.getElementById("productTotalsTitle");
    const bunnerTotal = document.getElementById("bunnerTotal");
    const h30Total = document.getElementById("hyller30Total");
    const h60Total = document.getElementById("hyller60Total");
    const totalLabel = document.getElementById("grandTotalLabel");
    const totalValue = document.getElementById("grandTotalValue");

    if (title) title.textContent = "Tilgjengelig · uten rampe";
    if (bunnerTotal) bunnerTotal.textContent = `${available.bunner} stabler × 10 = ${available.bunner * 10} stk.`;
    if (h30Total) h30Total.textContent = `${available.hyller30} sett × 30 = ${available.hyller30 * 30} hyller`;
    if (h60Total) h60Total.textContent = `${available.hyller60} sett × 60 = ${available.hyller60 * 60} hyller`;
    if (totalLabel) totalLabel.textContent = "Tilgjengelig";
    if (totalValue) totalValue.textContent = `${availableComponents.totalBunner} Bunner · ${availableComponents.totalHyller} hyller`;

    const bssAvailable = document.getElementById("bssAvailable");
    if (bssAvailable) bssAvailable.textContent = `${availableComponents.totalBunner} B · ${availableComponents.totalHyller} H`;
    const availableStock = document.getElementById("availableStock");
    if (availableStock) availableStock.innerHTML = `${availableComponents.totalBunner} Bunner<br>${availableComponents.totalHyller} hyller`;
    const availableValue = document.getElementById("availableValue");
    if (availableValue) availableValue.textContent = `${availableComponents.totalBunner} Bunner · ${availableComponents.totalHyller} hyller`;
  }

  function applyUtLager(result) {
    const { available } = result;
    const b = document.getElementById("upsB");
    const h30 = document.getElementById("upsH30");
    const h60 = document.getElementById("upsH60");
    const time = document.getElementById("upsTime");
    const head = document.querySelector("#utProductStockV273 .ups-head span:first-child");
    if (b) b.textContent = String(available.bunner);
    if (h30) h30.textContent = String(available.hyller30);
    if (h60) h60.textContent = String(available.hyller60);
    if (head) head.textContent = "TILGJENGELIG · UTEN RAMPE";
    if (time) time.textContent = new Intl.DateTimeFormat("nb-NO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date());
  }

  function apply(result) {
    applyCamera(result);
    applyUtLager(result);
    window.dispatchEvent(new CustomEvent("green-legacy-available-updated", { detail: result }));
  }

  async function refresh() {
    if (refreshing) return refreshing;
    refreshing = (async () => {
      try {
        const [scans, orders] = await Promise.all([
          get("mottak_scans?select=id,product,status,stock_status,ut_order_id&limit=10000"),
          get("ut_orders?select=id,status,bunner_stacks,hyller30_sets,hyller60_sets&order=created_at.asc&limit=1000")
        ]);
        const result = compute(scans, orders);
        apply(result);
        window.BAMA_GREEN_LEGACY_AVAILABLE_STATE = result;
        return result;
      } finally {
        refreshing = null;
      }
    })();
    return refreshing;
  }

  const previousUtRefresh = window.UT_PRODUCT_STOCK_REFRESH;
  if (typeof previousUtRefresh === "function") {
    window.UT_PRODUCT_STOCK_REFRESH = async function greenUnifiedUtRefresh(...args) {
      const result = await previousUtRefresh.apply(this, args);
      await refresh().catch(() => {});
      return result;
    };
  }

  window.addEventListener("bama-stock-updated", () => setTimeout(() => refresh().catch(() => {}), 0));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh().catch(() => {});
  });

  window.GREEN_LEGACY_AVAILABLE_REFRESH = refresh;
  window.BAMA_GREEN_LEGACY_AVAILABLE_INFO = {
    version: "1.0.0",
    source: "ut_test_stock + ut_test_orders via green-ut-api.js",
    balancedProducts: PRODUCTS.slice(),
    forlengereAffectsWarehouseBalance: false,
    updatedAt: "2026-08-08T22:35:00+02:00"
  };

  refresh().catch(() => {});
  setInterval(() => refresh().catch(() => {}), REFRESH_MS);
})();
