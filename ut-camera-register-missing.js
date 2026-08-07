"use strict";

(() => {
  const host = document.querySelector("section.card:last-of-type");
  const lower = document.getElementById("lowerInput");
  const find = document.getElementById("findButton");
  const add = document.getElementById("addButton");
  const candidate = document.getElementById("candidate");
  if (!host || !lower || !find || !add || !candidate || document.getElementById("utMissingBox")) return;

  const style = document.createElement("style");
  style.textContent = `
    .ut-missing{display:none;margin-top:12px;padding:14px;border:2px solid var(--warn);border-radius:14px;background:rgba(246,185,75,.08)}
    .ut-missing.show{display:block}.ut-missing h3{margin:0;color:var(--warn);font-size:20px}.ut-missing .code{margin-top:7px;font:900 32px Consolas,monospace}.ut-missing p{margin:8px 0;color:var(--muted);line-height:1.45}
    .ut-missing-products{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.ut-missing-products button{min-height:48px;border:1px solid var(--line);border-radius:11px;background:var(--dark);color:var(--text);font-weight:900}.ut-missing-products button.active{border-color:var(--accent);background:var(--accent);color:#17130a}.ut-missing-products button:disabled{display:none}
    .ut-missing-confirm{width:100%;min-height:60px;margin-top:10px;border:0;border-radius:12px;background:var(--ok);color:#062418;font-weight:950;font-size:17px}.ut-missing-confirm:disabled{opacity:.45}
    @media(max-width:560px){.ut-missing-products{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const box = document.createElement("div");
  box.id = "utMissingBox";
  box.className = "ut-missing";
  box.innerHTML = `
    <h3>⚠ Товар не оприбуткований</h3>
    <div class="code" id="utMissingCode">------</div>
    <p id="utMissingText">Виберіть тип товару. Після підтвердження система створить INN-запис і відразу додасть товар на цю рампу.</p>
    <div class="ut-missing-products">
      <button type="button" data-ut-missing-product="bunner">Bunner</button>
      <button type="button" data-ut-missing-product="hyller30">Hyller x30</button>
      <button type="button" data-ut-missing-product="hyller60">Hyller x60</button>
    </div>
    <button class="ut-missing-confirm" id="utMissingConfirm" type="button" disabled>Оприбуткувати + додати на RAMPE</button>
  `;
  candidate.insertAdjacentElement("afterend", box);

  const codeEl = document.getElementById("utMissingCode");
  const textEl = document.getElementById("utMissingText");
  const confirmBtn = document.getElementById("utMissingConfirm");
  const productButtons = [...box.querySelectorAll("[data-ut-missing-product]")];
  let selectedProduct = "";
  let regBusy = false;
  const originalFindCandidate = findCandidate;

  function hideMissing() {
    box.classList.remove("show");
    selectedProduct = "";
    productButtons.forEach(b => b.classList.remove("active"));
    confirmBtn.disabled = true;
  }

  function missingProducts() {
    return ["bunner", "hyller30", "hyller60"].filter(p => needed(p));
  }

  function showMissing(code, pending = false) {
    const allowed = missingProducts();
    if (!allowed.length) return;
    box.classList.add("show");
    codeEl.textContent = code;
    textEl.textContent = pending
      ? "Цей номер уже є в INN як pending. Виберіть тип — запис буде підтверджено і відразу додано на рампу."
      : "Номера немає серед оприбуткованих INN. Виберіть тип — система оприбуткує товар і відразу додасть його на рампу.";
    productButtons.forEach(b => {
      const ok = allowed.includes(b.dataset.utMissingProduct);
      b.disabled = !ok;
      b.classList.remove("active");
    });
    selectedProduct = "";
    if (allowed.length === 1) {
      selectedProduct = allowed[0];
      const b = productButtons.find(x => x.dataset.utMissingProduct === selectedProduct);
      b?.classList.add("active");
      confirmBtn.disabled = false;
    } else {
      confirmBtn.disabled = true;
    }
    confirmBtn.textContent = `Оприбуткувати + додати на RAMPE ${order?.ramp || ""}`;
  }

  productButtons.forEach(button => {
    button.addEventListener("click", () => {
      selectedProduct = button.dataset.utMissingProduct;
      productButtons.forEach(b => b.classList.toggle("active", b === button));
      confirmBtn.disabled = false;
    });
  });

  async function checkExisting(code) {
    try {
      const rows = await req(`mottak_scans?select=id,product,status,stock_status,ut_order_id,lower_number&upper_number=eq.078500&lower_number=eq.${encodeURIComponent(code)}&order=created_at.desc&limit=5`);
      return rows || [];
    } catch {
      return [];
    }
  }

  async function enhancedFindCandidate() {
    hideMissing();
    originalFindCandidate();
    if (selectedRow) return;

    const code = norm(lower.value).replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (!/^[A-Z0-9]{6}$/.test(code)) return;

    const allowedRows = stock.filter(r => needed(r.product));
    const exact = allowedRows.filter(r => norm(r.lower_number) === code);
    const near = allowedRows.filter(r => distance(r.lower_number, code) === 1);
    if (exact.length > 1 || near.length > 1) return;

    const existing = await checkExisting(code);
    if (existing.length) {
      const pending = existing.find(r => r.status === "pending");
      if (pending) {
        showMissing(code, true);
        msg("Номер є в INN як pending. Підтвердьте тип товару, щоб одразу додати його на рампу.", "warn");
        return;
      }
      const active = existing[0];
      msg(`Номер уже є в INN: ${productNames[active.product] || active.product} · ${active.status} / ${active.stock_status || "—"}. Новий дубль не створюємо.`, "bad");
      return;
    }

    showMissing(code, false);
    msg("Товар не оприбуткований. Можна оприбуткувати його і одразу додати на цю рампу.", "warn");
  }

  findCandidate = enhancedFindCandidate;
  find.onclick = enhancedFindCandidate;

  lower.addEventListener("input", hideMissing);

  confirmBtn.addEventListener("click", async () => {
    if (regBusy || !selectedProduct) return;
    const code = norm(lower.value).replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (!/^[A-Z0-9]{6}$/.test(code)) return;

    regBusy = true;
    confirmBtn.disabled = true;
    msg("Оприбутковуємо товар і додаємо його на рампу…");
    try {
      await rpc("register_and_reserve_ut_scan", {
        p_order_id: order.id,
        p_product: selectedProduct,
        p_lower_number: code,
        p_confidence: null
      });
      await load();
      hideMissing();
      lower.value = "";
      selectedRow = null;
      candidate.className = "candidate";
      add.disabled = true;
      document.getElementById("doneCard")?.classList.add("show");
      document.getElementById("doneTitle").textContent = "Оприбутковано і додано";
      document.getElementById("doneText").textContent = `${productNames[selectedProduct] || selectedProduct} · ${code} → RAMPE ${order.ramp}`;
      msg(complete() ? tr("complete") : "Товар оприбутковано в INN і додано на рампу.", "ok");
    } catch (e) {
      msg(e.message || String(e), "bad");
    } finally {
      regBusy = false;
      confirmBtn.disabled = !selectedProduct;
      render();
    }
  });
})();
