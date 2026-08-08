"use strict";

(() => {
  const get = (id) => document.getElementById(id);

  if (typeof payload === "function") {
    const basePayload = payload;
    payload = function payloadWithPartyFields(includeCreate = false) {
      const data = basePayload(includeCreate);
      data.recipient = get("mottaker")?.value.trim() || null;
      data.transporter = get("transporter")?.value.trim() || null;
      return data;
    };
  }

  if (typeof startEdit === "function") {
    const baseStartEdit = startEdit;
    startEdit = function startEditWithPartyFields(id) {
      baseStartEdit(id);
      const order = Array.isArray(orders)
        ? orders.find((item) => String(item.id) === String(id))
        : null;
      if (get("mottaker")) get("mottaker").value = order?.recipient || "";
      if (get("transporter")) get("transporter").value = order?.transporter || "";
    };
  }

  if (typeof clearForm === "function") {
    const baseClearForm = clearForm;
    clearForm = function clearFormWithPartyFields(focus = true, keepReceipt = false) {
      baseClearForm(focus, keepReceipt);
      if (get("mottaker")) get("mottaker").value = "";
      if (get("transporter")) get("transporter").value = "";
    };
  }
})();
