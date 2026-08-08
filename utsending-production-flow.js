"use strict";

(() => {
  const VERSION = "UT Lager v27.13 · 3 STATUS<br>Oppdatert 09.08.2026 kl. 00:04";
  const nb = {
    statusNew:"Ny",statusWork:"I arbeid",statusRamp:"På rampe",statusSent:"Sendt",statusStorno:"Stornert",unknown:"Ukjent",
    readyRampButton:"Klar på rampe",sendButton:"Send fra rampe",
    confirmCheck:"Jeg bekrefter at alle varer er kontrollert og står på riktig rampe.",
    departCheck:"Jeg bekrefter at hele rampen sendes ut fra lageret nå.",
    completeFirst:"Alle bestilte varer må være skannet på rampen før rampen kan markeres som klar.",
    confirmRampFirst:"Bekreft først at alle varer er kontrollert og står på riktig rampe.",
    staging:"Bekrefter at hele rampen er komplett…",rampReadyBefore:"RAMPE",rampReadyAfter:"er kontrollert og klar På rampe.",
    rampFirst:"Rampen må først være ferdig kontrollert og markert På rampe.",confirmFirst:"Bekreft først at rampen sendes ut fra lageret nå.",
    sendConfirmBefore:"Send hele RAMPE",sendConfirmAfter:"Etter dette flyttes varene til Sendt.",sending:"Sender rampen…",sentAlertBefore:"RAMPE",sentAlertAfter:"er sendt."
  };
  const tr = key => typeof window.utText === "function" ? window.utText(key) : (nb[key] || key);

  const cancelCopy = () => {
    const l = window.UT_LANG || localStorage.getItem("mottak_ut_language") || "nb";
    if (l === "uk") return {
      button:"❌ Скасувати замовлення",
      confirm:ramp=>`Скасувати замовлення RAMPE ${ramp}?\n\nТовари, які зараз стоять на рампі, повернуться у статус «На складі». Уже відправлені товари НЕ змінюються.`,
      reason:"Причина скасування:",
      defaultReason:"Скасовано користувачем — товар з рампи повернути на склад",
      working:"Скасовую замовлення і повертаю товар з рампи на склад…",
      done:ramp=>`RAMPE ${ramp} скасовано. Товар, який стояв на рампі, повернуто на склад. Уже відправлений товар не змінено.`,
      error:"Не вдалося скасувати замовлення."
    };
    if (l === "pl") return {
      button:"❌ Anuluj zamówienie",
      confirm:ramp=>`Anulować zamówienie RAMPA ${ramp}?\n\nTowary, które obecnie stoją na rampie, wrócą do statusu „Na magazynie”. Towary już wysłane NIE zostaną zmienione.`,
      reason:"Powód anulowania:",
      defaultReason:"Anulowane przez użytkownika — zwrot z rampy na magazyn",
      working:"Anuluję zamówienie i zwracam towar z rampy na magazyn…",
      done:ramp=>`RAMPA ${ramp} anulowana. Towary stojące na rampie wróciły na magazyn. Wysłane towary nie zostały zmienione.`,
      error:"Nie udało się anulować zamówienia."
    };
    return {
      button:"❌ Avbryt bestilling",
      confirm:ramp=>`Avbryte bestillingen for RAMPE ${ramp}?\n\nVarer som står på rampen returneres til status «På lager». Varer som allerede er sendt endres IKKE.`,
      reason:"Årsak til avbrytelse:",
      defaultReason:"Avbrutt av bruker — varer på rampen returneres til lager",
      working:"Avbryter bestillingen og returnerer varer fra rampen til lager…",
      done:ramp=>`RAMPE ${ramp} er avbrutt. Varer som sto på rampen er returnert til lager. Sendte varer er ikke endret.`,
      error:"Bestillingen kunne ikke avbrytes."
    };
  };

  try { statusLabel = order => order.status === "new" ? tr("statusNew") : ["received","in_progress","problem"].includes(order.status) ? tr("statusWork") : order.status === "staged" ? tr("statusRamp") : order.status === "completed" ? tr("statusSent") : order.status === "cancelled" ? tr("statusStorno") : (order.status || tr("unknown")); } catch {}
  try { activeOrder = order => !["completed","cancelled"].includes(order.status); } catch {}
  try { active = order => !["completed","cancelled"].includes(order.status); } catch {}

  async function markReadyOnRamp() {
    const order = typeof current === "function" ? current() : null;
    if (!order || busy) return;
    if (typeof complete === "function" && !complete(order)) { message("testMessage",tr("completeFirst"),"bad"); return; }
    const check = document.getElementById("confirmCheck");
    if (check && !check.checked) { message("testMessage",tr("confirmRampFirst"),"bad"); return; }
    busy = true;
    const button = document.getElementById("testDispatchButton");
    if (button) button.disabled = true;
    message("testMessage",tr("staging"));
    try {
      await rpc("stage_ut_order",{p_order_id:order.id});
      if (check) check.checked = false;
      await loadAll(true);
      alert(`${tr("rampReadyBefore")} ${order.ramp} ${tr("rampReadyAfter")}`);
    } catch (error) { message("testMessage",error.message||String(error),"bad"); }
    finally { busy=false; enhance(); }
  }

  async function sendFromRamp() {
    const order = typeof current === "function" ? current() : null;
    if (!order || busy) return;
    if (order.status !== "staged") { message("testMessage",tr("rampFirst"),"bad"); return; }
    const check = document.getElementById("confirmCheck");
    if (check && !check.checked) { message("testMessage",tr("confirmFirst"),"bad"); return; }
    if (!confirm(`${tr("sendConfirmBefore")} ${order.ramp}? ${tr("sendConfirmAfter")}`)) return;
    busy = true;
    const button = document.getElementById("testDispatchButton");
    if (button) button.disabled = true;
    message("testMessage",tr("sending"));
    try {
      await rpc("confirm_ut_dispatch",{p_order_id:order.id});
      if (check) check.checked = false;
      await loadAll(true);
      selectedId=null; selectedScans=[];
      document.getElementById("detail")?.classList.remove("show");
      alert(`${tr("sentAlertBefore")} ${order.ramp} ${tr("sentAlertAfter")}`);
    } catch (error) { message("testMessage",error.message||String(error),"bad"); }
    finally { busy=false; enhance(); }
  }

  async function cancelCurrentOrder() {
    const order = typeof current === "function" ? current() : null;
    if (!order || busy || ["completed","cancelled"].includes(order.status)) return;
    const c = cancelCopy();
    if (!confirm(c.confirm(order.ramp || "—"))) return;
    const reason = prompt(c.reason, c.defaultReason);
    if (reason === null) return;

    busy = true;
    const button = document.getElementById("utSafeCancelOrder");
    if (button) button.disabled = true;
    if (typeof message === "function") message("scanMessage",c.working,"warn");
    try {
      await rpc("cancel_ut_order",{p_order_id:order.id,p_reason:(reason.trim()||c.defaultReason)});
      await loadAll(true);
      selectedId=null; selectedScans=[];
      document.getElementById("detail")?.classList.remove("show");
      alert(c.done(order.ramp || "—"));
    } catch (error) {
      if (typeof message === "function") message("scanMessage",error.message||c.error,"bad");
      else alert(`${c.error}\n${error.message||error}`);
    } finally {
      busy=false;
      enhance();
    }
  }

  function setText(node,text){ if(node && node.textContent!==text) node.textContent=text; }
  function addStyle(){ if(document.getElementById("productionFlowStyle")) return; const s=document.createElement("style"); s.id="productionFlowStyle"; s.textContent=`.production-send-button{background:#f4c430!important;color:#17130a!important;border:0!important;min-height:66px!important;font-size:20px!important;font-weight:950!important;box-shadow:0 8px 22px rgba(244,196,48,.16)!important}.production-send-button.final-dispatch-button{background:#48d597!important;color:#062418!important;box-shadow:0 8px 22px rgba(72,213,151,.2)!important}.production-send-button:disabled{opacity:.42!important}.production-cancel-button{width:100%!important;min-height:54px!important;margin-top:9px!important;border:2px solid #ff7373!important;border-radius:13px!important;background:rgba(255,115,115,.12)!important;color:#ffd2d2!important;font-size:16px!important;font-weight:950!important;touch-action:manipulation!important}.production-cancel-button:disabled{opacity:.42!important}`; document.head.appendChild(s); }

  function ensureCancelButton(order) {
    const actions = document.getElementById("detailActions");
    if (!actions) return;

    const oldCoreCancel = actions.querySelector('[data-action="cancel"]');
    if (oldCoreCancel) oldCoreCancel.style.display = "none";

    let button = document.getElementById("utSafeCancelOrder");
    if (!button) {
      button = document.createElement("button");
      button.id = "utSafeCancelOrder";
      button.type = "button";
      button.className = "btn production-cancel-button";
      actions.appendChild(button);
    }
    button.textContent = cancelCopy().button;
    button.hidden = !order || (order.test_state && order.test_state !== "active") || ["completed","cancelled"].includes(order.status);
    button.disabled = Boolean(busy);
    button.onclick = cancelCurrentOrder;
  }

  function enhance(){
    addStyle();
    const version=document.querySelector(".version"); if(version && version.innerHTML!==VERSION) version.innerHTML=VERSION;
    document.querySelector(".test-banner")?.remove();
    const order=typeof current==="function"?current():null;
    const button=document.getElementById("testDispatchButton");
    const check=document.querySelector(".confirm-box .check");
    if(button){
      button.classList.add("production-send-button");
      if(order?.status==="staged"){
        setText(button,tr("sendButton")); button.classList.add("final-dispatch-button"); button.onclick=sendFromRamp; if(check) setText(check.querySelector("span"),tr("departCheck"));
      } else {
        setText(button,tr("readyRampButton")); button.classList.remove("final-dispatch-button"); button.onclick=markReadyOnRamp; if(check) setText(check.querySelector("span"),tr("confirmCheck"));
      }
    }
    ensureCancelButton(order);
    const returnButton=document.getElementById("returnButton"); if(returnButton) returnButton.style.display="none";
    document.querySelectorAll(".test-result").forEach(n=>n.style.display="none");
    const testMessage=document.getElementById("testMessage"); if(testMessage && /test/i.test(testMessage.textContent||"")) testMessage.textContent="";
  }

  window.UT_PRODUCTION_ENHANCE = enhance;
  window.UT_CANCEL_CURRENT_ORDER = cancelCurrentOrder;
  enhance();
})();
