"use strict";

const SUPABASE_BASE = "https://hzjsatehehhpgpskckfi.supabase.co";
const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
const $ = (id) => document.getElementById(id);

let state = { bunner: 0, h30: 0, h60: 0 };
let orders = [];
let editingId = null;
let busy = false;

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function headers(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    ...extra,
  };
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${SUPABASE_BASE}/rest/v1/${path}`, {
      ...options,
      headers: headers(options.headers || {}),
      signal: controller.signal,
    });
    const text = await response.text();
    let body = null;
    if (text) {
      try { body = JSON.parse(text); } catch { body = text; }
    }
    if (!response.ok) {
      const message = body && typeof body === "object"
        ? (body.message || body.hint || body.details || `HTTP ${response.status}`)
        : (body || `HTTP ${response.status}`);
      throw new Error(message);
    }
    return body;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Ingen svar fra Supabase innen 15 sekunder.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function setConnection(prefix, text, type = "", detail = "") {
  $(`${prefix}Status`).textContent = text;
  $(`${prefix}Dot`).className = `dot ${type}`.trim();
  const box = $(`${prefix}Error`);
  box.textContent = detail;
  box.classList.toggle("show", Boolean(detail));
}

function msg(text, type = "") {
  $("message").textContent = text;
  $("message").className = `message ${type}`.trim();
}

function date(value) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function orderNumber() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `UT-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function positiveOrZero(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function normalizeRamp(value) {
  return String(value || "").trim().toUpperCase();
}

function totals(values = state) {
  return {
    bunner: values.bunner * 10 + values.h30 + values.h60,
    hyller: values.h30 * 30 + values.h60 * 60,
  };
}

function statusLabel(order) {
  if (order.test_state === "returned") return "Test returnert";
  if (order.test_state === "dispatched") return "Test trukket";
  if (order.status === "new") return "Ny";
  if (["received", "in_progress", "staged", "problem"].includes(order.status)) return "I arbeid";
  if (order.status === "completed") return "Test trukket";
  if (order.status === "cancelled") return "Stornert";
  return order.status || "Ukjent";
}

function active(order) {
  return !["completed", "cancelled"].includes(order.status) && order.test_state !== "returned";
}

function amount(order) {
  const parts = [];
  const b = Number(order.bunner_stacks) || 0;
  const h30 = Number(order.hyller30_sets) || 0;
  const h60 = Number(order.hyller60_sets) || 0;
  if (b) parts.push(`${b} ${b === 1 ? "stabel" : "stabler"} Bunner = ${b * 10}`);
  if (h30) parts.push(`${h30} Hyller x30 = ${h30} Bunner + ${h30 * 30} hyller`);
  if (h60) parts.push(`${h60} Hyller x60 = ${h60} Bunner + ${h60 * 60} hyller`);
  return parts.join(" · ") || "Ingen varer";
}

function readState() {
  state.bunner = positiveOrZero($("bunnerQty").value);
  state.h30 = positiveOrZero($("h30Qty").value);
  state.h60 = positiveOrZero($("h60Qty").value);
  $("bunnerQty").value = state.bunner;
  $("h30Qty").value = state.h30;
  $("h60Qty").value = state.h60;
  renderForm();
}

function renderForm() {
  const t = totals();
  $("sumRamp").textContent = normalizeRamp($("ramp").value) || "Ikke valgt";
  $("bunnerOutput").textContent = `${state.bunner * 10} Bunner`;
  $("h30Output").textContent = `${state.h30} Bunner · ${state.h30 * 30} hyller`;
  $("h60Output").textContent = `${state.h60} Bunner · ${state.h60 * 60} hyller`;
  $("sumBunner").textContent = `${state.bunner} ${state.bunner === 1 ? "stabel" : "stabler"} = ${state.bunner * 10} Bunner`;
  $("sumH30").textContent = `${state.h30} sett`;
  $("sumH60").textContent = `${state.h60} sett`;
  $("sumTotal").textContent = `${t.bunner} Bunner · ${t.hyller} hyller`;
}

function setQuantity(key, value) {
  state[key] = Math.max(0, positiveOrZero(value));
  const inputId = key === "bunner" ? "bunnerQty" : key === "h30" ? "h30Qty" : "h60Qty";
  $(inputId).value = state[key];
  renderForm();
}

function payload(includeCreate = false) {
  const data = {
    ramp: normalizeRamp($("ramp").value),
    bunner_stacks: state.bunner,
    hyller30_sets: state.h30,
    hyller60_sets: state.h60,
    office_note: $("officeNote").value.trim() || null,
    updated_at: new Date().toISOString(),
  };
  if (includeCreate) {
    Object.assign(data, {
      order_number: orderNumber(),
      status: "new",
      created_by: "office-ramp-web",
    });
  }
  return data;
}

async function loadInn() {
  setConnection("inn", "Lagerstatus…");
  try {
    const rows = await request("mottak_scans?select=product,status,stock_status&limit=10000") || [];
    const verified = rows.filter((row) => row.status === "verified");
    const available = verified.filter((row) => (row.stock_status || "in_stock") === "in_stock");
    const physical = verified.filter((row) => ["in_stock", "reserved", "staged"].includes(row.stock_status || "in_stock"));
    const metric = (list) => {
      const b = list.filter((r) => r.product === "bunner").length;
      const h30 = list.filter((r) => r.product === "hyller30").length;
      const h60 = list.filter((r) => r.product === "hyller60").length;
      return { b, h30, h60, bunner: b * 10 + h30 + h60, hyller: h30 * 30 + h60 * 60 };
    };
    const a = metric(available);
    const p = metric(physical);
    const pending = rows.filter((row) => row.status === "pending");
    $("physicalValue").textContent = `${p.bunner} Bunner · ${p.hyller} hyller`;
    $("availableValue").textContent = `${a.bunner} Bunner · ${a.hyller} hyller`;
    $("bunnerValue").textContent = `${a.b} ${a.b === 1 ? "stabel" : "stabler"} × 10 = ${a.b * 10} stk.`;
    $("h30Value").textContent = `${a.h30} sett = ${a.h30 * 30} hyller`;
    $("h60Value").textContent = `${a.h60} sett = ${a.h60 * 60} hyller`;
    $("stockSummary").textContent = `${a.bunner} tilgjengelige Bunner · ${a.hyller} hyller`;
    $("pendingValue").textContent = `Pending: ${pending.filter((r) => r.product === "bunner").length} Bunner · ${pending.filter((r) => r.product === "hyller30").length} Hyller x30 · ${pending.filter((r) => r.product === "hyller60").length} Hyller x60`;
    setConnection("inn", "Lager tilkoblet", "ok");
  } catch (error) {
    $("stockSummary").textContent = "Feil";
    setConnection("inn", "Lagerfeil", "bad", `Feil ved lesing av mottak_scans:\n${error.message || error}`);
  }
}

function groupActiveByRamp() {
  const map = new Map();
  orders.filter(active).forEach((order) => {
    const ramp = normalizeRamp(order.ramp) || "—";
    if (!map.has(ramp)) map.set(ramp, []);
    map.get(ramp).push(order);
  });
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "nb", { numeric: true }));
}

function renderHistory() {
  const groups = groupActiveByRamp();
  $("historyCount").textContent = String(groups.length);
  if (!groups.length) {
    $("history").innerHTML = '<div class="empty">Ingen aktive ramper.</div>';
    return;
  }

  $("history").innerHTML = groups.map(([ramp, rampOrders]) => {
    const aggregate = rampOrders.reduce((sum, order) => ({
      b: sum.b + (Number(order.bunner_stacks) || 0),
      h30: sum.h30 + (Number(order.hyller30_sets) || 0),
      h60: sum.h60 + (Number(order.hyller60_sets) || 0),
    }), { b: 0, h30: 0, h60: 0 });
    const total = totals({ bunner: aggregate.b, h30: aggregate.h30, h60: aggregate.h60 });
    const legacy = rampOrders.length > 1 ? `<div class="field-help">${rampOrders.length} eldre aktive poster ligger under samme rampe. Nye dubletter blokkeres.</div>` : "";
    const cards = rampOrders.map((order) => {
      const canEdit = order.status === "new";
      return `<article class="order">
        <div class="order-top"><div class="order-number">${esc(order.order_number || order.id)}</div><strong>${esc(statusLabel(order))}</strong></div>
        <div class="amount">${esc(amount(order))}</div>
        <div class="meta">${date(order.created_at)}${order.office_note ? ` · ${esc(order.office_note)}` : ""}</div>
        <div class="order-actions">
          ${canEdit ? `<button class="order-action edit-action" data-edit="${esc(order.id)}">Rediger rampen</button>` : ""}
          <button class="order-action storno-action" data-storno="${esc(order.id)}">Storner</button>
        </div>
      </article>`;
    }).join("");
    return `<section class="ramp-card">
      <div class="ramp-card-head"><div><div class="ramp-title">RAMPE ${esc(ramp)}</div><div class="field-help">Samlet: ${total.bunner} Bunner · ${total.hyller} hyller</div></div><span class="ramp-state">${rampOrders.length} oppdrag</span></div>
      ${legacy}<div class="ramp-orders">${cards}</div>
    </section>`;
  }).join("");

  document.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => startEdit(button.dataset.edit)));
  document.querySelectorAll("[data-storno]").forEach((button) => button.addEventListener("click", () => stornOrder(button.dataset.storno)));
}

async function loadUt() {
  $("refresh").disabled = true;
  setConnection("ut", "UT-database…");
  try {
    orders = await request("ut_orders?select=*&order=created_at.desc&limit=500") || [];
    renderHistory();
    setConnection("ut", `UT tilkoblet · ${groupActiveByRamp().length} aktive ramper`, "ok");
  } catch (error) {
    $("history").innerHTML = '<div class="empty">UT-databasen kunne ikke lastes.</div>';
    $("historyCount").textContent = "Feil";
    setConnection("ut", "UT-feil", "bad", `Feil ved lesing av ut_orders:\n${error.message || error}`);
  } finally {
    $("refresh").disabled = false;
  }
}

async function send() {
  const ramp = normalizeRamp($("ramp").value);
  if (!ramp) {
    msg("Skriv inn rampenummer.", "bad");
    $("ramp").focus();
    return;
  }
  if (state.bunner + state.h30 + state.h60 === 0) {
    msg("Legg minst én varetype til rampen.", "bad");
    return;
  }
  if (busy) return;

  busy = true;
  $("send").disabled = true;
  $("receipt").classList.remove("show");
  try {
    if (editingId) {
      msg("Lagrer hele rampen…");
      const rows = await request(`ut_orders?id=eq.${encodeURIComponent(editingId)}&status=eq.new`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload(false)),
      });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row) throw new Error("Rampen er ikke lenger Ny og kan ikke redigeres.");
      msg("Rampen er oppdatert.", "ok");
      clearForm(false);
    } else {
      const duplicate = orders.find((order) => active(order) && normalizeRamp(order.ramp) === ramp);
      if (duplicate) {
        $("historyDetails").open = true;
        throw new Error(`RAMPE ${ramp} har allerede et aktivt oppdrag (${duplicate.order_number || duplicate.id}). Rediger eller stornér den eksisterende rampen.`);
      }
      msg("Sender hele rampen til lageret…");
      const rows = await request("ut_orders", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload(true)),
      });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row) throw new Error("Supabase returnerte ingen opprettet rampe.");
      $("receiptNo").textContent = `${row.order_number} er sendt`;
      $("receiptText").textContent = `Hele RAMPE ${row.ramp} er sendt som ett samlet lageroppdrag.`;
      $("receipt").classList.add("show");
      msg("Rampen er sendt til lageret.", "ok");
      clearForm(false, true);
    }
    await Promise.all([loadInn(), loadUt()]);
  } catch (error) {
    msg(`${editingId ? "Kunne ikke lagre rampen" : "Kunne ikke sende rampen"}.\n${error.message || error}`, "bad");
  } finally {
    busy = false;
    $("send").disabled = false;
  }
}

function startEdit(id) {
  const order = orders.find((item) => String(item.id) === String(id));
  if (!order || order.status !== "new") {
    msg("Bare en rampe med status Ny kan redigeres.", "bad");
    return;
  }
  editingId = order.id;
  $("ramp").value = order.ramp || "";
  $("officeNote").value = order.office_note || "";
  state = {
    bunner: Number(order.bunner_stacks) || 0,
    h30: Number(order.hyller30_sets) || 0,
    h60: Number(order.hyller60_sets) || 0,
  };
  $("bunnerQty").value = state.bunner;
  $("h30Qty").value = state.h30;
  $("h60Qty").value = state.h60;
  $("formTitle").textContent = `Rediger RAMPE ${order.ramp}`;
  $("editBanner").textContent = `Redigerer ${order.order_number || order.id}. Alle tre varetypene lagres i samme oppdrag.`;
  $("editBanner").classList.add("show");
  $("send").textContent = "Lagre hele rampen";
  $("reset").textContent = "Avbryt redigering";
  renderForm();
  $("formCard").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function stornOrder(id) {
  const order = orders.find((item) => String(item.id) === String(id));
  if (!order || ["completed", "cancelled"].includes(order.status)) return;
  const reason = prompt(`Hvorfor skal ${order.order_number || "rampen"} storneres?`, "Stornert fra kontoret.");
  if (reason === null) return;
  if (!confirm(`Storner oppdraget på RAMPE ${order.ramp}? Reserverte varer returneres.`)) return;
  try {
    msg("Stornerer rampen…");
    await request("rpc/cancel_ut_order", {
      method: "POST",
      body: JSON.stringify({ p_order_id: order.id, p_reason: reason.trim() || "Stornert fra kontoret." }),
    });
    if (String(editingId) === String(id)) clearForm(false);
    msg("Rampen er stornert og beholdt i historikken.", "ok");
    await Promise.all([loadInn(), loadUt()]);
  } catch (error) {
    msg(`Kunne ikke stornere rampen.\n${error.message || error}`, "bad");
  }
}

function clearForm(focus = true, keepReceipt = false) {
  editingId = null;
  state = { bunner: 0, h30: 0, h60: 0 };
  $("ramp").value = "";
  $("officeNote").value = "";
  $("bunnerQty").value = "0";
  $("h30Qty").value = "0";
  $("h60Qty").value = "0";
  if (!keepReceipt) $("receipt").classList.remove("show");
  $("formTitle").textContent = "Ny rampe";
  $("editBanner").classList.remove("show");
  $("editBanner").textContent = "";
  $("send").textContent = "Send hele rampen";
  $("reset").textContent = "Nullstill";
  if (!keepReceipt) msg("");
  renderForm();
  if (focus) $("ramp").focus();
}

$("ramp").addEventListener("input", () => {
  $("ramp").value = $("ramp").value.replace(/[^0-9A-Za-z-]/g, "").toUpperCase();
  renderForm();
});

["bunnerQty", "h30Qty", "h60Qty"].forEach((id) => {
  $(id).addEventListener("input", readState);
  $(id).addEventListener("change", readState);
});

document.querySelectorAll("[data-minus]").forEach((button) => button.addEventListener("click", () => {
  const key = button.dataset.minus;
  setQuantity(key, state[key] - 1);
}));

document.querySelectorAll("[data-plus]").forEach((button) => button.addEventListener("click", () => {
  const key = button.dataset.plus;
  setQuantity(key, state[key] + 1);
}));

document.querySelectorAll("[data-set]").forEach((button) => button.addEventListener("click", () => {
  const [key, raw] = button.dataset.set.split(":");
  setQuantity(key, raw);
}));

$("send").addEventListener("click", send);
$("reset").addEventListener("click", () => clearForm());
$("refresh").addEventListener("click", () => Promise.all([loadInn(), loadUt()]));

renderForm();
Promise.all([loadInn(), loadUt()]);
setInterval(() => Promise.all([loadInn(), loadUt()]), 10000);
