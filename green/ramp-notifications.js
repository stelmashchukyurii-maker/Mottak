"use strict";

(() => {
  if (window.__BAMA_RAMP_NOTIFICATIONS__) return;
  window.__BAMA_RAMP_NOTIFICATIONS__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const HEADERS = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  let rampRows = [];
  let ideaCount = 0;
  let busy = false;

  function isMainPage() {
    const file = location.pathname.split("/").filter(Boolean).pop() || "";
    return !window.frameElement && ["", "Mottak", "index.html"].includes(file);
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  async function api(path, timeoutMs = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: HEADERS,
        signal: controller.signal,
        cache: "no-store"
      });
      const body = await response.json().catch(() => []);
      if (!response.ok) throw new Error(body?.message || `HTTP ${response.status}`);
      return Array.isArray(body) ? body : [];
    } finally {
      clearTimeout(timer);
    }
  }

  function installStyle() {
    if (document.getElementById("rampNotificationCss")) return;
    const style = document.createElement("style");
    style.id = "rampNotificationCss";
    style.textContent = `
      .ramp-badge{
        position:absolute;left:-10px;bottom:-9px;min-width:29px;height:29px;max-width:92px;padding:0 7px;
        display:grid;place-items:center;border:3px solid #0b1020;border-radius:999px;
        background:#ff7a3d;color:#fff;font:950 12px Arial,sans-serif;white-space:nowrap;overflow:hidden
      }
      .ramp-badge[hidden]{display:none}
      .ibell.ramp-hot{animation:rampBellPulse 1.35s infinite}
      @keyframes rampBellPulse{
        0%,100%{transform:scale(1);box-shadow:0 14px 34px #0008,0 0 0 0 #ff7a3d66}
        50%{transform:scale(1.035);box-shadow:0 14px 34px #0008,0 0 0 13px #ff7a3d00}
      }
      .ramp-notification-panel{
        position:fixed;top:80px;right:14px;z-index:1100;width:min(430px,calc(100% - 28px));
        max-height:min(72vh,650px);overflow:auto;border:1px solid #303b59;border-radius:18px;
        background:#151c30;color:#f5f7ff;box-shadow:0 22px 55px #000b
      }
      .ramp-notification-panel[hidden]{display:none}
      .rnp-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 15px;border-bottom:1px solid #303b59;background:#151c30}
      .rnp-head strong{display:block;font-size:18px}.rnp-head small{display:block;margin-top:3px;color:#aab4ce}
      .rnp-close{width:38px;height:38px;border:1px solid #303b59;border-radius:11px;background:#0d1426;color:#fff;font-size:22px}
      .rnp-body{display:grid;gap:9px;padding:12px}
      .rnp-section-title{margin:2px 2px 0;color:#aab4ce;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
      .rnp-item{display:block;padding:12px;border:1px solid #303b59;border-radius:13px;background:#0d1426;color:#f5f7ff;text-decoration:none}
      .rnp-item.ramp{border-color:#ff7a3d99;background:#ff7a3d12}
      .rnp-item.idea{border-color:#75b7ff88;background:#75b7ff10}
      .rnp-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
      .rnp-title{font-weight:950}.rnp-time{color:#aab4ce;font-size:11px;white-space:nowrap}
      .rnp-details{margin-top:6px;color:#dbe4fb;font-size:13px;line-height:1.45}
      .rnp-note{margin-top:5px;color:#aab4ce;font-size:12px;line-height:1.4}
      .rnp-empty{padding:18px 12px;text-align:center;color:#aab4ce}
      .rnp-error{padding:12px;border:1px solid #ff737388;border-radius:12px;color:#ffb0b0}
      @media(max-width:560px){.ramp-notification-panel{top:76px;right:10px;width:calc(100% - 20px)}}
    `;
    document.head.appendChild(style);
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat("nb-NO", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(value));
    } catch {
      return "";
    }
  }

  function orderDetails(order) {
    const parts = [];
    const bunner = Number(order.bunner_stacks) || 0;
    const h30 = Number(order.hyller30_sets) || 0;
    const h60 = Number(order.hyller60_sets) || 0;
    if (bunner) parts.push(`${bunner} ${bunner === 1 ? "stabel" : "stabler"} Bunner`);
    if (h30) parts.push(`${h30} Hyller x30`);
    if (h60) parts.push(`${h60} Hyller x60`);
    return parts.join(" · ") || "Ingen varer registrert";
  }

  function orderState(order) {
    const labels = {
      new: "Ny",
      received: "Mottatt",
      in_progress: "I arbeid",
      problem: "Problem",
      staged: "På rampe"
    };
    return labels[order.status] || "Aktiv";
  }

  function activeRampNumbers() {
    return [...new Set(rampRows.map(row => String(row.ramp || "").trim()).filter(Boolean))]
      .sort((a, b) => Number(a) - Number(b));
  }

  function ensureBell() {
    const bell = document.getElementById("ideaBell");
    if (!bell) return null;
    bell.setAttribute("aria-haspopup", "dialog");
    bell.setAttribute("aria-expanded", "false");
    let badge = bell.querySelector(".ramp-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "ramp-badge";
      badge.hidden = true;
      badge.textContent = "";
      bell.appendChild(badge);
    }
    return bell;
  }

  function ensurePanel() {
    let panel = document.getElementById("rampNotificationPanel");
    if (panel) return panel;
    panel = document.createElement("section");
    panel.id = "rampNotificationPanel";
    panel.className = "ramp-notification-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Varsler");
    panel.innerHTML = `
      <div class="rnp-head">
        <div><strong>🔔 Varsler</strong><small id="rnpSummary">Laster…</small></div>
        <button class="rnp-close" type="button" aria-label="Lukk">×</button>
      </div>
      <div class="rnp-body" id="rnpBody"><div class="rnp-empty">Laster varsler…</div></div>`;
    document.body.appendChild(panel);
    panel.querySelector(".rnp-close").addEventListener("click", closePanel);
    return panel;
  }

  function render() {
    const bell = ensureBell();
    const panel = ensurePanel();
    if (!bell || !panel) return;

    const badge = bell.querySelector(".ramp-badge");
    const ramps = activeRampNumbers();
    const rampCount = ramps.length;
    const fullRampLabel = ramps.join(" · ");
    badge.textContent = rampCount <= 3 ? fullRampLabel : `${ramps.slice(0, 2).join("·")}+${rampCount - 2}`;
    badge.title = fullRampLabel ? `Aktive ramper: ${fullRampLabel}` : "Ingen aktive ramper";
    badge.hidden = rampCount === 0;
    bell.classList.toggle("ramp-hot", rampCount > 0);

    const total = rampCount + ideaCount;
    document.getElementById("rnpSummary").textContent = total
      ? `${rampCount} aktive ramper · ${ideaCount} nye meldinger`
      : "Ingen nye varsler";

    const body = document.getElementById("rnpBody");
    const blocks = [];

    if (rampRows.length) {
      blocks.push('<div class="rnp-section-title">Aktive ramper — til avgang er bekreftet</div>');
      blocks.push(...rampRows.map(order => `
        <a class="rnp-item ramp" href="utsending.html">
          <div class="rnp-top">
            <span class="rnp-title">🚚 RAMPE ${esc(order.ramp || "—")} · ${esc(orderState(order))}</span>
            <span class="rnp-time">${esc(formatDate(order.created_at))}</span>
          </div>
          <div class="rnp-details">${esc(orderDetails(order))}</div>
          <div class="rnp-note">${esc(order.order_number || "Lageroppdrag")}${order.office_note ? ` · ${esc(order.office_note)}` : ""}</div>
        </a>`));
    }

    if (ideaCount) {
      blocks.push('<div class="rnp-section-title">Idébank</div>');
      blocks.push(`
        <a class="rnp-item idea" href="idebank-admin.html">
          <div class="rnp-top"><span class="rnp-title">💬 ${ideaCount} nye meldinger</span><span>→</span></div>
          <div class="rnp-note">Åpne Idébank — administrasjon</div>
        </a>`);
    }

    body.innerHTML = blocks.length ? blocks.join("") : '<div class="rnp-empty">Ingen nye varsler.</div>';
  }

  async function refresh() {
    if (busy || !isMainPage()) return;
    busy = true;
    try {
      const [orders, ideas] = await Promise.all([
        api("ut_orders?select=id,order_number,ramp,bunner_stacks,hyller30_sets,hyller60_sets,office_note,status,test_state,created_at&status=in.(new,received,in_progress,problem,staged)&order=created_at.desc&limit=50"),
        api("idebank_suggestions?select=id&read_at=is.null&limit=1000")
      ]);
      rampRows = orders;
      ideaCount = ideas.length;
      render();
    } catch (error) {
      const panel = ensurePanel();
      const body = panel?.querySelector("#rnpBody");
      if (body && !panel.hidden) body.innerHTML = `<div class="rnp-error">Kunne ikke laste varsler: ${esc(error.message || error)}</div>`;
    } finally {
      busy = false;
    }
  }

  function openPanel() {
    const bell = ensureBell();
    const panel = ensurePanel();
    if (!bell || !panel) return;
    panel.hidden = false;
    bell.setAttribute("aria-expanded", "true");
    refresh();
  }

  function closePanel() {
    const bell = ensureBell();
    const panel = ensurePanel();
    if (panel) panel.hidden = true;
    if (bell) bell.setAttribute("aria-expanded", "false");
  }

  function togglePanel() {
    const panel = ensurePanel();
    if (!panel || panel.hidden) openPanel();
    else closePanel();
  }

  function start() {
    if (!isMainPage()) return;
    installStyle();
    ensurePanel();

    const waitForBell = setInterval(() => {
      if (!ensureBell()) return;
      clearInterval(waitForBell);
      refresh();
    }, 120);
    setTimeout(() => clearInterval(waitForBell), 8000);

    document.addEventListener("click", event => {
      const bell = event.target.closest("#ideaBell");
      if (bell) {
        event.preventDefault();
        event.stopImmediatePropagation();
        togglePanel();
        return;
      }
      const panel = document.getElementById("rampNotificationPanel");
      if (panel && !panel.hidden && !event.target.closest("#rampNotificationPanel")) closePanel();
    }, true);

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closePanel();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh();
    });

    setInterval(refresh, 30000);

    const version = document.querySelector(".version");
    if (version) version.textContent = "Hovedmeny v22 STABIL · Oppdatert 06.08.2026 kl. 07:00";
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start, { once: true })
    : start();
})();
