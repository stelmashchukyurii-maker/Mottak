"use strict";

(() => {
  if (window.__BAMA_UT_TEST_API__) return;
  window.__BAMA_UT_TEST_API__ = true;

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
    nordic_auto_scan: "ut_test_nordic_auto_scan",
    nordic_preview: "ut_test_nordic_preview",
  };

  const PRODUCT_NAMES = {
    bunner: "Bunner",
    hyller30: "Hyller x30",
    hyller60: "Hyller x60",
    forlengere_korte: "Forlengere korte",
    forlengere_lange: "Forlengere lange",
  };

  function requestMethod(input, init) {
    return String(init?.method || input?.method || "GET").toUpperCase();
  }

  function originalUrl(input) {
    return typeof input === "string" || input instanceof URL ? String(input) : input.url;
  }

  async function requestPayload(input, init) {
    try {
      if (typeof init?.body === "string") return JSON.parse(init.body);
      if (input instanceof Request) return await input.clone().json();
    } catch (_) {}
    return null;
  }

  function requestHeaders(input, init) {
    if (init?.headers) return new Headers(init.headers);
    if (input instanceof Request) return new Headers(input.headers);
    return new Headers();
  }

  async function confirmNordicBeforeWrite(input, init, rawUrl) {
    let url;
    try { url = new URL(rawUrl, location.href); } catch (_) { return null; }
    if (url.origin !== SUPABASE_ORIGIN || url.pathname !== "/rest/v1/rpc/nordic_auto_scan") return null;
    if (requestMethod(input, init) !== "POST") return null;

    const payload = await requestPayload(input, init);
    if (!payload?.p_order_id || !payload?.p_epc) return null;

    const previewUrl = new URL(rawUrl, location.href);
    previewUrl.pathname = "/rest/v1/rpc/ut_test_nordic_preview";
    const previewResponse = await nativeFetch(previewUrl.toString(), {
      method: "POST",
      headers: requestHeaders(input, init),
      body: JSON.stringify({ p_order_id: payload.p_order_id, p_epc: payload.p_epc }),
      cache: "no-store",
    });

    const previewText = await previewResponse.text();
    let preview = null;
    try { preview = previewText ? JSON.parse(previewText) : null; } catch (_) {}
    if (!previewResponse.ok) {
      return new Response(previewText || JSON.stringify({ message: "Не вдалося визначити товар перед підтвердженням." }), {
        status: previewResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!preview?.ok) {
      return new Response(JSON.stringify({ message: "Не вдалося визначити товар перед підтвердженням." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (preview.kind === "complete") return null;

    const product = PRODUCT_NAMES[preview.product] || preview.product || "Невідомий товар";
    const lower = preview.physical_lower || String(payload.p_epc).slice(-6);
    const unitInfo = preview.kind === "counts" && preview.unit_index
      ? `\nВізок: ${preview.unit_index} з ${preview.ordered || "—"}`
      : "";
    const ok = window.confirm(
      `Nordic ID знайшов товар:\n\n${product}\nБірка: ${lower}${unitInfo}\n\nЦЕ ДІЙСНО ЦЕЙ ТОВАР?\n\nOK — підтвердити\nCancel — НЕ додавати`
    );

    if (!ok) {
      return new Response(JSON.stringify({ message: `СКАСОВАНО — ${product} не додано на рампу.` }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
    return null;
  }

  function rewrittenUrl(rawUrl) {
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
        throw new Error(`TEST SAFETY: Supabase RPC '${rpcName}' is not allowed in the isolated test contour.`);
      }
      url.pathname = `/rest/v1/rpc/${mapped}`;
      return url.toString();
    }

    const mappedTable = tableMap[first];
    if (!mappedTable) {
      throw new Error(`TEST SAFETY: Supabase table '${first}' is not allowed in the isolated test contour.`);
    }

    url.pathname = `/rest/v1/${mappedTable}${slash === -1 ? "" : restPath.slice(slash)}`;
    return url.toString();
  }

  window.fetch = async function bamaUtTestFetch(input, init = {}) {
    const rawUrl = originalUrl(input);

    const confirmationResponse = await confirmNordicBeforeWrite(input, init, rawUrl);
    if (confirmationResponse) return confirmationResponse;

    let nextUrl;
    try {
      nextUrl = rewrittenUrl(rawUrl);
    } catch (error) {
      console.error("[UT-TEST-CHAIN] blocked", requestMethod(input, init), rawUrl, error);
      return Promise.reject(error);
    }

    if (nextUrl === rawUrl) return nativeFetch(input, init);

    console.info("[UT-TEST-CHAIN]", requestMethod(input, init), rawUrl, "→", nextUrl);

    if (typeof input === "string" || input instanceof URL) {
      return nativeFetch(nextUrl, init);
    }

    const replacement = new Request(nextUrl, input);
    return nativeFetch(replacement, init);
  };

  window.BAMA_UT_TEST_API = {
    mode: "test",
    isolated: true,
    tables: { ...tableMap },
    rpcs: { ...rpcMap },
    nordicPreSaveConfirm: true,
    version: "1.5.0",
    updatedAt: "2026-08-09T22:42:00+02:00",
  };
})();
