"use strict";

(() => {
  if (window.__UT_CAMERA_MANUAL_TOGGLE__) return;
  window.__UT_CAMERA_MANUAL_TOGGLE__ = true;

  const PANEL_ID = "utFloatingWorkflow";
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;

  const bar = panel.querySelector(".ut-float-bar");
  const collapse = panel.querySelector(".ut-collapse");
  if (!bar || !collapse) return;

  const style = document.createElement("style");
  style.id = "utCameraManualToggleStyle";
  style.textContent = `
    #${PANEL_ID} .ut-float-bar{grid-template-columns:auto auto minmax(116px,auto) 44px auto!important}
    #${PANEL_ID} .ut-manual-toggle{width:44px;min-width:44px;min-height:56px;border:1px solid #303b59;border-radius:11px;background:#151c30;color:#f5f7ff;font-size:20px;font-weight:950;display:grid;place-items:center;pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    #${PANEL_ID} .ut-manual-toggle:active{transform:translateY(1px)}
    #${PANEL_ID}.collapsed .ut-float-bar{grid-template-columns:auto auto 44px auto!important}
    @media(max-width:390px){
      #${PANEL_ID} .ut-float-bar{grid-template-columns:auto 72px minmax(82px,auto) 42px auto!important;gap:4px!important}
      #${PANEL_ID} .ut-manual-toggle{width:42px;min-width:42px}
      #${PANEL_ID}.collapsed .ut-float-bar{grid-template-columns:auto auto 42px auto!important}
    }
  `;
  document.head.appendChild(style);

  const manual = document.createElement("button");
  manual.type = "button";
  manual.className = "ut-manual-toggle";
  manual.textContent = "⌨";
  manual.setAttribute("aria-label", "Manuell registrering");
  manual.title = "Manuell registrering";
  bar.insertBefore(manual, collapse);

  function resetWorkflow() {
    try { clearPhoto(); } catch {}
    try {
      const s = window.UT_FLOAT_STATE;
      if (s) Object.assign(s, { phase: "idle", code: "", row: null, selectedProduct: "", message: "" });
      window.dispatchEvent(new CustomEvent("ut:workflow-state", { detail: { ...(s || {}) } }));
    } catch {}
    try { document.getElementById("doneCard")?.classList.remove("show"); } catch {}
    try { document.getElementById("candidate")?.classList.remove("show", "warn"); } catch {}
  }

  function manualMode() {
    resetWorkflow();
    const input = document.getElementById("lowerInput");
    if (!input) return;
    input.value = "";
    const card = input.closest("section.card") || input;
    try { card.scrollIntoView({ behavior: "smooth", block: "center" }); } catch { input.scrollIntoView(); }
    setTimeout(() => {
      try { input.focus({ preventScroll: true }); } catch { input.focus(); }
      try { input.click(); } catch {}
    }, 280);
  }

  manual.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    manualMode();
  });

  // If opened from the clean UT v28 page, return there instead of legacy utsending.html.
  try {
    const from = new URLSearchParams(location.search).get("from");
    const orderId = new URLSearchParams(location.search).get("order") || "";
    if (from === "v28") {
      const back = document.getElementById("backLink");
      if (back) back.href = `utsending-v28.html?open=${encodeURIComponent(orderId)}&v=20260807-2142`;
    }
  } catch {}

  console.info("UT camera manual toggle is active.");
})();
