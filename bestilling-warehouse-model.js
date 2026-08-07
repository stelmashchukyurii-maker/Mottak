"use strict";

(() => {
  const VERSION = "UT Kontor v26 REDIGERING<br>Oppdatert 07.08.2026 kl. 13:46";
  const get = (id) => document.getElementById(id);

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

  // Simple visible workflow. Technical statuses stay in the database.
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

  function canEditOrder(order) {
    return order && !["completed", "cancelled"].includes(order.status);
  }

  function ensureEditButtons() {
    if (!Array.isArray(orders)) return;
    document.querySelectorAll("#history .order").forEach((card) => {
      const storno = card.querySelector("[data-storno]");
      if (!storno) return;
      const id = storno.dataset.storno;
      const order = orders.find((item) => String(item.id) === String(id));
      if (!canEditOrder(order)) return;

      let edit = card.querySelector("[data-edit]");
      if (!edit) {
        edit = document.createElement("button");
        edit.type = "button";
        edit.className = "order-action edit-action";
        edit.dataset.edit = id;
        edit.addEventListener("click", () => startEdit(id));
        storno.parentElement?.insertBefore(edit, storno);
      }
      edit.textContent = "Rediger bestilling";
    });
  }

  if (typeof renderHistory === "function") {
    const previousRenderHistory = renderHistory;
    renderHistory = function renderHistoryEditableUntilSent() {
      previousRenderHistory();
      ensureEditButtons();
    };
  }

  // Office may edit every active order until it is actually sent.
  startEdit = function startEditUntilSent(id) {
    const order = Array.isArray(orders)
      ? orders.find((item) => String(item.id) === String(id))
      : null;

    if (!canEditOrder(order)) {
      msg("Et sendt eller stornert oppdrag kan ikke redigeres.", "bad");
      return;
    }

    editingId = order.id;
    get("ramp").value = order.ramp || "";
    get("officeNote").value = order.office_note || "";
    if (get("mottaker")) get("mottaker").value = order.recipient || "";
    if (get("transporter")) get("transporter").value = order.transporter || "";

    state = {
      bunner: Number(order.bunner_stacks) || 0,
      h30: Number(order.hyller30_sets) || 0,
      h60: Number(order.hyller60_sets) || 0,
    };
    get("bunnerQty").value = state.bunner;
    get("h30Qty").value = state.h30;
    get("h60Qty").value = state.h60;

    get("formTitle").textContent = `Rediger RAMPE ${order.ramp}`;
    const label = statusLabel(order);
    get("editBanner").textContent = order.status === "new"
      ? `Redigerer ${order.order_number || order.id}. Hele bestillingen kan endres.`
      : `Status: ${label}. Bestillingen kan redigeres frem til Sendt. Endres rampe eller antall, starter lageroppdraget på nytt som Ny.`;
    get("editBanner").classList.add("show");
    get("send").textContent = "Lagre endringer";
    get("reset").textContent = "Avbryt redigering";
    renderForm();
    get("formCard").scrollIntoView({ behavior: "smooth", block: "start" });
  };

  async function saveEditedOrder(event) {
    if (!editingId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (busy) return;

    const order = Array.isArray(orders)
      ? orders.find((item) => String(item.id) === String(editingId))
      : null;
    if (!canEditOrder(order)) {
      msg("Oppdraget er allerede Sendt eller Stornert og kan ikke redigeres.", "bad");
      return;
    }

    const data = payload(false);
    if (!data.ramp) {
      msg("Velg rampe.", "bad");
      get("ramp")?.focus();
      return;
    }
    if ((Number(data.bunner_stacks) || 0) + (Number(data.hyller30_sets) || 0) + (Number(data.hyller60_sets) || 0) === 0) {
      msg("Legg minst én varetype til rampen.", "bad");
      return;
    }

    const collision = orders.find((item) =>
      active(item) && normalizeRamp(item.ramp) === normalizeRamp(data.ramp) && String(item.id) !== String(editingId)
    );
    if (collision) {
      msg(`RAMPE ${data.ramp} har allerede et aktivt oppdrag.`, "bad");
      return;
    }

    const operationalChange =
      normalizeRamp(order.ramp) !== normalizeRamp(data.ramp)
      || (Number(order.bunner_stacks) || 0) !== (Number(data.bunner_stacks) || 0)
      || (Number(order.hyller30_sets) || 0) !== (Number(data.hyller30_sets) || 0)
      || (Number(order.hyller60_sets) || 0) !== (Number(data.hyller60_sets) || 0);

    if (order.status !== "new" && operationalChange) {
      const ok = confirm("Lageret har allerede startet dette oppdraget. Ved endring av rampe eller antall returneres plukkede varer til På lager, og oppdraget starter på nytt som Ny. Fortsette?");
      if (!ok) return;
    }

    busy = true;
    get("send").disabled = true;
    msg("Lagrer endringene…");
    try {
      await request("rpc/update_ut_order_before_dispatch", {
        method: "POST",
        body: JSON.stringify({
          p_order_id: editingId,
          p_ramp: data.ramp,
          p_bunner_stacks: Number(data.bunner_stacks) || 0,
          p_hyller30_sets: Number(data.hyller30_sets) || 0,
          p_hyller60_sets: Number(data.hyller60_sets) || 0,
          p_office_note: data.office_note || null,
          p_recipient: data.recipient || null,
          p_transporter: data.transporter || null,
        }),
      });
      clearForm(false);
      msg(operationalChange && order.status !== "new"
        ? "Bestillingen er oppdatert og sendt til lageret på nytt som Ny."
        : "Bestillingen er oppdatert.", "ok");
      await Promise.all([loadInn(), loadUt()]);
    } catch (error) {
      msg(`Kunne ikke lagre bestillingen.\n${error.message || error}`, "bad");
    } finally {
      busy = false;
      get("send").disabled = false;
    }
  }

  get("send")?.addEventListener("click", saveEditedOrder, true);

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
