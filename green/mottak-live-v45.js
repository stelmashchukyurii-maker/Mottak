"use strict";

const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
const TABLE = "mottak_scans";
const LANGUAGE_KEY = "mottak_nordic_cloud_language";
const PRODUCT_KEY = "mottak_nordic_cloud_product";
const DEVICE_KEY = "mottak_nordic_cloud_device";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const PRODUCTS = { bunner: "Bunner", hyller30: "Hyller x30", hyller60: "Hyller x60" };
const TEXT = window.MOTTAK_TEXT;
const $ = id => document.getElementById(id);

let language = TEXT[localStorage.getItem(LANGUAGE_KEY)] ? localStorage.getItem(LANGUAGE_KEY) : "nb";
let product = PRODUCTS[localStorage.getItem(PRODUCT_KEY)] ? localStorage.getItem(PRODUCT_KEY) : "bunner";
let cloudRows = [];
let saving = false;
let scanTimer = null;
let parsedCode = "";

const deviceId = (() => {
  let value = localStorage.getItem(DEVICE_KEY);
  if (!value) {
    value = `nordic-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(DEVICE_KEY, value);
  }
  return value;
})();

const t = () => TEXT[language];
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const compact = value => String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const normalizeService = value => compact(value).slice(0, 12);
const normalizeUpper = value => String(value || "").replace(/\D/g, "").slice(0, 6);
const normalizeLower = value => compact(value).slice(0, 6);

function show(text, type = "") {
  $("message").textContent = text;
  $("message").className = `message ${type}`;
}

function focusScanner(delay = 0) {
  clearTimeout(focusScanner.timer);
  focusScanner.timer = setTimeout(() => {
    const input = $("scanInput");
    try { input.focus({ preventScroll: true }); } catch { input.focus(); }
    updateFocusStatus();
  }, delay);
}

function currentParts() {
  return {
    scannerCode: normalizeService($("serviceCode").value),
    upperNumber: normalizeUpper($("upperNumber").value),
    lowerNumber: normalizeLower($("lowerNumber").value)
  };
}

function partsValid(parts) {
  return /^[A-Z0-9]{12}$/.test(parts.scannerCode)
    && /^\d{6}$/.test(parts.upperNumber)
    && /^[A-Z0-9]{6}$/.test(parts.lowerNumber);
}

function scannerMessages() {
  return {
    nb: {
      ready: "Skannerfeltet er aktivt — trykk utløseren.",
      notReady: "Trykk «Aktiver skanner».",
      empty: "Ingen tegn mottatt ennå.",
      count: n => `Mottatt: ${n} tegn`,
      complete: "Komplett kode mottatt: 24 tegn.",
      multiple: "Flere tegn ble mottatt. Den siste komplette 24-tegnskoden brukes."
    },
    pl: {
      ready: "Pole skanera jest aktywne — naciśnij spust.",
      notReady: "Naciśnij «Aktywuj skaner».",
      empty: "Nie odebrano jeszcze znaków.",
      count: n => `Odebrano: ${n} znaków`,
      complete: "Odebrano pełny kod: 24 znaki.",
      multiple: "Odebrano kilka kodów. Użyto ostatniego pełnego kodu 24-znakowego."
    },
    uk: {
      ready: "Поле сканера активне — натисніть курок.",
      notReady: "Натисніть «Активувати сканер».",
      empty: "Символів ще не отримано.",
      count: n => `Отримано: ${n} символів`,
      complete: "Повний код отримано: 24 символи.",
      multiple: "Отримано кілька кодів. Використано останній повний код із 24 символів."
    }
  }[language];
}

function updateFocusStatus() {
  const status = $("focusStatus");
  const text = $("focusStatusText");
  if (!status || !text) return;
  const ready = document.activeElement === $("scanInput");
  status.classList.toggle("ready", ready);
  $("scanInput").classList.toggle("scan-ready", ready);
  text.textContent = ready ? scannerMessages().ready : scannerMessages().notReady;
}

function updateMeter() {
  const meter = $("scanMeter");
  if (!meter) return;
  const raw = compact($("scanInput").value);
  meter.className = "scan-meter";
  if (!raw.length) {
    meter.textContent = scannerMessages().empty;
  } else if (raw.length === 24) {
    meter.textContent = scannerMessages().complete;
    meter.classList.add("good");
  } else if (raw.length > 24) {
    meter.textContent = scannerMessages().multiple;
    meter.classList.add("bad");
  } else {
    meter.textContent = scannerMessages().count(raw.length);
  }
}

function renderRaw() {
  const raw = compact($("scanInput").value);
  $("rawPreview").textContent = raw ? `${t().rawLabel}: ${raw} (${raw.length})` : t().rawEmpty;
  updateMeter();
}

function renderPartState() {
  const parts = currentParts();
  $("serviceCode").value = parts.scannerCode;
  $("upperNumber").value = parts.upperNumber;
  $("lowerNumber").value = parts.lowerNumber;

  [
    ["serviceCode", /^[A-Z0-9]{12}$/.test(parts.scannerCode)],
    ["upperNumber", /^\d{6}$/.test(parts.upperNumber)],
    ["lowerNumber", /^[A-Z0-9]{6}$/.test(parts.lowerNumber)]
  ].forEach(([id, valid]) => {
    $(id).classList.toggle("valid", valid);
    $(id).classList.toggle("invalid", Boolean($(id).value) && !valid);
  });

  $("saveScanButton").disabled = saving || !partsValid(parts);
  renderRaw();
}

function splitStableScan() {
  clearTimeout(scanTimer);
  const raw = compact($("scanInput").value);

  if (!raw) {
    show(t().noCode, "bad");
    focusScanner();
    return false;
  }

  if (raw.length < 24) {
    show(`${t().wrongLength}: ${raw.length}.`, "bad");
    focusScanner();
    return false;
  }

  const code = raw.slice(-24);
  if (!/^[A-Z0-9]{12}[0-9]{6}[A-Z0-9]{6}$/.test(code)) {
    show(t().invalid, "bad");
    focusScanner();
    return false;
  }

  parsedCode = code;
  $("scanInput").value = code;
  $("serviceCode").value = code.slice(0, 12);
  $("upperNumber").value = code.slice(12, 18);
  $("lowerNumber").value = code.slice(18, 24);
  renderPartState();
  show(raw.length > 24 ? `${t().prepared}\n${scannerMessages().multiple}` : t().prepared, raw.length > 24 ? "warn" : "ok");
  focusScanner();
  return true;
}

function clearForm() {
  clearTimeout(scanTimer);
  parsedCode = "";
  $("scanInput").value = "";
  $("serviceCode").value = "";
  $("upperNumber").value = "";
  $("lowerNumber").value = "";
  renderPartState();
  show("");
  focusScanner(20);
}

function renderChoices() {
  document.querySelectorAll("[data-language]").forEach(button => {
    button.classList.toggle("active", button.dataset.language === language);
  });
  document.querySelectorAll("[data-product]").forEach(button => {
    button.classList.toggle("active", button.dataset.product === product);
  });
}

function applyLanguage() {
  document.documentElement.lang = language;
  document.querySelectorAll("[data-t]").forEach(element => {
    const value = t()[element.dataset.t];
    if (typeof value === "string") element.textContent = value;
  });
  document.querySelectorAll("[data-guide-language]").forEach(element => {
    element.classList.toggle("active", element.dataset.guideLanguage === language);
  });
  $("scanInput").placeholder = t().scanTitle;
  renderChoices();
  renderPartState();
  renderCloud();
  updateFocusStatus();
}

function statusPill(status) {
  const safe = ["pending", "verified", "invalid"].includes(status) ? status : "pending";
  const label = safe === "verified" ? t().verified : safe === "invalid" ? t().problem : t().pending;
  return `<span class="status-pill status-${safe}">${esc(label)}</span>`;
}

function renderCounts() {
  $("allCount").textContent = cloudRows.length;
  $("pendingCount").textContent = cloudRows.filter(row => row.status === "pending").length;
  $("verifiedCount").textContent = cloudRows.filter(row => row.status === "verified").length;
  $("photoCount").textContent = cloudRows.filter(row => Boolean(row.photo_url)).length;
}

function renderCloud() {
  const body = $("cloudBody");
  renderCounts();
  if (!cloudRows.length) {
    body.innerHTML = `<tr><td class="empty" colspan="9">${esc(t().empty)}</td></tr>`;
    return;
  }

  body.innerHTML = cloudRows.map(row => `<tr>
    <td>${row.photo_url
      ? `<a href="${esc(row.photo_url)}" target="_blank" rel="noopener"><img class="thumb" src="${esc(row.photo_url)}" loading="lazy" alt="Mottak"></a>`
      : `<div class="no-photo">${esc(t().noPhoto)}</div>`}</td>
    <td>${esc(new Date(row.created_at).toLocaleString())}</td>
    <td>${esc(PRODUCTS[row.product] || row.product || "—")}</td>
    <td class="mono">${esc(row.scanner_code || "—")}</td>
    <td class="mono">${esc(row.upper_number || "—")}</td>
    <td class="mono">${esc(row.lower_number || "—")}</td>
    <td>${statusPill(row.status)}</td>
    <td>${esc(row.source || "—")}</td>
    <td><button class="success" type="button" data-status-id="${esc(row.id)}" data-status-value="verified">${esc(t().approve)}</button><button class="danger" type="button" data-status-id="${esc(row.id)}" data-status-value="invalid">${esc(t().problem)}</button></td>
  </tr>`).join("");
}

async function loadCloud() {
  const response = await client.from(TABLE)
    .select("id,created_at,product,scanner_code,upper_number,lower_number,status,source,device_id,photo_url,photo_path,confidence,raw_data")
    .order("created_at", { ascending: false })
    .limit(300);

  if (response.error) {
    show(`${t().loadError}\n${response.error.message}`, "bad");
    return false;
  }

  cloudRows = response.data || [];
  renderCloud();
  return true;
}

async function savePending() {
  if (saving) return;
  const parts = currentParts();
  renderPartState();

  if (!partsValid(parts)) {
    show(t().invalid, "bad");
    focusScanner();
    return;
  }

  saving = true;
  renderPartState();
  show(t().saving);

  try {
    const pairQuery = await client.from(TABLE)
      .select("id,scanner_code,photo_url,source,status,device_id,raw_data")
      .eq("upper_number", parts.upperNumber)
      .eq("lower_number", parts.lowerNumber)
      .order("created_at", { ascending: false })
      .limit(10);

    if (pairQuery.error) throw pairQuery.error;
    const pairRows = pairQuery.data || [];
    const exactRow = pairRows.find(row => compact(row.scanner_code) === parts.scannerCode);

    if (exactRow) {
      show(t().duplicate, "warn");
      return;
    }

    const conflictingPair = pairRows.find(row => compact(row.scanner_code) && compact(row.scanner_code) !== parts.scannerCode);
    if (conflictingPair) {
      show(t().pairConflict, "bad");
      return;
    }

    const cameraRow = pairRows.find(row => !compact(row.scanner_code));
    const rawData = parsedCode || `${parts.scannerCode}${parts.upperNumber}${parts.lowerNumber}`;
    let result;

    if (cameraRow) {
      result = await client.from(TABLE).update({
        product,
        scanner_code: parts.scannerCode,
        status: "pending",
        source: cameraRow.source || (cameraRow.photo_url ? "camera" : "nordic_id"),
        device_id: cameraRow.device_id || deviceId,
        raw_data: rawData
      }).eq("id", cameraRow.id).select("id").maybeSingle();
    } else {
      result = await client.from(TABLE).insert({
        product,
        scanner_code: parts.scannerCode,
        upper_number: parts.upperNumber,
        lower_number: parts.lowerNumber,
        status: "pending",
        source: "nordic_id",
        device_id: deviceId,
        raw_data: rawData,
        photo_url: "",
        photo_path: ""
      }).select("id").maybeSingle();
    }

    if (result.error) throw result.error;
    if (!result.data?.id) throw new Error("Database did not confirm the write");

    show(cameraRow ? t().linked : t().saved, "ok");
    await loadCloud();
    clearForm();
  } catch (error) {
    show(`${t().saveError}\n${error.message || error}`, "bad");
  } finally {
    saving = false;
    renderPartState();
    focusScanner(30);
  }
}

async function updateStatus(id, status) {
  const payload = status === "verified"
    ? { status, verified_at: new Date().toISOString() }
    : { status };
  const response = await client.from(TABLE).update(payload).eq("id", id);
  if (response.error) {
    show(`${t().updateError}\n${response.error.message}`, "bad");
    return;
  }
  await loadCloud();
  focusScanner(20);
}

const scanInput = $("scanInput");

scanInput.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === "Tab") {
    event.preventDefault();
    splitStableScan();
  }
});

scanInput.addEventListener("input", () => {
  clearTimeout(scanTimer);
  renderRaw();
  if (compact(scanInput.value).length) {
    scanTimer = setTimeout(splitStableScan, 420);
  }
});

scanInput.addEventListener("focus", updateFocusStatus);
scanInput.addEventListener("blur", updateFocusStatus);

$("splitButton").addEventListener("click", splitStableScan);
$("saveScanButton").addEventListener("click", savePending);
$("clearButton").addEventListener("click", clearForm);
$("focusButton").addEventListener("click", () => focusScanner());
$("activateScanButton").addEventListener("click", () => {
  $("scanCard").scrollIntoView({ behavior: "smooth", block: "start" });
  focusScanner(300);
});
$("refreshButton").addEventListener("click", async () => {
  await loadCloud();
  focusScanner(20);
});

$("languages").addEventListener("click", event => {
  const button = event.target.closest("[data-language]");
  if (!button) return;
  language = button.dataset.language;
  localStorage.setItem(LANGUAGE_KEY, language);
  applyLanguage();
  focusScanner(20);
});

$("products").addEventListener("click", event => {
  const button = event.target.closest("[data-product]");
  if (!button) return;
  product = button.dataset.product;
  localStorage.setItem(PRODUCT_KEY, product);
  renderChoices();
  focusScanner(20);
});

["serviceCode", "upperNumber", "lowerNumber"].forEach(id => {
  $(id).addEventListener("input", renderPartState);
});

$("cloudBody").addEventListener("click", event => {
  const button = event.target.closest("[data-status-id]");
  if (!button) return;
  updateStatus(button.dataset.statusId, button.dataset.statusValue);
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) focusScanner(250);
});

window.addEventListener("pageshow", () => focusScanner(250));

client.channel("mottak-nordic-cloud-v45")
  .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, loadCloud)
  .subscribe();

applyLanguage();
loadCloud();
clearForm();
