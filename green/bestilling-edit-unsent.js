"use strict";

(() => {
  const get = (id) => document.getElementById(id);
  const isEditable = (order) => order && !["completed", "cancelled"].includes(order.status);

  function renderEditableHistory() {
    const groups = groupActiveByRamp();
    get("historyCount").textContent = String(groups.length);
    if (!groups.length) {
      get("history").innerHTML = '<div class="empty">Ingen aktive ramper.</div>';
      return;
    }

    get("history").innerHTML = groups.map(([ramp, rampOrders]) => {
      const aggregate = rampOrders.reduce((sum, order) => ({
        b: sum.b + (Number(order.bunner_stacks) || 0),
        h30: sum.h30 + (Number(order.hyller30_sets) || 0),
        h60: sum.h60 + (Number(order.hyller60_sets) || 0),
      }), { b: 0, h30: 0, h60: 0 });
      const total = totals({ bunner: aggregate.b, h30: aggregate.h30, h60: aggregate.h60 });
      const legacy = rampOrders.length > 1
        ? `<div class="field-help">${rampOrders.length} eldre aktive poster ligger under samme rampe.</div>`
        : "";

      const cards = rampOrders.map((order) => {
        const party = [order.recipient, order.transporter].filter(Boolean).map(esc).join(" · ");
        return `<article class="order">
          <div class="order-top"><div class="order-number">${esc(order.order_number || order.id)}</div><strong>${esc(statusLabel(order))}</strong></div>
          <div class="amount">${esc(amount(order))}</div>
          ${party ? `<div class="meta">${party}</div>` : ""}
          <div class="meta">${date(order.created_at)}${order.office_note ? ` · ${esc(order.office_note)}` : ""}</div>
          <div class="order-actions">
            ${isEditable(order) ? `<button class="order-action edit-action" data-edit="${esc(order.id)}">Rediger bestilling</button>` : ""}
            <button class="order-action storno-action" data-storno="${esc(order.id)}">Storner</button>
          </div>
        </article>`;
      }).join("");

      return `<section class="ramp-card">
        <div class="ramp-card-head"><div><div class="ramp-title">RAMPE ${esc(ramp)}</div><div class="field-help">Samlet: ${total.bunner} Bunner · ${total.hyller} hyller</div></div><span class="ramp-state">${rampOrders.length} oppdrag</span></div>
        ${legacy}<div class="ramp-orders">${cards}</div>
      </section>`;
    }).join("");

    document.querySelectorAll("[data-edit]").forEach((button) =>
      button.addEventListener("click", () => startEdit(button.dataset.edit))
    );
    document.querySelectorAll("[data-storno]").forEach((button) =>
      button.addEventListener("click", () => stornOrder(button.dataset.storno))
    );
  }

  renderHistory = renderEditableHistory;

  startEdit = function startEditAnyUnsent(id) {
    const order = Array.isArray(orders)
      ? orders.find((item) => String(item.id) === String(id))
      : null;

    if (!isEditable(order)) {
      msg("Sendt eller stornert oppdrag kan ikke redigeres.", "bad");
      return;
    }

    editingId = order.id;
    get("ramp").value = order.ramp || "";
    if (get("mottaker")) get("mottaker").value = order.recipient || "";
    if (get("transporter")) get("transporter").value = order.transporter || "";
    get("officeNote").value = order.office_note || "";

    state = {
      bunner: Number(order.bunner_stacks) || 0,
      h30: Number(order.hyller30_sets) || 0,
      h60: Number(order.hyller60_sets) || 0,
    };
    get("bunnerQty").value = state.bunner;
    get("h30Qty").value = state.h30;
    get("h60Qty").value = state.h60;

    get("formTitle").textContent = `Rediger RAMPE ${order.ramp}`;
    get("editBanner").textContent = order.status === "new"
      ? `Redigerer ${order.order_number || order.id}. Du kan endre hele bestillingen.`
      : `Status: ${statusLabel(order)}. Du kan redigere frem til Sendt. Endring av rampe eller antall starter lageroppdraget på nytt som Ny.`;
    get("editBanner").classList.add("show");
    get("send").textContent = "Lagre endringer";
    get("reset").textContent = "Avbryt redigering";
    renderForm();
    get("formCard").scrollIntoView({ behavior: "smooth", block: "start" });
  };

  async function saveEditedOrder() {
    const order = Array.isArray(orders)
      ? orders.find((item) => String(item.id) === String(editingId))
      : null;
    if (!isEditable(order) || busy) return;

    const ramp = normalizeRamp(get("ramp").value);
    if (!ramp) {
      msg("Velg rampe.", "bad");
      get("ramp").focus();
      return;
    }
    if (state.bunner + state.h30 + state.h60 === 0) {
      msg("Legg minst én varetype til rampen.", "bad");
      return;
    }

    const operationalChange =
      normalizeRamp(order.ramp) !== ramp
      || (Number(order.bunner_stacks) || 0) !== (Number(state.bunner) || 0)
      || (Number(order.hyller30_sets) || 0) !== (Number(state.h30) || 0)
      || (Number(order.hyller60_sets) || 0) !== (Number(state.h60) || 0);

    if (order.status !== "new" && operationalChange) {
      const ok = confirm(
        `RAMPE ${order.ramp} er allerede ${statusLabel(order)}.\n\n` +
        "Du endrer rampe eller antall. Allerede valgte varer returneres til På lager, og oppdraget starter på nytt som Ny.\n\nLagre endringene?"
      );
      if (!ok) return;
    }

    busy = true;
    get("send").disabled = true;
    msg("Lagrer endringene…");

    try {
      await request("rpc/office_edit_unsent_ut_order", {
        method: "POST",
        body: JSON.stringify({
          p_order_id: order.id,
          p_ramp: ramp,
          p_recipient: get("mottaker")?.value.trim() || null,
          p_transporter: get("transporter")?.value.trim() || null,
          p_bunner_stacks: Number(state.bunner) || 0,
          p_hyller30_sets: Number(state.h30) || 0,
          p_hyller60_sets: Number(state.h60) || 0,
          p_office_note: get("officeNote").value.trim() || null,
        }),
      });

      clearForm(false);
      msg(order.status !== "new" && operationalChange
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

  get("send")?.addEventListener("click", (event) => {
    if (!editingId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    saveEditedOrder();
  }, true);

  const version = document.querySelector(".version");
  if (version) version.innerHTML = "UT Kontor v27 REDIGERING<br>Oppdatert 07.08.2026 kl. 13:46";

  renderHistory();
})();
