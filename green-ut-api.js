"use strict";

// BaMavaremottak — GREEN backend marker
// Version 2.0.0
// Updated: 2026-08-09 00:04 Europe/Oslo
//
// Agreed architecture:
// - WORKING and GREEN are two UI/code routes over the SAME normal database.
// - Only the dedicated UT TEST chain is isolated and uses ut_test_* via ut-test-api.js.
//
// This file is kept as a compatibility marker because existing GREEN wrappers load it.
// It intentionally does NOT rewrite fetch(), tables or RPC names.
(() => {
  if (window.__BAMA_GREEN_UT_API__) return;
  window.__BAMA_GREEN_UT_API__ = true;

  window.BAMA_GREEN_UT_API = {
    mode: "green",
    isolated: false,
    backend: "production",
    productionWritesBlocked: false,
    tables: {
      mottak_scans: "mottak_scans",
      ut_orders: "ut_orders",
      ut_order_scans: "ut_order_scans",
      ut_order_items: "ut_order_items"
    },
    version: "2.0.0",
    updatedAt: "2026-08-09T00:04:00+02:00"
  };

  console.info("[GREEN] shared production backend active. Dedicated UT TEST remains isolated via ut-test-api.js.");
})();
