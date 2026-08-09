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
    nb: { bunner:"Bunner", hyller30:"Hyller x30", hyller60:"Hyller x60", forlengere_korte:"Forlengere korte", forlengere_lange:"Forlengere lange" },
    pl: { bunner:"Bunner", hyller30:"Hyller x30", hyller60:"Hyller x60", forlengere_korte:"Przedłużki krótkie", forlengere_lange:"Przedłużki długie" },
    uk: { bunner:"Bunner", hyller30:"Hyller x30", hyller60:"Hyller x60", forlengere_korte:"Подовжувачі короткі", forlengere_lange:"Подовжувачі довгі" },
  };

  const COPY = {
    nb: {
      found:"Nordic ID fant varen:", tag:"Brikke", question:"ER DETTE RIKTIG VARE?", ok:"OK — bekreft", cancel:"Cancel — IKKE legg til",
      previewError:"Kunne ikke identifisere varen før bekreftelse.", cancelled:p=>`AVBRUTT — ${p} ble ikke lagt til på rampen.`,
      needExtras:"Registrer først Hyller og Forlengere for korte/lange forlengere før «Klar på rampe»."
    },
    pl: {
      found:"Nordic ID znalazł produkt:", tag:"Etykieta", question:"CZY TO NA PEWNO TEN PRODUKT?", ok:"OK — potwierdź", cancel:"Cancel — NIE dodawaj",
      previewError:"Nie udało się rozpoznać produktu przed potwierdzeniem.", cancelled:p=>`ANULOWANO — ${p} nie został dodany do rampy.`,
      needExtras:"Najpierw wpisz liczbę półek i przedłużek dla krótkich/długich przedłużek przed «Gotowe na rampie»."
    },
    uk: {
      found:"Nordic ID знайшов товар:", tag:"Бірка", question:"ЦЕ ДІЙСНО ЦЕЙ ТОВАР?", ok:"OK — підтвердити", cancel:"Cancel — НЕ додавати",
      previewError:"Не вдалося визначити товар перед підтвердженням.", cancelled:p=>`СКАСОВАНО — ${p} не додано на рампу.`,
      needExtras:"Спочатку введіть Hyller і Forlengere для коротких/довгих продовжувачів перед «Готово на рампі»."
    }
  };

  function lang() {
    const v = window.UT_LANG || localStorage.getItem("mottak_ut_language") || "nb";
    return v === "pl" || v === "uk" ? v : "nb";
  }
  function copy(){ return COPY[lang()] || COPY.nb; }
  function productName(id){ return (PRODUCT_NAMES[lang()] || PRODUCT_NAMES.nb)[id] || id || "—"; }
  function requestMethod(input, init) { return String(init?.method || input?.method || "GET").toUpperCase(); }
  function originalUrl(input) { return typeof input === "string" || input instanceof URL ? String(input) : input.url; }
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
  function jsonResponse(message,status=409){
    return new Response(JSON.stringify({message}),{status,headers:{"Content-Type":"application/json"}});
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
    if (!previewResponse.ok || !preview?.ok) return jsonResponse(copy().previewError, previewResponse.ok ? 400 : previewResponse.status);

    if (preview.kind === "complete") return null;

    // Forlengere: no browser confirmation here. The Nordic page opens the dedicated
    // Hyller + Forlengere modal; saving those fields is the user's confirmation.
    if (preview.kind === "counts") return null;

    const c = copy();
    const product = productName(preview.product);
    const lower = preview.physical_lower || String(payload.p_epc).slice(-6);
    const ok = window.confirm(`${c.found}\n\n${product}\n${c.tag}: ${lower}\n\n${c.question}\n\n${c.ok}\n${c.cancel}`);
    if (!ok) return jsonResponse(c.cancelled(product));
    return null;
  }

  async function guardStageBeforeWrite(input, init, rawUrl) {
    let url;
    try { url = new URL(rawUrl, location.href); } catch (_) { return null; }
    if (url.origin !== SUPABASE_ORIGIN || url.pathname !== "/rest/v1/rpc/stage_ut_order") return null;
    if (requestMethod(input, init) !== "POST") return null;
    if (window.UT_EXTRA_PRODUCTS_COMPLETE === false) return jsonResponse(copy().needExtras);
    return null;
  }

  function rewrittenUrl(rawUrl) {
    const url = new URL(rawUrl, location.href);
    if (url.origin !== SUPABASE_ORIGIN || !url.pathname.startsWith("/rest/v1/")) return url.toString();
    const restPath = url.pathname.slice("/rest/v1/".length);
    const slash = restPath.indexOf("/");
    const first = slash === -1 ? restPath : restPath.slice(0, slash);
    if (first === "rpc") {
      const rpcName = restPath.slice(4);
      const mapped = rpcMap[rpcName];
      if (!mapped) throw new Error(`TEST SAFETY: Supabase RPC '${rpcName}' is not allowed in the isolated test contour.`);
      url.pathname = `/rest/v1/rpc/${mapped}`;
      return url.toString();
    }
    const mappedTable = tableMap[first];
    if (!mappedTable) throw new Error(`TEST SAFETY: Supabase table '${first}' is not allowed in the isolated test contour.`);
    url.pathname = `/rest/v1/${mappedTable}${slash === -1 ? "" : restPath.slice(slash)}`;
    return url.toString();
  }

  function enhanceNordicTestUi() {
    try {
      const card = document.getElementById("nidScannerCard");
      if (card && !document.getElementById("nidPreSaveConfirmBadge")) {
        const badge = document.createElement("div");
        badge.id = "nidPreSaveConfirmBadge";
        badge.textContent = "V2.6.2 · LANG + EXTENDER FIELDS + RAMP GUARD · 09.08.2026 22:52";
        badge.style.cssText = "margin:8px 0 0;padding:7px 9px;border:1px solid #f4c430;border-radius:10px;background:rgba(244,196,48,.08);color:#fff1a8;font:900 10px/1.35 Arial,sans-serif;text-align:center";
        card.querySelector(".nid-head")?.insertAdjacentElement("afterend", badge);
      }
      const action = document.getElementById("testDispatchButton");
      if (action) {
        const text = String(action.textContent || "").trim();
        if (text === "readyRampButton") action.textContent = "Klar på rampe";
        if (text === "sendButton") action.textContent = "Send fra rampe";
      }
    } catch (_) {}
  }
  function startUiEnhancer() {
    enhanceNordicTestUi();
    try { new MutationObserver(enhanceNordicTestUi).observe(document.documentElement,{childList:true,subtree:true,characterData:true}); } catch (_) {}
    setInterval(enhanceNordicTestUi,700);
  }

  window.fetch = async function bamaUtTestFetch(input, init = {}) {
    const rawUrl = originalUrl(input);
    const confirmationResponse = await confirmNordicBeforeWrite(input, init, rawUrl);
    if (confirmationResponse) return confirmationResponse;
    const stageGuardResponse = await guardStageBeforeWrite(input, init, rawUrl);
    if (stageGuardResponse) return stageGuardResponse;

    let nextUrl;
    try { nextUrl = rewrittenUrl(rawUrl); }
    catch (error) {
      console.error("[UT-TEST-CHAIN] blocked", requestMethod(input, init), rawUrl, error);
      return Promise.reject(error);
    }
    if (nextUrl === rawUrl) return nativeFetch(input, init);
    console.info("[UT-TEST-CHAIN]", requestMethod(input, init), rawUrl, "→", nextUrl);
    if (typeof input === "string" || input instanceof URL) return nativeFetch(nextUrl, init);
    return nativeFetch(new Request(nextUrl, input), init);
  };

  window.BAMA_UT_TEST_API = {
    mode:"test", isolated:true, tables:{...tableMap}, rpcs:{...rpcMap}, nordicPreSaveConfirm:true,
    version:"1.6.0", updatedAt:"2026-08-09T22:52:00+02:00"
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startUiEnhancer, {once:true});
  else startUiEnhancer();
})();
