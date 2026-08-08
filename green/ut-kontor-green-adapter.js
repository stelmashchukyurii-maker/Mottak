"use strict";

// BaMavaremottak — GREEN UT Kontor production adapter
// Version 29.0
// Updated: 2026-08-08 16:18 Europe/Oslo
(() => {
  if (window.__BAMA_GREEN_UT_KONTOR_V29__) return;
  window.__BAMA_GREEN_UT_KONTOR_V29__ = true;

  const STORAGE_KEY = "mottak_ut_language";
  const UPDATED_NO = "Oppdatert 08.08.2026 kl. 16:18";
  const UPDATED_UK = "Оновлено 08.08.2026 о 16:18";
  const registry = window.BAMA_PRODUCTS;

  const isUk = () => localStorage.getItem(STORAGE_KEY) === "uk";
  const n = (value) => Number(value) || 0;

  function ukWord(value, one, few, many) {
    const abs = Math.abs(Number(value) || 0);
    const mod100 = abs % 100;
    const mod10 = abs % 10;
    if (mod100 >= 11 && mod100 <= 19) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
  }

  function installStyle() {
    if (document.getElementById("greenUtKontorStyle")) return;
    const style = document.createElement("style");
    style.id = "greenUtKontorStyle";
    style.textContent = `
      .green-ut-lang{display:flex;justify-content:flex-end;gap:8px;margin:7px 0 12px}
      .green-ut-lang button{min-width:58px;min-height:44px;padding:8px 13px;border:1px solid #303b59;border-radius:999px;background:#0d1426;color:#f5f7ff;font:950 14px Arial,sans-serif}
      .green-ut-lang button.active{border-color:#f4c430;background:#f4c430;color:#17130a}
      .green-ut-data-note{margin:-3px 0 13px;color:#48d597;font-size:11px;font-weight:850;text-align:right}
      @media(max-width:520px){.green-ut-lang{margin-top:5px}.green-ut-lang button{min-width:54px;min-height:42px}}
    `;
    document.head.appendChild(style);
  }

  function installLanguageSwitch() {
    if (document.getElementById("greenUtLang")) return;
    const top = document.querySelector(".top");
    if (!top) return;
    const wrap = document.createElement("div");
    wrap.id = "greenUtLang";
    wrap.className = "green-ut-lang";
    wrap.innerHTML = '<button type="button" data-green-lang="no">NO</button><button type="button" data-green-lang="uk">UA</button>';
    top.insertAdjacentElement("afterend", wrap);

    const note = document.createElement("div");
    note.id = "greenUtDataNote";
    note.className = "green-ut-data-note";
    wrap.insertAdjacentElement("afterend", note);

    wrap.addEventListener("click", (event) => {
      const button = event.target.closest("[data-green-lang]");
      if (!button) return;
      localStorage.setItem(STORAGE_KEY, button.dataset.greenLang === "uk" ? "uk" : "nb");
      applyAll(true);
    });
  }

  function cleanProductionText(text) {
    return String(text ?? "")
      .replaceAll("TEST-замовлення", "замовлення")
      .replaceAll("TEST замовлення", "замовлення")
      .replaceAll("TEST-bestillingen", "bestillingen")
      .replaceAll("TEST-bestilling", "bestilling")
      .replaceAll("TEST-databasen", "databasen")
      .replaceAll("TEST produktmodul", "Produktmodul")
      .replaceAll(" · TEST", "");
  }

  function patchMessages() {
    if (window.__BAMA_GREEN_MSG_PATCH__ || typeof window.msg !== "function") return;
    window.__BAMA_GREEN_MSG_PATCH__ = true;
    const baseMsg = window.msg;
    window.msg = function greenMsg(text, type) {
      return baseMsg(cleanProductionText(text), type);
    };
  }

  function cleanReceipt() {
    const no = document.getElementById("receiptNo");
    const text = document.getElementById("receiptText");
    if (no) no.textContent = cleanProductionText(no.textContent);
    if (text) text.textContent = cleanProductionText(text.textContent);
  }

  function setVersion() {
    const version = document.querySelector(".version");
    if (version) {
      version.innerHTML = `UT Kontor GREEN v29.0 · PRODUKTER<br>${isUk() ? UPDATED_UK : UPDATED_NO}`;
    }
  }

  function productLabel(id) {
    return registry?.getProductName?.(id, isUk() ? "uk" : "no") || id;
  }

  function patchExtraCards() {
    ["forlengere_korte", "forlengere_lange", "forlengere_plast"].forEach((id) => {
      const card = document.querySelector(`[data-ut-product-id="${id}"]`);
      if (!card) return;
      const input = document.getElementById(`${id}Qty`);
      const value = Math.max(0, Number.parseInt(input?.value || "0", 10) || 0);
      const plast = id === "forlengere_plast";
      const title = card.querySelector(".ramp-product-head strong");
      const badge = card.querySelector(".ut-extra-unit");
      const note = card.querySelector(".ut-extra-note");
      const output = document.getElementById(`${id}Output`);

      if (title) title.textContent = productLabel(id);
      if (badge) badge.textContent = plast ? (isUk() ? "ящики" : "esker") : (isUk() ? "візки" : "vogner");
      if (note) {
        note.textContent = plast
          ? (isUk() ? "1 одиниця = 1 ящик. Без Bunner, полиць і CC Post." : "1 enhet = 1 eske. Ingen Bunner, Hyller eller CC Post.")
          : (isUk() ? "1 візок = 1 Bunner. Кількість полиць і подовжувачів вводиться окремо при UT-підтвердженні." : "1 vogn = 1 Bunner. Antall Hyller og Forlengere registreres per vogn ved UT-bekreftelse.");
      }
      if (output) {
        const unit = plast
          ? (isUk() ? ukWord(value, "ящик", "ящики", "ящиків") : (value === 1 ? "eske" : "esker"))
          : (isUk() ? ukWord(value, "візок", "візки", "візків") : (value === 1 ? "vogn" : "vogner"));
        output.textContent = `${value} ${unit}`;
      }
    });
  }

  function patchSummaryLabels() {
    const map = [
      ["sumForlengereKorte", "forlengere_korte"],
      ["sumForlengereLange", "forlengere_lange"],
      ["sumForlengerePlast", "forlengere_plast"],
    ];
    map.forEach(([outputId, productId]) => {
      const row = document.getElementById(outputId)?.closest(".summary-row");
      const label = row?.querySelector("span");
      if (label) label.textContent = productLabel(productId);
    });
  }

  function parseExtras(card) {
    const text = card.querySelector(".ut-extra-history")?.textContent || "";
    const read = (names) => {
      for (const name of names) {
        const safe = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const match = text.match(new RegExp(`${safe}:\\s*(\\d+)`, "i"));
        if (match) return n(match[1]);
      }
      return 0;
    };
    return {
      short: read(["Forlengere korte", "Подовжувачі короткі", "Короткі продовжувачі"]),
      long: read(["Forlengere lange", "Подовжувачі довгі", "Довгі продовжувачі"]),
      plast: read(["Forlengere plast", "Подовжувачі пластикові", "Пластикові продовжувачі"]),
    };
  }

  function patchRampHeaders() {
    if (!Array.isArray(window.orders)) return;
    document.querySelectorAll("#history .ramp-card").forEach((rampCard) => {
      let bunner = 0;
      let hyller = 0;
      [...rampCard.querySelectorAll(".order")].forEach((card) => {
        const id = card.querySelector("[data-storno]")?.dataset.storno || card.querySelector("[data-edit]")?.dataset.edit;
        const order = window.orders.find((row) => String(row.id) === String(id));
        if (!order) return;
        const ext = parseExtras(card);
        const b = n(order.bunner_stacks), h30 = n(order.hyller30_sets), h60 = n(order.hyller60_sets);
        bunner += b * 10 + h30 + h60 + ext.short + ext.long;
        hyller += h30 * 30 + h60 * 60;
      });
      const line = rampCard.querySelector(".ramp-card-head .field-help");
      if (line) line.textContent = isUk() ? `Всього: ${bunner} Bunner · ${hyller} полиць` : `Samlet: ${bunner} Bunner · ${hyller} hyller`;
    });
  }

  function paintSwitch() {
    document.querySelectorAll("[data-green-lang]").forEach((button) => {
      const active = button.dataset.greenLang === (isUk() ? "uk" : "no");
      button.classList.toggle("active", active);
    });
    const note = document.getElementById("greenUtDataNote");
    if (note) note.textContent = isUk() ? "🟢 GREEN-код · спільні production-дані" : "🟢 GREEN-kode · felles production-data";
  }

  function applyLanguage() {
    window.UT_TEST_LANG?.apply?.();
    patchExtraCards();
    patchSummaryLabels();
    window.UT_KONTOR_HISTORY_VISUALS?.decorate?.();
    patchRampHeaders();
    setVersion();
    paintSwitch();
    cleanReceipt();
  }

  function applyAll(fromSwitch = false) {
    const y = window.scrollY;
    if (fromSwitch) {
      ["forlengere_korteQty", "forlengere_langeQty", "forlengere_plastQty"].forEach((id) => {
        document.getElementById(id)?.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
    applyLanguage();
    requestAnimationFrame(() => window.scrollTo(0, y));
  }

  function wrapRenderers() {
    if (window.__BAMA_GREEN_RENDER_PATCH__) return;
    window.__BAMA_GREEN_RENDER_PATCH__ = true;

    const baseHistory = window.renderHistory;
    if (typeof baseHistory === "function") {
      window.renderHistory = function greenRenderHistory(...args) {
        const result = baseHistory.apply(this, args);
        queueMicrotask(applyLanguage);
        return result;
      };
    }

    const baseForm = window.renderForm;
    if (typeof baseForm === "function") {
      window.renderForm = function greenRenderForm(...args) {
        const result = baseForm.apply(this, args);
        queueMicrotask(() => {
          patchExtraCards();
          patchSummaryLabels();
          setVersion();
        });
        return result;
      };
    }
  }

  function start() {
    installStyle();
    installLanguageSwitch();
    patchMessages();
    wrapRenderers();
    applyAll();

    document.getElementById("send")?.addEventListener("click", () => {
      [80, 350, 900].forEach((delay) => setTimeout(() => {
        cleanReceipt();
        applyLanguage();
      }, delay));
    });
    document.getElementById("refresh")?.addEventListener("click", () => setTimeout(applyLanguage, 350));
    [150, 500, 1200].forEach((delay) => setTimeout(applyLanguage, delay));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
