"use strict";
(() => {
  if (window.__NORDIC_TIL_LAGER_V102__) return;
  window.__NORDIC_TIL_LAGER_V102__ = true;

  const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const HOLD_MS = 1500;
  const PN = {
    bunner: "Bunner",
    hyller30: "Hyller x30",
    hyller60: "Hyller x60",
    forlengere_korte: "Forlengere korte",
    forlengere_lange: "Forlengere lange",
    vrak_bunner: "Vrak bunner · 10",
    vrak_hyller: "Vrak hyller · 30"
  };
  const $ = id => document.getElementById(id);
  let holdTimer = 0, holdRaf = 0, holdStarted = 0, holdCompleted = false;

  function currentEnv() {
    return $("workBtn")?.classList.contains("active") ? "work" : "test";
  }
  function currentProduct() {
    return document.querySelector("#products [data-product].active")?.dataset.product || "";
  }
  function makeClient(env) {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false },
      global: { headers: { "x-bama-environment": env } }
    });
  }
  function timeText(value) {
    if (!value) return "—";
    try { return new Date(value).toLocaleTimeString("nb-NO", {hour:"2-digit",minute:"2-digit",second:"2-digit"}); }
    catch { return "—"; }
  }
  function meaning(product, count) {
    const n = Number(count) || 0;
    if (product === "bunner") return `${n} stabler × 10 = ${n * 10} Bunner`;
    if (product === "hyller30") return `${n} sett × 30 = ${n * 30} hyller`;
    if (product === "hyller60") return `${n} sett × 60 = ${n * 60} hyller`;
    if (product === "vrak_bunner") return `${n} stabler × 10 = ${n * 10} Vrak bunner`;
    if (product === "vrak_hyller") return `${n} stabler × 30 = ${n * 30} Vrak hyller`;
    if (product === "forlengere_korte") return `${n} RFID-enheter · Forlengere korte`;
    if (product === "forlengere_lange") return `${n} RFID-enheter · Forlengere lange`;
    return `${n} enheter`;
  }

  function installStyle() {
    if ($("tilLagerV102Style")) return;
    const s = document.createElement("style");
    s.id = "tilLagerV102Style";
    s.textContent = `
      #workBtn{position:relative!important;overflow:hidden!important;touch-action:manipulation!important;user-select:none!important;-webkit-user-select:none!important}
      #workBtn .v102-label{position:relative;z-index:2}
      #workBtn .v102-hold{position:absolute;left:0;bottom:0;width:0;height:7px;background:#ff7373;z-index:1;transition:width .05s linear}
      #workBtn.v102-holding{border-color:#ff7373!important;box-shadow:0 0 0 3px rgba(255,115,115,.14)}
      #tilLagerStock{margin:10px 0;padding:12px;border:2px solid #75b7ff;border-radius:18px;background:rgba(117,183,255,.055);color:#f5f7ff}
      #tilLagerStock .v102-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
      #tilLagerStock .v102-title{color:#75b7ff;font-size:14px;font-weight:1000}
      #tilLagerStock .v102-mode{padding:4px 7px;border:1px solid #303b59;border-radius:999px;color:#aab4ce;font-size:9px;font-weight:950}
      #tilLagerStock .v102-product{margin-top:10px;color:#f4c430;font-size:18px;font-weight:1000}
      #tilLagerStock .v102-count{margin-top:2px;font-size:clamp(34px,11vw,52px);font-weight:1000;line-height:1.05}
      #tilLagerStock .v102-meaning{margin-top:4px;color:#dce7ff;font-size:13px;font-weight:900}
      #tilLagerStock .v102-last{margin-top:10px;padding:9px;border:1px dashed #303b59;border-radius:11px;color:#aab4ce;font-size:11px;line-height:1.35}
      #tilLagerStock.v102-loading{opacity:.68}
    `;
    document.head.appendChild(s);
  }

  function installStockCard() {
    if ($("tilLagerStock")) return;
    const rfid = document.querySelector("section.rfid") || $("rfidCard");
    if (!rfid) return;
    const card = document.createElement("section");
    card.id = "tilLagerStock";
    card.innerHTML = `
      <div class="v102-head"><div class="v102-title">📦 PÅ LAGER NÅ</div><div class="v102-mode" id="v102Mode">TEST</div></div>
      <div class="v102-product" id="v102Product">Вибери продукт</div>
      <div class="v102-count" id="v102Count">—</div>
      <div class="v102-meaning" id="v102Meaning">Тут буде видно фактичний прихід на склад.</div>
      <div class="v102-last" id="v102Last">Siste mottak: —</div>`;
    rfid.insertAdjacentElement("afterend", card);
  }

  async function refreshStock(scroll = false) {
    installStockCard();
    const card = $("tilLagerStock"), product = currentProduct(), env = currentEnv();
    if (!card) return;
    $("v102Mode").textContent = env.toUpperCase();
    if (!product) {
      $("v102Product").textContent = "Вибери продукт";
      $("v102Count").textContent = "—";
      $("v102Meaning").textContent = "Тут буде видно фактичний прихід на склад.";
      $("v102Last").textContent = "Siste mottak: —";
      return;
    }
    card.classList.add("v102-loading");
    $("v102Product").textContent = PN[product] || product;
    $("v102Count").textContent = "…";
    $("v102Meaning").textContent = "Оновлюю склад…";
    try {
      const client = makeClient(env);
      const q = await client.from("mottak_scans")
        .select("id,product,lower_number,scanner_code,source,created_at,verified_at", {count:"exact"})
        .eq("environment", env)
        .eq("product", product)
        .eq("status", "verified")
        .eq("stock_status", "in_stock")
        .order("created_at", {ascending:false})
        .limit(1);
      if (q.error) throw q.error;
      const count = Number(q.count) || 0, row = q.data?.[0] || null;
      $("v102Count").textContent = String(count);
      $("v102Meaning").textContent = meaning(product, count);
      $("v102Last").textContent = row
        ? `Siste mottak: ${row.lower_number || "—"} · ${timeText(row.verified_at || row.created_at)} · ${row.source || "—"}`
        : "Siste mottak: —";
    } catch (e) {
      $("v102Count").textContent = "!";
      $("v102Meaning").textContent = `Не вдалося прочитати склад: ${e.message || e}`;
      $("v102Last").textContent = "Siste mottak: —";
    } finally {
      card.classList.remove("v102-loading");
    }
    if (scroll) setTimeout(() => card.scrollIntoView({behavior:"smooth",block:"center"}), 80);
  }

  function resetHold() {
    clearTimeout(holdTimer); cancelAnimationFrame(holdRaf);
    holdTimer = 0; holdRaf = 0; holdStarted = 0;
    const btn = $("workBtn"), bar = btn?.querySelector(".v102-hold"), label = btn?.querySelector(".v102-label");
    btn?.classList.remove("v102-holding");
    if (bar) bar.style.width = "0%";
    if (label && currentEnv() !== "work") label.textContent = "🏭 WORK · УТРИМАТИ 1,5 c";
  }
  function paintHold() {
    if (!holdStarted) return;
    const elapsed = performance.now() - holdStarted;
    const pct = Math.min(100, elapsed / HOLD_MS * 100);
    const btn = $("workBtn"), bar = btn?.querySelector(".v102-hold"), label = btn?.querySelector(".v102-label");
    if (bar) bar.style.width = `${pct}%`;
    if (label) label.textContent = `🏭 WORK · ${Math.max(0,(HOLD_MS-elapsed)/1000).toFixed(1)} c`;
    if (pct < 100) holdRaf = requestAnimationFrame(paintHold);
  }
  function activateWork() {
    holdCompleted = true;
    try { navigator.vibrate?.(45); } catch {}
    const ok = window.confirm("Увімкнути WORK? Це реальний склад. Дублікати RFID заблоковані.");
    resetHold();
    if (!ok) return;
    if (typeof window.setEnv === "function") window.setEnv("work");
    const label = $("workBtn")?.querySelector(".v102-label");
    if (label) label.textContent = "🏭 WORK ✓";
    setTimeout(() => refreshStock(false), 80);
  }
  function beginHold(e) {
    if (currentEnv() === "work" || holdTimer) return;
    e?.preventDefault?.(); holdCompleted = false; holdStarted = performance.now();
    $("workBtn")?.classList.add("v102-holding");
    try { if (e?.pointerId != null) $("workBtn")?.setPointerCapture(e.pointerId); } catch {}
    paintHold();
    holdTimer = setTimeout(activateWork, HOLD_MS);
  }
  function endHold(e) {
    e?.preventDefault?.();
    if (!holdCompleted) resetHold();
  }

  function installWorkButton() {
    const old = $("workBtn");
    if (!old || old.dataset.v102 === "1") return;
    const fresh = old.cloneNode(false);
    fresh.id = "workBtn"; fresh.className = old.className; fresh.type = "button"; fresh.dataset.v102 = "1";
    fresh.innerHTML = `<span class="v102-label">${currentEnv()==="work"?"🏭 WORK ✓":"🏭 WORK · УТРИМАТИ 1,5 c"}</span><span class="v102-hold"></span>`;
    old.replaceWith(fresh);
    fresh.addEventListener("contextmenu", e => e.preventDefault());
    if (window.PointerEvent) {
      fresh.addEventListener("pointerdown", beginHold);
      fresh.addEventListener("pointerup", endHold);
      fresh.addEventListener("pointercancel", endHold);
    } else {
      fresh.addEventListener("touchstart", beginHold, {passive:false});
      fresh.addEventListener("touchend", endHold, {passive:false});
      fresh.addEventListener("touchcancel", endHold, {passive:false});
    }
  }

  function hookSaveButton() {
    const old = $("yesBtn");
    if (!old || old.dataset.v102 === "1") return;
    const fresh = old.cloneNode(true); fresh.dataset.v102 = "1"; old.replaceWith(fresh);
    fresh.addEventListener("click", async () => {
      if (typeof window.savePending !== "function") return;
      await window.savePending();
      setTimeout(() => refreshStock(true), 120);
    });
  }

  function start() {
    installStyle(); installStockCard(); installWorkButton(); hookSaveButton();
    const version = document.querySelector(".version");
    if (version) version.textContent = "Nordic ID – Til lager · DEV V1.0.2 · STOCK VIEW + WORK HOLD · 10.08.2026 kl. 22:39";
    $("products")?.addEventListener("click", () => setTimeout(() => refreshStock(false), 80));
    $("testBtn")?.addEventListener("click", () => setTimeout(() => refreshStock(false), 80));
    refreshStock(false);
  }

  start();
  window.NORDIC_TIL_LAGER_V102 = { refreshStock, version:"1.0.2" };
})();
