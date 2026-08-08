(() => {
  "use strict";

  const PANEL_ID = "bama-floating-camera";
  const STATUS_ID = "bama-floating-workflow-status";
  const STYLE_ID = "bama-floating-workflow-style";

  const COPY = {
    nb: {
      photo: "📷 FOTO",
      recognize: "🔍 LES NUMMER",
      save: "💾 LAGRE",
      link: "🔗 KOBLE FOTO",
      replace: "⚠ ERSTATT FOTO",
      correct: "✏️ SKRIV NUMMER",
      processing: "⏳ BEHANDLER…",
      checking: "Sjekker databasen…",
      newTag: "✅ NY ETIKETT",
      exists: "⚠ FINNES ALLEREDE",
      saved: "✅ LAGRET",
      error: "❌ FEIL",
      photoReady: "Foto klart — neste: les nummer",
      waitingPhoto: "Venter på nytt bilde",
      fromNordic: "Nordic ID",
      fromCamera: "Kamera",
      hasPhoto: "har bilde",
      noPhoto: "venter på bilde",
      verified: "godkjent",
      pending: "pending",
      invalid: "problem",
      codePrefix: "Etikett"
    },
    pl: {
      photo: "📷 FOTO",
      recognize: "🔍 ODCZYTAJ NUMER",
      save: "💾 ZAPISZ",
      link: "🔗 POŁĄCZ FOTO",
      replace: "⚠ ZASTĄP FOTO",
      correct: "✏️ WPISZ NUMER",
      processing: "⏳ PRZETWARZANIE…",
      checking: "Sprawdzam bazę…",
      newTag: "✅ NOWA ETYKIETA",
      exists: "⚠ JUŻ ISTNIEJE",
      saved: "✅ ZAPISANO",
      error: "❌ BŁĄD",
      photoReady: "Zdjęcie gotowe — następnie odczytaj numer",
      waitingPhoto: "Czeka na nowe zdjęcie",
      fromNordic: "Nordic ID",
      fromCamera: "Kamera",
      hasPhoto: "ma zdjęcie",
      noPhoto: "czeka na zdjęcie",
      verified: "zatwierdzone",
      pending: "pending",
      invalid: "problem",
      codePrefix: "Etykieta"
    },
    uk: {
      photo: "📷 ФОТО",
      recognize: "🔍 РОЗПІЗНАТИ",
      save: "💾 ЗБЕРЕГТИ",
      link: "🔗 ПРИВ’ЯЗАТИ ФОТО",
      replace: "⚠ ЗАМІНИТИ ФОТО",
      correct: "✏️ ВВЕСТИ НОМЕР",
      processing: "⏳ ОБРОБКА…",
      checking: "Перевіряю базу…",
      newTag: "✅ НОВА БІРКА",
      exists: "⚠ ВЖЕ ІСНУЄ",
      saved: "✅ ЗБЕРЕЖЕНО",
      error: "❌ ПОМИЛКА",
      photoReady: "Фото готове — далі розпізнати номер",
      waitingPhoto: "Очікує нове фото",
      fromNordic: "Nordic ID",
      fromCamera: "Камера",
      hasPhoto: "має фото",
      noPhoto: "очікує фото",
      verified: "підтверджено",
      pending: "pending",
      invalid: "проблема",
      codePrefix: "Бірка"
    }
  };

  let existingRow = null;
  let checkedKey = "";
  let checkSerial = 0;
  let checking = false;
  let saveRequested = false;
  let sticky = null;
  let stickyTimer = null;

  function languageCode() {
    try {
      return COPY[language] ? language : "nb";
    } catch (_) {
      return "nb";
    }
  }

  function t() {
    return COPY[languageCode()] || COPY.nb;
  }

  function getBusy() {
    try { return Boolean(busy); } catch (_) { return false; }
  }

  function getImageReady() {
    try { return Boolean(imageData); } catch (_) { return false; }
  }

  function normalizeUpper(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 6);
  }

  function normalizeLower(value) {
    return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  }

  function readCode() {
    const upper = normalizeUpper(document.getElementById("upperValue")?.value);
    const lower = normalizeLower(document.getElementById("lowerValue")?.value);
    return {
      upper,
      lower,
      valid: /^\d{6}$/.test(upper) && /^[A-Z0-9]{6}$/.test(lower),
      key: `${upper}|${lower}`
    };
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID} .bama-workflow-status {
        pointer-events: auto;
        width: min(330px, calc(100vw - 24px));
        padding: 10px 12px;
        border: 2px solid #303b59;
        border-radius: 15px;
        background: rgba(13,20,38,.97);
        color: #f5f7ff;
        box-shadow: 0 10px 28px rgba(0,0,0,.48);
        backdrop-filter: blur(10px);
      }
      #${PANEL_ID} .bama-workflow-status[hidden] { display:none; }
      #${PANEL_ID} .bama-workflow-status strong {
        display:block;
        font-size:16px;
        line-height:1.25;
      }
      #${PANEL_ID} .bama-workflow-status span {
        display:block;
        margin-top:4px;
        color:#cbd5eb;
        font-size:12px;
        line-height:1.35;
      }
      #${PANEL_ID} .bama-workflow-status.info { border-color:#75b7ff; }
      #${PANEL_ID} .bama-workflow-status.ok { border-color:#48d597; background:rgba(15,52,39,.97); }
      #${PANEL_ID} .bama-workflow-status.warn { border-color:#f6b94b; background:rgba(55,39,10,.98); }
      #${PANEL_ID} .bama-workflow-status.bad { border-color:#ff7373; background:rgba(59,23,32,.98); }

      #${PANEL_ID}[data-workflow-state="recognize"] .bama-photo-button { background:#75b7ff; color:#071a2e; }
      #${PANEL_ID}[data-workflow-state="save"] .bama-photo-button { background:#48d597; color:#062418; }
      #${PANEL_ID}[data-workflow-state="replace"] .bama-photo-button { background:#f6b94b; color:#241600; }
      #${PANEL_ID}[data-workflow-state="correct"] .bama-photo-button { background:#ffb86b; color:#2a1600; }
      #${PANEL_ID}[data-workflow-state="busy"] .bama-photo-button { background:#64748b; color:#f8fafc; }

      #${PANEL_ID}.collapsed .bama-photo-button::before {
        content: attr(data-workflow-icon) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function setSticky(kind, title, detail, milliseconds = 2800) {
    sticky = { kind, title, detail, until: Date.now() + milliseconds };
    clearTimeout(stickyTimer);
    stickyTimer = setTimeout(() => {
      sticky = null;
      refresh();
    }, milliseconds + 50);
    refresh();
  }

  function statusTextForRow(row) {
    if (!row) return "";
    const source = row.scanner_code ? t().fromNordic : t().fromCamera;
    const photo = row.photo_url ? t().hasPhoto : t().noPhoto;
    const status = row.status === "verified"
      ? t().verified
      : row.status === "invalid"
        ? t().invalid
        : t().pending;
    return `${source} · ${photo} · ${status}`;
  }

  function showStatus(panel, kind, title, detail = "") {
    const status = panel.querySelector(`#${STATUS_ID}`);
    if (!status) return;
    status.hidden = false;
    status.className = `bama-workflow-status ${kind || "info"}`;
    const strong = status.querySelector("strong");
    const span = status.querySelector("span");
    strong.textContent = title || "";
    span.textContent = detail || "";
    span.hidden = !detail;
  }

  function hideStatus(panel) {
    const status = panel.querySelector(`#${STATUS_ID}`);
    if (status) status.hidden = true;
  }

  async function checkExisting(force = false) {
    const code = readCode();
    if (!code.valid) {
      existingRow = null;
      checkedKey = "";
      checking = false;
      refresh();
      return;
    }

    if (!force && code.key === checkedKey && !checking) return;

    checkedKey = code.key;
    existingRow = null;
    checking = true;
    const serial = ++checkSerial;
    refresh();

    try {
      let dbClient;
      let tableName;
      try {
        dbClient = client;
        tableName = TABLE;
      } catch (_) {
        dbClient = null;
      }

      if (!dbClient || !tableName) throw new Error("Database client unavailable");

      const response = await dbClient
        .from(tableName)
        .select("id,status,source,scanner_code,photo_url,created_at,product")
        .eq("upper_number", code.upper)
        .eq("lower_number", code.lower)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (serial !== checkSerial) return;
      if (response.error) throw response.error;
      existingRow = response.data || null;
    } catch (_) {
      if (serial !== checkSerial) return;
      existingRow = null;
    } finally {
      if (serial === checkSerial) {
        checking = false;
        refresh();
      }
    }
  }

  function workflowState() {
    const code = readCode();
    const imageReady = getImageReady();
    const isBusy = getBusy();

    if (isBusy) return { state: "busy", label: t().processing, icon: "⏳", disabled: true };
    if (!imageReady) return { state: "photo", label: t().photo, icon: "📷", disabled: false };
    if (!code.valid) {
      if (code.lower.length > 0) return { state: "correct", label: t().correct, icon: "✏️", disabled: false };
      return { state: "recognize", label: t().recognize, icon: "🔍", disabled: false };
    }
    if (checking) return { state: "busy", label: t().processing, icon: "⏳", disabled: true };
    if (existingRow?.photo_url) return { state: "replace", label: t().replace, icon: "⚠", disabled: false };
    if (existingRow) return { state: "save", label: t().link, icon: "🔗", disabled: false };
    return { state: "save", label: t().save, icon: "💾", disabled: false };
  }

  function refresh() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    const actionButton = panel.querySelector(".bama-photo-button");
    if (!actionButton) return;

    const flow = workflowState();
    panel.dataset.workflowState = flow.state;
    actionButton.dataset.workflowAction = flow.state;
    actionButton.dataset.workflowIcon = flow.icon;
    actionButton.textContent = flow.label;
    actionButton.disabled = flow.disabled;
    actionButton.setAttribute("aria-label", flow.label.replace(/^[^A-Za-zА-Яа-яЇїІіЄєŁł]+/u, "").trim());

    if (sticky && sticky.until > Date.now()) {
      showStatus(panel, sticky.kind, sticky.title, sticky.detail);
      return;
    }

    const code = readCode();

    if (getBusy()) {
      showStatus(panel, "info", t().processing, code.valid ? `${t().codePrefix}: ${code.lower}` : "");
      return;
    }

    if (code.valid) {
      if (checking) {
        showStatus(panel, "info", t().checking, `${t().codePrefix}: ${code.lower}`);
      } else if (existingRow) {
        showStatus(panel, "warn", t().exists, `${t().codePrefix}: ${code.lower} · ${statusTextForRow(existingRow)}`);
      } else {
        showStatus(panel, "ok", t().newTag, `${t().codePrefix}: ${code.lower}`);
      }
      return;
    }

    if (getImageReady()) {
      showStatus(panel, "info", t().photoReady, "");
      return;
    }

    hideStatus(panel);
  }

  function handleBaseMessage(text, type) {
    const value = String(text || "").trim();

    if (!value) {
      if (!(sticky && sticky.until > Date.now())) refresh();
      return;
    }

    if (saveRequested && type === "ok") {
      saveRequested = false;
      existingRow = null;
      checkedKey = "";
      setSticky("ok", t().saved, value, 3000);
      return;
    }

    if (type === "bad") {
      saveRequested = false;
      setSticky("bad", t().error, value, 4200);
      return;
    }

    setTimeout(() => {
      refresh();
      const code = readCode();
      if (code.valid) checkExisting(true);
    }, 0);
  }

  function installHooks(panel) {
    const photoInput = document.getElementById("photoInput");
    const recognizeButton = document.getElementById("recognizeButton");
    const openaiButton = document.getElementById("openaiBackupButton");
    const saveButton = document.getElementById("saveButton");
    const lowerInput = document.getElementById("lowerValue");
    const upperInput = document.getElementById("upperValue");
    const actionButton = panel.querySelector(".bama-photo-button");

    if (!photoInput || !recognizeButton || !saveButton || !lowerInput || !actionButton) return false;

    actionButton.addEventListener("click", event => {
      const action = actionButton.dataset.workflowAction || "photo";
      if (action === "photo") return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (action === "recognize") {
        recognizeButton.click();
        setTimeout(refresh, 0);
        return;
      }

      if (action === "save" || action === "replace") {
        saveRequested = true;
        saveButton.click();
        setTimeout(refresh, 0);
        return;
      }

      if (action === "correct") {
        lowerInput.focus();
        lowerInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, true);

    saveButton.addEventListener("click", () => {
      saveRequested = true;
      setTimeout(refresh, 0);
    });

    recognizeButton.addEventListener("click", () => setTimeout(refresh, 0));
    openaiButton?.addEventListener("click", () => setTimeout(refresh, 0));

    photoInput.addEventListener("change", () => {
      existingRow = null;
      checkedKey = "";
      refresh();
      setTimeout(refresh, 250);
      setTimeout(refresh, 700);
    });

    [lowerInput, upperInput].filter(Boolean).forEach(input => {
      input.addEventListener("input", () => {
        existingRow = null;
        checkedKey = "";
        refresh();
        clearTimeout(input._bamaWorkflowTimer);
        input._bamaWorkflowTimer = setTimeout(() => checkExisting(true), 250);
      });
    });

    try {
      const originalShow = show;
      show = function showWithFloatingWorkflow(text, type = "") {
        originalShow(text, type);
        handleBaseMessage(text, type);
      };
    } catch (_) {}

    try {
      const originalRenderResult = renderResult;
      renderResult = function renderResultWithFloatingWorkflow() {
        originalRenderResult();
        setTimeout(() => {
          refresh();
          const code = readCode();
          if (code.valid) checkExisting();
        }, 0);
      };
    } catch (_) {}

    try {
      const originalApplyLanguage = applyLanguage;
      applyLanguage = function applyLanguageWithFloatingWorkflow() {
        originalApplyLanguage();
        setTimeout(refresh, 0);
      };
    } catch (_) {}

    return true;
  }

  function start(attempt = 0) {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) {
      if (attempt < 50) setTimeout(() => start(attempt + 1), 150);
      return;
    }

    if (document.getElementById(STATUS_ID)) return;

    addStyles();
    const status = document.createElement("div");
    status.id = STATUS_ID;
    status.className = "bama-workflow-status info";
    status.hidden = true;
    status.innerHTML = "<strong></strong><span></span>";

    const options = panel.querySelector(".bama-floating-options");
    if (options) panel.insertBefore(status, options);
    else panel.prepend(status);

    if (!installHooks(panel)) {
      status.remove();
      if (attempt < 50) setTimeout(() => start(attempt + 1), 150);
      return;
    }

    refresh();
    const code = readCode();
    if (code.valid) checkExisting(true);
    console.info("Camera Cloud floating workflow is active.");
  }

  start();
})();