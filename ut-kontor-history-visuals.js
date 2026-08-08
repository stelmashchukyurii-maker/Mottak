"use strict";

// BaMavaremottak — TEST UT Kontor history visuals
// Version 1.2.0
// Updated: 2026-08-08 13:40 Europe/Oslo
// CSS-only pictograms: no image files, no extra network requests.
(() => {
  if (window.__UT_KONTOR_HISTORY_VISUALS__) return;
  window.__UT_KONTOR_HISTORY_VISUALS__ = true;

  const isUk = () => localStorage.getItem("mottak_ut_language") === "uk";
  const n = (value) => Number(value) || 0;

  function installStyle() {
    if (document.getElementById("utHistoryVisualStyle")) return;
    const style = document.createElement("style");
    style.id = "utHistoryVisualStyle";
    style.textContent = `
      #history .amount.ut-visual-amount{display:grid;gap:8px;margin-top:9px;color:inherit;font-weight:inherit}
      .ut-product-line{display:grid;grid-template-columns:52px minmax(0,1fr);gap:10px;align-items:center;padding:9px 10px;border:1px solid #303b59;border-radius:12px;background:#0d1426}
      .ut-product-copy{min-width:0}.ut-product-title{font-size:14px;font-weight:1000;line-height:1.2;color:#f5f7ff}.ut-product-detail{margin-top:4px;font-size:12px;font-weight:850;line-height:1.35;color:#d8dfef}.ut-product-detail strong{color:#f4c430;font-weight:1000}
      .ut-product-iconbox{width:48px;height:48px;display:flex;align-items:center;justify-content:center;border:1px solid #303b59;border-radius:50%;background:#0a1120;position:relative;overflow:visible}
      .ut-product-mark{position:relative;display:block;width:31px;height:34px;color:#cbd4e4}
      .ut-product-mark::after{content:"";position:absolute;left:50%;bottom:-5px;transform:translateX(-50%);width:5px;height:9px;border-radius:2px;background:#f4c430;box-shadow:0 0 0 1px rgba(244,196,48,.35)}
      .ut-product-mark.bunner{height:27px;width:33px;border-left:2px solid currentColor;border-right:2px solid currentColor;background:repeating-linear-gradient(to bottom,transparent 0 3px,currentColor 3px 5px,transparent 5px 7px)}
      .ut-product-mark.bunner::before{content:"";position:absolute;left:3px;right:3px;bottom:-2px;height:5px;background:radial-gradient(circle at 3px 2px,#a78348 0 2px,transparent 2.5px),radial-gradient(circle at calc(100% - 3px) 2px,#a78348 0 2px,transparent 2.5px)}
      .ut-product-mark.rack{border:2px solid currentColor;border-top-width:2px;border-bottom-width:3px;border-radius:1px}
      .ut-product-mark.rack::before{content:"";position:absolute;inset:3px 4px;background:repeating-linear-gradient(to bottom,currentColor 0 1.4px,transparent 1.4px 5px)}
      .ut-product-mark.rack60::before{background:repeating-linear-gradient(to bottom,currentColor 0 1.2px,transparent 1.2px 3px)}
      .ut-post-inline{color:#f4c430;font-weight:1000}
      @media(max-width:520px){.ut-product-line{grid-template-columns:46px minmax(0,1fr);gap:8px;padding:8px}.ut-product-iconbox{width:43px;height:43px}.ut-product-title{font-size:13px}.ut-product-detail{font-size:11.5px}}
    `;
    document.head.appendChild(style);
  }

  function row(type, title, detailHtml) {
    return `<div class="ut-product-line"><span class="ut-product-iconbox" aria-hidden="true"><span class="ut-product-mark ${type}"></span></span><div class="ut-product-copy"><div class="ut-product-title">${title}</div><div class="ut-product-detail">${detailHtml}</div></div></div>`;
  }

  function detailBunner(count) {
    const total = count * 10;
    const posts = total * 4;
    return isUk()
      ? `${count} ${count === 1 ? "стопка" : "стопок"} = <strong>${total} Bunner + ${posts} CC Post</strong>`
      : `${count} ${count === 1 ? "stabel" : "stabler"} = <strong>${total} Bunner + ${posts} CC Post</strong>`;
  }

  function detailHyller(count, size) {
    const hyller = count * size;
    const posts = count * 4;
    return isUk()
      ? `${count} ${count === 1 ? "комплект" : "комплектів"} = <strong>${count} Bunner + ${hyller} полиць + ${posts} CC Post</strong>`
      : `${count} sett = <strong>${count} Bunner + ${hyller} hyller + ${posts} CC Post</strong>`;
  }

  function forlengereSummaryText(count) {
    const posts = count * 4;
    return isUk()
      ? `${count} ${count === 1 ? "візок" : "візків"} = ${count} Bunner + ${posts} CC Post`
      : `${count} ${count === 1 ? "vogn" : "vogner"} = ${count} Bunner + ${posts} CC Post`;
  }

  function decorateSummary() {
    const b = n(document.getElementById("bunnerQty")?.value);
    const h30 = n(document.getElementById("h30Qty")?.value);
    const h60 = n(document.getElementById("h60Qty")?.value);
    const short = n(document.getElementById("forlengere_korteQty")?.value);
    const long = n(document.getElementById("forlengere_langeQty")?.value);
    const sumB = document.getElementById("sumBunner");
    const sum30 = document.getElementById("sumH30");
    const sum60 = document.getElementById("sumH60");
    const sumShort = document.getElementById("sumForlengereKorte");
    const sumLong = document.getElementById("sumForlengereLange");

    if (sumB) {
      const bases = b * 10;
      const posts = bases * 4;
      sumB.textContent = isUk()
        ? `${b} ${b === 1 ? "стопка" : "стопок"} = ${bases} Bunner + ${posts} CC Post`
        : `${b} ${b === 1 ? "stabel" : "stabler"} = ${bases} Bunner + ${posts} CC Post`;
    }
    if (sum30) {
      sum30.textContent = isUk()
        ? `${h30} комплектів = ${h30} Bunner + ${h30 * 30} полиць + ${h30 * 4} CC Post`
        : `${h30} sett = ${h30} Bunner + ${h30 * 30} hyller + ${h30 * 4} CC Post`;
    }
    if (sum60) {
      sum60.textContent = isUk()
        ? `${h60} комплектів = ${h60} Bunner + ${h60 * 60} полиць + ${h60 * 4} CC Post`
        : `${h60} sett = ${h60} Bunner + ${h60 * 60} hyller + ${h60 * 4} CC Post`;
    }
    if (sumShort) sumShort.textContent = forlengereSummaryText(short);
    if (sumLong) sumLong.textContent = forlengereSummaryText(long);
  }

  function decorateForlengereHistory() {
    document.querySelectorAll("#history .ut-extra-history").forEach((box) => {
      const lines = (box.innerText || "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return;
      box.innerHTML = lines.map((line) => {
        const clean = line.replace(/\s*=\s*\d+\s+Bunner\s*\+\s*\d+\s+CC Post\s*$/i, "");
        const isMetal = /Forlengere\s+(korte|lange)|Подовжувачі\s+(короткі|довгі)/i.test(clean);
        if (!isMetal) return clean;
        const match = clean.match(/:\s*(\d+)/);
        const count = match ? n(match[1]) : 0;
        return `${clean} = ${count} Bunner + ${count * 4} CC Post`;
      }).join("<br>");
    });

    document.querySelectorAll("#history .ut-extra-ramp-total").forEach((el) => {
      const clean = (el.textContent || "").replace(/\s*·\s*\d+\s+CC Post\s*$/i, "");
      if (!/Forlengere/i.test(clean)) {
        el.textContent = clean;
        return;
      }
      const match = clean.match(/^(\d+)/);
      const carts = match ? n(match[1]) : 0;
      el.textContent = carts ? `${clean} · ${carts * 4} CC Post` : clean;
    });
  }

  function decorateHistory() {
    installStyle();
    if (typeof orders === "undefined" || !Array.isArray(orders)) return;

    document.querySelectorAll("#history .order").forEach((card) => {
      const id = card.querySelector("[data-storno]")?.dataset.storno || card.querySelector("[data-edit]")?.dataset.edit;
      if (!id) return;
      const order = orders.find((item) => String(item.id) === String(id));
      if (!order) return;
      const amount = card.querySelector(".amount");
      if (!amount) return;

      const b = n(order.bunner_stacks);
      const h30 = n(order.hyller30_sets);
      const h60 = n(order.hyller60_sets);
      const rows = [];
      if (b) rows.push(row("bunner", "Bunner", detailBunner(b)));
      if (h30) rows.push(row("rack rack30", "Hyller x30", detailHyller(h30, 30)));
      if (h60) rows.push(row("rack rack60", "Hyller x60", detailHyller(h60, 60)));
      if (!rows.length) rows.push(`<div class="ut-product-detail">${isUk() ? "Немає товарів" : "Ingen varer"}</div>`);
      amount.classList.add("ut-visual-amount");
      amount.innerHTML = rows.join("");
    });

    decorateForlengereHistory();
  }

  function decorate() {
    decorateHistory();
    decorateSummary();
  }

  const previousRenderHistory = window.renderHistory;
  window.renderHistory = function renderHistoryWithVisuals() {
    if (typeof previousRenderHistory === "function") previousRenderHistory();
    decorate();
  };

  const previousRenderForm = window.renderForm;
  window.renderForm = function renderFormWithCcPosts() {
    if (typeof previousRenderForm === "function") previousRenderForm();
    decorateSummary();
  };

  ["bunnerQty", "h30Qty", "h60Qty", "forlengere_korteQty", "forlengere_langeQty"].forEach((id) => {
    const input = document.getElementById(id);
    input?.addEventListener("input", () => setTimeout(decorateSummary, 0));
    input?.addEventListener("change", () => setTimeout(decorateSummary, 0));
  });
  document.querySelector(".ramp-products")?.addEventListener("click", () => setTimeout(decorateSummary, 0));

  window.UT_KONTOR_HISTORY_VISUALS = { version: "1.2.0", decorate };
  decorate();
})();
