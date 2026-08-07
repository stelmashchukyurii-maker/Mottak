"use strict";

(() => {
  const VERSION = "UT Lager v18 PRODUKSJON<br>Oppdatert 07.08.2026 kl. 10:27";

  try {
    statusLabel = function productionStatusLabel(order) {
      if (order.status === "new") return "Ny";
      if (["received", "in_progress", "problem"].includes(order.status)) return "I arbeid";
      if (order.status === "staged") return "På rampe";
      if (order.status === "completed") return "Sendt";
      if (order.status === "cancelled") return "Stornert";
      return order.status || "Ukjent";
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
      message("testMessage", "Rampen må først være ferdig kontrollert og markert På rampe.", "bad");
      return;
    }

    const check = document.getElementById("confirmCheck");
    if (check && !check.checked) {
      message("testMessage", "Bekreft først at alle varer står på riktig rampe.", "bad");
      return;
    }

    if (!confirm(`Send hele RAMPE ${order.ramp}? Etter dette flyttes varene til Sendt.`)) return;

    busy = true;
    const button = document.getElementById("testDispatchButton");
    if (button) button.disabled = true;
    message("testMessage", "Sender rampen…");

    try {
      await rpc("confirm_ut_dispatch", { p_order_id: order.id });
      if (check) check.checked = false;
      await loadAll(true);
      selectedId = null;
      selectedScans = [];
      document.getElementById("detail")?.classList.remove("show");
      document.getElementById("ramps")?.scrollIntoView({ behavior: "smooth", block: "start" });
      alert(`RAMPE ${order.ramp} er sendt.`);
    } catch (error) {
      message("testMessage", error.message || String(error), "bad");
    } finally {
      busy = false;
      enhance();
    }
  }

  function replaceFixedCopy() {
    const version = document.querySelector(".version");
    if (version) version.innerHTML = VERSION;

    document.querySelector(".test-banner")?.remove();

    const button = document.getElementById("testDispatchButton");
    if (button) {
      button.textContent = "Send fra rampe";
      button.classList.add("production-send-button");
      button.onclick = sendFromRamp;
    }

    const returnButton = document.getElementById("returnButton");
    if (returnButton) returnButton.style.display = "none";

    const check = document.querySelector(".confirm-box .check");
    if (check) {
      const span = check.querySelector("span");
      if (span) span.textContent = "Jeg bekrefter at alle varer er kontrollert og står på riktig rampe.";
    }

    document.querySelectorAll(".test-result").forEach((node) => node.style.display = "none");

    const testMessage = document.getElementById("testMessage");
    if (testMessage && /test/i.test(testMessage.textContent || "")) testMessage.textContent = "";

    document.querySelectorAll(".status").forEach((node) => {
      if (node.textContent.trim() === "Test trukket") node.textContent = "Sendt";
      if (node.textContent.trim() === "Test returnert") node.textContent = "Stornert";
    });
  }

  function addStyle() {
    if (document.getElementById("productionFlowStyle")) return;
    const style = document.createElement("style");
    style.id = "productionFlowStyle";
    style.textContent = `
      .production-send-button{
        background:#48d597!important;
        color:#062418!important;
        border:0!important;
        min-height:66px!important;
        font-size:20px!important;
        font-weight:950!important;
        box-shadow:0 8px 22px rgba(72,213,151,.18)!important;
      }
      .production-send-button:disabled{opacity:.42!important}
    `;
    document.head.appendChild(style);
  }

  function enhance() {
    addStyle();
    replaceFixedCopy();
  }

  const observer = new MutationObserver(() => requestAnimationFrame(enhance));
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  enhance();
  setTimeout(() => {
    try { renderRamps(); } catch {}
    try { if (selectedId) renderDetail(); } catch {}
    enhance();
  }, 250);
})();
