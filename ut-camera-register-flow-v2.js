"use strict";

(() => {
  if (window.__UT_REGISTER_FLOW_V2__) return;
  window.__UT_REGISTER_FLOW_V2__ = true;

  const PRODUCTS = ["bunner", "hyller30", "hyller60"];
  const state = window.UT_FLOAT_STATE = window.UT_FLOAT_STATE || {
    phase: "idle",
    code: "",
    row: null,
    selectedProduct: "",
    message: ""
  };

  const COPY = {
    nb: {
      missingTitle: "⚠ IKKE PÅ LAGER",
      missingText: "Etiketten finnes ikke som tilgjengelig lagerbeholdning. Velg produkttype og registrer den først.",
      pendingText: "Etiketten finnes som pending INN. Velg produkttype for å godkjenne den på lager.",
      register: "📥 REGISTRER PÅ LAGER",
      registering: "⏳ REGISTRERER…",
      registeredTitle: "✅ REGISTRERT PÅ LAGER",
      registeredText: "Varen er nå på lager. Vil du sende den videre til rampen uten å skanne på nytt?",
      send: "→ SEND TIL RAMPE",
      keep: "Ikke nå",
      kept: "Registrert på lager. Ikke flyttet til rampen.",
      found: "✅ FUNNET PÅ LAGER",
      notNeeded: "Denne produkttypen er ikke lenger nødvendig på denne rampen.",
      existingElsewhere: "Etiketten finnes allerede, men er ikke tilgjengelig på lager.",
      registerFail: "Kunne ikke registrere varen på lager.",
      sent: "✅ LAGT PÅ RAMPE"
    },
    pl: {
      missingTitle: "⚠ BRAK NA MAGAZYNIE",
      missingText: "Etykieta nie istnieje jako dostępny towar magazynowy. Wybierz typ produktu i najpierw przyjmij go na magazyn.",
      pendingText: "Etykieta istnieje jako pending INN. Wybierz typ produktu, aby zatwierdzić ją na magazynie.",
      register: "📥 PRZYJMIJ NA MAGAZYN",
      registering: "⏳ REJESTRACJA…",
      registeredTitle: "✅ PRZYJĘTO NA MAGAZYN",
      registeredText: "Towar jest już na magazynie. Wysłać go od razu na rampę bez ponownego skanowania?",
      send: "→ WYŚLIJ NA RAMPĘ",
      keep: "Nie teraz",
      kept: "Towar przyjęty na magazyn. Nie przeniesiono go na rampę.",
      found: "✅ ZNALEZIONO NA MAGAZYNIE",
      notNeeded: "Ten typ produktu nie jest już potrzebny na tej rampie.",
      existingElsewhere: "Etykieta już istnieje, ale towar nie jest dostępny na magazynie.",
      registerFail: "Nie udało się przyjąć towaru na magazyn.",
      sent: "✅ DODANO NA RAMPĘ"
    },
    uk: {
      missingTitle: "⚠ НЕМАЄ НА СКЛАДІ",
      missingText: "Бірки немає серед доступного товару на складі. Виберіть тип продукту і спочатку оприбуткуйте його.",
      pendingText: "Бірка вже є як pending INN. Виберіть тип продукту, щоб підтвердити її на складі.",
      register: "📥 ОПРИБУТКУВАТИ НА СКЛАД",
      registering: "⏳ ОПРИБУТКОВУЄМО…",
      registeredTitle: "✅ ОПРИБУТКОВАНО НА СКЛАД",
      registeredText: "Товар уже на складі. Відправити його одразу на рампу без повторного сканування?",
      send: "→ ВІДПРАВИТИ НА РАМПУ",
      keep: "Не зараз",
      kept: "Товар оприбутковано на склад. На рампу не переміщено.",
      found: "✅ ЗНАЙДЕНО НА СКЛАДІ",
      notNeeded: "Цей тип товару вже не потрібен на цій рампі.",
      existingElsewhere: "Бірка вже існує, але товар зараз не доступний на складі.",
      registerFail: "Не вдалося оприбуткувати товар на склад.",
      sent: "✅ ДОДАНО НА РАМПУ"
    }
  };

  function langCode() {
    try { return COPY[lang] ? lang : "nb"; } catch { return "nb"; }
  }
  function c() { return COPY[langCode()] || COPY.nb; }
  function clean(v) { return String(v || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6); }
  function emit(patch = {}) {
    Object.assign(state, patch);
    window.dispatchEvent(new CustomEvent("ut:workflow-state", { detail: { ...state } }));
  }

  const lower = document.getElementById("lowerInput");
  const find = document.getElementById("findButton");
  const add = document.getElementById("addButton");
  const candidate = document.getElementById("candidate");
  const host = document.querySelector("section.card:last-of-type");
  if (!lower || !find || !add || !candidate || !host) return;

  document.getElementById("utMissingBox")?.remove();

  const style = document.createElement("style");
  style.id = "utRegisterFlowV2Style";
  style.textContent = `
    .ut-register-v2{display:none;margin-top:12px;padding:14px;border:2px solid var(--warn);border-radius:14px;background:rgba(246,185,75,.08)}
    .ut-register-v2.show{display:block}.ut-register-v2.registered{border-color:var(--ok);background:rgba(72,213,151,.08)}
    .ut-register-v2 h3{margin:0;color:var(--warn);font-size:20px}.ut-register-v2.registered h3{color:var(--ok)}
    .ut-register-v2 .code{margin-top:7px;font:900 32px Consolas,monospace}.ut-register-v2 p{margin:8px 0;color:var(--muted);line-height:1.45}
    .ut-register-products{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.ut-register-products button{min-height:48px;border:1px solid var(--line);border-radius:11px;background:var(--dark);color:var(--text);font-weight:900}.ut-register-products button.active{border-color:var(--accent);background:var(--accent);color:#17130a}.ut-register-products button[hidden]{display:none}
    .ut-register-actions{display:grid;grid-template-columns:1fr;gap:8px;margin-top:10px}.ut-register-actions.two{grid-template-columns:1fr 1fr}
    .ut-register-action{width:100%;min-height:58px;border:0;border-radius:12px;font-weight:950;font-size:16px}.ut-register-action.primary{background:var(--ok);color:#062418}.ut-register-action.secondary{background:#2c395c;color:var(--text)}.ut-register-action:disabled{opacity:.45}
    @media(max-width:560px){.ut-register-products,.ut-register-actions.two{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const box = document.createElement("div");
  box.id = "utRegisterFlowV2";
  box.className = "ut-register-v2";
  box.innerHTML = `
    <h3 id="utRegTitle"></h3>
    <div class="code" id="utRegCode">------</div>
    <p id="utRegText"></p>
    <div class="ut-register-products" id="utRegProducts">
      <button type="button" data-ut-reg-product="bunner">Bunner</button>
      <button type="button" data-ut-reg-product="hyller30">Hyller x30</button>
      <button type="button" data-ut-reg-product="hyller60">Hyller x60</button>
    </div>
    <div class="ut-register-actions" id="utRegActions">
      <button class="ut-register-action primary" id="utRegPrimary" type="button" disabled></button>
      <button class="ut-register-action secondary" id="utRegSecondary" type="button" hidden></button>
    </div>
  `;
  candidate.insertAdjacentElement("afterend", box);

  const title = document.getElementById("utRegTitle");
  const codeEl = document.getElementById("utRegCode");
  const textEl = document.getElementById("utRegText");
  const productsEl = document.getElementById("utRegProducts");
  const productButtons = [...box.querySelectorAll("[data-ut-reg-product]")];
  const actions = document.getElementById("utRegActions");
  const primary = document.getElementById("utRegPrimary");
  const secondary = document.getElementById("utRegSecondary");

  let selectedProduct = "";
  let registeredRow = null;
  let regBusy = false;
  const previousFind = findCandidate;

  function allowedProducts() {
    const a = PRODUCTS.filter(p => {
      try { return needed(p); } catch { return true; }
    });
    return a.length ? a : PRODUCTS;
  }

  function resetBox() {
    box.className = "ut-register-v2";
    productsEl.hidden = false;
    actions.classList.remove("two");
    secondary.hidden = true;
    primary.disabled = true;
    selectedProduct = "";
    registeredRow = null;
    productButtons.forEach(b => b.classList.remove("active"));
  }

  function showMissing(code, pending = false) {
    resetBox();
    box.classList.add("show");
    title.textContent = c().missingTitle;
    codeEl.textContent = code;
    textEl.textContent = pending ? c().pendingText : c().missingText;
    primary.textContent = c().register;
    const allowed = allowedProducts();
    productButtons.forEach(b => {
      b.hidden = !allowed.includes(b.dataset.utRegProduct);
    });
    if (allowed.length === 1) {
      selectedProduct = allowed[0];
      productButtons.find(b => b.dataset.utRegProduct === selectedProduct)?.classList.add("active");
      primary.disabled = false;
    }
    emit({ phase: "missing", code, row: null, selectedProduct, message: textEl.textContent });
  }

  function showRegistered(row) {
    registeredRow = row;
    selectedProduct = row.product;
    box.className = "ut-register-v2 show registered";
    title.textContent = c().registeredTitle;
    codeEl.textContent = clean(row.lower_number);
    textEl.textContent = c().registeredText;
    productsEl.hidden = true;
    actions.classList.add("two");
    primary.disabled = false;
    primary.textContent = `${c().send} ${order?.ramp || ""}`;
    secondary.hidden = false;
    secondary.textContent = c().keep;
    emit({ phase: "registered", code: clean(row.lower_number), row, selectedProduct: row.product, message: textEl.textContent });
  }

  async function existingRows(code) {
    try {
      return await req(`mottak_scans?select=id,product,status,stock_status,scanner_code,lower_number,ut_order_id,created_at&upper_number=eq.078500&lower_number=eq.${encodeURIComponent(code)}&order=created_at.desc&limit=5`) || [];
    } catch { return []; }
  }

  async function enhancedFind() {
    resetBox();
    emit({ phase: "checking", code: clean(lower.value), row: null, selectedProduct: "", message: "" });
    try { await previousFind(); } catch {}
    if (selectedRow) {
      emit({ phase: "found", code: clean(selectedRow.lower_number), row: selectedRow, selectedProduct: selectedRow.product, message: c().found });
      return;
    }

    const code = clean(lower.value);
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      emit({ phase: "idle", code, row: null, selectedProduct: "", message: "" });
      return;
    }

    const rows = await existingRows(code);
    const pending = rows.find(r => r.status === "pending");
    if (pending) {
      showMissing(code, true);
      msg(c().pendingText, "warn");
      return;
    }

    const verified = rows.find(r => r.status === "verified");
    if (verified) {
      if ((verified.stock_status || "in_stock") === "in_stock") {
        if (needed(verified.product)) {
          selectedRow = verified;
          showCandidate(verified, false);
          emit({ phase: "found", code, row: verified, selectedProduct: verified.product, message: c().found });
        } else {
          msg(c().notNeeded, "warn");
          emit({ phase: "blocked", code, row: verified, selectedProduct: verified.product, message: c().notNeeded });
        }
      } else {
        msg(`${c().existingElsewhere} (${verified.stock_status || "—"})`, "bad");
        emit({ phase: "blocked", code, row: verified, selectedProduct: verified.product, message: c().existingElsewhere });
      }
      return;
    }

    if (rows.length) {
      msg(c().existingElsewhere, "bad");
      emit({ phase: "blocked", code, row: rows[0], selectedProduct: rows[0].product || "", message: c().existingElsewhere });
      return;
    }

    showMissing(code, false);
    msg(c().missingText, "warn");
  }

  findCandidate = enhancedFind;
  find.onclick = enhancedFind;

  productButtons.forEach(button => {
    button.addEventListener("click", () => {
      selectedProduct = button.dataset.utRegProduct;
      productButtons.forEach(b => b.classList.toggle("active", b === button));
      primary.disabled = false;
      emit({ phase: "missing", code: clean(lower.value), selectedProduct });
    });
  });

  async function registerOnly() {
    if (regBusy || !selectedProduct) return;
    const code = clean(lower.value);
    if (!/^[A-Z0-9]{6}$/.test(code)) return;
    regBusy = true;
    primary.disabled = true;
    primary.textContent = c().registering;
    emit({ phase: "registering", code, selectedProduct, message: c().registering });
    msg(c().registering);
    try {
      const rows = await rpc("register_ut_scan_only", {
        p_product: selectedProduct,
        p_lower_number: code,
        p_confidence: null
      });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row?.id) throw new Error(c().registerFail);
      await load();
      selectedRow = row;
      showCandidate(row, false);
      document.getElementById("candidateText").textContent = c().registeredText;
      add.disabled = false;
      showRegistered(row);
      msg(c().registeredTitle, "ok");
    } catch (e) {
      msg(`${c().registerFail}\n${e.message || e}`, "bad");
      emit({ phase: "error", code, row: null, selectedProduct, message: e.message || String(e) });
      primary.disabled = false;
      primary.textContent = c().register;
    } finally {
      regBusy = false;
    }
  }

  async function sendRegistered() {
    if (!registeredRow || busy) return;
    selectedRow = registeredRow;
    add.disabled = false;
    emit({ phase: "sending", code: clean(registeredRow.lower_number), row: registeredRow, selectedProduct: registeredRow.product, message: "" });
    await add();
    if (!selectedRow) {
      const sent = registeredRow;
      box.className = "ut-register-v2";
      registeredRow = null;
      emit({ phase: "added", code: clean(sent.lower_number), row: sent, selectedProduct: sent.product, message: c().sent });
    } else {
      emit({ phase: "error", code: clean(registeredRow.lower_number), row: registeredRow, selectedProduct: registeredRow.product, message: document.getElementById("message")?.textContent || "" });
    }
  }

  primary.addEventListener("click", () => {
    if (registeredRow) sendRegistered();
    else registerOnly();
  });

  secondary.addEventListener("click", () => {
    const row = registeredRow;
    resetBox();
    selectedRow = null;
    add.disabled = true;
    candidate.className = "candidate";
    msg(c().kept, "ok");
    emit({ phase: "kept", code: clean(row?.lower_number), row, selectedProduct: row?.product || "", message: c().kept });
    try { clearPhoto(); } catch {}
  });

  lower.addEventListener("input", () => {
    resetBox();
    emit({ phase: imageData ? "photo" : "idle", code: clean(lower.value), row: null, selectedProduct: "", message: "" });
  });

  const originalAdd = add;
  add = async function addWithFlowEvent() {
    const row = selectedRow;
    await originalAdd();
    if (row && !selectedRow) emit({ phase: "added", code: clean(row.lower_number), row, selectedProduct: row.product, message: c().sent });
  };
  add.onclick = add;

  window.addEventListener("ut:refresh-register-flow", () => {
    if (box.classList.contains("show")) {
      if (registeredRow) showRegistered(registeredRow);
      else if (state.phase === "missing") showMissing(clean(lower.value), false);
    }
  });

  emit({ phase: "idle", code: "", row: null, selectedProduct: "", message: "" });
  console.info("UT camera register flow v2 is active.");
})();
