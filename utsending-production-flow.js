"use strict";

(() => {
  const VERSION = "UT Lager v21 RAMPEFLYT<br>Oppdatert 07.08.2026 kl. 12:38";
  const nb = {
    statusNew:"Ny",statusWork:"I arbeid",statusRamp:"På rampe",statusSent:"Sendt",statusStorno:"Stornert",unknown:"Ukjent",
    readyRampButton:"Klar på rampe",
    sendButton:"Send fra rampe",
    confirmCheck:"Jeg bekrefter at alle varer er kontrollert og står på riktig rampe.",
    departCheck:"Jeg bekrefter at hele rampen sendes ut fra lageret nå.",
    completeFirst:"Alle bestilte varer må være registrert før rampen kan markeres som klar.",
    confirmRampFirst:"Bekreft først at alle varer er kontrollert og står på riktig rampe.",
    staging:"Markerer hele rampen som klar…",
    rampReadyBefore:"RAMPE",rampReadyAfter:"er klar og står På rampe.",
    rampFirst:"Rampen må først være ferdig kontrollert og markert På rampe.",confirmFirst:"Bekreft først at rampen sendes ut fra lageret nå.",
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

  async function markReadyOnRamp() {
    const order = typeof current === "function" ? current() : null;
    if (!order || busy) return;

    if (typeof complete === "function" && !complete(order)) {
      message("testMessage", tr("completeFirst"), "bad");
      return;
    }

    const check = document.getElementById("confirmCheck");
    if (check && !check.checked) {
      message("testMessage", tr("confirmRampFirst"), "bad");
      return;
    }

    busy = true;
    const button = document.getElementById("testDispatchButton");
    if (button) button.disabled = true;
    message("testMessage", tr("staging"));

    try {
      await rpc("stage_ut_order", { p_order_id: order.id });
      if (check) check.checked = false;
      await loadAll(true);
      alert(`${tr("rampReadyBefore")} ${order.ramp} ${tr("rampReadyAfter")}`);
    } catch (error) {
      message("testMessage", error.message || String(error), "bad");
    } finally {
      busy = false;
      enhance();
    }
  }

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

    const order = typeof current === "function" ? current() : null;
    const button = document.getElementById("testDispatchButton");
    const check = document.querySelector(".confirm-box .check");

    if (button) {
      button.classList.add("production-send-button");
      if (order?.status === "staged") {
        setText(button, tr("sendButton"));
        button.classList.add("final-dispatch-button");
        button.onclick = sendFromRamp;
        if (check) setText(check.querySelector("span"), tr("departCheck"));
      } else {
        setText(button, tr("readyRampButton"));
        button.classList.remove("final-dispatch-button");
        button.onclick = markReadyOnRamp;
        if (check) setText(check.querySelector("span"), tr("confirmCheck"));
      }
    }

    const returnButton = document.getElementById("returnButton");
    if (returnButton) returnButton.style.display = "none";

    document.querySelectorAll(".test-result").forEach((node) => node.style.display = "none");

    const testMessage = document.getElementById("testMessage");
    if (testMessage && /test/i.test(testMessage.textContent || "")) testMessage.textContent = "";
  }

  function addStyle() {
    if (document.getElementById("productionFlowStyle")) return;
    const style = document.createElement("style");
    style.id = "productionFlowStyle";
    style.textContent = `
      .production-send-button{background:#f4c430!important;color:#17130a!important;border:0!important;min-height:66px!important;font-size:20px!important;font-weight:950!important;box-shadow:0 8px 22px rgba(244,196,48,.16)!important}
      .production-send-button.final-dispatch-button{background:#48d597!important;color:#062418!important;box-shadow:0 8px 22px rgba(72,213,151,.2)!important}
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
