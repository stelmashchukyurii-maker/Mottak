"use strict";

(() => {
  const lowerInput = document.getElementById("lowerInput");
  const upperInput = document.getElementById("upperInput");
  const reserveButton = document.getElementById("reserveButton");
  const pair = reserveButton?.closest(".pair");

  if (!lowerInput || !reserveButton || !pair || document.getElementById("utAllowedNumberSelect")) return;

  const style = document.createElement("style");
  style.textContent = `
    .pair{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr) auto!important}
    #utAllowedNumberSelect{min-height:48px;font-family:Consolas,monospace;font-weight:850}
    .ut-picker-help{grid-column:1/-1;margin-top:-1px;color:var(--warn);font-size:10px;line-height:1.35}
    @media(max-width:670px){.pair{grid-template-columns:1fr!important}.ut-picker-help{grid-column:auto}}
  `;
  document.head.appendChild(style);

  const select = document.createElement("select");
  select.id = "utAllowedNumberSelect";
  select.setAttribute("aria-label", "Вибрати допустимий товар для цієї рампи");
  pair.insertBefore(select, lowerInput);

  const help = document.createElement("div");
  help.className = "ut-picker-help";
  help.textContent = "Тимчасово для тесту: список містить лише доступні товари, яких ще не вистачає. Перше резервування автоматично запускає нову рампу в роботу.";
  pair.appendChild(help);

  const originalReserve = reserveButton.onclick;
  let fillingFromSelect = false;
  let starting = false;

  const cleanLower = value => String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

  function allowedProducts() {
    const order = current();
    if (!order) return new Set();

    const requested = requestQty(order);
    const scanned = scanQty();
    const allowed = new Set();

    if (scanned.b < requested.b) allowed.add("bunner");
    if (scanned.h30 < requested.h30) allowed.add("hyller30");
    if (scanned.h60 < requested.h60) allowed.add("hyller60");
    return allowed;
  }

  function canSelectNow() {
    const order = current();
    return Boolean(
      order &&
      (order.test_state || "active") === "active" &&
      ["new", "received", "in_progress", "problem"].includes(order.status)
    );
  }

  async function ensureRampStarted() {
    const order = current();
    if (!order) throw new Error("Рампу не відкрито.");
    if (order.status !== "new") return;
    if (starting) throw new Error("Рампа вже запускається. Зачекайте одну секунду.");

    starting = true;
    message("scanMessage", "Перше резервування: автоматично запускаємо всю рампу в роботу…", "warn");
    try {
      const now = new Date().toISOString();
      await patchOrder({
        status: "in_progress",
        received_at: order.received_at || now,
        started_at: now
      });
      message("scanMessage", "Рампу запущено. Резервуємо вибраний товар…", "ok");
    } finally {
      starting = false;
    }
  }

  function availableRows() {
    const allowed = allowedProducts();
    return stockRows
      .filter(row =>
        allowed.has(row.product) &&
        (row.stock_status || "in_stock") === "in_stock" &&
        /^[A-Z0-9]{6}$/.test(cleanLower(row.lower_number))
      )
      .sort((a, b) => {
        const productCompare = String(productNames[a.product] || a.product)
          .localeCompare(String(productNames[b.product] || b.product), "nb");
        if (productCompare) return productCompare;
        return cleanLower(a.lower_number).localeCompare(cleanLower(b.lower_number), "nb", { numeric: true });
      });
  }

  function optionLabel(row) {
    const product = productNames[row.product] || row.product;
    const number = cleanLower(row.lower_number);
    const epc = norm(row.scanner_code);
    return `${product} · ${number}${epc ? ` · EPC …${epc.slice(-8)}` : ""}`;
  }

  function refreshOptions() {
    const previous = select.value;
    const rows = availableRows();

    select.innerHTML = `<option value="">Вибрати допустимий номер · ${rows.length} доступно</option>` +
      rows.map(row => `<option value="${esc(row.id)}">${esc(optionLabel(row))}</option>`).join("");

    if (previous && rows.some(row => String(row.id) === String(previous))) {
      select.value = previous;
    }

    select.disabled = !canSelectNow() || rows.length === 0;
  }

  select.addEventListener("change", () => {
    const row = stockRows.find(item => String(item.id) === String(select.value));
    if (!row) {
      lowerInput.value = "";
      return;
    }

    fillingFromSelect = true;
    lowerInput.value = cleanLower(row.lower_number);
    lowerInput.dispatchEvent(new Event("input", { bubbles: true }));
    fillingFromSelect = false;
    message("scanMessage", `${productNames[row.product] || row.product} · ${cleanLower(row.lower_number)} вибрано зі списку. Натисніть «Знайти та зарезервувати».`, "ok");
  });

  lowerInput.addEventListener("input", () => {
    if (!fillingFromSelect && select.value) select.value = "";
  });

  reserveButton.onclick = async event => {
    try {
      await ensureRampStarted();

      if (!select.value) {
        if (typeof originalReserve === "function") return await originalReserve.call(reserveButton, event);
        return;
      }

      const row = stockRows.find(item =>
        String(item.id) === String(select.value) &&
        (item.stock_status || "in_stock") === "in_stock"
      );

      if (!row) {
        message("scanMessage", "Вибраний товар уже недоступний. Список оновлено.", "bad");
        lowerInput.value = "";
        refreshOptions();
        return;
      }

      await reserveKnownRow(row);
      select.value = "";
      lowerInput.value = "";
      refreshOptions();
    } catch (error) {
      message("scanMessage", error.message || String(error), "bad");
      renderDetail();
    }
  };

  const originalRenderDetail = renderDetail;
  renderDetail = function renderDetailWithAllowedPicker() {
    originalRenderDetail();
    refreshOptions();

    const order = current();
    const allowFirstReservation = Boolean(
      order &&
      (order.test_state || "active") === "active" &&
      order.status === "new"
    );

    if (allowFirstReservation) {
      lowerInput.disabled = false;
      if (upperInput) upperInput.disabled = false;
      reserveButton.disabled = false;
      message("scanMessage", "Нова рампа: перше резервування автоматично запустить її в роботу.", "ok");
    }
  };

  refreshOptions();
})();
