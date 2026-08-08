"use strict";

(() => {
  if (window.__BAMA_CAMERA_STOCK_FILTERS__) return;
  window.__BAMA_CAMERA_STOCK_FILTERS__ = true;

  const FILTERS = ["in_stock", "staged", "dispatched"];
  const PRODUCT_FILTERS = ["all", "bunner", "hyller30", "hyller60"];
  let activeStockFilter = "in_stock";
  let activeProductFilter = "all";

  const COPY = {
    nb: {
      in_stock: "På lager",
      staged: "På rampe",
      dispatched: "Sendt",
      empty: "Ingen poster med disse filtrene.",
      filtersTitle: "Lagerstatus",
      productFiltersTitle: "Produkt",
      allProducts: "Alle produkter",
      statusInStock: "På lager",
      statusStaged: "På rampe",
      statusDispatched: "Sendt"
    },
    pl: {
      in_stock: "Na magazynie",
      staged: "Na rampie",
      dispatched: "Wysłane",
      empty: "Brak wpisów dla wybranych filtrów.",
      filtersTitle: "Status magazynowy",
      productFiltersTitle: "Produkt",
      allProducts: "Wszystkie produkty",
      statusInStock: "Na magazynie",
      statusStaged: "Na rampie",
      statusDispatched: "Wysłane"
    },
    uk: {
      in_stock: "На складі",
      staged: "На рампі",
      dispatched: "Відправлено",
      empty: "Немає записів за вибраними фільтрами.",
      filtersTitle: "Складський статус",
      productFiltersTitle: "Продукт",
      allProducts: "Усі продукти",
      statusInStock: "На складі",
      statusStaged: "На рампі",
      statusDispatched: "Відправлено"
    }
  };

  const copy = () => COPY[language] || COPY.nb;
  const stockStatus = row => row.stock_status || "in_stock";

  const style = document.createElement("style");
  style.id = "cameraStockFiltersStyle";
  style.textContent = `
    th[data-t="upper"]{display:none!important}
    .camera-stock-filter-wrap{margin:12px 0;padding:11px;border:1px solid var(--line);border-radius:14px;background:var(--dark)}
    .camera-stock-filter-title,.camera-product-filter-title{margin:0 0 8px;color:var(--muted);font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
    .camera-product-filter-title{margin-top:12px}
    .camera-stock-filters{display:grid;grid-template-columns:repeat(3,minmax(125px,1fr));gap:7px;overflow-x:auto;padding-bottom:2px}
    .camera-product-filters{display:grid;grid-template-columns:repeat(4,minmax(125px,1fr));gap:7px;overflow-x:auto;padding-bottom:2px}
    .camera-stock-filter,.camera-product-filter{min-height:46px;padding:8px 9px;border:1px solid var(--line);border-radius:11px;background:#111a31;color:var(--text);font-size:12px;font-weight:900;white-space:nowrap}
    .camera-stock-filter strong,.camera-product-filter strong{display:inline-grid;place-items:center;min-width:23px;height:23px;margin-left:5px;padding:0 6px;border-radius:999px;background:rgba(255,255,255,.09);font-size:10px}
    .camera-stock-filter.active,.camera-product-filter.active{border-color:var(--accent);background:var(--accent);color:#17130a}
    .camera-stock-filter.active strong,.camera-product-filter.active strong{background:rgba(0,0,0,.16)}
    .stock-pill{display:inline-block;padding:6px 9px;border-radius:999px;font-size:11px;font-weight:950;white-space:nowrap}
    .stock-pill.in_stock{background:rgba(72,213,151,.18);color:#9bf0c6}
    .stock-pill.staged{background:rgba(244,196,48,.18);color:#ffe889}
    .stock-pill.dispatched{background:rgba(246,185,75,.18);color:#ffd991}
    .row-actions.camera-simple-actions{grid-template-columns:repeat(2,minmax(105px,1fr));min-width:225px}
    @media(max-width:760px){
      .camera-stock-filters{grid-template-columns:repeat(3,minmax(145px,1fr))}
      .camera-product-filters{grid-template-columns:repeat(4,minmax(145px,1fr))}
    }
  `;
  document.head.appendChild(style);

  function rowsForStatus(filter) {
    return rows.filter(row => stockStatus(row) === filter);
  }

  function matchesProduct(row, filter = activeProductFilter) {
    return filter === "all" || row.product === filter;
  }

  function filterCount(filter) {
    return rowsForStatus(filter).filter(row => matchesProduct(row)).length;
  }

  function productCount(filter) {
    const statusRows = rowsForStatus(activeStockFilter);
    return filter === "all" ? statusRows.length : statusRows.filter(row => row.product === filter).length;
  }

  function filteredRows() {
    return rowsForStatus(activeStockFilter).filter(row => matchesProduct(row));
  }

  function ensureFilters() {
    const tableWrap = document.querySelector("#tableBody")?.closest(".table-wrap");
    if (!tableWrap) return null;

    let wrap = document.getElementById("cameraStockFilterWrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "cameraStockFilterWrap";
      wrap.className = "camera-stock-filter-wrap";
      wrap.innerHTML = `
        <div class="camera-stock-filter-title"></div>
        <div class="camera-stock-filters"></div>
        <div class="camera-product-filter-title"></div>
        <div class="camera-product-filters"></div>
      `;
      tableWrap.insertAdjacentElement("beforebegin", wrap);
      wrap.addEventListener("click", event => {
        const stockButton = event.target.closest("[data-stock-filter]");
        if (stockButton) {
          activeStockFilter = FILTERS.includes(stockButton.dataset.stockFilter)
            ? stockButton.dataset.stockFilter
            : "in_stock";
          editingId = null;
          renderTable();
          return;
        }

        const productButton = event.target.closest("[data-product-filter]");
        if (productButton) {
          activeProductFilter = PRODUCT_FILTERS.includes(productButton.dataset.productFilter)
            ? productButton.dataset.productFilter
            : "all";
          editingId = null;
          renderTable();
        }
      });
    }

    const c = copy();
    wrap.querySelector(".camera-stock-filter-title").textContent = c.filtersTitle;
    wrap.querySelector(".camera-product-filter-title").textContent = c.productFiltersTitle;
    wrap.querySelector(".camera-stock-filters").innerHTML = FILTERS.map(filter => `
      <button class="camera-stock-filter${activeStockFilter === filter ? " active" : ""}" type="button" data-stock-filter="${filter}">
        ${esc(c[filter])}<strong>${filterCount(filter)}</strong>
      </button>
    `).join("");
    wrap.querySelector(".camera-product-filters").innerHTML = PRODUCT_FILTERS.map(filter => `
      <button class="camera-product-filter${activeProductFilter === filter ? " active" : ""}" type="button" data-product-filter="${filter}">
        ${esc(filter === "all" ? c.allProducts : PRODUCTS[filter] || filter)}<strong>${productCount(filter)}</strong>
      </button>
    `).join("");
    return wrap;
  }

  function stockPill(row) {
    const status = stockStatus(row);
    const c = copy();
    const label = status === "staged"
      ? c.statusStaged
      : status === "dispatched"
        ? c.statusDispatched
        : c.statusInStock;
    return `<span class="stock-pill ${esc(status)}">${esc(label)}</span>`;
  }

  renderNormalRow = function renderNormalStockRow(row) {
    return `<tr>
      <td>${row.photo_url
        ? `<a href="${esc(row.photo_url)}" target="_blank" rel="noopener"><img class="thumb" src="${esc(row.photo_url)}" loading="lazy" alt="Mottak"></a>`
        : `<div class="no-photo">${esc(t().noPhoto)}</div>`}</td>
      <td>${esc(new Date(row.created_at).toLocaleString())}</td>
      <td>${esc(PRODUCTS[row.product] || row.product || "—")}</td>
      <td class="mono">${esc(row.scanner_code || "—")}</td>
      <td class="mono">${esc(row.lower_number || "—")}</td>
      <td>${stockPill(row)}</td>
      <td>${esc(row.source || "—")}</td>
      <td><div class="row-actions camera-simple-actions">
        <button class="info" type="button" data-action="edit" data-id="${esc(row.id)}">${esc(t().edit)}</button>
        <button class="danger" type="button" data-action="delete" data-id="${esc(row.id)}" data-path="${esc(row.photo_path || "")}">${esc(t().delete)}</button>
      </div></td>
    </tr>`;
  };

  renderEditRow = function renderEditStockRow(row) {
    return `<tr class="editing" data-edit-row="${esc(row.id)}">
      <td>${row.photo_url
        ? `<a href="${esc(row.photo_url)}" target="_blank" rel="noopener"><img class="thumb" src="${esc(row.photo_url)}" loading="lazy" alt="Mottak"></a>`
        : `<div class="no-photo">${esc(t().noPhoto)}</div>`}</td>
      <td>${esc(new Date(row.created_at).toLocaleString())}</td>
      <td class="edit-cell"><select class="field" data-edit-field="product">${productOptions(row.product)}</select></td>
      <td class="edit-cell"><input class="field mono" data-edit-field="scanner_code" value="${esc(row.scanner_code || "")}" maxlength="100"></td>
      <td class="edit-cell">
        <input type="hidden" data-edit-field="upper_number" value="">
        <input class="field mono" data-edit-field="lower_number" value="${esc(row.lower_number || "")}" maxlength="6">
        <span class="edit-help">A-Z / 0-9</span>
      </td>
      <td>${stockPill(row)}</td>
      <td>${esc(row.source || "—")}</td>
      <td><div class="row-actions">
        <button class="success" type="button" data-action="save-edit" data-id="${esc(row.id)}">${esc(t().saveEdit)}</button>
        <button class="secondary" type="button" data-action="cancel-edit" data-id="${esc(row.id)}">${esc(t().cancel)}</button>
      </div></td>
    </tr>`;
  };

  const previousRenderCounts = renderCounts;

  renderTable = function renderStockTable() {
    const body = document.getElementById("tableBody");
    previousRenderCounts();
    ensureFilters();
    const visible = filteredRows();
    if (!visible.length) {
      body.innerHTML = `<tr><td class="empty" colspan="8">${esc(copy().empty)}</td></tr>`;
      return;
    }
    body.innerHTML = visible.map(row => row.id === editingId ? renderEditRow(row) : renderNormalRow(row)).join("");
  };

  loadTable = async function loadStockTable(showErrors = true) {
    const response = await client
      .from(TABLE)
      .select("id,created_at,product,scanner_code,upper_number,lower_number,status,stock_status,dispatched_at,source,device_id,photo_url,photo_path,confidence,raw_data")
      .order("created_at", { ascending: false })
      .limit(300);

    if (response.error) {
      if (showErrors) show(`${t().loadError}\n${response.error.message}`, "bad");
      return false;
    }

    rows = response.data || [];
    if (editingId && !rows.some(row => row.id === editingId)) editingId = null;
    renderTable();
    return true;
  };

  activeStockFilter = "in_stock";
  activeProductFilter = "all";
  loadTable(false);
  console.info("Camera stock filters active: På lager / På rampe / Sendt.");
})();
