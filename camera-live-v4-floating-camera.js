(() => {
  "use strict";

  const PANEL_ID = "bama-floating-camera";
  const STYLE_ID = "bama-floating-camera-style";
  const COLLAPSED_KEY = "bama_camera_floating_collapsed_v1";

  const PRODUCT_LABELS = {
    bunner: "B",
    hyller30: "H-30",
    hyller60: "H-60"
  };

  const PRODUCT_NAMES = {
    bunner: "Bunner",
    hyller30: "Hyller x30",
    hyller60: "Hyller x60"
  };

  function findProductButtons() {
    return [...document.querySelectorAll("#products [data-product], [data-product]")]
      .filter(button => PRODUCT_LABELS[button.dataset.product]);
  }

  function findCurrentProduct(buttons) {
    const active = buttons.find(button =>
      button.classList.contains("active") ||
      button.getAttribute("aria-pressed") === "true"
    );

    if (active?.dataset.product && PRODUCT_LABELS[active.dataset.product]) {
      return active.dataset.product;
    }

    const savedKeys = [
      "camera_live_product",
      "camera_live_v4_product",
      "ai_scanner_mottak_v2_selected_product"
    ];

    for (const key of savedKeys) {
      const saved = localStorage.getItem(key);
      if (PRODUCT_LABELS[saved]) return saved;
    }

    return "bunner";
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        right: max(12px, env(safe-area-inset-right));
        bottom: calc(12px + env(safe-area-inset-bottom));
        z-index: 2147483000;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
        font-family: Arial, Helvetica, sans-serif;
        pointer-events: none;
      }

      #${PANEL_ID} * {
        box-sizing: border-box;
      }

      #${PANEL_ID} button {
        pointer-events: auto;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      #${PANEL_ID} .bama-floating-options {
        display: grid;
        grid-template-columns: repeat(3, minmax(58px, 1fr));
        gap: 7px;
        width: min(292px, calc(100vw - 24px));
        padding: 9px;
        border: 2px solid #f4c430;
        border-radius: 16px;
        background: rgba(13, 20, 38, 0.97);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.48);
        backdrop-filter: blur(10px);
        transform-origin: right bottom;
      }

      #${PANEL_ID} .bama-floating-options[hidden] {
        display: none;
      }

      #${PANEL_ID} .bama-option {
        min-height: 48px;
        padding: 9px 8px;
        border: 2px solid #303b59;
        border-radius: 12px;
        background: #151c30;
        color: #f5f7ff;
        font-size: 15px;
        font-weight: 900;
        cursor: pointer;
      }

      #${PANEL_ID} .bama-option.active {
        border-color: #48d597;
        background: #0f3427;
        color: #ffffff;
        box-shadow: 0 0 0 3px rgba(72, 213, 151, 0.18);
      }

      #${PANEL_ID} .bama-floating-bar {
        display: grid;
        grid-template-columns: auto minmax(126px, auto) auto;
        align-items: stretch;
        gap: 7px;
        padding: 7px;
        border: 2px solid #f4c430;
        border-radius: 18px;
        background: rgba(13, 20, 38, 0.96);
        box-shadow: 0 12px 34px rgba(0, 0, 0, 0.52);
        backdrop-filter: blur(12px);
        pointer-events: auto;
        transition: transform 0.18s ease, opacity 0.18s ease;
      }

      #${PANEL_ID} .bama-product-button,
      #${PANEL_ID} .bama-photo-button,
      #${PANEL_ID} .bama-collapse-button {
        border: 0;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 900;
      }

      #${PANEL_ID} .bama-product-button {
        min-width: 68px;
        min-height: 58px;
        padding: 8px 10px;
        background: #48d597;
        color: #062418;
        font-size: 20px;
        letter-spacing: 0.02em;
      }

      #${PANEL_ID}[data-product="hyller30"] .bama-product-button {
        background: #75b7ff;
        color: #071a2e;
      }

      #${PANEL_ID}[data-product="hyller60"] .bama-product-button {
        background: #c49bff;
        color: #201032;
      }

      #${PANEL_ID} .bama-photo-button {
        min-height: 58px;
        padding: 9px 18px;
        background: #f4c430;
        color: #17130a;
        font-size: 20px;
        white-space: nowrap;
        box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.18);
      }

      #${PANEL_ID} .bama-photo-button:active,
      #${PANEL_ID} .bama-product-button:active,
      #${PANEL_ID} .bama-option:active {
        transform: scale(0.96);
      }

      #${PANEL_ID} .bama-collapse-button {
        width: 42px;
        min-height: 58px;
        padding: 0;
        border: 1px solid #303b59;
        background: #151c30;
        color: #f5f7ff;
        font-size: 20px;
      }

      #${PANEL_ID}.collapsed .bama-floating-options {
        display: none;
      }

      #${PANEL_ID}.collapsed .bama-floating-bar {
        grid-template-columns: auto auto auto;
        gap: 5px;
        padding: 5px;
        border-radius: 16px;
      }

      #${PANEL_ID}.collapsed .bama-product-button {
        min-width: 48px;
        min-height: 48px;
        padding: 5px 7px;
        font-size: 15px;
      }

      #${PANEL_ID}.collapsed .bama-photo-button {
        min-width: 54px;
        min-height: 48px;
        padding: 5px 10px;
        font-size: 0;
      }

      #${PANEL_ID}.collapsed .bama-photo-button::before {
        content: "📷";
        font-size: 23px;
      }

      #${PANEL_ID}.collapsed .bama-collapse-button {
        width: 36px;
        min-height: 48px;
        font-size: 17px;
      }

      @media (max-width: 390px) {
        #${PANEL_ID} .bama-floating-bar {
          grid-template-columns: auto minmax(108px, auto) auto;
        }

        #${PANEL_ID} .bama-product-button {
          min-width: 60px;
        }

        #${PANEL_ID} .bama-photo-button {
          padding-inline: 12px;
          font-size: 18px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function start(attempt = 0) {
    if (document.getElementById(PANEL_ID)) return;

    const photoInput = document.getElementById("photoInput");
    const productButtons = findProductButtons();

    if (!photoInput || productButtons.length === 0) {
      if (attempt < 30) setTimeout(() => start(attempt + 1), 200);
      return;
    }

    addStyles();

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.classList.toggle("collapsed", localStorage.getItem(COLLAPSED_KEY) === "1");
    panel.innerHTML = `
      <div class="bama-floating-options" hidden aria-label="Velg produkt">
        <button class="bama-option" type="button" data-floating-product="bunner">B</button>
        <button class="bama-option" type="button" data-floating-product="hyller30">H-30</button>
        <button class="bama-option" type="button" data-floating-product="hyller60">H-60</button>
      </div>
      <div class="bama-floating-bar">
        <button class="bama-product-button" type="button" aria-label="Velg produkt" aria-expanded="false">B</button>
        <button class="bama-photo-button" type="button" aria-label="Ta bilde">📷 FOTO</button>
        <button class="bama-collapse-button" type="button" aria-label="Minimer flytende kameraknapp">−</button>
      </div>
    `;

    document.body.appendChild(panel);

    const options = panel.querySelector(".bama-floating-options");
    const productButton = panel.querySelector(".bama-product-button");
    const photoButton = panel.querySelector(".bama-photo-button");
    const collapseButton = panel.querySelector(".bama-collapse-button");

    function syncProduct() {
      const currentProduct = findCurrentProduct(productButtons);
      panel.dataset.product = currentProduct;
      productButton.textContent = PRODUCT_LABELS[currentProduct];
      productButton.title = PRODUCT_NAMES[currentProduct];
      productButton.setAttribute("aria-label", `Valgt produkt: ${PRODUCT_NAMES[currentProduct]}. Trykk for å endre.`);

      panel.querySelectorAll("[data-floating-product]").forEach(button => {
        const active = button.dataset.floatingProduct === currentProduct;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    function closeOptions() {
      options.hidden = true;
      productButton.setAttribute("aria-expanded", "false");
    }

    function updateCollapsedUi() {
      const collapsed = panel.classList.contains("collapsed");
      collapseButton.textContent = collapsed ? "↗" : "−";
      collapseButton.setAttribute(
        "aria-label",
        collapsed ? "Utvid flytende kameraknapp" : "Minimer flytende kameraknapp"
      );
      if (collapsed) closeOptions();
    }

    productButton.addEventListener("click", event => {
      event.stopPropagation();
      if (panel.classList.contains("collapsed")) {
        panel.classList.remove("collapsed");
        localStorage.setItem(COLLAPSED_KEY, "0");
        updateCollapsedUi();
        return;
      }

      options.hidden = !options.hidden;
      productButton.setAttribute("aria-expanded", options.hidden ? "false" : "true");
    });

    options.addEventListener("click", event => {
      const option = event.target.closest("[data-floating-product]");
      if (!option) return;

      const targetProduct = option.dataset.floatingProduct;
      const originalButton = productButtons.find(button => button.dataset.product === targetProduct);
      originalButton?.click();
      closeOptions();
      setTimeout(syncProduct, 50);
    });

    photoButton.addEventListener("click", () => {
      closeOptions();
      if (navigator.vibrate) navigator.vibrate(25);
      photoInput.click();
    });

    collapseButton.addEventListener("click", () => {
      const collapsed = !panel.classList.contains("collapsed");
      panel.classList.toggle("collapsed", collapsed);
      localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
      updateCollapsedUi();
    });

    document.addEventListener("click", event => {
      if (!panel.contains(event.target)) closeOptions();
    });

    productButtons.forEach(button => {
      button.addEventListener("click", () => setTimeout(syncProduct, 50));
    });

    const productsContainer = document.getElementById("products");
    if (productsContainer) {
      const observer = new MutationObserver(syncProduct);
      observer.observe(productsContainer, {
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "aria-pressed"]
      });
    }

    window.addEventListener("storage", syncProduct);
    syncProduct();
    updateCollapsedUi();
  }

  start();
})();
