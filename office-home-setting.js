"use strict";

(() => {
  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const SETTING_KEY = "ut_office_home_button";
  const LEGACY_LOCAL_KEY = "bamavaremottak_home_return_v1:bestilling.html";
  const REFRESH_MS = 5000;

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  function isOfficePage() {
    return location.pathname.endsWith("/bestilling.html") || location.pathname.endsWith("bestilling.html");
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
            ? "Synkronisering feilet"
            : "Felles for telefon og PC";
    }
  }

  function apply(enabled, status = "") {
    setLegacyValue(enabled);
    updateSwitch(enabled, status);

    if (isOfficePage()) {
      const links = officeHomeLinks();
      links.forEach(link => {
        link.hidden = !enabled;
        link.style.display = enabled ? "" : "none";
        link.setAttribute("aria-hidden", enabled ? "false" : "true");
      });

      const fallback = document.getElementById("bamaHomeReturn");
      if (fallback) {
        fallback.hidden = !enabled;
        fallback.style.display = enabled ? "" : "none";
      }
    }
  }

  async function readSetting() {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/app_settings?key=eq.${encodeURIComponent(SETTING_KEY)}&select=bool_value&limit=1`,
      { headers, cache: "no-store" }
    );
    const rows = await response.json().catch(() => []);
    if (!response.ok) throw new Error(rows?.message || `HTTP ${response.status}`);
    return rows.length ? Boolean(rows[0].bool_value) : true;
  }

  async function writeSetting(enabled) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/app_settings`, {
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

  async function refresh() {
    if (busy) return;
    try {
      const enabled = await readSetting();
      currentValue = enabled;
      apply(enabled);
    } catch {
      apply(currentValue, "error");
    }
  }

  async function handleChange(event) {
    const input = event.target.closest("#officeHomeSwitch");
    if (!input || busy) return;
    const requested = input.checked;
    busy = true;
    apply(requested, "saving");
    try {
      currentValue = await writeSetting(requested);
      apply(currentValue);
    } catch {
      apply(currentValue, "error");
    } finally {
      busy = false;
    }
  }

  document.addEventListener("change", handleChange);
  document.addEventListener("DOMContentLoaded", () => {
    updateSwitch(currentValue, "loading");
    refresh();
  });
  window.addEventListener("pageshow", refresh);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh();
  });
  setInterval(refresh, REFRESH_MS);
})();
