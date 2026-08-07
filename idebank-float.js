"use strict";

(() => {
  if (document.getElementById("bamaIdebankFloat")) return;

  const STORAGE_KEY = "bama_idebank_v1";

  const style = document.createElement("style");
  style.textContent = `
    #bamaIdebankFloat{position:fixed;right:16px;bottom:max(16px,calc(env(safe-area-inset-bottom) + 10px));z-index:999999;font-family:Arial,Helvetica,sans-serif;color:#f5f7ff}
    .bama-idea-button{min-height:52px;padding:12px 16px;border:1px solid rgba(244,196,48,.72);border-radius:999px;background:#f4c430;color:#17130a;font-weight:950;box-shadow:0 10px 28px rgba(0,0,0,.38)}
    .bama-idea-panel{display:none;position:absolute;right:0;bottom:64px;width:min(360px,calc(100vw - 28px));padding:14px;border:1px solid #475579;border-radius:18px;background:#151c30;box-shadow:0 18px 45px rgba(0,0,0,.52)}
    .bama-idea-panel.show{display:block}
    .bama-idea-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
    .bama-idea-head strong{font-size:18px;color:#f4c430}.bama-idea-close{width:38px;height:38px;border:1px solid #475579;border-radius:10px;background:#0d1426;color:#f5f7ff;font-size:20px}
    .bama-idea-context{margin-top:7px;color:#aab4ce;font-size:11px;line-height:1.4}
    .bama-idea-panel textarea{width:100%;min-height:120px;margin-top:10px;padding:11px;border:1px solid #303b59;border-radius:12px;background:#0d1426;color:#f5f7ff;resize:vertical;font:inherit;box-sizing:border-box}
    .bama-idea-actions{display:flex;gap:8px;margin-top:9px}.bama-idea-save{flex:1;min-height:46px;border:0;border-radius:11px;background:#f4c430;color:#17130a;font-weight:950}.bama-idea-clear{min-height:46px;padding:0 12px;border:1px solid #475579;border-radius:11px;background:#24304f;color:#f5f7ff;font-weight:850}
    .bama-idea-status{min-height:18px;margin-top:7px;color:#aab4ce;font-size:11px}.bama-idea-status.ok{color:#48d597}
    .bama-idea-badge{display:inline-flex;align-items:center;justify-content:center;min-width:21px;height:21px;margin-left:7px;padding:0 6px;border-radius:999px;background:#151c30;color:#f4c430;font-size:11px}
    @media print{#bamaIdebankFloat{display:none!important}}
  `;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "bamaIdebankFloat";
  root.innerHTML = `
    <div class="bama-idea-panel" id="bamaIdeaPanel">
      <div class="bama-idea-head"><strong>💡 Idébank</strong><button class="bama-idea-close" type="button" aria-label="Lukk">×</button></div>
      <div class="bama-idea-context" id="bamaIdeaContext">Denne siden</div>
      <textarea id="bamaIdeaText" placeholder="Skriv idé, forbedring eller feil du har oppdaget…"></textarea>
      <div class="bama-idea-actions"><button class="bama-idea-save" type="button">Lagre idé</button><button class="bama-idea-clear" type="button">Tøm</button></div>
      <div class="bama-idea-status" id="bamaIdeaStatus">Første versjon lagrer idéen lokalt på denne enheten.</div>
    </div>
    <button class="bama-idea-button" type="button">💡 Idébank <span class="bama-idea-badge" id="bamaIdeaBadge">0</span></button>
  `;
  document.body.appendChild(root);

  const panel = root.querySelector("#bamaIdeaPanel");
  const mainButton = root.querySelector(".bama-idea-button");
  const closeButton = root.querySelector(".bama-idea-close");
  const saveButton = root.querySelector(".bama-idea-save");
  const clearButton = root.querySelector(".bama-idea-clear");
  const text = root.querySelector("#bamaIdeaText");
  const context = root.querySelector("#bamaIdeaContext");
  const status = root.querySelector("#bamaIdeaStatus");
  const badge = root.querySelector("#bamaIdeaBadge");

  function readIdeas() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function updateBadge() {
    badge.textContent = String(readIdeas().length);
  }

  function pageContext() {
    let detail = "";
    try {
      const frame = document.getElementById("utCore");
      const doc = frame?.contentDocument;
      const detailBox = doc?.getElementById("detail");
      if (detailBox?.classList.contains("show")) {
        const ramp = doc.getElementById("detailRamp")?.textContent?.trim();
        const no = doc.getElementById("detailNo")?.textContent?.trim();
        detail = [ramp, no].filter(Boolean).join(" · ");
      }
    } catch {}
    return detail || document.title || location.pathname;
  }

  function refreshContext() {
    context.textContent = `Сторінка: ${pageContext()}`;
  }

  function openPanel() {
    refreshContext();
    panel.classList.add("show");
    setTimeout(() => text.focus(), 50);
  }

  function closePanel() {
    panel.classList.remove("show");
  }

  mainButton.addEventListener("click", () => panel.classList.contains("show") ? closePanel() : openPanel());
  closeButton.addEventListener("click", closePanel);
  clearButton.addEventListener("click", () => {
    text.value = "";
    status.textContent = "Поле очищено.";
    status.className = "bama-idea-status";
  });

  saveButton.addEventListener("click", () => {
    const idea = text.value.trim();
    if (!idea) {
      status.textContent = "Спочатку напиши ідею або зауваження.";
      status.className = "bama-idea-status";
      return;
    }

    const ideas = readIdeas();
    ideas.push({
      id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
      text: idea,
      page: location.pathname,
      context: pageContext(),
      created_at: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
    text.value = "";
    status.textContent = "✓ Ідею збережено локально.";
    status.className = "bama-idea-status ok";
    updateBadge();
  });

  updateBadge();
})();
