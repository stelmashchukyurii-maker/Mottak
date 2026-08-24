"use strict";

(() => {
  if (window.__UT_KONTOR_MANUAL_CORRECTION__) return;
  window.__UT_KONTOR_MANUAL_CORRECTION__ = true;

  const API = "https://hzjsatehehhpgpskckfi.supabase.co/functions/v1/ut-kontor-manual-correction";
  const PRODUCTS = [
    { id: "bunner", label: "Bunner", unit: "stabler" },
    { id: "hyller30", label: "Hyller x30", unit: "sett" },
    { id: "hyller60", label: "Hyller x60", unit: "sett" },
  ];
  const state = { summary: new Map(), busy: false };

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  function ensureStyle() {
    if (document.getElementById("utManualCorrectionStyle")) return;
    const style = document.createElement("style");
    style.id = "utManualCorrectionStyle";
    style.textContent = `
      .ut-mc-launch{display:inline-flex;align-items:center;gap:7px;min-height:38px;margin:10px 0 12px;padding:8px 12px;border:1px solid rgba(244,196,48,.72);border-radius:11px;background:rgba(244,196,48,.09);color:#ffe17a;font:950 12px/1 Arial,sans-serif;letter-spacing:.02em;cursor:pointer}
      .ut-mc-launch:active{transform:translateY(1px)}
      .ut-mc-overlay{position:fixed;inset:0;z-index:99999;display:none;align-items:flex-start;justify-content:center;padding:20px;background:rgba(0,0,0,.72);overflow:auto}
      .ut-mc-overlay.show{display:flex}
      .ut-mc-card{width:min(760px,100%);margin:auto;background:#0b1020;border:2px solid #303b59;border-radius:20px;box-shadow:0 24px 80px rgba(0,0,0,.55);color:#f5f7ff;overflow:hidden}
      .ut-mc-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 16px;border-bottom:1px solid #303b59;background:#111827}
      .ut-mc-title{font:1000 19px/1.2 Arial,sans-serif;color:#f4c430}
      .ut-mc-close{width:38px;height:38px;border:1px solid #303b59;border-radius:10px;background:#151c30;color:#f5f7ff;font:1000 22px/1 Arial,sans-serif;cursor:pointer}
      .ut-mc-body{padding:14px}
      .ut-mc-note{margin:0 0 12px;color:#aab4ce;font:800 12px/1.4 Arial,sans-serif}
      .ut-mc-grid{display:grid;gap:10px}
      .ut-mc-row{display:grid;grid-template-columns:minmax(130px,.8fr) minmax(170px,1.15fr) auto;gap:10px;align-items:center;padding:12px;border:1px solid #303b59;border-radius:14px;background:#111827}
      .ut-mc-name{font:1000 17px/1.2 Arial,sans-serif;color:#f5f7ff}
      .ut-mc-counts{font:850 13px/1.4 Arial,sans-serif;color:#aab4ce}
      .ut-mc-counts b{color:#48d597}
      .ut-mc-controls{display:flex;gap:7px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
      .ut-mc-btn{min-width:42px;min-height:40px;padding:8px 11px;border:1px solid #303b59;border-radius:10px;background:#151c30;color:#f5f7ff;font:1000 15px/1 Arial,sans-serif;cursor:pointer}
      .ut-mc-btn.plus{border-color:rgba(72,213,151,.6);color:#9df0c8}
      .ut-mc-btn.minus{border-color:rgba(255,115,115,.55);color:#ff9b9b}
      .ut-mc-set{display:flex;gap:6px;align-items:center}
      .ut-mc-input{width:78px;min-height:40px;padding:7px 8px;border:1px solid #303b59;border-radius:10px;background:#070b14;color:#f5f7ff;font:950 15px/1 Arial,sans-serif;text-align:center;outline:none}
      .ut-mc-setbtn{min-height:40px;padding:8px 10px;border:1px solid rgba(244,196,48,.58);border-radius:10px;background:rgba(244,196,48,.08);color:#ffe17a;font:950 11px/1.1 Arial,sans-serif;cursor:pointer;white-space:nowrap}
      .ut-mc-msg{display:none;margin:12px 0 0;padding:10px 12px;border-radius:11px;font:900 13px/1.35 Arial,sans-serif}
      .ut-mc-msg.show{display:block}.ut-mc-msg.ok{background:rgba(72,213,151,.10);border:1px solid rgba(72,213,151,.45);color:#9df0c8}.ut-mc-msg.bad{background:rgba(255,115,115,.10);border:1px solid rgba(255,115,115,.45);color:#ff9b9b}
      .ut-mc-history{margin-top:14px;padding-top:12px;border-top:1px solid #303b59}
      .ut-mc-history-title{margin-bottom:7px;font:1000 13px/1.2 Arial,sans-serif;color:#aab4ce}
      .ut-mc-history-list{display:grid;gap:6px}
      .ut-mc-history-item{display:grid;grid-template-columns:58px 1fr auto;gap:9px;align-items:center;padding:8px 9px;border-radius:9px;background:#070b14;font:800 12px/1.3 Arial,sans-serif;color:#d8deef}
      .ut-mc-ref{color:#f4c430;font-weight:1000}.ut-mc-delta.pos{color:#48d597}.ut-mc-delta.neg{color:#ff8585}
      .ut-mc-empty{color:#aab4ce;font:800 12px/1.4 Arial,sans-serif}
      @media(max-width:650px){.ut-mc-overlay{padding:10px}.ut-mc-row{grid-template-columns:1fr;gap:8px}.ut-mc-controls{justify-content:flex-start}.ut-mc-history-item{grid-template-columns:54px 1fr}.ut-mc-history-item time{grid-column:2}}
    `;
    document.head.appendChild(style);
  }

  async function call(body) {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) throw new Error(data?.error || `HTTP ${response.status}`);
    return data;
  }

  function productMeta(id) {
    return PRODUCTS.find((item) => item.id === id) || { id, label: id, unit: "stk." };
  }

  function setMessage(text = "", type = "") {
    const node = document.getElementById("utMcMessage");
    if (!node) return;
    node.textContent = text;
    node.className = `ut-mc-msg${text ? " show" : ""}${type ? ` ${type}` : ""}`;
  }

  function renderSummary(rows = []) {
    state.summary = new Map(rows.map((row) => [String(row.product_id), row]));
    const grid = document.getElementById("utMcGrid");
    if (!grid) return;
    grid.innerHTML = PRODUCTS.map((product) => {
      const row = state.summary.get(product.id) || {};
      const physical = Number(row.physical_count) || 0;
      const available = Number(row.available_count) || 0;
      return `<div class="ut-mc-row" data-product="${esc(product.id)}">
        <div class="ut-mc-name">${esc(product.label)}</div>
        <div class="ut-mc-counts">Fysisk: <b>${physical}</b> ${esc(product.unit)} · Tilgjengelig: <b>${available}</b></div>
        <div class="ut-mc-controls">
          <button type="button" class="ut-mc-btn minus" data-adjust="-1" data-product="${esc(product.id)}">−1</button>
          <button type="button" class="ut-mc-btn plus" data-adjust="1" data-product="${esc(product.id)}">+1</button>
          <div class="ut-mc-set">
            <input class="ut-mc-input" data-target="${esc(product.id)}" type="number" min="0" step="1" value="${physical}" aria-label="Faktisk antall ${esc(product.label)}">
            <button type="button" class="ut-mc-setbtn" data-set="${esc(product.id)}">SETT FAKTISK</button>
          </div>
        </div>
      </div>`;
    }).join("");
  }

  function renderHistory(rows = []) {
    const list = document.getElementById("utMcHistoryList");
    if (!list) return;
    if (!rows.length) {
      list.innerHTML = '<div class="ut-mc-empty">Ingen manuelle korrigeringer ennå.</div>';
      return;
    }
    const formatter = new Intl.DateTimeFormat("nb-NO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    list.innerHTML = rows.map((row) => {
      const product = productMeta(String(row.product_id || ""));
      const delta = Number(row.delta) || 0;
      const sign = delta > 0 ? "+" : "";
      const cls = delta > 0 ? "pos" : delta < 0 ? "neg" : "";
      const when = row.created_at ? formatter.format(new Date(row.created_at)) : "";
      return `<div class="ut-mc-history-item">
        <span class="ut-mc-ref">${esc(row.reference_no || "—")}</span>
        <span>${esc(product.label)} · fysisk ${Number(row.physical_after) || 0}</span>
        <span class="ut-mc-delta ${cls}">${sign}${delta}</span>
        <time>${esc(when)}</time>
      </div>`;
    }).join("");
  }

  async function refreshPanel() {
    try {
      const [summary, history] = await Promise.all([
        call({ action: "summary" }),
        call({ action: "history", limit: 8 }),
      ]);
      renderSummary(summary.rows || []);
      renderHistory(history.rows || []);
    } catch (error) {
      setMessage(`Kunne ikke laste lagerkorrigering. ${error.message || error}`, "bad");
    }
  }

  async function refreshOfficeStock() {
    try { await window.BAMA_STOCK_SUMMARY_REFRESH?.(); } catch {}
    try { await window.loadInn?.(); } catch {}
    try { await window.loadUt?.(); } catch {}
    try { window.UT_KONTOR_EXTRA_STOCK?.render?.(); } catch {}
    try { document.dispatchEvent(new CustomEvent("florivo:stock-changed", { detail: { source: "ut-kontor-manual-correction" } })); } catch {}
  }

  async function mutate(productId, action, value) {
    if (state.busy) return;
    const row = state.summary.get(productId);
    const product = productMeta(productId);
    const before = Number(row?.physical_count) || 0;
    const after = action === "adjust" ? before + Number(value) : Number(value);
    if (!Number.isFinite(after) || after < 0) {
      setMessage("Faktisk antall kan ikke være negativt.", "bad");
      return;
    }
    if (after === before) {
      setMessage("Ingen endring.", "ok");
      return;
    }
    if (!confirm(`${product.label}: ${before} → ${after} ${product.unit}.\n\nLagre manuell korrigering?`)) return;

    state.busy = true;
    document.querySelectorAll(".ut-mc-btn,.ut-mc-setbtn,.ut-mc-input").forEach((el) => { el.disabled = true; });
    setMessage("Lagrer…");
    try {
      const result = await call(action === "adjust"
        ? { action: "adjust", product_id: productId, delta: Number(value) }
        : { action: "set", product_id: productId, target: Number(value) });
      const out = result.row || {};
      const ref = out.reference_no || "";
      setMessage(`${ref ? `${ref} · ` : ""}${product.label}: ${before} → ${Number(out.physical_count) || after}. Lagret.`, "ok");
      await Promise.all([refreshPanel(), refreshOfficeStock()]);
    } catch (error) {
      setMessage(`Kunne ikke lagre. ${error.message || error}`, "bad");
    } finally {
      state.busy = false;
      document.querySelectorAll(".ut-mc-btn,.ut-mc-setbtn,.ut-mc-input").forEach((el) => { el.disabled = false; });
    }
  }

  function createUi() {
    ensureStyle();
    if (!document.getElementById("utMcOverlay")) {
      const overlay = document.createElement("div");
      overlay.className = "ut-mc-overlay";
      overlay.id = "utMcOverlay";
      overlay.innerHTML = `<section class="ut-mc-card" role="dialog" aria-modal="true" aria-labelledby="utMcTitle">
        <div class="ut-mc-head"><div class="ut-mc-title" id="utMcTitle">Manuell lagerkorrigering</div><button type="button" class="ut-mc-close" id="utMcClose" aria-label="Lukk">×</button></div>
        <div class="ut-mc-body">
          <p class="ut-mc-note">Korriger fysisk lager. Feil i en bestilling skal fortsatt rettes med <b>Rediger bestilling</b>.</p>
          <div class="ut-mc-grid" id="utMcGrid"><div class="ut-mc-empty">Laster…</div></div>
          <div class="ut-mc-msg" id="utMcMessage"></div>
          <div class="ut-mc-history"><div class="ut-mc-history-title">Siste korrigeringer</div><div class="ut-mc-history-list" id="utMcHistoryList"><div class="ut-mc-empty">Laster…</div></div></div>
        </div>
      </section>`;
      document.body.appendChild(overlay);
      overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
      document.getElementById("utMcClose")?.addEventListener("click", close);
      overlay.addEventListener("click", (event) => {
        const adjust = event.target.closest("[data-adjust]");
        if (adjust) {
          mutate(String(adjust.dataset.product), "adjust", Number(adjust.dataset.adjust));
          return;
        }
        const set = event.target.closest("[data-set]");
        if (set) {
          const id = String(set.dataset.set);
          const input = overlay.querySelector(`[data-target="${CSS.escape(id)}"]`);
          mutate(id, "set", Number.parseInt(String(input?.value || ""), 10));
        }
      });
    }

    if (!document.getElementById("utMcLaunch")) {
      const button = document.createElement("button");
      button.type = "button";
      button.id = "utMcLaunch";
      button.className = "ut-mc-launch";
      button.textContent = "✎ MANUELL KORRIGERING";
      button.addEventListener("click", open);
      const stock = document.getElementById("bamaStockSummary8");
      if (stock?.parentNode) stock.insertAdjacentElement("afterend", button);
      else {
        const form = document.querySelector(".card,#formCard");
        form?.parentNode?.insertBefore(button, form);
      }
    }
  }

  async function open() {
    createUi();
    const overlay = document.getElementById("utMcOverlay");
    overlay?.classList.add("show");
    setMessage("");
    await refreshPanel();
  }

  function close() {
    document.getElementById("utMcOverlay")?.classList.remove("show");
  }

  function decorate() {
    createUi();
  }

  window.UT_KONTOR_MANUAL_CORRECTION = { open, close, refresh: refreshPanel, decorate };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", decorate, { once: true });
  else decorate();
  setTimeout(decorate, 400);
  setTimeout(decorate, 1200);
})();
