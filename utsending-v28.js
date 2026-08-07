"use strict";

(() => {
  const BASE = "https://hzjsatehehhpgpskckfi.supabase.co";
  const KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
  const VERSION = "UT v28.0 CLEAN";
  const UPDATED = "07.08.2026 kl. 21:09";
  const LANG_KEY = "mottak_ut_language";

  const $ = id => document.getElementById(id);
  const state = {
    orders: [],
    stock: [],
    scans: [],
    selectedId: null,
    busy: false,
    lastLoad: 0,
    lang: localStorage.getItem(LANG_KEY) || "nb"
  };

  const T = {
    nb: {
      home:"Hovedmeny", title:"UT — Ramper", subtitle:"Kontoret sender ramper. Lageret kontrollerer varene og sender rampen videre.",
      online:"Online", offline:"Offline", refresh:"Oppdater", stock:"På lager · uten rampe", ramps:"Ramper fra kontoret", noRamps:"Ingen aktive ramper.",
      order:"oppdrag", orders:"oppdrag", open:"Åpne rampen", new:"Ny", work:"I arbeid", staged:"På rampe", sent:"Sendt", cancelled:"Stornert", problem:"Problem",
      created:"Opprettet", office:"Kontor", close:"Lukk", start:"Start rampen", camera:"Kamera / telefon", bulk:"Massevalg", cancel:"Storner og frigjør",
      progress:"Registrert", complete:"Komplett", noItems:"Ingen varer er registrert ennå.", remove:"Fjern", confirmReady:"Jeg bekrefter at alle varer er kontrollert og står på riktig rampe.",
      ready:"Klar på rampe", confirmSend:"Jeg bekrefter at hele rampen sendes ut fra lageret nå.", send:"Send fra rampe", incomplete:"Alle bestilte varer må være registrert først.",
      working:"Utfører handling…", startOk:"Rampen er satt i arbeid.", readyOk:"Rampen er markert På rampe.", sendOk:"Rampen er sendt.", cancelReason:"Årsak til stornering/retur:",
      cancelOk:"Rampen er stornert og aktive varer er frigjort.", removeOk:"Varen er fjernet og tilbake på lager.", loadError:"Kunne ikke laste UT-data.",
      refreshAge:"Oppdatert", bunner:"B", h30:"H×30", h60:"H×60", requested:"Bestilt", status:"Status", scanFirst:"Start rampen før skanning."
    },
    pl: {
      home:"Menu główne", title:"UT — Rampy", subtitle:"Biuro wysyła rampy. Magazyn kontroluje towary i wysyła rampę dalej.",
      online:"Online", offline:"Offline", refresh:"Odśwież", stock:"Na magazynie · bez rampy", ramps:"Rampy z biura", noRamps:"Brak aktywnych ramp.",
      order:"zlecenie", orders:"zlecenia", open:"Otwórz rampę", new:"Nowe", work:"W pracy", staged:"Na rampie", sent:"Wysłane", cancelled:"Anulowane", problem:"Problem",
      created:"Utworzono", office:"Biuro", close:"Zamknij", start:"Rozpocznij rampę", camera:"Aparat / telefon", bulk:"Wybór masowy", cancel:"Anuluj i zwolnij",
      progress:"Zarejestrowano", complete:"Komplet", noItems:"Nie zarejestrowano jeszcze towarów.", remove:"Usuń", confirmReady:"Potwierdzam, że wszystkie towary są sprawdzone i stoją na właściwej rampie.",
      ready:"Gotowe na rampie", confirmSend:"Potwierdzam, że cała rampa jest teraz wysyłana z magazynu.", send:"Wyślij z rampy", incomplete:"Najpierw trzeba zarejestrować wszystkie zamówione towary.",
      working:"Wykonuję…", startOk:"Rampa została rozpoczęta.", readyOk:"Rampa została oznaczona jako Na rampie.", sendOk:"Rampa została wysłana.", cancelReason:"Powód anulowania/zwrotu:",
      cancelOk:"Rampa anulowana, aktywne towary zwolnione.", removeOk:"Towar usunięty i zwrócony do magazynu.", loadError:"Nie udało się wczytać danych UT.",
      refreshAge:"Odświeżono", bunner:"B", h30:"H×30", h60:"H×60", requested:"Zamówiono", status:"Status", scanFirst:"Najpierw rozpocznij rampę."
    },
    uk: {
      home:"Головне меню", title:"UT — Рампи", subtitle:"Офіс надсилає рампи. Склад контролює товар і відправляє рампу далі.",
      online:"Online", offline:"Offline", refresh:"Оновити", stock:"На складі · без рампи", ramps:"Рампи з офісу", noRamps:"Немає активних рамп.",
      order:"замовлення", orders:"замовлення", open:"Відкрити рампу", new:"Нове", work:"В роботі", staged:"На рампі", sent:"Відправлено", cancelled:"Скасовано", problem:"Проблема",
      created:"Створено", office:"Офіс", close:"Закрити", start:"Почати рампу", camera:"Камера / телефон", bulk:"Масовий вибір", cancel:"Скасувати і звільнити",
      progress:"Зареєстровано", complete:"Комплект", noItems:"Товар ще не зареєстрований.", remove:"Прибрати", confirmReady:"Підтверджую, що весь товар перевірений і стоїть на правильній рампі.",
      ready:"Готово на рампі", confirmSend:"Підтверджую, що вся рампа зараз відправляється зі складу.", send:"Відправити з рампи", incomplete:"Спочатку треба зареєструвати весь замовлений товар.",
      working:"Виконую…", startOk:"Рампу переведено в роботу.", readyOk:"Рампу позначено як На рампі.", sendOk:"Рампу відправлено.", cancelReason:"Причина скасування/повернення:",
      cancelOk:"Рампу скасовано, активний товар звільнено.", removeOk:"Товар прибрано і повернуто на склад.", loadError:"Не вдалося завантажити дані UT.",
      refreshAge:"Оновлено", bunner:"B", h30:"H×30", h60:"H×60", requested:"Замовлено", status:"Статус", scanFirst:"Спочатку почніть рампу."
    }
  };

  const tr = key => (T[state.lang] || T.nb)[key] || key;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const norm = value => String(value || "").trim().toUpperCase();
  const fmtDate = value => value ? new Intl.DateTimeFormat(state.lang === "uk" ? "uk-UA" : state.lang === "pl" ? "pl-PL" : "nb-NO", {day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(value)) : "—";

  function headers(extra={}) {
    return {apikey:KEY, Authorization:`Bearer ${KEY}`, Accept:"application/json", "Content-Type":"application/json", ...extra};
  }

  async function request(path, options={}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`${BASE}/rest/v1/${path}`, {...options, headers:headers(options.headers || {}), signal:controller.signal, cache:"no-store"});
      const text = await response.text();
      let body = null;
      if (text) { try { body = JSON.parse(text); } catch { body = text; } }
      if (!response.ok) {
        const msg = body && typeof body === "object" ? (body.message || body.hint || body.details || `HTTP ${response.status}`) : (body || `HTTP ${response.status}`);
        throw new Error(msg);
      }
      return body;
    } finally {
      clearTimeout(timeout);
    }
  }

  const rpc = (name,args={}) => request(`rpc/${name}`, {method:"POST", body:JSON.stringify(args)});
  const current = () => state.orders.find(o => String(o.id) === String(state.selectedId)) || null;
  const isActive = o => !["completed","cancelled"].includes(o.status);

  function requested(o) {
    return {b:+o.bunner_stacks||0, h30:+o.hyller30_sets||0, h60:+o.hyller60_sets||0};
  }

  function scanned() {
    const list = state.scans.filter(s => !s.released_at);
    return {
      b:list.filter(s => s.product === "bunner").length,
      h30:list.filter(s => s.product === "hyller30").length,
      h60:list.filter(s => s.product === "hyller60").length
    };
  }

  function complete(o) {
    const r = requested(o), s = scanned();
    return r.b === s.b && r.h30 === s.h30 && r.h60 === s.h60;
  }

  function statusLabel(o) {
    if (o.status === "new") return tr("new");
    if (["received","in_progress"].includes(o.status)) return tr("work");
    if (o.status === "problem") return tr("problem");
    if (o.status === "staged") return tr("staged");
    if (o.status === "completed") return tr("sent");
    if (o.status === "cancelled") return tr("cancelled");
    return o.status || "—";
  }

  function orderAmount(o) {
    const r = requested(o), parts=[];
    if (r.b) parts.push(`${r.b} B`);
    if (r.h30) parts.push(`${r.h30} H×30`);
    if (r.h60) parts.push(`${r.h60} H×60`);
    return parts.join(" · ") || "—";
  }

  function setOnline(ok, text="") {
    const dot = $("onlineDot"), label = $("onlineText");
    dot.className = `online-dot ${ok ? "ok" : "bad"}`;
    label.textContent = text || (ok ? tr("online") : tr("offline"));
  }

  function renderStaticText() {
    document.documentElement.lang = state.lang === "nb" ? "no" : state.lang;
    $("homeLink").textContent = `← ${tr("home")}`;
    $("pageTitle").textContent = tr("title");
    $("subtitle").textContent = tr("subtitle");
    $("stockLabel").textContent = tr("stock");
    $("rampsTitle").textContent = tr("ramps");
    $("refreshBtn").setAttribute("aria-label", tr("refresh"));
    document.querySelectorAll("[data-lang]").forEach(b => b.classList.toggle("active", b.dataset.lang === state.lang));
    $("version").innerHTML = `${VERSION}<br>${UPDATED}`;
  }

  function renderStock() {
    const count = product => state.stock.filter(r => r.product === product).length;
    $("stockB").textContent = count("bunner");
    $("stockH30").textContent = count("hyller30");
    $("stockH60").textContent = count("hyller60");
    $("stockTime").textContent = state.lastLoad ? `${tr("refreshAge")} ${new Intl.DateTimeFormat(state.lang === "uk" ? "uk-UA" : state.lang === "pl" ? "pl-PL" : "nb-NO", {hour:"2-digit",minute:"2-digit"}).format(new Date(state.lastLoad))}` : "";
  }

  function groupRamps() {
    const map = new Map();
    state.orders.filter(isActive).forEach(o => {
      const ramp = norm(o.ramp) || "—";
      if (!map.has(ramp)) map.set(ramp, []);
      map.get(ramp).push(o);
    });
    return [...map.entries()].sort((a,b) => a[0].localeCompare(b[0], "nb", {numeric:true}));
  }

  function renderRamps() {
    const groups = groupRamps();
    $("rampCount").textContent = `${groups.length}`;
    if (!groups.length) {
      $("ramps").innerHTML = `<div class="empty">${esc(tr("noRamps"))}</div>`;
      return;
    }
    $("ramps").innerHTML = groups.map(([ramp,list]) => {
      const totals = list.reduce((a,o) => { const r=requested(o); a.b+=r.b; a.h30+=r.h30; a.h60+=r.h60; return a; }, {b:0,h30:0,h60:0});
      const parts=[];
      if (totals.b) parts.push(`${totals.b} B`);
      if (totals.h30) parts.push(`${totals.h30} H×30`);
      if (totals.h60) parts.push(`${totals.h60} H×60`);
      return `<article class="ramp-card">
        <div class="ramp-head"><div><div class="ramp-title">RAMPE ${esc(ramp)}</div><div class="ramp-total">${esc(parts.join(" · ") || "—")}</div></div><span class="ramp-count">${list.length} ${esc(list.length===1?tr("order"):tr("orders"))}</span></div>
        <div class="ramp-orders">${list.map(o => `<div class="order-line">
          <div class="order-top"><span class="order-no">${esc(o.order_number || o.id)}</span><span class="status ${esc(o.status)}">${esc(statusLabel(o))}</span></div>
          <div class="order-products">${esc(orderAmount(o))}</div>
          <div class="meta">${fmtDate(o.created_at)}</div>
          <button class="btn primary wide" data-open="${esc(o.id)}">${esc(tr("open"))}</button>
        </div>`).join("")}</div>
      </article>`;
    }).join("");
  }

  async function loadScans(id) {
    return await request(`ut_order_scans?select=*&order_id=eq.${encodeURIComponent(id)}&order=scanned_at.desc&limit=1000`) || [];
  }

  async function loadAll({showBusy=true}={}) {
    if (state.busy) return;
    state.busy = true;
    const refresh = $("refreshBtn");
    if (showBusy) refresh.classList.add("spin");
    refresh.disabled = true;
    try {
      const [orders, stock] = await Promise.all([
        request("ut_orders?select=*&order=created_at.desc&limit=300"),
        request("mottak_scans?select=id,product,status,stock_status&status=eq.verified&stock_status=in.(in_stock,reserved)&limit=10000")
      ]);
      state.orders = orders || [];
      state.stock = stock || [];
      state.lastLoad = Date.now();
      setOnline(true);
      renderStock();
      renderRamps();
      if (state.selectedId && current()) {
        state.scans = await loadScans(state.selectedId);
        renderDetail();
      } else if (state.selectedId) {
        closeDetail();
      }
    } catch (error) {
      setOnline(false);
      $("toast").textContent = `${tr("loadError")} ${error.message || error}`;
      $("toast").className = "toast show bad";
    } finally {
      state.busy = false;
      refresh.disabled = false;
      refresh.classList.remove("spin");
    }
  }

  async function openOrder(id) {
    if (state.busy) return;
    state.busy = true;
    try {
      state.selectedId = id;
      state.scans = await loadScans(id);
      renderDetail();
      $("detail").hidden = false;
      requestAnimationFrame(() => $("detail").scrollIntoView({behavior:"smooth", block:"start"}));
    } catch (e) {
      toast(e.message || String(e), "bad");
    } finally {
      state.busy = false;
    }
  }

  function detailProgressRow(label, got, need) {
    const done = got === need;
    return `<div class="product-row"><span>${esc(label)}</span><strong class="${done ? "done" : ""}">${got} / ${need}</strong></div>`;
  }

  function renderDetail() {
    const o = current();
    if (!o) return;
    const r = requested(o), s = scanned(), isComplete = complete(o);
    $("detailNo").textContent = o.order_number || o.id;
    $("detailRamp").textContent = `RAMPE ${o.ramp || "—"}`;
    $("detailStatus").textContent = statusLabel(o);
    $("detailMeta").innerHTML = `${tr("created")}: ${fmtDate(o.created_at)}${o.office_note ? `<br>${tr("office")}: ${esc(o.office_note)}` : ""}`;
    $("progressRows").innerHTML = [
      r.b ? detailProgressRow("B", s.b, r.b) : "",
      r.h30 ? detailProgressRow("H×30", s.h30, r.h30) : "",
      r.h60 ? detailProgressRow("H×60", s.h60, r.h60) : ""
    ].join("");

    if (!state.scans.length) $("scanList").innerHTML = `<div class="empty small">${esc(tr("noItems"))}</div>`;
    else $("scanList").innerHTML = state.scans.map(scan => `<div class="scan-item">
      <div><strong>${esc(scan.product === "bunner" ? "B" : scan.product === "hyller30" ? "H×30" : "H×60")}</strong><div class="scan-code">${esc(scan.upper_number || "------")} · ${esc(scan.lower_number || "------")}</div></div>
      ${(!scan.released_at && !["staged","completed","cancelled"].includes(o.status)) ? `<button class="icon danger" data-remove="${esc(scan.mottak_scan_id)}" aria-label="${esc(tr("remove"))}">×</button>` : ""}
    </div>`).join("");

    const canWork = ["received","in_progress","problem"].includes(o.status);
    $("cameraBtn").disabled = !canWork;
    $("bulkBtn").disabled = !canWork;
    $("cameraBtn").textContent = `📷 ${tr("camera")}`;
    $("bulkBtn").textContent = `☑ ${tr("bulk")}`;
    $("startBtn").hidden = o.status !== "new";
    $("startBtn").textContent = tr("start");
    $("cancelBtn").hidden = ["completed","cancelled"].includes(o.status);
    $("cancelBtn").textContent = tr("cancel");
    $("closeDetail").textContent = tr("close");

    const check = $("confirmCheck");
    check.checked = false;
    if (o.status === "staged") {
      $("confirmText").textContent = tr("confirmSend");
      $("finalBtn").textContent = `🚚 ${tr("send")}`;
      $("finalBtn").className = "btn success wide big";
      $("finalBtn").disabled = false;
      check.disabled = false;
    } else {
      $("confirmText").textContent = tr("confirmReady");
      $("finalBtn").textContent = `✓ ${tr("ready")}`;
      $("finalBtn").className = "btn primary wide big";
      $("finalBtn").disabled = !isComplete || !canWork;
      check.disabled = !isComplete || !canWork;
    }
    $("detail").hidden = false;
  }

  function closeDetail() {
    state.selectedId = null;
    state.scans = [];
    $("detail").hidden = true;
  }

  function toast(text, type="ok") {
    const el = $("toast");
    el.textContent = text;
    el.className = `toast show ${type}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.className = "toast", 2600);
  }

  async function patchOrder(data) {
    const o = current();
    const rows = await request(`ut_orders?id=eq.${encodeURIComponent(o.id)}`, {method:"PATCH", headers:{Prefer:"return=representation"}, body:JSON.stringify({...data, updated_at:new Date().toISOString()})});
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) throw new Error("Order update failed");
    Object.assign(o,row);
  }

  async function runAction(action) {
    const o = current();
    if (!o || state.busy) return;
    state.busy = true;
    try {
      if (action === "start") {
        await patchOrder({status:"in_progress", received_at:o.received_at || new Date().toISOString(), started_at:new Date().toISOString()});
        toast(tr("startOk"));
      } else if (action === "cancel") {
        const reason = prompt(tr("cancelReason"), "Test / feil");
        if (reason === null) return;
        await rpc("cancel_ut_order", {p_order_id:o.id, p_reason:reason.trim() || "Stornert"});
        toast(tr("cancelOk"));
      } else if (action === "final") {
        if (!$("confirmCheck").checked) return;
        if (o.status === "staged") {
          if (!confirm(`${tr("send")} — RAMPE ${o.ramp}?`)) return;
          await rpc("confirm_ut_dispatch", {p_order_id:o.id});
          toast(tr("sendOk"));
          state.selectedId = null;
        } else {
          if (!complete(o)) { toast(tr("incomplete"), "bad"); return; }
          await rpc("stage_ut_order", {p_order_id:o.id});
          toast(tr("readyOk"));
        }
      }
    } catch (e) {
      toast(e.message || String(e), "bad");
    } finally {
      state.busy = false;
      await loadAll({showBusy:false});
    }
  }

  async function removeScan(id) {
    const o = current();
    if (!o || state.busy) return;
    state.busy = true;
    try {
      await rpc("remove_ut_scan", {p_order_id:o.id, p_mottak_scan_id:id});
      toast(tr("removeOk"));
      state.scans = await loadScans(o.id);
      const stock = await request("mottak_scans?select=id,product,status,stock_status&status=eq.verified&stock_status=in.(in_stock,reserved)&limit=10000");
      state.stock = stock || [];
      renderStock();
      renderDetail();
    } catch (e) {
      toast(e.message || String(e), "bad");
    } finally {
      state.busy = false;
    }
  }

  function goCamera() {
    const o = current();
    if (!o) return;
    if (!["received","in_progress","problem"].includes(o.status)) { toast(tr("scanFirst"), "bad"); return; }
    location.href = `ut-camera-v5.html?order=${encodeURIComponent(o.id)}&ramp=${encodeURIComponent(o.ramp || "")}&from=v28&v=20260807-2109`;
  }

  function goBulk() {
    const o = current();
    if (!o) return;
    if (!["received","in_progress","problem"].includes(o.status)) { toast(tr("scanFirst"), "bad"); return; }
    location.href = `ut-bulk.html?order=${encodeURIComponent(o.id)}&ramp=${encodeURIComponent(o.ramp || "")}&from=v28&v=20260807-2109`;
  }

  document.addEventListener("click", e => {
    const lang = e.target.closest("[data-lang]");
    if (lang) {
      state.lang = lang.dataset.lang;
      localStorage.setItem(LANG_KEY, state.lang);
      renderStaticText(); renderStock(); renderRamps(); if (current()) renderDetail();
      return;
    }
    const open = e.target.closest("[data-open]");
    if (open) { openOrder(open.dataset.open); return; }
    const remove = e.target.closest("[data-remove]");
    if (remove) { removeScan(remove.dataset.remove); return; }
  });

  $("refreshBtn").addEventListener("click", () => loadAll());
  $("closeDetail").addEventListener("click", closeDetail);
  $("startBtn").addEventListener("click", () => runAction("start"));
  $("cancelBtn").addEventListener("click", () => runAction("cancel"));
  $("finalBtn").addEventListener("click", () => runAction("final"));
  $("confirmCheck").addEventListener("change", () => { if (current()?.status === "staged") $("finalBtn").disabled = !$("confirmCheck").checked; else $("finalBtn").disabled = !$("confirmCheck").checked || !complete(current()); });
  $("cameraBtn").addEventListener("click", goCamera);
  $("bulkBtn").addEventListener("click", goBulk);
  window.addEventListener("online", () => setOnline(true));
  window.addEventListener("offline", () => setOnline(false));
  window.addEventListener("pageshow", () => { if (state.lastLoad && Date.now() - state.lastLoad > 10000) loadAll({showBusy:false}); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && state.lastLoad && Date.now() - state.lastLoad > 15000) loadAll({showBusy:false}); });

  renderStaticText();
  loadAll();
})();
