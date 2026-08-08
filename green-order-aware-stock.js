"use strict";

// GREEN shared available-stock model
// Version 1.0.0
// Updated: 2026-08-08 22:18 Europe/Oslo
//
// Rule used by GREEN UT Kontor / UT Lager / Camera:
// available = current in_stock - still-unallocated quantity from active orders.
// Once a concrete item is reserved/staged, it leaves in_stock and also counts as linked,
// so it is NOT subtracted twice.
(() => {
  if (window.__BAMA_GREEN_ORDER_AWARE_STOCK__) return;
  window.__BAMA_GREEN_ORDER_AWARE_STOCK__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const ACTIVE = status => !["completed", "cancelled"].includes(String(status || ""));
  const n = value => Number.parseInt(value, 10) || 0;

  async function get(path) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json"
      },
      cache: "no-store"
    });
    const data = await response.json().catch(() => []);
    if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
    return Array.isArray(data) ? data : [];
  }

  function ordered(order, product) {
    if (product === "bunner") return n(order.bunner_stacks);
    if (product === "hyller30") return n(order.hyller30_sets);
    return n(order.hyller60_sets);
  }

  async function load() {
    const [scans, orders] = await Promise.all([
      get("mottak_scans?select=id,product,status,stock_status,ut_order_id&limit=10000"),
      get("ut_orders?select=id,status,bunner_stacks,hyller30_sets,hyller60_sets&order=created_at.asc&limit=1000")
    ]);

    const verified = scans.filter(row => row.status === "verified");
    const activeOrders = orders.filter(order => ACTIVE(order.status));
    const activeIds = new Set(activeOrders.map(order => String(order.id)));

    const inStock = {
      bunner: verified.filter(row => row.product === "bunner" && (row.stock_status || "in_stock") === "in_stock").length,
      hyller30: verified.filter(row => row.product === "hyller30" && (row.stock_status || "in_stock") === "in_stock").length,
      hyller60: verified.filter(row => row.product === "hyller60" && (row.stock_status || "in_stock") === "in_stock").length
    };

    const linked = new Map();
    for (const row of verified) {
      const id = row.ut_order_id ? String(row.ut_order_id) : "";
      if (!id || !activeIds.has(id)) continue;
      if (!linked.has(id)) linked.set(id, { bunner: 0, hyller30: 0, hyller60: 0 });
      const bucket = linked.get(id);
      if (Object.prototype.hasOwnProperty.call(bucket, row.product)) bucket[row.product] += 1;
    }

    const unallocated = { bunner: 0, hyller30: 0, hyller60: 0 };
    for (const order of activeOrders) {
      const used = linked.get(String(order.id)) || { bunner: 0, hyller30: 0, hyller60: 0 };
      unallocated.bunner += Math.max(0, ordered(order, "bunner") - used.bunner);
      unallocated.hyller30 += Math.max(0, ordered(order, "hyller30") - used.hyller30);
      unallocated.hyller60 += Math.max(0, ordered(order, "hyller60") - used.hyller60);
    }

    const available = {
      bunner: Math.max(0, inStock.bunner - unallocated.bunner),
      hyller30: Math.max(0, inStock.hyller30 - unallocated.hyller30),
      hyller60: Math.max(0, inStock.hyller60 - unallocated.hyller60)
    };

    return { inStock, unallocated, available, activeOrders: activeOrders.length };
  }

  function totals(v) {
    return {
      totalBunner: v.bunner * 10 + v.hyller30 + v.hyller60,
      totalHyller: v.hyller30 * 30 + v.hyller60 * 60
    };
  }

  function applyUtLager(state) {
    const a = state.available;
    const b = document.getElementById("upsB");
    const h30 = document.getElementById("upsH30");
    const h60 = document.getElementById("upsH60");
    if (!b || !h30 || !h60) return false;
    b.textContent = String(a.bunner);
    h30.textContent = String(a.hyller30);
    h60.textContent = String(a.hyller60);
    const head = document.querySelector("#utProductStockV273 .ups-head span:first-child");
    if (head) head.textContent = "TILGJENGELIG · ETTER BESTILLINGER";
    const time = document.getElementById("upsTime");
    if (time) time.textContent = new Intl.DateTimeFormat("nb-NO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date());
    return true;
  }

  function applyCamera(state) {
    const a = state.available;
    const t = totals(a);
    const title = document.getElementById("productTotalsTitle");
    const bunner = document.getElementById("bunnerTotal");
    const h30 = document.getElementById("hyller30Total");
    const h60 = document.getElementById("hyller60Total");
    const totalLabel = document.getElementById("grandTotalLabel");
    const totalValue = document.getElementById("grandTotalValue");
    if (!title || !bunner || !h30 || !h60 || !totalValue) return false;
    title.textContent = "Tilgjengelig · etter bestillinger";
    bunner.textContent = `${a.bunner} stabler × 10 = ${a.bunner * 10} stk.`;
    h30.textContent = `${a.hyller30} sett × 30 = ${a.hyller30 * 30} hyller`;
    h60.textContent = `${a.hyller60} sett × 60 = ${a.hyller60 * 60} hyller`;
    if (totalLabel) totalLabel.textContent = "Tilgjengelig";
    totalValue.textContent = `${t.totalBunner} Bunner · ${t.totalHyller} hyller`;
    return true;
  }

  async function refresh() {
    try {
      const state = await load();
      applyUtLager(state);
      applyCamera(state);
      window.dispatchEvent(new CustomEvent("green-order-aware-stock-updated", { detail: state }));
      return state;
    } catch (error) {
      console.error("[GREEN ORDER-AWARE STOCK]", error);
      throw error;
    }
  }

  const previousUtRefresh = window.UT_PRODUCT_STOCK_REFRESH;
  window.UT_PRODUCT_STOCK_REFRESH = async function greenOrderAwareRefresh() {
    try { await previousUtRefresh?.(); } catch {}
    return refresh();
  };

  window.addEventListener("bama-stock-updated", () => refresh().catch(() => {}));
  setTimeout(() => refresh().catch(() => {}), 80);
  setInterval(() => refresh().catch(() => {}), 5000);

  window.BAMA_GREEN_ORDER_AWARE_STOCK = {
    version: "1.0.0",
    updatedAt: "2026-08-08T22:18:00+02:00",
    formula: "available = in_stock - unallocated active-order demand",
    load,
    refresh
  };
})();
