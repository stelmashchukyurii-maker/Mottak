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

    if (typeof input === "string" || input instanceof URL) return nativeFetch(nextUrl, init);
    const replacement = new Request(nextUrl, input);
    return nativeFetch(replacement, init);
  };

  function installInteractionStability() {
    if (window.__UT_TEST_INTERACTION_STABILITY__) return;
    if (typeof window.renderDetail !== "function") return;
    window.__UT_TEST_INTERACTION_STABILITY__ = true;

    const pickerDrafts = new Map();
    const extraDrafts = new Map();
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
        note: "TEST: виберіть конкретну зареєстровану одиницю. На новій рампі перше «Додати» автоматично запускає її."
      };
      if (language() === "pl") return {
        choose: count => `Wybierz z magazynu · ${count} dostępnych`,
        add: "Dodaj",
        selected: "Wybrano — naciśnij «Dodaj»",
        note: "TEST: wybierz konkretną zarejestrowaną jednostkę. Dla nowej rampy pierwsze «Dodaj» uruchamia ją automatycznie."
      };
      return {
        choose: count => `Velg fra lagerlisten · ${count} tilgjengelig`,
        add: "Legg til",
        selected: "Valgt — trykk «Legg til»",
        note: "TEST: velg én konkret registrering. På en ny rampe starter første «Legg til» rampen automatisk."
      };
    };

    function currentOrder() {
      try { return typeof window.current === "function" ? window.current() : null; }
      catch { return null; }
    }

    function currentOrderId() {
      return currentOrder()?.id || "";
    }

    function isPicker(target) {
      return Boolean(target?.matches?.("[data-test-select]"));
    }

    function isExtraInput(target) {
      return Boolean(target?.matches?.("[data-extra-hyller],[data-extra-forlengere]"));
    }

    function pickerKey(product) {
      return `${currentOrderId()}::${product || ""}`;
    }

    function extraKey(element) {
      if (!element) return "";
      if (element.hasAttribute("data-extra-hyller")) return `${currentOrderId()}::h::${element.getAttribute("data-extra-hyller")}`;
      if (element.hasAttribute("data-extra-forlengere")) return `${currentOrderId()}::f::${element.getAttribute("data-extra-forlengere")}`;
      return "";
    }

    function canPickNow() {
      const order = currentOrder();
      return Boolean(order && (order.test_state || "active") === "active" && ["new", "received", "in_progress", "problem"].includes(order.status));
    }

    function rememberVisibleChoices() {
      document.querySelectorAll("[data-test-select]").forEach(select => {
        if (select.value) pickerDrafts.set(pickerKey(select.dataset.testSelect), select.value);
      });
    }

    function rememberExtraInput(element) {
      const key = extraKey(element);
      if (!key) return;
      extraDrafts.set(key, element.value);
      element.dataset.extraDirty = "1";
    }

    function restoreExtraDrafts() {
      document.querySelectorAll("[data-extra-hyller],[data-extra-forlengere]").forEach(input => {
        const key = extraKey(input);
        if (!key || !extraDrafts.has(key)) return;
        const value = extraDrafts.get(key);
        if (input.value !== value) input.value = value;
        input.dataset.extraDirty = "1";
      });
    }

    function clearExtraDraftsForUnit(unitKey) {
      const orderId = currentOrderId();
      extraDrafts.delete(`${orderId}::h::${unitKey}`);
      extraDrafts.delete(`${orderId}::f::${unitKey}`);
    }

    async function addSelected(product, select) {
      const value = select?.value || "";
      if (!value) return;
      busyUntil = Date.now() + 5000;
      pickerDrafts.set(pickerKey(product), value);

      try {
        const order = currentOrder();
        if (order?.status === "new" && typeof window.patchOrder === "function") {
          const now = new Date().toISOString();
          await window.patchOrder({
            status: "in_progress",
            received_at: order.received_at || now,
            started_at: order.started_at || now
          });
        }
        if (typeof window.reserveSelected === "function") await window.reserveSelected(product);
      } finally {
        pickerDrafts.delete(pickerKey(product));
        busyUntil = Date.now() + 600;
      }
    }

    function applyOne(select) {
      if (!isPicker(select)) return;
      const product = select.dataset.testSelect || "";
      const key = pickerKey(product);
      const remembered = pickerDrafts.get(key) || "";

      if (remembered && [...select.options].some(option => option.value === remembered)) select.value = remembered;
      else if (remembered) pickerDrafts.delete(key);

      const text = copy();
      const available = Math.max(0, select.options.length - 1);
      if (select.options[0]) select.options[0].textContent = text.choose(available);

      const usable = canPickNow() && available > 0;
      select.disabled = !usable;

      const picker = select.closest(".test-picker");
      const button = picker?.querySelector("[data-test-add]");
      const note = picker?.querySelector(".test-picker-note");
      if (button) {
        button.textContent = select.value ? text.selected : text.add;
        button.disabled = !usable || !select.value;
        button.onclick = () => addSelected(product, select);
      }
      if (note) note.textContent = text.note;

      select.style.borderColor = select.value ? "#48d597" : "";
      select.style.boxShadow = select.value ? "0 0 0 2px rgba(72,213,151,.12)" : "";
    }

    function applyAll() {
      document.querySelectorAll("[data-test-select]").forEach(applyOne);
      restoreExtraDrafts();
    }

    document.addEventListener("pointerdown", event => {
      if (isPicker(event.target) || isExtraInput(event.target)) busyUntil = Date.now() + 5000;
    }, true);

    document.addEventListener("touchstart", event => {
      if (isPicker(event.target) || isExtraInput(event.target)) busyUntil = Date.now() + 5000;
    }, { capture: true, passive: true });

    document.addEventListener("focusin", event => {
      if (isPicker(event.target) || isExtraInput(event.target)) busyUntil = Date.now() + 30000;
    }, true);

    document.addEventListener("input", event => {
      if (!isExtraInput(event.target)) return;
      busyUntil = Date.now() + 30000;
      rememberExtraInput(event.target);
    }, true);

    document.addEventListener("change", event => {
      const target = event.target;
      if (isPicker(target)) {
        busyUntil = Date.now() + 1800;
        const key = pickerKey(target.dataset.testSelect);
        if (target.value) pickerDrafts.set(key, target.value);
        else pickerDrafts.delete(key);
        applyOne(target);
        return;
      }
      if (isExtraInput(target)) {
        busyUntil = Date.now() + 1800;
        rememberExtraInput(target);
      }
    }, true);

    document.addEventListener("click", event => {
      const clearButton = event.target?.closest?.("[data-extra-clear]");
      if (clearButton) clearExtraDraftsForUnit(clearButton.dataset.extraClear || "");
    }, true);

    document.addEventListener("focusout", event => {
      if (isPicker(event.target) || isExtraInput(event.target)) busyUntil = Date.now() + 1800;
    }, true);

    const baseRenderDetail = window.renderDetail;
    window.renderDetail = function renderDetailWithStableTestInputs(...args) {
      const active = document.activeElement;
      const interacting = isPicker(active) || isExtraInput(active) || Date.now() < busyUntil;
      if (interacting) return;

      rememberVisibleChoices();
      document.querySelectorAll("[data-extra-dirty='1']").forEach(rememberExtraInput);
      const result = baseRenderDetail.apply(this, args);
      applyAll();
      return result;
    };

    const observer = new MutationObserver(() => queueMicrotask(applyAll));
    observer.observe(document.documentElement, { childList: true, subtree: true });
    applyAll();

    const markVersion = () => {
      const version = document.querySelector(".version");
      const html = "TEST · UT Lager v27.15 · INPUT/PICKER FIX<br>Oppdatert 08.08.2026 kl. 19:03";
      if (version && /UT Lager/i.test(version.textContent || "") && version.innerHTML !== html) version.innerHTML = html;
      try {
        if (parent.document.title !== "TEST — UT Lager v27.15") parent.document.title = "TEST — UT Lager v27.15";
      } catch {}
    };

    new MutationObserver(() => queueMicrotask(markVersion)).observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
    markVersion();
  }

  const startInteractionStability = () => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      installInteractionStability();
      if (window.__UT_TEST_INTERACTION_STABILITY__ || attempts >= 120) clearInterval(timer);
    }, 100);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startInteractionStability, { once: true });
  else startInteractionStability();

  window.BAMA_UT_TEST_API = {
    mode: "test",
    isolated: true,
    tables: { ...tableMap },
    rpcs: { ...rpcMap },
    version: "1.5.0",
    updatedAt: "2026-08-08T19:03:00+02:00",
  };
})();
