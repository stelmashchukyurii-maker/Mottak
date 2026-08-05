"use strict";

(() => {
  if (window.__BAMA_IDEBANK_UI__) return;
  window.__BAMA_IDEBANK_UI__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const TABLE = "idebank_suggestions";
  const BUCKET = "idebank-screenshots";
  const RELEASE = "05.08.2026 kl. 20:55";
  const jsonHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  const fileName = () => location.pathname.split("/").filter(Boolean).pop() || "";
  const isOffice = () => fileName() === "bestilling.html";
  const isMain = () => !window.frameElement && ["", "Mottak", "index.html"].includes(fileName());

  function updateVersion() {
    const version = document.querySelector(".version");
    if (!version) return;
    if (isOffice()) version.innerHTML = `UT Kontor v21 STABIL<br>Oppdatert ${RELEASE}`;
    if (isMain()) version.textContent = `Hovedmeny v19 STABIL · Oppdatert ${RELEASE}`;
  }

  async function api(url, options = {}, timeout = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal, cache: "no-store" });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || `HTTP ${response.status}`);
      return body;
    } finally {
      clearTimeout(timer);
    }
  }

  function addStyles() {
    if (document.getElementById("idebankUiStyles")) return;
    const style = document.createElement("style");
    style.id = "idebankUiStyles";
    style.textContent = `
      .idea-bell{position:fixed;top:max(14px,env(safe-area-inset-top));right:14px;z-index:980;width:57px;height:57px;border:1px solid rgba(117,183,255,.7);border-radius:18px;background:#151c30;color:#fff;display:grid;place-items:center;text-decoration:none;box-shadow:0 14px 34px rgba(0,0,0,.4)}
      .idea-bell-icon{font-size:27px}.idea-badge{position:absolute;top:-7px;right:-7px;min-width:25px;height:25px;padding:0 7px;border:3px solid #0b1020;border-radius:999px;background:#ff4d5e;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:950}.idea-badge[hidden]{display:none}.idea-bell.unread{animation:ideaPulse 1.4s ease-in-out infinite}
      @keyframes ideaPulse{0%,100%{box-shadow:0 14px 34px rgba(0,0,0,.4),0 0 0 0 rgba(255,77,94,.45)}50%{box-shadow:0 14px 34px rgba(0,0,0,.4),0 0 0 13px rgba(255,77,94,0)}}
      .idea-cloud{position:fixed;right:15px;bottom:max(16px,env(safe-area-inset-bottom));z-index:980;min-width:164px;min-height:68px;padding:13px 17px;border:2px solid rgba(72,213,151,.75);border-radius:26px 26px 26px 8px;background:linear-gradient(145deg,#173c31,#151c30);color:#fff;display:flex;align-items:center;gap:10px;box-shadow:0 18px 42px rgba(0,0,0,.44);font-weight:950}.idea-cloud .icon{font-size:27px}.idea-cloud small{display:block;margin-top:3px;color:#aab4ce;font-size:10px;font-weight:700}
      .idea-overlay{position:fixed;inset:0;z-index:1200;padding:18px 14px;background:rgba(3,7,18,.8);display:grid;place-items:center;backdrop-filter:blur(5px)}.idea-overlay[hidden]{display:none}.idea-dialog{width:min(560px,100%);max-height:92vh;overflow:auto;border:1px solid #303b59;border-radius:22px;background:#151c30;color:#f5f7ff;box-shadow:0 30px 80px rgba(0,0,0,.6)}
      .idea-head{display:flex;justify-content:space-between;gap:12px;padding:18px;border-bottom:1px solid #303b59}.idea-head h2{margin:0 0 5px;font-size:24px}.idea-head p{margin:0;color:#aab4ce;font-size:13px}.idea-close{width:42px;height:42px;border:1px solid #303b59;border-radius:13px;background:#0d1426;color:#fff;font-size:24px}.idea-form{padding:18px;display:grid;gap:14px}.idea-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.idea-form label{display:grid;gap:7px;font-size:13px;font-weight:900}.idea-form select,.idea-form textarea,.idea-form input[type=file]{width:100%;padding:12px;border:1px solid #303b59;border-radius:13px;background:#0d1426;color:#f5f7ff;font:inherit}.idea-form textarea{min-height:145px;resize:vertical}.idea-note{color:#aab4ce;font-size:11px;line-height:1.45}.idea-result{min-height:20px;font-size:13px}.idea-result.ok{color:#48d597}.idea-result.error{color:#ff7373}.idea-actions{display:grid;grid-template-columns:1fr auto;gap:10px}.idea-send,.idea-cancel{min-height:50px;padding:11px 15px;border-radius:13px;font-weight:950}.idea-send{border:0;background:#48d597;color:#062418}.idea-cancel{border:1px solid #303b59;background:#0d1426;color:#fff}.idea-send:disabled{opacity:.55}.idea-toast{position:fixed;left:50%;bottom:100px;z-index:1300;transform:translateX(-50%);width:min(420px,calc(100% - 28px));padding:13px;border:1px solid rgba(72,213,151,.7);border-radius:14px;background:#11352a;color:#fff;text-align:center;font-weight:900}
      @media(max-width:560px){.idea-bell{width:52px;height:52px}.idea-cloud{right:12px;bottom:12px;min-width:150px;min-height:62px;padding:11px 14px}.idea-grid,.idea-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function addAdminPageCard() {
    if (!isMain() || typeof pages === "undefined" || !Array.isArray(pages)) return;
    if (pages.some(page => page.id === "idebank-admin")) return;
    const page = {
      id: "idebank-admin",
      section: "overview",
      title: "IDÉBANK — ADMINISTRASJON",
      description: "Les nye forslag, vurder risiko og endre status uten å slette meldinger.",
      href: "idebank-admin.html",
      file: "idebank-admin.html",
      icon: "💬",
      type: "info",
      status: "ADMIN / MONITORERING",
      tags: ["FORSLAG", "FEIL", "STATUS"]
    };
    const index = pages.findIndex(item => item.section === "overview");
    if (index >= 0) pages.splice(index, 0, page); else pages.push(page);
    if (typeof render === "function") render();
  }

  async function unreadCount() {
    const rows = await api(`${SUPABASE_URL}/rest/v1/${TABLE}?select=id&read_at=is.null&limit=1000`, { headers: jsonHeaders });
    return Array.isArray(rows) ? rows.length : 0;
  }

  function addBell() {
    if (!isMain() || document.getElementById("ideaBell")) return;
    addStyles();
    const bell = document.createElement("a");
    bell.id = "ideaBell";
    bell.className = "idea-bell";
    bell.href = "idebank-admin.html";
    bell.setAttribute("aria-label", "Åpne Idébank-administrasjon");
    bell.innerHTML = '<span class="idea-bell-icon">🔔</span><span class="idea-badge" hidden>0</span>';
    document.body.appendChild(bell);
  }

  async function refreshBell() {
    if (!isMain()) return;
    addBell();
    const bell = document.getElementById("ideaBell");
    const badge = bell?.querySelector(".idea-badge");
    try {
      const count = await unreadCount();
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.hidden = count === 0;
      bell.classList.toggle("unread", count > 0);
      bell.title = count ? `${count} uleste forslag` : "Ingen nye forslag";
    } catch {
      badge.hidden = true;
      bell.classList.remove("unread");
      bell.title = "Kunne ikke hente forslag";
    }
  }

  function language() {
    const lang = (document.documentElement.lang || "nb").toLowerCase();
    if (lang.startsWith("pl")) return "PL";
    if (lang.startsWith("uk") || lang.startsWith("ua")) return "UK";
    if (lang.startsWith("en")) return "EN";
    return "NO";
  }

  async function upload(file) {
    if (!file) return { path: null, url: null };
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Bruk JPG, PNG eller WEBP.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Skjermbildet kan være maks. 5 MB.");
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
    const path = `ut-kontor/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${ext}`;
    await api(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": file.type, "x-upsert": "false" },
      body: file
    }, 20000);
    const encoded = path.split("/").map(encodeURIComponent).join("/");
    return { path, url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encoded}` };
  }

  function toast(text) {
    document.querySelector(".idea-toast")?.remove();
    const node = document.createElement("div");
    node.className = "idea-toast";
    node.textContent = text;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 3500);
  }

  function addOfficeCloud() {
    if (!isOffice() || document.getElementById("ideaCloud")) return;
    addStyles();
    const button = document.createElement("button");
    button.id = "ideaCloud";
    button.className = "idea-cloud";
    button.type = "button";
    button.innerHTML = '<span class="icon">💬</span><span>Idébank / Forslag<small>Send feil eller forbedring</small></span>';

    const overlay = document.createElement("div");
    overlay.className = "idea-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <section class="idea-dialog" role="dialog" aria-modal="true" aria-labelledby="ideaTitle">
        <div class="idea-head"><div><h2 id="ideaTitle">💬 Idébank</h2><p>Forslaget lagres for siden UT — Kontor.</p></div><button class="idea-close" type="button" aria-label="Lukk">×</button></div>
        <form class="idea-form">
          <div class="idea-grid">
            <label>Kategori<select name="category" required><option value="">Velg kategori</option><option>Feil</option><option>Forbedring</option><option value="Funksjon">Ny funksjon</option><option>Annet</option></select></label>
            <label>Språk<select name="language"><option value="NO">Norsk</option><option value="PL">Polski</option><option value="UK">Українська</option><option value="EN">English</option></select></label>
          </div>
          <label>Forslag / beskrivelse<textarea name="message" minlength="3" maxlength="4000" required placeholder="Beskriv feilen eller hva som bør forbedres..."></textarea></label>
          <label>Skjermbilde (valgfritt)<input name="screenshot" type="file" accept="image/jpeg,image/png,image/webp"></label>
          <div class="idea-note">JPG, PNG eller WEBP · maks. 5 MB. Meldingen får status <strong>Ny</strong>. Ingenting implementeres eller slettes automatisk.</div>
          <div class="idea-result" aria-live="polite"></div>
          <div class="idea-actions"><button class="idea-send" type="submit">Send forslag</button><button class="idea-cancel" type="button">Avbryt</button></div>
        </form>
      </section>`;
    document.body.append(button, overlay);

    const form = overlay.querySelector("form");
    const result = overlay.querySelector(".idea-result");
    const send = overlay.querySelector(".idea-send");
    form.elements.language.value = language();
    const close = () => { if (send.disabled) return; overlay.hidden = true; document.body.style.overflow = ""; result.textContent = ""; result.className = "idea-result"; };
    button.addEventListener("click", () => { overlay.hidden = false; document.body.style.overflow = "hidden"; setTimeout(() => form.elements.category.focus(), 0); });
    overlay.querySelector(".idea-close").addEventListener("click", close);
    overlay.querySelector(".idea-cancel").addEventListener("click", close);
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !overlay.hidden) close(); });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      send.disabled = true;
      result.textContent = "Sender…";
      result.className = "idea-result";
      try {
        const message = form.elements.message.value.trim();
        if (message.length < 3) throw new Error("Skriv minst 3 tegn.");
        const image = await upload(form.elements.screenshot.files[0]);
        await api(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
          method: "POST",
          headers: { ...jsonHeaders, Prefer: "return=representation" },
          body: JSON.stringify({
            page_name: "UT — Kontor",
            category: form.elements.category.value,
            message,
            language: form.elements.language.value,
            screenshot_path: image.path,
            screenshot_url: image.url,
            user_label: "UT Kontor",
            user_agent: navigator.userAgent.slice(0,500)
          })
        });
        form.reset();
        form.elements.language.value = language();
        result.textContent = "Forslaget er sendt.";
        result.className = "idea-result ok";
        setTimeout(() => { overlay.hidden = true; document.body.style.overflow = ""; toast("Takk! Forslaget er lagret med status Ny."); }, 600);
      } catch (error) {
        result.textContent = error?.message || "Kunne ikke sende forslaget.";
        result.className = "idea-result error";
      } finally {
        send.disabled = false;
      }
    });
  }

  function start() {
    updateVersion();
    addAdminPageCard();
    addBell();
    addOfficeCloud();
    refreshBell();
    if (isMain()) {
      setInterval(refreshBell, 30000);
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refreshBell(); });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();