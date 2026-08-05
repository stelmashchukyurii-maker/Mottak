"use strict";

(() => {
  const style = document.createElement("style");
  style.textContent = `
    .top-stock-line{
      display:flex;
      align-items:center;
      gap:0;
      margin:7px 0 9px;
      border:1px solid var(--line);
      border-radius:13px;
      background:var(--dark);
      overflow-x:auto;
      white-space:nowrap;
      scrollbar-width:thin;
    }
    .top-stock-item{
      flex:1 0 auto;
      min-width:max-content;
      padding:10px 14px;
      font-size:14px;
      font-weight:950;
      text-align:center;
      color:var(--text);
    }
    .top-stock-item + .top-stock-item{border-left:1px solid var(--line)}
    .top-stock-item strong{color:var(--accent)}
    .top-stock-line.loading .top-stock-item{color:var(--muted)}
    .top-stock-line.error{border-color:rgba(255,115,115,.55)}
    .top-stock-line.error .top-stock-item{color:var(--bad)}
    @media(max-width:560px){
      .top-stock-item{padding:9px 11px;font-size:12px}
    }
  `;
  document.head.appendChild(style);

  const line = document.getElementById("topStockLine");
  if (!line) return;

  function setLoading() {
    line.className = "top-stock-line loading";
    document.getElementById("topStockBunner").textContent = "Bunner: laster…";
    document.getElementById("topStockH30").textContent = "Hyller x30: laster…";
    document.getElementById("topStockH60").textContent = "Hyller x60: laster…";
  }

  async function loadTopStock() {
    setLoading();
    try {
      const rows = await request("mottak_scans?select=product,status,stock_status&limit=10000") || [];
      const available = rows.filter((row) =>
        row.status === "verified" && (row.stock_status || "in_stock") === "in_stock"
      );
      const bunner = available.filter((row) => row.product === "bunner").length;
      const h30 = available.filter((row) => row.product === "hyller30").length;
      const h60 = available.filter((row) => row.product === "hyller60").length;

      line.className = "top-stock-line";
      document.getElementById("topStockBunner").innerHTML = `<strong>Bunner:</strong> ${bunner} ${bunner === 1 ? "stabel" : "stabler"}`;
      document.getElementById("topStockH30").innerHTML = `<strong>Hyller x30:</strong> ${h30} sett`;
      document.getElementById("topStockH60").innerHTML = `<strong>Hyller x60:</strong> ${h60} sett`;
    } catch (error) {
      line.className = "top-stock-line error";
      document.getElementById("topStockBunner").textContent = "Lagerdata ikke tilgjengelig";
      document.getElementById("topStockH30").textContent = "";
      document.getElementById("topStockH60").textContent = "";
    }
  }

  loadTopStock();
  setInterval(() => {
    if (!document.hidden) loadTopStock();
  }, 10000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loadTopStock();
  });
})();
