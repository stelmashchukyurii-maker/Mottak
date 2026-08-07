"use strict";

(() => {
  const VERSION = "UT Lager v19 SPRÅK<br>Oppdatert 07.08.2026 kl. 10:52";
  const nb = {
    statusNew:"Ny",statusWork:"I arbeid",statusRamp:"På rampe",statusSent:"Sendt",statusStorno:"Stornert",unknown:"Ukjent",
    sendButton:"Send fra rampe",confirmCheck:"Jeg bekrefter at alle varer er kontrollert og står på riktig rampe.",
    rampFirst:"Rampen må først være ferdig kontrollert og markert På rampe.",confirmFirst:"Bekreft først at alle varer står på riktig rampe.",
    sendConfirmBefore:"Send hele RAMPE",sendConfirmAfter:"Etter dette flyttes varene til Sendt.",sending:"Sender rampen…",sentAlertBefore:"RAMPE",sentAlertAfter:"er sendt."
  };
  const tr = (key) => typeof window.utText === "function" ? window.utText(key) : (nb[key] || key);

  try {
    statusLabel = function productionStatusLabel(order) {
      if (order.status === "new") return tr("statusNew");
      if (["received", "in_progress", "problem"].includes(order.status)) return tr("statusWork");
      if (order.status === "staged") return tr("statusRamp");
      if (order.status === "completed") return tr("statusSent");
      if (order.status === "cancelled") return tr("statusStorno");
      return order.status || tr("unknown");
    };
  } catch {}

  try {
    active = function productionActive(order) {
      return !["completed", "cancelled"].includes(order.status);
    };
  } catch {}

  async function sendFromRamp() {
    const order = typeof current === "function" ? current() : null;
    if (!order || busy) return;

    if (order.status !== "staged") {
      message("testMessage", tr("rampFirst"), "bad");
      return;
    }

    const check = document.getElementById("confirmCheck");
    if (check && !check.checked) {
      message("testMessage", tr("confirmFirst"), "bad");
      return;
    }

    if (!confirm(`${tr("sendConfirmBefore")} ${order.ramp}? ${tr("sendConfirmAfter")}`)) return;

    busy = true;
    const button = document.getElementById("testDispatchButton");
    if (button) button.disabled = true;
    message("testMessage", tr("sending"));

    try {
      await rpc("confirm_ut_dispatch", { p_order_id: order.id });
      if (check) check.checked = false;
      await loadAll(true);
      selectedId = null;
      selectedScans = [];
      document.getElementById("detail")?.classList.remove("show");
      document.getElementById("ramps")?.scrollIntoView({ behavior: "smooth", block: "start" });
      alert(`${tr("sentAlertBefore")} ${order.ramp} ${tr("sentAlertAfter")}`);
    } catch (error) {
      message("testMessage", error.message || String(error), "bad");
    } finally {
      busy = false;
      enhance();
    }
  }

  function setText(node, text) {
    if (node && node.textContent !== text) node.textContent = text;
  }

  function replaceFixedCopy() {
    const version = document.querySelector(".version");
    if (version && version.innerHTML !== VERSION) version.innerHTML = VERSION;

    document.querySelector(".test-banner")?.remove();

    const button = document.getElementById("testDispatchButton");
    if (button) {
      setText(button, tr("sendButton"));
      button.classList.add("production-send-button");
      button.onclick = sendFromRamp;
    }

    const returnButton = document.getElementById("returnButton");
    if (returnButton) returnButton.style.display = "none";

    const check = document.querySelector(".confirm-box .check");
    if (check) setText(check.querySelector("span"), tr("confirmCheck"));

    document.querySelectorAll(".test-result").forEach((node) => node.style.display = "none");

    const testMessage = document.getElementById("testMessage");
    if (testMessage && /test/i.test(testMessage.textContent || "")) testMessage.textContent = "";
  }

  function addStyle() {
    if (document.getElementById("productionFlowStyle")) return;
    const style = document.createElement("style");
    style.id = "productionFlowStyle";
    style.textContent = `
      .production-send-button{background:#48d597!important;color:#062418!important;border:0!important;min-height:66px!important;font-size:20px!important;font-weight:950!important;box-shadow:0 8px 22px rgba(72,213,151,.18)!important}
      .production-send-button:disabled{opacity:.42!important}
    `;
    document.head.appendChild(style);
  }

  function enhance() {
    addStyle();
    replaceFixedCopy();
  }

  window.UT_PRODUCTION_ENHANCE = enhance;
  const observer = new MutationObserver(() => requestAnimationFrame(enhance));
  observer.observe(document.body, { childList: true, subtree: true });
  enhance();
  setTimeout(() => {
    try { renderRamps(); } catch {}
    try { if (selectedId) renderDetail(); } catch {}
    enhance();
  }, 250);
})();
