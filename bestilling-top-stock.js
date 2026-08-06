"use strict";

(() => {
  if (!document.getElementById("officeHomeSettingScript")) {
    const homeSetting = document.createElement("script");
    homeSetting.id = "officeHomeSettingScript";
    homeSetting.src = "office-home-setting.js?v=20260806-0722";
    document.body.appendChild(homeSetting);
  }

  const TARGET_VERSION = "UT Kontor v23 STABIL<br>Oppdatert 06.08.2026 kl. 07:22";
  const version = document.querySelector(".version");
  const applyVersion = () => {
    const node = document.querySelector(".version");
    if (node && node.innerHTML !== TARGET_VERSION) node.innerHTML = TARGET_VERSION;
  };
  applyVersion();

  document.querySelectorAll(".ramp-product-head small").forEach((small) => small.remove());

  const style = document.createElement("style");
  style.textContent = `
    html,body{max-width:100%;overflow-x:hidden}
    body{width:100%}
    .app{width:min(820px,100%);max-width:100%;overflow-x:hidden}
    h1{max-width:100%;overflow-wrap:anywhere}

    .top-stock-line{
      display:grid;
      gap:10px;
      width:100%;
      max-width:100%;
      min-width:0;
      margin:10px 0 13px;
    }
    .top-stock-item{
      display:grid;
      grid-template-columns:minmax(0,.72fr) minmax(0,1.28fr);
      align-items:center;
      gap:12px;
      width:100%;
      max-width:100%;
      min-width:0;
      min-height:68px;
      padding:15px 18px;
      overflow:hidden;
      border:2px solid var(--line);
      border-radius:16px;
      background:var(--dark);
      color:var(--text);
      font-size:22px;
      font-weight:950;
      line-height:1.18;
    }
    .top-stock-item:first-child{
      border-color:var(--accent);
      box-shadow:0 0 0 2px rgba(244,196,48,.09);
    }
    .top-stock-item strong{
      min-width:0;
      max-width:100%;
      color:var(--accent);
      font-size:25px;
      font-weight:950;
      letter-spacing:-.025em;
      text-align:left;
      text-shadow:0 1px 0 rgba(0,0,0,.8),0 0 12px rgba(244,196,48,.12);
    }
    .top-stock-value{
      min-width:0;
      max-width:100%;
      text-align:right;
      color:var(--text);
      font-size:22px;
      font-weight:950;
      line-height:1.15;
      letter-spacing:-.025em;
      white-space:normal;
      overflow-wrap:anywhere;
      text-shadow:0 1px 0 rgba(0,0,0,.85);
    }
    .top-stock-line.loading .top-stock-item{color:var(--muted)}
    .top-stock-line.loading .top-stock-item strong{color:var(--muted)}
    .top-stock-line.error .top-stock-item{
      border-color:rgba(255,115,115,.55);
      color:var(--bad);
    }

    .ramp-products{gap:13px}
    .ramp-product{
      padding:16px 14px;
      border-width:2px;
      box-shadow:0 10px 22px rgba(0,0,0,.18);
    }
    .ramp-product-head{
      display:grid!important;
      grid-template-columns:minmax(0,1fr)!important;
      gap:11px!important;
      align-items:start!important;
      margin-bottom:15px!important;
    }
    .ramp-product-head>div{min-width:0}
    .ramp-product-head small{display:none!important}
    .ramp-product-head strong{
      display:block;
      color:var(--accent);
      font-size:clamp(26px,6.5vw,34px)!important;
      font-weight:950!important;
      line-height:1.05;
      letter-spacing:-.025em;
      text-shadow:0 1px 0 #000,0 0 14px rgba(244,196,48,.12);
    }
    .ramp-product-head output.stock-balance{
      display:grid!important;
      gap:8px!important;
      width:100%!important;
      min-width:0!important;
      margin:0!important;
      text-align:left!important;
      line-height:1.25!important;
    }
    .stock-balance span{
      display:block;
      width:100%;
      min-width:0;
      padding:9px 11px;
      border:1px solid rgba(48,59,89,.95);
      border-radius:11px;
      background:#070b14;
      overflow-wrap:anywhere;
    }
    .stock-balance .stock-now{
      color:var(--text)!important;
      font-size:clamp(16px,4.4vw,20px)!important;
      font-weight:950!important;
    }
    .stock-balance .stock-demand{
      color:#d8deef!important;
      font-size:clamp(16px,4.35vw,20px)!important;
      font-weight:900!important;
    }
    .stock-balance .stock-after{
      color:var(--ok)!important;
      border-color:rgba(72,213,151,.55);
      background:rgba(72,213,151,.07);
      font-size:clamp(17px,4.55vw,21px)!important;
      font-weight:950!important;
    }
    .stock-balance .stock-after.warn{
      color:var(--bad)!important;
      border-color:rgba(255,115,115,.62);
      background:rgba(255,115,115,.09);
    }

    .qty.compact{grid-template-columns:64px minmax(0,1fr) 64px;gap:9px}
    .qty.compact input{
      min-width:0;
      min-height:58px;
      font-size:34px!important;
      font-weight:950!important;
    }
    .qty.compact .step{
      min-height:58px;
      font-size:38px!important;
      line-height:1;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.04);
    }
    .quick{gap:8px;margin-top:10px}
    .quick button{
      min-width:0;
      min-height:46px!important;
      font-size:20px!important;
      font-weight:950!important;
      border-width:2px!important;
    }

    #ramp{
      width:100%;
      min-height:60px;
      padding:12px 46px 12px 15px;
      border:3px solid var(--line);
      border-radius:15px;
      background-color:var(--dark);
      color:var(--text);
      font:950 20px/1.2 Arial,Helvetica,sans-serif;
      outline:none;
      transition:border-color .2s,box-shadow .2s,background-color .2s;
    }
    #ramp option{background:#0d1426;color:#f5f7ff}
    #ramp.ramp-awaiting{
      border-color:var(--accent);
      background:linear-gradient(90deg,rgba(244,196,48,.16),rgba(13,20,38,.98));
      box-shadow:0 0 0 4px rgba(244,196,48,.14),0 0 22px rgba(244,196,48,.34);
      animation:rampAttention 1.35s ease-in-out infinite;
    }
    #ramp.ramp-selected{
      border-color:var(--ok);
      background:linear-gradient(90deg,rgba(72,213,151,.14),rgba(13,20,38,.98));
      box-shadow:0 0 0 3px rgba(72,213,151,.12);
      animation:none;
    }
    #ramp:focus{box-shadow:0 0 0 5px rgba(244,196,48,.18),0 0 24px rgba(244,196,48,.28)}
    @keyframes rampAttention{
      0%,100%{box-shadow:0 0 0 3px rgba(244,196,48,.10),0 0 12px rgba(244,196,48,.18)}
      50%{box-shadow:0 0 0 6px rgba(244,196,48,.20),0 0 28px rgba(244,196,48,.48)}
    }
    @media(prefers-reduced-motion:reduce){#ramp.ramp-awaiting{animation:none}}

    @media(max-width:560px){
      .app{padding-left:10px;padding-right:10px}
      .top-stock-item{
        grid-template-columns:minmax(0,.66fr) minmax(0,1.34fr);
        gap:7px;
        min-height:58px;
        padding:12px;
        font-size:18px;
      }
      .top-stock-item strong{font-size:19px;letter-spacing:-.035em}
      .top-stock-value{font-size:16px;line-height:1.16;letter-spacing:-.025em}
      .ramp-product{padding:15px 12px}
      .ramp-product-head strong{font-size:29px!important}
      .stock-balance .stock-now,.stock-balance .stock-demand{font-size:17px!important}
      .stock-balance .stock-after{font-size:18px!important}
      .qty.compact{grid-template-columns:58px minmax(0,1fr) 58px}
      .qty.compact input{font-size:32px!important}
      .quick button{font-size:19px!important}
      #ramp{min-height:58px;font-size:18px}
    }
  `;
  document.head.appendChild(style);

  const rampSelect = document.getElementById("ramp");
  if (rampSelect) {
    const syncRampHighlight = () => {
      const selected = Boolean(rampSelect.value);
      rampSelect.classList.toggle("ramp-awaiting", !selected);
      rampSelect.classList.toggle("ramp-selected", selected);
      rampSelect.setAttribute("aria-invalid", selected ? "false" : "true");
    };
    rampSelect.addEventListener("change", syncRampHighlight);
    rampSelect.addEventListener("input", syncRampHighlight);
    syncRampHighlight();
  }

  const versionObserver = new MutationObserver(applyVersion);
  if (version) versionObserver.observe(version, { childList: true, subtree: true, characterData: true });
  setTimeout(applyVersion, 300);
  setTimeout(applyVersion, 1000);
  setTimeout(applyVersion, 2500);

  const line = document.getElementById("topStockLine");
  if (!line || typeof request !== "function") return;

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
    } catch {
      line.className = "top-stock-line error";
      setRow("topStockBunner", "Lagerstatus", "Data ikke tilgjengelig");
      setRow("topStockH30", "Hyller x30", "—");
      setRow("topStockH60", "Hyller x60", "—");
    }
  }

  loadTopStock();
})();
