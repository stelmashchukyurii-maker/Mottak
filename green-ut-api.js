"use strict";

// BaMavaremottak — GREEN UT safety adapter
// Version 1.0.0
// Updated: 2026-08-08 21:07 Europe/Oslo
//
// GREEN is a private pre-production clone. Until explicit promotion,
// every permitted UT database call is routed to the isolated ut_test_* backend.
// Unknown Supabase REST tables/RPC are blocked.
(() => {
  if (window.__BAMA_GREEN_UT_API__) return;
  window.__BAMA_GREEN_UT_API__ = true;

  const SUPABASE_ORIGIN = "https://hzjsatehehhpgpskckfi.supabase.co";
  const nativeFetch = window.fetch.bind(window);

  const tableMap = {
    mottak_scans: "ut_test_stock",
    ut_orders: "ut_test_orders",
    ut_order_scans: "ut_test_order_scans",
    ut_order_items: "ut_test_order_items",
  };

  const rpcMap = {
    ut_physical_stock: "ut_test_physical_stock",
    reserve_ut_scan_by_id: "ut_test_reserve_scan_by_id",
    reserve_ut_scan: "ut_test_reserve_scan",
    remove_ut_scan: "ut_test_remove_scan",
    stage_ut_order: "ut_test_stage_order",
    test_dispatch_ut_order: "ut_test_dispatch_order",
    confirm_ut_dispatch: "ut_test_dispatch_order",
    return_ut_test_order: "ut_test_return_order",
    cancel_ut_order: "ut_test_cancel_order",
    office_edit_unsent_ut_order: "ut_test_office_edit_order",
    update_ut_order_before_dispatch: "ut_test_office_edit_order",
    register_ut_scan_only: "ut_test_register_scan_only",
    save_ut_order_with_items: "ut_test_save_order_with_items",
    ut_extra_progress: "ut_test_extra_progress",
    confirm_ut_extra_unit: "ut_test_confirm_extra_unit",
    clear_ut_extra_unit: "ut_test_clear_extra_unit",
  };

  function method(input, init) {
    return String(init?.method || input?.method || "GET").toUpperCase();
  }

  function rewrite(rawUrl) {
    const url = new URL(rawUrl, location.href);
    if (url.origin !== SUPABASE_ORIGIN || !url.pathname.startsWith("/rest/v1/")) {
      return url.toString();
    }

    const restPath = url.pathname.slice("/rest/v1/".length);
    const slash = restPath.indexOf("/");
    const first = slash === -1 ? restPath : restPath.slice(0, slash);

    if (first === "rpc") {
      const rpcName = restPath.slice(4);
      const mapped = rpcMap[rpcName];
      if (!mapped) {
        throw new Error(`GREEN SAFETY: Supabase RPC '${rpcName}' is blocked in the GREEN clone.`);
      }
      url.pathname = `/rest/v1/rpc/${mapped}`;
      return url.toString();
    }

    const mappedTable = tableMap[first];
    if (!mappedTable) {
      throw new Error(`GREEN SAFETY: Supabase table '${first}' is blocked in the GREEN clone.`);
    }

    url.pathname = `/rest/v1/${mappedTable}${slash === -1 ? "" : restPath.slice(slash)}`;
    return url.toString();
  }

  window.fetch = function bamaGreenUtFetch(input, init = {}) {
    const rawUrl = typeof input === "string" || input instanceof URL ? String(input) : input.url;
    let nextUrl;
    try {
      nextUrl = rewrite(rawUrl);
    } catch (error) {
      console.error("[GREEN-UT] blocked", method(input, init), rawUrl, error);
      return Promise.reject(error);
    }

    if (nextUrl === rawUrl) return nativeFetch(input, init);

    console.info("[GREEN-UT]", method(input, init), rawUrl, "→", nextUrl);
    if (typeof input === "string" || input instanceof URL) return nativeFetch(nextUrl, init);

    const replacement = new Request(nextUrl, input);
    return nativeFetch(replacement, init);
  };

  window.BAMA_GREEN_UT_API = {
    mode: "green",
    isolated: true,
    backend: "ut_test",
    productionWritesBlocked: true,
    tables: { ...tableMap },
    rpcs: { ...rpcMap },
    version: "1.0.0",
    updatedAt: "2026-08-08T21:07:00+02:00",
  };
})();
