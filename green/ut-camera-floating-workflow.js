"use strict";

(() => {
  if (window.__UT_FLOATING_WORKFLOW__) return;
  window.__UT_FLOATING_WORKFLOW__ = true;

  const PANEL_ID = "utFloatingWorkflow";
  const AI_KEY = "ut_camera_floating_ai_v1";
  const COLLAPSE_KEY = "ut_camera_floating_collapsed_v1";
  let aiProvider = localStorage.getItem(AI_KEY) === "openai" ? "openai" : "gemini";
  let lastPhase = "";

  const PRODUCT_SHORT = { bunner: "B", hyller30: "H-30", hyller60: "H-60" };
  const COPY = {
    nb: {
      photo: "📷 FOTO", read: "🔍 LES NUMMER", choose: "VELG PRODUKT", register: "📥 REGISTRER PÅ LAGER",
      send: "→ SEND TIL RAMPE", next: "📷 NESTE", retry: "↩ NYTT FOTO", busy: "⏳ BEHANDLER…",
      checking: "Sjekker lageret…", found: "✅ FUNNET PÅ LAGER", missing: "⚠ IKKE PÅ LAGER",
      registered: "✅ REGISTRERT PÅ LAGER", added: "✅ LAGT PÅ RAMPE", kept: "✅ BEHOLDT PÅ LAGER",
      blocked: "⚠ KAN IKKE FLYTTES", error: "❌ FEIL", ai: "AI", ramp: "RAMPE"
    },
    pl: {
      photo: "📷 FOTO", read: "🔍 ODCZYTAJ", choose: "WYBIERZ PRODUKT", register: "📥 PRZYJMIJ NA MAGAZYN",
      send: "→ WYŚLIJ NA RAMPĘ", next: "📷 NASTĘPNE", retry: "↩ NOWE FOTO", busy: "⏳ PRZETWARZANIE…",
      checking: "Sprawdzam magazyn…", found: "✅ ZNALEZIONO NA MAGAZYNIE", missing: "⚠ BRAK NA MAGAZYNIE",
      registered: "✅ PRZYJĘTO NA MAGAZYN", added: "✅ DODANO NA RAMPĘ", kept: "✅ ZOSTAŁO NA MAGAZYNIE",
      blocked: "⚠ NIE MOŻNA PRZENIEŚĆ", error: "❌ BŁĄD", ai: "AI", ramp: "RAMPA"
    },
    uk: {
      photo: "📷 ФОТО", read: "🔍 РОЗПІЗНАТИ", choose: "ВИБЕРІТЬ ПРОДУКТ", register: "📥 ОПРИБУТКУВАТИ",
      send: "→ НА РАМПУ", next: "📷 НАСТУПНЕ", retry: "↩ НОВЕ ФОТО", busy: "⏳ ОБРОБКА…",
      checking: "Перевіряю склад…", found: "✅ ЗНАЙДЕНО НА СКЛАДІ", missing: "⚠ НЕМАЄ НА СКЛАДІ",
      registered: "✅ ОПРИБУТКОВАНО НА СКЛАД", added: "✅ ДОДАНО НА РАМПУ", kept: "✅ ЗАЛИШЕНО НА СКЛАДІ",
      blocked: "⚠ НЕ МОЖНА ПЕРЕМІСТИТИ", error: "❌ ПОМИЛКА", ai: "AI", ramp: "РАМПА"
    }
  };

  function langCode() {
    try { return COPY[lang] ? lang : "nb"; } catch { return "nb"; }
  }
  function t() { return COPY[langCode()] || COPY.nb; }
  function code() { return String(document.getElementById("lowerInput")?.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6); }
  function imageReady() { try { return Boolean(imageData); } catch { return false; } }
  function isBusy() { try { return Boolean(busy); } catch { return false; } }
  function rampName() { try { return order?.ramp || RAMP_PARAM || "—"; } catch { return "—"; } }
  function flow() { return window.UT_FLOAT_STATE || { phase: "idle", code: "", row: null, selectedProduct: "", message: "" }; }

  const style = document.createElement("style");
  style.id = "utFloatingWorkflowStyle";
  style.textContent = `
    #${PANEL_ID}{position:fixed;right:max(10px,env(safe-area-inset-right));bottom:calc(10px + env(safe-area-inset-bottom));z-index:2147483000;display:flex;flex-direction:column;align-items:flex-end;gap:7px;font-family:Arial,Helvetica,sans-serif;pointer-events:none}
    #${PANEL_ID} *{box-sizing:border-box}#${PANEL_ID} button{pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent;cursor:pointer}
    #${PANEL_ID} .ut-float-status{width:min(350px,calc(100vw - 20px));padding:10px 12px;border:2px solid #303b59;border-radius:14px;background:rgba(13,20,38,.97);color:#f5f7ff;box-shadow:0 10px 28px rgba(0,0,0,.45);backdrop-filter:blur(10px)}
    #${PANEL_ID} .ut-float-status[hidden]{display:none}#${PANEL_ID} .ut-float-status strong{display:block;font-size:15px;line-height:1.25}#${PANEL_ID} .ut-float-status span{display:block;margin-top:4px;color:#cbd5eb;font-size:12px;line-height:1.35}
    #${PANEL_ID}[data-tone="ok"] .ut-float-status{border-color:#48d597;background:rgba(15,52,39,.97)}#${PANEL_ID}[data-tone="warn"] .ut-float-status{border-color:#f6b94b;background:rgba(55,39,10,.98)}#${PANEL_ID}[data-tone="bad"] .ut-float-status{border-color:#ff7373;background:rgba(59,23,32,.98)}#${PANEL_ID}[data-tone="info"] .ut-float-status{border-color:#75b7ff}
    #${PANEL_ID} .ut-float-products{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:min(350px,calc(100vw - 20px));padding:7px;border:2px solid #f6b94b;border-radius:14px;background:rgba(13,20,38,.98);pointer-events:auto}#${PANEL_ID} .ut-float-products[hidden]{display:none}
    #${PANEL_ID} .ut-product-choice{min-height:46px;border:1px solid #303b59;border-radius:10px;background:#151c30;color:#f5f7ff;font-size:14px;font-weight:950}#${PANEL_ID} .ut-product-choice.active{border-color:#f4c430;background:#f4c430;color:#17130a}
    #${PANEL_ID} .ut-float-bar{display:grid;grid-template-columns:auto auto minmax(116px,auto) auto;gap:5px;align-items:stretch;padding:6px;border:2px solid #f4c430;border-radius:17px;background:rgba(13,20,38,.97);box-shadow:0 12px 32px rgba(0,0,0,.52);backdrop-filter:blur(12px);pointer-events:auto}
    #${PANEL_ID} .ut-ramp-badge{display:grid;place-items:center;min-width:69px;min-height:56px;padding:5px 7px;border-radius:11px;background:#75b7ff;color:#071a2e;font-size:10px;font-weight:950;text-align:center;line-height:1.05}#${PANEL_ID} .ut-ramp-badge strong{display:block;margin-top:2px;font-size:19px}
    #${PANEL_ID} .ut-ai{display:grid;grid-template-rows:auto 1fr;min-width:88px;min-height:56px;padding:4px;gap:3px;border:1px solid #303b59;border-radius:11px;background:#10182b}#${PANEL_ID} .ut-ai-title{color:#aab4ce;font-size:8px;font-weight:950;text-align:center;line-height:1}#${PANEL_ID} .ut-ai-buttons{display:grid;grid-template-columns:1fr 1fr;gap:3px}#${PANEL_ID} .ut-ai-choice{min-height:34px;padding:3px;border:1px solid #303b59;border-radius:7px;background:#151c30;color:#dbe4f7;font-size:8px;font-weight:950}#${PANEL_ID} .ut-ai-choice.active{border-color:#48d597;background:#164534;color:#fff}
    #${PANEL_ID} .ut-main-action{min-height:56px;padding:8px 11px;border:0;border-radius:11px;background:#f4c430;color:#17130a;font-size:15px;font-weight:950;white-space:nowrap}#${PANEL_ID} .ut-main-action:disabled{opacity:.55;cursor:not-allowed}#${PANEL_ID}[data-action="read"] .ut-main-action{background:#75b7ff;color:#071a2e}#${PANEL_ID}[data-action="send"],#${PANEL_ID}[data-action="register"] .ut-main-action{background:#48d597;color:#062418}#${PANEL_ID}[data-action="busy"] .ut-main-action{background:#64748b;color:#fff}#${PANEL_ID}[data-action="retry"] .ut-main-action{background:#f6b94b;color:#241600}
    #${PANEL_ID} .ut-collapse{width:38px;min-height:56px;border:1px solid #303b59;border-radius:11px;background:#151c30;color:#f5f7ff;font-size:18px;font-weight:950}
    #${PANEL_ID}.collapsed .ut-float-status,#${PANEL_ID}.collapsed .ut-float-products,#${PANEL_ID}.collapsed .ut-ai{display:none!important}#${PANEL_ID}.collapsed .ut-float-bar{grid-template-columns:auto auto auto}#${PANEL_ID}.collapsed .ut-ramp-badge{min-width:52px}#${PANEL_ID}.collapsed .ut-main-action{min-width:56px;font-size:0}#${PANEL_ID}.collapsed .ut-main-action::before{content:attr(data-icon);font-size:22px}
    @media(max-width:390px){#${PANEL_ID} .ut-float-bar{grid-template-columns:auto 78px minmax(98px,auto) auto}#${PANEL_ID} .ut-ramp-badge{min-width:58px}#${PANEL_ID} .ut-ai{min-width:78px}#${PANEL_ID} .ut-main-action{padding-inline:8px;font-size:13px}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.classList.toggle("collapsed", localStorage.getItem(COLLAPSE_KEY) === "1");
  panel.innerHTML = `
    <div class="ut-float-status" hidden><strong></strong><span></span></div>
    <div class="ut-float-products" hidden>
      <button class="ut-product-choice" type="button" data-product="bunner">B</button>
      <button class="ut-product-choice" type="button" data-product="hyller30">H-30</button>
      <button class="ut-product-choice" type="button" data-product="hyller60">H-60</button>
    </div>
    <div class="ut-float-bar">
      <div class="ut-ramp-badge"><span>${t().ramp}</span><strong>—</strong></div>
      <div class="ut-ai"><div class="ut-ai-title">AI</div><div class="ut-ai-buttons"><button class="ut-ai-choice" type="button" data-ai="gemini">G</button><button class="ut-ai-choice" type="button" data-ai="openai">O</button></div></div>
      <button class="ut-main-action" type="button">📷 FOTO</button>
      <button class="ut-collapse" type="button">−</button>
    </div>
  `;
  document.body.appendChild(panel);

  const status = panel.querySelector(".ut-float-status");
  const statusTitle = status.querySelector("strong");
  const statusDetail = status.querySelector("span");
  const products = panel.querySelector(".ut-float-products");
  const productButtons = [...panel.querySelectorAll(".ut-product-choice")];
  const action = panel.querySelector(".ut-main-action");
  const collapse = panel.querySelector(".ut-collapse");
  const rampBadge = panel.querySelector(".ut-ramp-badge");

  function setAi(provider) {
    aiProvider = provider === "openai" ? "openai" : "gemini";
    localStorage.setItem(AI_KEY, aiProvider);
    panel.querySelectorAll("[data-ai]").forEach(b => b.classList.toggle("active", b.dataset.ai === aiProvider));
  }

  function availableProduct(product) {
    const source = document.querySelector(`#utRegProducts [data-ut-reg-product="${product}"]`);
    return source ? !source.hidden : true;
  }

  function showStatus(tone, title, detail = "") {
    panel.dataset.tone = tone;
    status.hidden = false;
    statusTitle.textContent = title || "";
    statusDetail.textContent = detail || "";
    statusDetail.hidden = !detail;
  }

  function hideStatus() { status.hidden = true; }

  function setAction(kind, label, icon, disabled = false) {
    panel.dataset.action = kind;
    action.dataset.action = kind;
    action.dataset.icon = icon;
    action.textContent = label;
    action.disabled = disabled;
  }

  function updateProductPicker(f) {
    const visible = f.phase === "missing";
    products.hidden = !visible;
    productButtons.forEach(b => {
      b.hidden = !availableProduct(b.dataset.product);
      b.classList.toggle("active", b.dataset.product === f.selectedProduct);
    });
  }

  function refresh() {
    const f = flow();
    const currentCode = code();
    const row = f.row;
    const product = f.selectedProduct || row?.product || "";
    const productText = PRODUCT_SHORT[product] || product || "";
    rampBadge.querySelector("span").textContent = t().ramp;
    rampBadge.querySelector("strong").textContent = rampName();
    updateProductPicker(f);

    if (isBusy() || ["checking","registering","sending"].includes(f.phase)) {
      const title = f.phase === "checking" ? t().checking : t().busy;
      showStatus("info", title, currentCode ? `${currentCode}${productText ? ` · ${productText}` : ""}` : "");
      setAction("busy", t().busy, "⏳", true);
      return;
    }

    if (f.phase === "missing") {
      showStatus("warn", t().missing, `${f.code || currentCode}${f.selectedProduct ? ` · ${PRODUCT_SHORT[f.selectedProduct]}` : ""}`);
      if (f.selectedProduct) setAction("register", t().register, "📥", false);
      else setAction("busy", t().choose, "?", true);
      return;
    }

    if (f.phase === "registered") {
      showStatus("ok", t().registered, `${f.code || currentCode} · ${productText}`);
      setAction("send", `${t().send} ${rampName()}`, "→", false);
      return;
    }

    if (f.phase === "found") {
      showStatus("ok", t().found, `${f.code || currentCode} · ${productText}`);
      setAction("send", `${t().send} ${rampName()}`, "→", false);
      return;
    }

    if (f.phase === "added") {
      showStatus("ok", t().added, `${f.code || currentCode} · ${productText} → ${t().ramp} ${rampName()}`);
      setAction("next", t().next, "📷", false);
      return;
    }

    if (f.phase === "kept") {
      showStatus("ok", t().kept, `${f.code || currentCode} · ${productText}`);
      setAction("next", t().next, "📷", false);
      return;
    }

    if (f.phase === "blocked") {
      showStatus("warn", t().blocked, f.message || `${currentCode} · ${productText}`);
      setAction("retry", t().retry, "↩", false);
      return;
    }

    if (f.phase === "error") {
      showStatus("bad", t().error, f.message || currentCode);
      setAction("retry", t().retry, "↩", false);
      return;
    }

    if (!imageReady()) {
      hideStatus();
      setAction("photo", t().photo, "📷", false);
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(currentCode)) {
      showStatus("info", t().read, aiProvider === "openai" ? "OpenAI" : "Gemini");
      setAction("read", t().read, "🔍", false);
      return;
    }

    showStatus("info", t().checking, currentCode);
    setAction("busy", t().busy, "⏳", true);
  }

  function resetAndPhoto() {
    try { clearPhoto(); } catch {}
    try {
      const s = window.UT_FLOAT_STATE;
      if (s) Object.assign(s, { phase: "idle", code: "", row: null, selectedProduct: "", message: "" });
    } catch {}
    refresh();
    setTimeout(() => document.getElementById("photoInput")?.click(), 50);
  }

  action.addEventListener("click", async event => {
    event.preventDefault();
    const kind = action.dataset.action;
    if (kind === "photo" || kind === "next" || kind === "retry") {
      resetAndPhoto();
      return;
    }
    if (kind === "read") {
      const button = document.getElementById(aiProvider === "openai" ? "openaiButton" : "geminiButton");
      if (button && !button.disabled) button.click();
      setTimeout(refresh, 0);
      return;
    }
    if (kind === "register") {
      await window.UT_REGISTER_FLOW_V2?.registerOnly?.();
      refresh();
      return;
    }
    if (kind === "send") {
      if (flow().phase === "registered") await window.UT_REGISTER_FLOW_V2?.sendRegistered?.();
      else await window.UT_REGISTER_FLOW_V2?.moveSelectedToRamp?.();
      refresh();
    }
  });

  products.addEventListener("click", event => {
    const b = event.target.closest("[data-product]");
    if (!b || b.hidden) return;
    window.UT_REGISTER_FLOW_V2?.selectProduct?.(b.dataset.product);
    setTimeout(refresh, 0);
  });

  panel.querySelectorAll("[data-ai]").forEach(b => b.addEventListener("click", () => {
    setAi(b.dataset.ai);
    refresh();
  }));

  collapse.addEventListener("click", () => {
    const collapsed = !panel.classList.contains("collapsed");
    panel.classList.toggle("collapsed", collapsed);
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    collapse.textContent = collapsed ? "↗" : "−";
  });

  window.addEventListener("ut:workflow-state", refresh);
  document.getElementById("photoInput")?.addEventListener("change", () => setTimeout(refresh, 100));
  document.getElementById("geminiButton")?.addEventListener("click", () => setTimeout(refresh, 50));
  document.getElementById("openaiButton")?.addEventListener("click", () => setTimeout(refresh, 50));
  document.getElementById("lowerInput")?.addEventListener("input", () => setTimeout(refresh, 0));
  document.querySelector(".lang")?.addEventListener("click", () => setTimeout(() => { window.dispatchEvent(new Event("ut:refresh-register-flow")); refresh(); }, 40));

  const message = document.getElementById("message");
  if (message) new MutationObserver(refresh).observe(message, { childList: true, subtree: true, characterData: true, attributes: true });

  setAi(aiProvider);
  collapse.textContent = panel.classList.contains("collapsed") ? "↗" : "−";
  refresh();
  console.info("UT floating workflow is active.");
})();
