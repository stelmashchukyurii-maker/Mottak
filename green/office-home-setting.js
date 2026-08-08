"use strict";

(() => {
  if (window.__BAMA_OFFICE_HOME_SETTING__) return;
  window.__BAMA_OFFICE_HOME_SETTING__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const SETTING_KEY = "ut_office_home_button";
  const LEGACY_LOCAL_KEY = "bamavaremottak_home_return_v1:bestilling.html";
  const LATEST_CAMERA_HREF = "camera-live-v414.html";

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  function isOfficePage() {
    return location.pathname.endsWith("/bestilling.html") || location.pathname.endsWith("bestilling.html");
  }

  function isMainPage() {
    const file = location.pathname.split("/").filter(Boolean).pop() || "";
    return !window.frameElement && (file === "index.html" || file === "Mottak" || file === "");
  }

  function ensureLatestCameraLinks() {
    if (!isMainPage()) return false;
    if (typeof pages === "undefined" || !Array.isArray(pages)) return false;

    let changed = false;
    pages.forEach(page => {
      if (page.id === "camera-v4" || page.id === "inn-camera") {
        if (page.href !== LATEST_CAMERA_HREF) {
          page.href = LATEST_CAMERA_HREF;
          changed = true;
        }
        if (page.id === "camera-v4") {
          page.title = "SISTE ARBEIDSLENKE — KAMERA CLOUD v4.14";
          page.status = "SISTE VERSJON";
        }
      }
    });
    return changed;
  }

  function ensureLagerstatusPage() {
    if (!isMainPage()) return false;

    document.getElementById("lagerstatusMainCard")?.remove();

    if (typeof pages === "undefined" || !Array.isArray(pages)) return false;
    if (pages.some(page => page.id === "lagerstatus")) return false;

    const lagerstatusPage = {
      id: "lagerstatus",
      section: "ut",
      title: "LAGERSTATUS / HISTORIKK",
      description: "Administrer lagerstatus, markering som sendt og manuell retur uten skanning.",
      href: "lagerstatus.html",
      file: "lagerstatus.html",
      icon: "📦",
      type: "approved",
      status: "GODKJENT · MANUELL RETUR",
      tags: ["LAGERSTATUS", "HISTORIKK", "RETUR"]
    };

    const warehouseIndex = pages.findIndex(page => page.id === "ut-warehouse");
    if (warehouseIndex >= 0) pages.splice(warehouseIndex + 1, 0, lagerstatusPage);
    else pages.push(lagerstatusPage);

    return true;
  }

  function renderMainEnhancements() {
    const cameraChanged = ensureLatestCameraLinks();
    const lagerstatusAdded = ensureLagerstatusPage();
    if ((cameraChanged || lagerstatusAdded) && typeof render === "function") render();
  }

  function setLegacyValue(enabled) {
    try {
      localStorage.setItem(LEGACY_LOCAL_KEY, enabled ? "true" : "false");
    } catch {}
  }

  function officeHomeLinks() {
    return [...document.querySelectorAll('a[href]')].filter(link => {
      try {
        return new URL(link.getAttribute("href"), location.href).pathname.endsWith("/index.html");
      } catch {
        return false;
      }
    });
  }

  function updateSwitch(enabled, status = "") {
    const input = document.getElementById("officeHomeSwitch");
    const state = document.getElementById("officeHomeState");
    const note = document.getElementById("officeHomeStatus");

    if (input) {
      input.checked = enabled;
      input.disabled = status === "loading" || status === "saving";
    }
    if (state) state.textContent = enabled ? "PÅ" : "AV";
    if (note) {
      note.textContent = status === "loading"
        ? "Laster…"
        : status === "saving"
          ? "Lagrer…"
          : status === "error"
            ? "Kunne ikke synkronisere"
            : "Lagret felles for telefon og PC";
    }
  }

  function apply(enabled, status = "") {
    setLegacyValue(enabled);
    updateSwitch(enabled, status);

    if (!isOfficePage()) return;
    officeHomeLinks().forEach(link => {
      link.hidden = !enabled;
      link.style.display = enabled ? "" : "none";
      link.setAttribute("aria-hidden", enabled ? "false" : "true");
    });
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function readSetting() {
    const response = await fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/app_settings?key=eq.${encodeURIComponent(SETTING_KEY)}&select=bool_value&limit=1`,
      { headers, cache: "no-store" }
    );
    const rows = await response.json().catch(() => []);
    if (!response.ok) throw new Error(rows?.message || `HTTP ${response.status}`);
    return rows.length ? Boolean(rows[0].bool_value) : true;
  }

  async function writeSetting(enabled) {
    const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/app_settings`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify({
        key: SETTING_KEY,
        bool_value: Boolean(enabled),
        updated_at: new Date().toISOString()
      })
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || `HTTP ${response.status}`);
    return Boolean(Array.isArray(body) && body[0] ? body[0].bool_value : enabled);
  }

  let currentValue = true;
  let busy = false;

  async function start() {
    renderMainEnhancements();
    updateSwitch(currentValue, "loading");
    try {
      currentValue = await readSetting();
      apply(currentValue);
    } catch {
      apply(currentValue, "error");
    }
  }

  async function handleChange(event) {
    const input = event.target.closest("#officeHomeSwitch");
    if (!input || busy) return;

    const previous = currentValue;
    const requested = input.checked;
    busy = true;
    apply(requested, "saving");

    try {
      currentValue = await writeSetting(requested);
      apply(currentValue);
    } catch {
      currentValue = previous;
      apply(currentValue, "error");
    } finally {
      busy = false;
    }
  }

  document.addEventListener("change", handleChange);
  document.addEventListener("bama:office-switch-rendered", () => {
    apply(currentValue);
    ensureLatestCameraLinks();
    ensureLagerstatusPage();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

(() => {
  if (!document.querySelector('script[data-bama-idebank]')) {
    const script = document.createElement("script");
    script.src = "idebank-ui.js?v=20260806-0655";
    script.defer = true;
    script.dataset.bamaIdebank = "true";
    document.head.appendChild(script);
  }

  if (!document.querySelector('script[data-bama-ramp-notifications]')) {
    const script = document.createElement("script");
    script.src = "ramp-notifications.js?v=20260806-0700";
    script.defer = true;
    script.dataset.bamaRampNotifications = "true";
    document.head.appendChild(script);
  }
})();

(() => {
  if (window.__BAMA_PIN_REMOVE_LOCK__) return;
  window.__BAMA_PIN_REMOVE_LOCK__ = true;

  const isMainPage = () => {
    const file = location.pathname.split("/").filter(Boolean).pop() || "";
    return !window.frameElement && (file === "index.html" || file === "Mottak" || file === "");
  };
  if (!isMainPage()) return;

  let unlocked = false;
  let relockTimer = 0;
  let hintTimer = 0;

  function ensureStyle() {
    if (document.getElementById("bamaPinLockStyle")) return;
    const style = document.createElement("style");
    style.id = "bamaPinLockStyle";
    style.textContent = `
      #bamaPinLockBar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px}
      #bamaPinLockButton{min-height:42px;padding:8px 12px;border:1px solid #f4c430;border-radius:12px;background:#0d1426;color:#f4c430;font-weight:950;touch-action:manipulation}
      #bamaPinLockButton.unlocked{border-color:#48d597;background:#143b30;color:#dfffee}
      #bamaPinLockHint{flex:1;min-width:180px;color:#aab4ce;font-size:11px;line-height:1.35}
      #bamaPinLockHint.warn{color:#f6b94b}
      .unpin.pin-remove-locked,.pin.active.pin-remove-locked{filter:saturate(.7);box-shadow:inset 0 0 0 2px rgba(255,255,255,.08)}
    `;
    document.head.appendChild(style);
  }

  function protectedButtons() {
    return [...document.querySelectorAll("[data-unpin], [data-pin].active")];
  }

  function paint() {
    const button = document.getElementById("bamaPinLockButton");
    const hint = document.getElementById("bamaPinLockHint");
    if (button) {
      button.textContent = unlocked ? "🔓 Redigering i 60 s" : "🔒 Festede sider";
      button.classList.toggle("unlocked", unlocked);
      button.setAttribute("aria-pressed", unlocked ? "true" : "false");
    }
    if (hint && !hint.dataset.message) {
      hint.textContent = unlocked
        ? "Du kan fjerne festede sider nå. Låses automatisk igjen."
        : "Festede sider kan ikke fjernes ved et uhell.";
    }
    protectedButtons().forEach(node => node.classList.toggle("pin-remove-locked", !unlocked));
  }

  function showHint(text) {
    const hint = document.getElementById("bamaPinLockHint");
    if (!hint) return;
    clearTimeout(hintTimer);
    hint.dataset.message = "1";
    hint.textContent = text;
    hint.classList.add("warn");
    hintTimer = setTimeout(() => {
      hint.dataset.message = "";
      hint.classList.remove("warn");
      paint();
    }, 2400);
  }

  function lock() {
    unlocked = false;
    clearTimeout(relockTimer);
    paint();
  }

  function unlock() {
    unlocked = true;
    clearTimeout(relockTimer);
    relockTimer = setTimeout(lock, 60000);
    paint();
  }

  function ensureBar() {
    ensureStyle();
    const pinned = document.getElementById("pinned");
    const grid = document.getElementById("pinnedGrid");
    if (!pinned || !grid) return;

    let bar = document.getElementById("bamaPinLockBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "bamaPinLockBar";
      bar.innerHTML = `
        <button id="bamaPinLockButton" type="button" aria-pressed="false">🔒 Festede sider</button>
        <span id="bamaPinLockHint">Festede sider kan ikke fjernes ved et uhell.</span>`;
      pinned.insertBefore(bar, grid);
      document.getElementById("bamaPinLockButton").addEventListener("click", () => unlocked ? lock() : unlock());
    }
    paint();
  }

  document.addEventListener("click", event => {
    const remove = event.target.closest?.("[data-unpin]");
    const toggle = event.target.closest?.("[data-pin]");
    const isRemoval = Boolean(remove || (toggle && toggle.classList.contains("active")));
    if (!isRemoval || unlocked) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    showHint("🔒 Закладка захищена. Натисніть замок, щоб дозволити зняття на 60 секунд.");
  }, true);

  document.addEventListener("bama:office-switch-rendered", () => queueMicrotask(() => {
    ensureBar();
    paint();
  }));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      ensureBar();
      const version = document.querySelector(".version");
      if (version) version.textContent = "Hovedmeny v18.1 PIN-LÅS · Oppdatert 07.08.2026 kl. 22:25";
    }, { once: true });
  } else {
    ensureBar();
    const version = document.querySelector(".version");
    if (version) version.textContent = "Hovedmeny v18.1 PIN-LÅS · Oppdatert 07.08.2026 kl. 22:25";
  }
})();
