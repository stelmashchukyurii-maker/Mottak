"use strict";

(() => {
  const VERSION = "UT Kontor v24 LAGER-RAMPE-SENDT<br>Oppdatert 07.08.2026 kl. 10:24";

  function applyVersion() {
    const node = document.querySelector(".version");
    if (node) node.innerHTML = VERSION;
  }

  // Completed and stornert orders are history, never active work.
  if (typeof active === "function") {
    active = function officeActive(order) {
      return !["completed", "cancelled"].includes(order?.status);
    };
  }

  // Simple visible workflow. Technical statuses can stay in the database.
  if (typeof statusLabel === "function") {
    statusLabel = function officeStatusLabel(order) {
      if (order?.status === "new") return "Ny";
      if (["received", "in_progress"].includes(order?.status)) return "I arbeid";
      if (order?.status === "staged") return "På rampe";
      if (order?.status === "completed") return "Sendt";
      if (order?.status === "cancelled") return "Stornert";
      if (order?.status === "problem") return "Problem";
      return order?.status || "Ukjent";
    };
  }

  async function refreshVisibleWarehouse() {
    const line = document.getElementById("topStockLine");
    if (!line || typeof request !== "function") return;
    try {
      const rows = await request("mottak_scans?select=product,status,stock_status&limit=10000") || [];
      // reserved is still physically in the warehouse; staged is already on the ramp.
      const warehouse = rows.filter((row) =>
        row.status === "verified" && ["in_stock", "reserved"].includes(row.stock_status || "in_stock")
      );
      const count = (product) => warehouse.filter((row) => row.product === product).length;
      const b = count("bunner"), h30 = count("hyller30"), h60 = count("hyller60");
      const setRow = (id, label, value) => {
        const row = document.getElementById(id);
        if (row) row.innerHTML = `<strong>${label}</strong><span class="top-stock-value">${value}</span>`;
      };
      line.className = "top-stock-line";
      setRow("topStockBunner", "Bunner", `${b} ${b === 1 ? "stabel" : "stabler"} × 10 = ${b * 10} stk.`);
      setRow("topStockH30", "Hyller x30", `${h30} sett = ${h30 * 30} hyller`);
      setRow("topStockH60", "Hyller x60", `${h60} sett = ${h60 * 60} hyller`);
    } catch {
      // Existing connection/error UI handles errors.
    }
  }

  applyVersion();
  if (typeof renderHistory === "function") renderHistory();
  refreshVisibleWarehouse();
  setTimeout(() => {
    applyVersion();
    if (typeof renderHistory === "function") renderHistory();
    refreshVisibleWarehouse();
  }, 500);
})();
