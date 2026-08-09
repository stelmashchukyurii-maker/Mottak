"use strict";

(() => {
  // Disable any cached v1 compact counter that may still be referenced by bestilling.html.
  window.__BAMA_COMPACT_STOCK_COUNTER__ = true;
  if (!document.querySelector('script[data-bama-compact-stock-v2]')) {
    const safeCounter = document.createElement("script");
    safeCounter.src = "compact-stock-counter-v2.js?v=20260809-0912";
    safeCounter.dataset.bamaCompactStockV2 = "true";
    document.body.appendChild(safeCounter);
  }

  const get = (id) => document.getElementById(id);

  if (typeof payload === "function") {
    const basePayload = payload;
    payload = function payloadWithPartyFields(includeCreate = false) {
      const data = basePayload(includeCreate);
      data.recipient = get("mottaker")?.value.trim() || null;
      data.transporter = get("transporter")?.value.trim() || null;
      return data;
    };
  }

  if (typeof startEdit === "function") {
    const baseStartEdit = startEdit;
    startEdit = function startEditWithPartyFields(id) {
      baseStartEdit(id);
      const order = Array.isArray(orders) ? orders.find((item) => String(item.id) === String(id)) : null;
      if (get("mottaker")) get("mottaker").value = order?.recipient || "";
      if (get("transporter")) get("transporter").value = order?.transporter || "";
    };
  }

  if (typeof clearForm === "function") {
    const baseClearForm = clearForm;
    clearForm = function clearFormWithPartyFields(focus = true, keepReceipt = false) {
      baseClearForm(focus, keepReceipt);
      if (get("mottaker")) get("mottaker").value = "";
      if (get("transporter")) get("transporter").value = "";
    };
  }

  // WORKING and GREEN now use the same central product registry and the same
  // extra-product order module. GREEN already exposes BAMA_PRODUCTS from its parent;
  // direct WORKING loads products.js here when needed.
  if (!window.__BAMA_WORKING_PRODUCTS_BOOTSTRAP__) {
    window.__BAMA_WORKING_PRODUCTS_BOOTSTRAP__ = true;
    const BUILD = "20260809-0912";
    const topLevelWorking = window.top === window;

    function scrubWorkingLabels(root = document.body) {
      if (!topLevelWorking || !root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((node) => {
        if (node.nodeValue?.includes("TEST")) node.nodeValue = node.nodeValue.replaceAll("TEST", "WORKING");
      });
      const version = document.querySelector(".version");
      if (version) version.innerHTML = "UT Kontor WORKING · EXTRA PRODUCTS<br>Oppdatert 09.08.2026 kl. 09:12";
    }

    if (topLevelWorking) {
      new MutationObserver(() => scrubWorkingLabels()).observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    function loadExtraModule() {
      if (window.__BAMA_UT_KONTOR_PRODUCTS__ || document.querySelector('script[data-bama-ut-products]')) {
        scrubWorkingLabels();
        return;
      }
      const script = document.createElement("script");
      script.src = `ut-kontor-products.js?v=${BUILD}`;
      script.dataset.bamaUtProducts = "1";
      script.onload = () => {
        scrubWorkingLabels();
        setTimeout(scrubWorkingLabels, 300);
        setTimeout(scrubWorkingLabels, 1000);
      };
      script.onerror = () => console.error("[UT Kontor] Could not load extra products module.");
      document.body.appendChild(script);
    }

    function ensureRegistry() {
      const registry = window.parent?.BAMA_PRODUCTS || window.BAMA_PRODUCTS;
      if (registry) {
        loadExtraModule();
        return;
      }
      if (document.querySelector('script[data-bama-products-registry]')) return;
      const script = document.createElement("script");
      script.src = `products.js?v=${BUILD}`;
      script.dataset.bamaProductsRegistry = "1";
      script.onload = loadExtraModule;
      script.onerror = () => console.error("[UT Kontor] Could not load products.js.");
      document.head.appendChild(script);
    }

    ensureRegistry();
  }
})();