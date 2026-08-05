"use strict";

(() => {
  if (!document.getElementById("officeHomeSettingScript")) {
    const homeSetting = document.createElement("script");
    homeSetting.id = "officeHomeSettingScript";
    homeSetting.src = "office-home-setting.js?v=20260805-1725";
    document.body.appendChild(homeSetting);
  }

  const style = document.createElement("style");
  style.textContent = `
    .top-stock-line{
      display:grid;
      gap:10px;
      margin:10px 0 13px;
    }
    .top-stock-item{
      display:grid;
      grid-template-columns:minmax(125px,.7fr) minmax(0,1.3fr);
      align-items:center;
      gap:16px;
      min-height:68px;
      padding:15px 20px;
      border:2px solid var(--line);
      border-radius:16px;
      background:var(--dark);
      color:var(--text);
      font-size:20px;
      font-weight:950;
      line-height:1.25;
    }
    .top-stock-item:first-child{
      border-color:var(--accent);
      box-shadow:0 0 0 2px rgba(244,196,48,.09);
    }
    .top-stock-item strong{
      color:var(--accent);
      font-size:22px;
      text-align:left;
    }
    .top-stock-value{
      text-align:right;
      color:var(--text);
      font-size:21px;
      font-weight:950;
    }
    .top-stock-line.loading .top-stock-item{color:var(--muted)}
    .top-stock-line.loading .top-stock-item strong{color:var(--muted)}
    .top-stock-line.error .top-stock-item{
      border-color:rgba(255,115,115,.55);
      color:var(--bad);
    }
    @media(max-width:560px){
      .top-stock-item{
        grid-template-columns:minmax(100px,.75fr) minmax(0,1.25fr);
        gap:10px;
        min-height:58px;
        padding:12px 14px;
        font-size:16px;
      }
      .top-stock-item strong{font-size:17px}
      .top-stock-value{font-size:16px}
    }
  `;
  document.head.appendChild(style);

  const line = document.getElementById("topStockLine");
  if (!line) return;

  function setRow(id, label, value) {
    const row = document.getElementById(id);
    if (!row) return;
    row.innerHTML = `<strong>${label}</strong><span class="top-stock-value">${value}</span>`;
  }

  function setLoading() {
    line.className = "top-stock-line loading";
    setRow("topStockBunner", "Bunner", "Laster…");
    setRow("topStockH30", "Hyller x30", "Laster…");
    setRow("topStockH60", "Hyller x60", "Laster…");
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
      setRow("topStockBunner", "Bunner", `${bunner} ${bunner === 1 ? "stabel" : "stabler"} × 10 = ${bunner * 10} stk.`);
      setRow("topStockH30", "Hyller x30", `${h30} sett = ${h30 * 30} hyller`);
      setRow("topStockH60", "Hyller x60", `${h60} sett = ${h60 * 60} hyller`);
    } catch (error) {
      line.className = "top-stock-line error";
      setRow("topStockBunner", "Lagerstatus", "Data ikke tilgjengelig");
      setRow("topStockH30", "Hyller x30", "—");
      setRow("topStockH60", "Hyller x60", "—");
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
