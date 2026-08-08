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
  };

  function requestMethod(input, init) {
    return String(init?.method || input?.method || "GET").toUpperCase();
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

  window.fetch = function bamaUtTestFetch(input, init = {}) {
    const rawUrl = typeof input === "string" || input instanceof URL ? String(input) : input.url;
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

  // TEST UT Lager mobile picker protection.
  // The legacy detail renderer refreshes every few seconds and rebuilds the
  // Bunner/Hyller <select> elements. On mobile that can close an open picker
  // and erase a choice before the user presses "Legg til". Keep this fix
  // inside the isolated TEST contour; production files are not modified.
  function installPickerStability() {
    if (window.__UT_TEST_PICKER_STABILITY__) return;
    if (typeof window.renderDetail !== "function") return;

    window.__UT_TEST_PICKER_STABILITY__ = true;

    const drafts = new Map();
    let busyUntil = 0;

    const language = () => {
      const value = window.UT_LANG || localStorage.getItem("mottak_ut_language") || "nb";
      return value === "uk" || value === "pl" ? value : "nb";
    };

    const copy = () => {
      if (language() === "uk") return {
        choose: count => `Вибрати зі складу · ${count} доступно`,
        add: "Додати",
        selected: "Вибрано — натисніть «Додати»",
        note: "TEST: виберіть конкретну зареєстровану одиницю. Повторіть до потрібної кількості."
      };
      if (language() === "pl") return {
        choose: count => `Wybierz z magazynu · ${count} dostępnych`,
        add: "Dodaj",
        selected: "Wybrano — naciśnij «Dodaj»",
        note: "TEST: wybierz konkretną zarejestrowaną jednostkę. Powtarzaj do wymaganej liczby."
      };
      return {
        choose: count => `Velg fra lagerlisten · ${count} tilgjengelig`,
        add: "Legg til",
        selected: "Valgt — trykk «Legg til»",
        note: "TEST: velg én konkret registrering. Gjenta til antallet er komplett."
      };
    };

    const currentOrderId = () => {
      try { return typeof window.current === "function" ? (window.current()?.id || "") : ""; }
      catch { return ""; }
    };

    const draftKey = product => `${currentOrderId()}::${product || ""}`;

    function isPicker(target) {
      return Boolean(target?.matches?.("[data-test-select]"));
    }

    function rememberVisibleChoices() {
      document.querySelectorAll("[data-test-select]").forEach(select => {
        if (select.value) drafts.set(draftKey(select.dataset.testSelect), select.value);
      });
    }

    function applyOne(select) {
      if (!isPicker(select)) return;
      const product = select.dataset.testSelect || "";
      const key = draftKey(product);
      const remembered = drafts.get(key) || "";

      if (remembered && [...select.options].some(option => option.value === remembered)) {
        select.value = remembered;
      } else if (remembered) {
        drafts.delete(key);
      }

      const text = copy();
      const available = Math.max(0, select.options.length - 1);
      if (select.options[0]) select.options[0].textContent = text.choose(available);

      const picker = select.closest(".test-picker");
      const button = picker?.querySelector("[data-test-add]");
      const note = picker?.querySelector(".test-picker-note");
      if (button) {
        button.textContent = select.value ? text.selected : text.add;
        button.disabled = select.disabled || !select.value;
      }
      if (note) note.textContent = text.note;

      select.style.borderColor = select.value ? "#48d597" : "";
      select.style.boxShadow = select.value ? "0 0 0 2px rgba(72,213,151,.12)" : "";
    }

    function applyAll() {
      document.querySelectorAll("[data-test-select]").forEach(applyOne);
    }

    document.addEventListener("pointerdown", event => {
      if (!isPicker(event.target)) return;
      busyUntil = Date.now() + 5000;
    }, true);

    document.addEventListener("touchstart", event => {
      if (!isPicker(event.target)) return;
      busyUntil = Date.now() + 5000;
    }, { capture: true, passive: true });

    document.addEventListener("focusin", event => {
      if (!isPicker(event.target)) return;
      busyUntil = Date.now() + 30000;
    }, true);

    document.addEventListener("change", event => {
      const select = event.target;
      if (!isPicker(select)) return;
      busyUntil = Date.now() + 1800;
      const key = draftKey(select.dataset.testSelect);
      if (select.value) drafts.set(key, select.value);
      else drafts.delete(key);
      applyOne(select);
    }, true);

    document.addEventListener("focusout", event => {
      if (!isPicker(event.target)) return;
      // Give the subsequent "Legg til" tap time to finish before any redraw.
      busyUntil = Date.now() + 1800;
    }, true);

    document.addEventListener("click", event => {
      const button = event.target?.closest?.("[data-test-add]");
      if (!button) return;
      const product = button.dataset.testAdd || "";
      // The reservation itself will refresh the stock. Forget the old choice
      // only after the click has been handed to the core handler.
      setTimeout(() => {
        drafts.delete(draftKey(product));
        applyAll();
      }, 700);
    }, true);

    const baseRenderDetail = window.renderDetail;
    window.renderDetail = function renderDetailWithStableTestPickers(...args) {
      const active = document.activeElement;
      const pickerOpen = isPicker(active) || Date.now() < busyUntil;

      if (pickerOpen) {
        // Background data can refresh, but do not replace the native mobile
        // select while the user is choosing or moving to "Legg til".
        return;
      }

      rememberVisibleChoices();
      const result = baseRenderDetail.apply(this, args);
      applyAll();
      return result;
    };

    // Re-apply translation/UX after language modules or outer TEST wrappers
    // have updated the detail without changing the selected stock row.
    const observer = new MutationObserver(() => {
      if (document.querySelector("[data-test-select]")) queueMicrotask(applyAll);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    applyAll();

    // Visible TEST version marker. Parent wrapper can write its banner first;
    // this applies the current fix marker afterwards without touching BLUE.
    const markVersion = () => {
      const version = document.querySelector(".version");
      if (version && /UT Lager/i.test(version.textContent || "")) {
        version.innerHTML = "TEST · UT Lager v27.14 · PICKER FIX<br>Oppdatert 08.08.2026 kl. 18:28";
      }
      try { parent.document.title = "TEST — UT Lager v27.14"; } catch {}
    };
    new MutationObserver(() => queueMicrotask(markVersion)).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    markVersion();
  }

  // ut-test-api.js is loaded in <head>, before the legacy core and its
  // enhancement modules. Install after DOMContentLoaded and keep checking
  // briefly in case the iframe wrapper finishes loading modules later.
  const startPickerStability = () => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      installPickerStability();
      if (window.__UT_TEST_PICKER_STABILITY__ || attempts >= 120) clearInterval(timer);
    }, 100);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startPickerStability, { once: true });
  } else {
    startPickerStability();
  }

  window.BAMA_UT_TEST_API = {
    mode: "test",
    isolated: true,
    tables: { ...tableMap },
    rpcs: { ...rpcMap },
    version: "1.4.0",
    updatedAt: "2026-08-08T18:28:00+02:00",
  };
})();
