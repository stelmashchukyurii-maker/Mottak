"use strict";

(() => {
  if (document.getElementById("utStatusColorsStyle")) return;

  const style = document.createElement("style");
  style.id = "utStatusColorsStyle";
  style.textContent = `
    .order-line.ut-new{border-color:rgba(244,196,48,.72);background:rgba(244,196,48,.045)}
    .order-line.ut-sent{border-color:rgba(72,213,151,.72);background:rgba(72,213,151,.045)}
    .order-line.ut-work{border-color:rgba(117,183,255,.65);background:rgba(117,183,255,.04)}
    .order-line.ut-cancel{border-color:rgba(255,115,115,.58);background:rgba(255,115,115,.04)}

    .status.ut-status-pill{display:inline-flex;align-items:center;min-height:27px;padding:4px 9px;border-radius:999px;border:1px solid currentColor;font-size:11px;font-weight:950;line-height:1}
    .status.ut-new{color:#f4c430;background:rgba(244,196,48,.11)}
    .status.ut-sent{color:#48d597;background:rgba(72,213,151,.11)}
    .status.ut-work{color:#75b7ff;background:rgba(117,183,255,.11)}
    .status.ut-cancel{color:#ff8c8c;background:rgba(255,115,115,.11)}

    .ramp-card.ut-new{border-color:rgba(244,196,48,.82)}
    .ramp-card.ut-new .ramp-title{color:#f4c430}
    .ramp-card.ut-new .open-btn{background:#f4c430;color:#17130a}

    .ramp-card.ut-sent{border-color:rgba(72,213,151,.82)}
    .ramp-card.ut-sent .ramp-title{color:#48d597}
    .ramp-card.ut-sent .open-btn{background:#48d597;color:#062418}

    .ramp-card.ut-work{border-color:rgba(117,183,255,.72)}
    .ramp-card.ut-work .ramp-title{color:#75b7ff}
    .ramp-card.ut-work .open-btn{background:#75b7ff;color:#071525}

    .ramp-card.ut-cancel{border-color:rgba(255,115,115,.62)}
    .ramp-card.ut-cancel .ramp-title{color:#ff8c8c}
  `;
  document.head.appendChild(style);

  function stateFromText(value) {
    const text = String(value || "").trim().toLowerCase();
    if (!text) return "";

    if (["sendt", "completed", "ferdig", "виконано", "відправлено", "wysłane", "gotowe"].some(v => text.includes(v))) return "sent";
    if (["ny", "new", "нове", "новий", "nowe", "nowy"].some(v => text.includes(v))) return "new";
    if (["i arbeid", "pågår", "in progress", "received", "staged", "в роботі", "у роботі", "w toku", "przyjęte"].some(v => text.includes(v))) return "work";
    if (["stornert", "cancelled", "скасовано", "anulowane", "problem"].some(v => text.includes(v))) return "cancel";
    return "";
  }

  function apply() {
    document.querySelectorAll(".order-line").forEach(line => {
      line.classList.remove("ut-new", "ut-sent", "ut-work", "ut-cancel");
      const status = line.querySelector(".status");
      if (!status) return;

      status.classList.add("ut-status-pill");
      status.classList.remove("ut-new", "ut-sent", "ut-work", "ut-cancel");

      const state = stateFromText(status.textContent);
      if (!state) return;
      line.classList.add(`ut-${state}`);
      status.classList.add(`ut-${state}`);
    });

    document.querySelectorAll(".ramp-card").forEach(card => {
      card.classList.remove("ut-new", "ut-sent", "ut-work", "ut-cancel");
      const lines = [...card.querySelectorAll(".order-line")];
      if (!lines.length) return;

      const states = lines.map(line => {
        if (line.classList.contains("ut-new")) return "new";
        if (line.classList.contains("ut-work")) return "work";
        if (line.classList.contains("ut-sent")) return "sent";
        if (line.classList.contains("ut-cancel")) return "cancel";
        return "";
      });

      let state = "";
      if (states.some(v => v === "new")) state = "new";
      else if (states.some(v => v === "work")) state = "work";
      else if (states.length && states.every(v => v === "sent")) state = "sent";
      else if (states.length && states.every(v => v === "cancel")) state = "cancel";

      if (state) card.classList.add(`ut-${state}`);
    });
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      apply();
    });
  });

  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  apply();
})();
