"use strict";

const SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co";
const SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya";
const TABLE = "mottak_scans";
const LANGUAGE_KEY = "mottak_nordic_cloud_language";
const DEVICE_KEY = "mottak_nordic_cloud_device";
const REQUIRED_PREFIX = "33161403D000";
const EPC_LENGTH = 24;
const EPC_PATTERN = /^33161403D000\d{6}[A-Z0-9]{6}$/;

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const BASE_TEXT = window.MOTTAK_TEXT;
const PRODUCTS = { bunner: "Bunner", hyller30: "Hyller x30", hyller60: "Hyller x60" };
const $ = id => document.getElementById(id);

const V46_TEXT = {
  nb: {
    subtitle: "Kandidatversjon for stabil mottak av én Bunner. To ekte skannerfelt A/B arbeider bak ett enkelt brukerfelt.",
    candidateWarning: "Testside: v4.5 er ikke endret. Ingenting lagres automatisk etter RFID-lesing.",
    chooseMode: "2. Velg modus",
    singleBunner: "Én Bunner",
    stackLater: "Bunner-stabel — neste trinn",
    scanHeading: "3. Skann etiketten",
    singleOnly: "Forventer nøyaktig 1 unik etikett",
    activate: "▶ Aktiver skanner",
    scanHelp: "Trykk aktiver, og skann én etikett. Siden bytter automatisk mellom kanal A og B. Flere mottatte EPC-er deles i blokker på 24 tegn.",
    activeChannel: "Aktiv kanal",
    uniqueFound: "Unike riktige",
    lastLength: "Siste lengde",
    restartFields: "Start skannerfeltene på nytt",
    clearOperation: "Ny skanning",
    foundTags: "Mottatte riktige etiketter",
    service: "Servicekode",
    upper: "Øvre",
    lower: "Nedre",
    tagStatus: "Resultat",
    technicalDetails: "Teknisk journal",
    checkHeading: "4. Kontroller og bekreft",
    serviceRule: "Må være nøyaktig 33161403D000",
    manualHelp: "Lagring er bare mulig når operasjonen inneholder én unik riktig etikett. Sammenlign tallene med den fysiske etiketten.",
    saveConfirm: "Lagre / Bekreft",
    cloudNote: "Telefon og Nordic ID bruker samme mottak_scans-tabell. Kameraoppføring kobles med øvre + nedre nummer.",
    scannerReady: "Kanal {channel} er aktiv. Trykk utløseren.",
    scannerInactive: "Trykk «Aktiver skanner».",
    emptyOperation: "Ingen riktig etikett er mottatt ennå.",
    oneReady: "1 riktig etikett funnet. Kontroller feltene og bekreft manuelt.",
    multipleFound: "{count} riktige etiketter funnet. Modusen «Én Bunner» kan ikke lagres. Kontroller området og start en ny skanning.",
    badLength: "Mottatt {length} tegn. Lengden må være delelig med 24. Ingenting ble lagt til.",
    noValid: "Ingen gyldig Bunner-etikett ble funnet.",
    foreignIgnored: "{count} fremmed RFID-kode ble ignorert.",
    foreignIgnoredMany: "{count} fremmede RFID-koder ble ignorert.",
    duplicateIgnored: "Gjentatt lesing av samme etikett ble ignorert.",
    duplicateIgnoredMany: "{count} gjentatte lesinger ble ignorert.",
    accepted: "Godkjent",
    blocked: "Blokkert",
    emptyTable: "Ingen riktige etiketter i denne operasjonen.",
    logEmpty: "Teknisk journal er tom.",
    fieldsRestarted: "Skannerfeltene er startet på nytt. Tidligere mottatte etiketter er beholdt.",
    operationCleared: "Ny operasjon er klar.",
    invalidParts: "Kontroller 12 / 6 / 6. Servicekoden må være 33161403D000.",
    multipleSaveBlocked: "Lagring er blokkert fordi mer enn én unik riktig etikett er mottatt.",
    saving: "Kontrollerer databasen og lagrer…",
    saved: "Etiketten er lagret som pending.",
    linked: "Nordic ID er koblet til den eksisterende kameraoppføringen.",
    duplicateDb: "Denne nøyaktige EPC-en finnes allerede i databasen.",
    conflictDb: "Samme øvre + nedre nummer finnes med en annen full EPC. Lagring er blokkert.",
    saveError: "Kunne ikke lagre oppføringen.",
    loadError: "Kunne ikke laste den felles tabellen.",
    updateError: "Kunne ikke oppdatere status.",
    manualChanged: "Numrene er manuelt endret. Kontroller ekstra nøye før lagring.",
    rawReceived: "Kanal {channel}: mottatt {length} tegn ({blocks} blokk(er)).",
    foreignPrefix: "Fremmed RFID-blokk",
    invalidBlock: "Ugyldig 24-tegnsblokk",
    noPhoto: "Venter på foto"
  },
  pl: {
    subtitle: "Wersja testowa stabilnego przyjęcia jednego Bunner. Dwa prawdziwe pola skanera A/B działają pod jednym prostym blokiem użytkownika.",
    candidateWarning: "Strona testowa: v4.5 nie została zmieniona. Po odczycie RFID nic nie zapisuje się automatycznie.",
    chooseMode: "2. Wybierz tryb",
    singleBunner: "Jeden Bunner",
    stackLater: "Stos Bunner — następny etap",
    scanHeading: "3. Zeskanuj etykietę",
    singleOnly: "Oczekiwana dokładnie 1 unikalna etykieta",
    activate: "▶ Aktywuj skaner",
    scanHelp: "Naciśnij aktywację i zeskanuj jedną etykietę. Strona automatycznie przełącza kanał A/B. Kilka EPC jest dzielonych kolejno na bloki po 24 znaki.",
    activeChannel: "Aktywny kanał",
    uniqueFound: "Unikalne poprawne",
    lastLength: "Ostatnia długość",
    restartFields: "Uruchom pola skanera ponownie",
    clearOperation: "Nowy skan",
    foundTags: "Odebrane poprawne etykiety",
    service: "Kod służbowy",
    upper: "Górny",
    lower: "Dolny",
    tagStatus: "Wynik",
    technicalDetails: "Dziennik techniczny",
    checkHeading: "4. Sprawdź i potwierdź",
    serviceRule: "Musi być dokładnie 33161403D000",
    manualHelp: "Zapis jest możliwy tylko wtedy, gdy operacja zawiera jedną unikalną poprawną etykietę. Porównaj numery z fizyczną etykietą.",
    saveConfirm: "Zapisz / Potwierdź",
    cloudNote: "Telefon i Nordic ID używają tej samej tabeli mottak_scans. Wpis aparatu jest łączony przez numer górny + dolny.",
    scannerReady: "Kanał {channel} jest aktywny. Naciśnij spust.",
    scannerInactive: "Naciśnij «Aktywuj skaner».",
    emptyOperation: "Nie odebrano jeszcze poprawnej etykiety.",
    oneReady: "Znaleziono 1 poprawną etykietę. Sprawdź pola i potwierdź ręcznie.",
    multipleFound: "Znaleziono {count} poprawne etykiety. Trybu «Jeden Bunner» nie można zapisać. Sprawdź obszar i rozpocznij nowy skan.",
    badLength: "Odebrano {length} znaków. Długość musi być podzielna przez 24. Niczego nie dodano.",
    noValid: "Nie znaleziono poprawnej etykiety Bunner.",
    foreignIgnored: "Pominięto {count} obcy kod RFID.",
    foreignIgnoredMany: "Pominięto {count} obce kody RFID.",
    duplicateIgnored: "Powtórny odczyt tej samej etykiety został pominięty.",
    duplicateIgnoredMany: "Pominięto {count} powtórne odczyty.",
    accepted: "Przyjęto",
    blocked: "Zablokowano",
    emptyTable: "Brak poprawnych etykiet w tej operacji.",
    logEmpty: "Dziennik techniczny jest pusty.",
    fieldsRestarted: "Pola skanera uruchomiono ponownie. Wcześniejsze etykiety pozostają.",
    operationCleared: "Nowa operacja jest gotowa.",
    invalidParts: "Sprawdź 12 / 6 / 6. Kod służbowy musi być 33161403D000.",
    multipleSaveBlocked: "Zapis zablokowany, ponieważ odebrano więcej niż jedną unikalną poprawną etykietę.",
    saving: "Sprawdzanie bazy i zapisywanie…",
    saved: "Etykietę zapisano jako pending.",
    linked: "Nordic ID połączono z istniejącym wpisem aparatu.",
    duplicateDb: "Dokładnie ten EPC już istnieje w bazie.",
    conflictDb: "Ten sam numer górny + dolny istnieje z innym pełnym EPC. Zapis zablokowany.",
    saveError: "Nie udało się zapisać wpisu.",
    loadError: "Nie udało się pobrać wspólnej tabeli.",
    updateError: "Nie udało się zmienić statusu.",
    manualChanged: "Numery zmieniono ręcznie. Sprawdź je szczególnie dokładnie przed zapisem.",
    rawReceived: "Kanał {channel}: odebrano {length} znaków ({blocks} bloków).",
    foreignPrefix: "Obcy blok RFID",
    invalidBlock: "Niepoprawny blok 24-znakowy",
    noPhoto: "Czeka na zdjęcie"
  },
  uk: {
    subtitle: "Кандидатна версія стабільного приймання одного Bunner. Два справжні поля сканера A/B працюють під одним простим блоком для користувача.",
    candidateWarning: "Тестова сторінка: v4.5 не змінена. Після RFID-зчитування нічого не зберігається автоматично.",
    chooseMode: "2. Виберіть режим",
    singleBunner: "Один Bunner",
    stackLater: "Стопка Bunner — наступний етап",
    scanHeading: "3. Проскануйте бірку",
    singleOnly: "Очікується рівно 1 унікальна бірка",
    activate: "▶ Активувати сканер",
    scanHelp: "Натисніть активацію та проскануйте одну бірку. Сторінка автоматично чергує канали A/B. Кілька EPC послідовно діляться на блоки по 24 символи.",
    activeChannel: "Активний канал",
    uniqueFound: "Унікальні правильні",
    lastLength: "Остання довжина",
    restartFields: "Перезапустити поля сканера",
    clearOperation: "Нове сканування",
    foundTags: "Отримані правильні бірки",
    service: "Службовий код",
    upper: "Верхній",
    lower: "Нижній",
    tagStatus: "Результат",
    technicalDetails: "Технічний журнал",
    checkHeading: "4. Перевірте та підтвердьте",
    serviceRule: "Має бути рівно 33161403D000",
    manualHelp: "Збереження можливе лише тоді, коли операція містить одну унікальну правильну бірку. Зіставте номери з фізичною біркою.",
    saveConfirm: "Зберегти / Підтвердити",
    cloudNote: "Телефон і Nordic ID використовують одну таблицю mottak_scans. Запис камери зв’язується за верхнім + нижнім номером.",
    scannerReady: "Канал {channel} активний. Натисніть курок.",
    scannerInactive: "Натисніть «Активувати сканер».",
    emptyOperation: "Правильної бірки ще не отримано.",
    oneReady: "Знайдено 1 правильну бірку. Перевірте поля та підтвердьте вручну.",
    multipleFound: "Знайдено {count} правильні бірки. Режим «Один Bunner» не можна зберегти. Перевірте зону та почніть нове сканування.",
    badLength: "Отримано {length} символів. Довжина має ділитися на 24. Нічого не додано.",
    noValid: "Правильної бірки Bunner не знайдено.",
    foreignIgnored: "Сторонній RFID-код ({count}) проігноровано.",
    foreignIgnoredMany: "Сторонні RFID-коди ({count}) проігноровано.",
    duplicateIgnored: "Повторне зчитування тієї самої бірки проігноровано.",
    duplicateIgnoredMany: "Повторні зчитування ({count}) проігноровано.",
    accepted: "Прийнято",
    blocked: "Заблоковано",
    emptyTable: "У цій операції немає правильних бірок.",
    logEmpty: "Технічний журнал порожній.",
    fieldsRestarted: "Поля сканера перезапущено. Раніше отримані бірки збережені в поточній операції.",
    operationCleared: "Нова операція готова.",
    invalidParts: "Перевірте 12 / 6 / 6. Службовий код має бути 33161403D000.",
    multipleSaveBlocked: "Збереження заблоковано, бо отримано більше однієї унікальної правильної бірки.",
    saving: "Перевіряю базу та зберігаю…",
    saved: "Бірку збережено зі статусом pending.",
    linked: "Nordic ID приєднано до наявного запису камери.",
    duplicateDb: "Точно такий повний EPC уже є в базі.",
    conflictDb: "Така сама пара верхній + нижній уже має інший повний EPC. Збереження заблоковано.",
    saveError: "Не вдалося зберегти запис.",
    loadError: "Не вдалося завантажити спільну таблицю.",
    updateError: "Не вдалося оновити статус.",
    manualChanged: "Номери змінено вручну. Перед збереженням перевірте їх особливо уважно.",
    rawReceived: "Канал {channel}: отримано {length} символів ({blocks} блоків).",
    foreignPrefix: "Сторонній RFID-блок",
    invalidBlock: "Неправильний 24-символьний блок",
    noPhoto: "Очікує фото"
  }
};

let language = BASE_TEXT[localStorage.getItem(LANGUAGE_KEY)] ? localStorage.getItem(LANGUAGE_KEY) : "nb";
let cloudRows = [];
let saving = false;
let activeChannel = "A";
let processing = false;
let lastRawLength = 0;
let selectedRaw = "";
let lastNotice = null;
let technicalEvents = [];
let pullStartY = null;

const operationCodes = new Map();
const fieldTimers = { A: null, B: null };

const deviceId = (() => {
  let value = localStorage.getItem(DEVICE_KEY);
  if (!value) {
    value = `nordic-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(DEVICE_KEY, value);
  }
  return value;
})();

const t = () => BASE_TEXT[language];
const v = () => V46_TEXT[language];
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const compact = value => String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const normalizeService = value => compact(value).slice(0, 12);
const normalizeUpper = value => String(value || "").replace(/\D/g, "").slice(0, 6);
const normalizeLower = value => compact(value).slice(0, 6);
const interpolate = (text, values = {}) => Object.entries(values).reduce(
  (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
  text
);

function show(text, type = "") {
  $("message").textContent = text;
  $("message").className = `message ${type}`;
}

function setOperationMessage(text, type = "") {
  $("operationMessage").textContent = text;
  $("operationMessage").className = `big-message ${type}`;
}

function currentParts() {
  return {
    scannerCode: normalizeService($("serviceCode").value),
    upperNumber: normalizeUpper($("upperNumber").value),
    lowerNumber: normalizeLower($("lowerNumber").value)
  };
}

function partsToEpc(parts) {
  return `${parts.scannerCode}${parts.upperNumber}${parts.lowerNumber}`;
}

function partsValid(parts) {
  return parts.scannerCode === REQUIRED_PREFIX
    && /^\d{6}$/.test(parts.upperNumber)
    && /^[A-Z0-9]{6}$/.test(parts.lowerNumber)
    && EPC_PATTERN.test(partsToEpc(parts));
}

function splitEpc(code) {
  return {
    scannerCode: code.slice(0, 12),
    upperNumber: code.slice(12, 18),
    lowerNumber: code.slice(18, 24)
  };
}

function rowFullEpc(row) {
  const raw = compact(row?.raw_data);
  if (EPC_PATTERN.test(raw)) return raw;
  const combined = `${normalizeService(row?.scanner_code)}${normalizeUpper(row?.upper_number)}${normalizeLower(row?.lower_number)}`;
  return EPC_PATTERN.test(combined) ? combined : "";
}

function addTechnical(message, raw = "") {
  technicalEvents.unshift({
    time: new Date(),
    message,
    raw
  });
  technicalEvents = technicalEvents.slice(0, 80);
  renderTechnicalLog();
}

function renderTechnicalLog() {
  if (!technicalEvents.length) {
    $("technicalLog").textContent = v().logEmpty;
    return;
  }
  $("technicalLog").textContent = technicalEvents.map(event => {
    const time = event.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return `[${time}] ${event.message}${event.raw ? `\n${event.raw}` : ""}`;
  }).join("\n\n");
}

function scannerHasFocus() {
  return document.activeElement === $("scanA") || document.activeElement === $("scanB");
}

function updateFocusStatus() {
  const ready = scannerHasFocus();
  $("scanConsole").classList.toggle("ready", ready);
  $("activeChannel").textContent = activeChannel;
  if (!operationCodes.size) {
    $("scanStatus").textContent = ready
      ? interpolate(v().scannerReady, { channel: activeChannel })
      : v().scannerInactive;
  }
}

function fieldFor(name) {
  return name === "A" ? $("scanA") : $("scanB");
}

function otherChannel(name) {
  return name === "A" ? "B" : "A";
}

function focusChannel(name, delay = 0) {
  clearTimeout(focusChannel.timer);
  focusChannel.timer = setTimeout(() => {
    activeChannel = name;
    const field = fieldFor(name);
    try { field.focus({ preventScroll: true }); } catch { field.focus(); }
    try { field.setSelectionRange(field.value.length, field.value.length); } catch {}
    updateFocusStatus();
  }, delay);
}

function activateScanner(delay = 0) {
  focusChannel(activeChannel, delay);
}

function moveToOtherField(fromName) {
  const fromField = fieldFor(fromName);
  const nextName = otherChannel(fromName);
  const nextField = fieldFor(nextName);

  setTimeout(() => {
    nextField.value = "";
    activeChannel = nextName;
    try { nextField.focus({ preventScroll: true }); } catch { nextField.focus(); }
    try { nextField.setSelectionRange(0, 0); } catch {}
    updateFocusStatus();
  }, 70);

  setTimeout(() => {
    fromField.value = "";
  }, 180);
}

function renderPartState() {
  const parts = currentParts();
  $("serviceCode").value = parts.scannerCode;
  $("upperNumber").value = parts.upperNumber;
  $("lowerNumber").value = parts.lowerNumber;

  [
    ["serviceCode", parts.scannerCode === REQUIRED_PREFIX],
    ["upperNumber", /^\d{6}$/.test(parts.upperNumber)],
    ["lowerNumber", /^[A-Z0-9]{6}$/.test(parts.lowerNumber)]
  ].forEach(([id, valid]) => {
    $(id).classList.toggle("valid", valid);
    $(id).classList.toggle("invalid", Boolean($(id).value) && !valid);
  });

  $("saveScanButton").disabled = saving || operationCodes.size !== 1 || !partsValid(parts);
}

function fillParts(code) {
  const parts = splitEpc(code);
  $("serviceCode").value = parts.scannerCode;
  $("upperNumber").value = parts.upperNumber;
  $("lowerNumber").value = parts.lowerNumber;
  renderPartState();
}

function clearParts() {
  $("serviceCode").value = "";
  $("upperNumber").value = "";
  $("lowerNumber").value = "";
  renderPartState();
}

function renderOperationTable() {
  const rows = [...operationCodes.values()];
  if (!rows.length) {
    $("operationBody").innerHTML = `<tr><td class="empty" colspan="5">${esc(v().emptyTable)}</td></tr>`;
    return;
  }

  $("operationBody").innerHTML = rows.map((code, index) => {
    const parts = splitEpc(code);
    const status = rows.length === 1 ? v().accepted : v().blocked;
    const statusClass = rows.length === 1 ? "status-verified" : "status-invalid";
    return `<tr>
      <td>${index + 1}</td>
      <td class="mono">${esc(parts.scannerCode)}</td>
      <td class="mono">${esc(parts.upperNumber)}</td>
      <td class="mono">${esc(parts.lowerNumber)}</td>
      <td><span class="status-pill ${statusClass}">${esc(status)}</span></td>
    </tr>`;
  }).join("");
}

function noticeSuffix() {
  if (!lastNotice) return "";
  const lines = [];
  if (lastNotice.foreign === 1) lines.push(interpolate(v().foreignIgnored, { count: 1 }));
  if (lastNotice.foreign > 1) lines.push(interpolate(v().foreignIgnoredMany, { count: lastNotice.foreign }));
  if (lastNotice.duplicates === 1) lines.push(v().duplicateIgnored);
  if (lastNotice.duplicates > 1) lines.push(interpolate(v().duplicateIgnoredMany, { count: lastNotice.duplicates }));
  return lines.length ? `\n${lines.join(" ")}` : "";
}

function renderOperation() {
  const count = operationCodes.size;
  $("uniqueCount").textContent = count;
  $("lastLength").textContent = lastRawLength;
  renderOperationTable();

  if (count === 0) {
    selectedRaw = "";
    clearParts();
    $("scanStatus").textContent = scannerHasFocus()
      ? interpolate(v().scannerReady, { channel: activeChannel })
      : v().scannerInactive;
    const message = lastNotice?.error || v().emptyOperation;
    setOperationMessage(`${message}${noticeSuffix()}`, lastNotice?.error ? "bad" : "");
  } else if (count === 1) {
    const code = [...operationCodes.keys()][0];
    if (selectedRaw !== code) {
      selectedRaw = code;
      fillParts(code);
    }
    $("scanStatus").textContent = "1 / 1";
    setOperationMessage(`${v().oneReady}${noticeSuffix()}`, lastNotice?.foreign || lastNotice?.duplicates ? "warn" : "ok");
  } else {
    selectedRaw = "";
    clearParts();
    $("scanStatus").textContent = `${count} / 1`;
    setOperationMessage(`${interpolate(v().multipleFound, { count })}${noticeSuffix()}`, "bad");
  }

  renderPartState();
  updateFocusStatus();
}

function processRaw(raw, channel) {
  lastRawLength = raw.length;
  const blocksCount = raw.length / EPC_LENGTH;
  addTechnical(interpolate(v().rawReceived, {
    channel,
    length: raw.length,
    blocks: Number.isInteger(blocksCount) ? blocksCount : "—"
  }), raw);

  if (!raw.length || raw.length % EPC_LENGTH !== 0) {
    lastNotice = {
      error: interpolate(v().badLength, { length: raw.length }),
      foreign: 0,
      duplicates: 0
    };
    renderOperation();
    return;
  }

  let foreign = 0;
  let duplicates = 0;
  let validInThisInput = 0;

  for (let offset = 0; offset < raw.length; offset += EPC_LENGTH) {
    const block = raw.slice(offset, offset + EPC_LENGTH);
    if (!EPC_PATTERN.test(block)) {
      foreign += 1;
      const reason = block.startsWith(REQUIRED_PREFIX) ? v().invalidBlock : v().foreignPrefix;
      addTechnical(`${reason} #${offset / EPC_LENGTH + 1}`, block);
      continue;
    }

    validInThisInput += 1;
    if (operationCodes.has(block)) {
      duplicates += 1;
      continue;
    }
    operationCodes.set(block, block);
  }

  lastNotice = {
    error: validInThisInput === 0 ? v().noValid : "",
    foreign,
    duplicates
  };
  renderOperation();
}

function consumeField(name) {
  clearTimeout(fieldTimers[name]);
  const field = fieldFor(name);
  const raw = compact(field.value);
  if (!raw) return;

  if (processing) {
    fieldTimers[name] = setTimeout(() => consumeField(name), 80);
    return;
  }

  processing = true;
  try {
    processRaw(raw, name);
    moveToOtherField(name);
  } finally {
    processing = false;
  }
}

function scheduleField(name) {
  clearTimeout(fieldTimers[name]);
  const field = fieldFor(name);
  if (!compact(field.value)) return;
  const hasTerminator = /[\r\n\t]/.test(field.value);
  fieldTimers[name] = setTimeout(() => consumeField(name), hasTerminator ? 140 : 430);
}

function restartFields() {
  clearTimeout(fieldTimers.A);
  clearTimeout(fieldTimers.B);
  $("scanA").value = "";
  $("scanB").value = "";
  activeChannel = "A";
  addTechnical(v().fieldsRestarted);
  setOperationMessage(v().fieldsRestarted, "warn");
  focusChannel("A", 40);
}

function resetOperation({ focus = true, clearUserMessage = true } = {}) {
  clearTimeout(fieldTimers.A);
  clearTimeout(fieldTimers.B);
  operationCodes.clear();
  selectedRaw = "";
  lastRawLength = 0;
  lastNotice = null;
  $("scanA").value = "";
  $("scanB").value = "";
  clearParts();
  if (clearUserMessage) show("");
  renderOperation();
  setOperationMessage(v().operationCleared, "");
  if (focus) activateScanner(40);
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

  const locale = language === "nb" ? "nb-NO" : language === "pl" ? "pl-PL" : "uk-UA";
  body.innerHTML = cloudRows.map(row => `<tr>
    <td>${row.photo_url
      ? `<a href="${esc(row.photo_url)}" target="_blank" rel="noopener"><img class="thumb" src="${esc(row.photo_url)}" loading="lazy" alt="Mottak"></a>`
      : `<div class="no-photo">${esc(v().noPhoto)}</div>`}</td>
    <td>${esc(new Date(row.created_at).toLocaleString(locale))}</td>
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
    show(`${v().loadError}\n${response.error.message}`, "bad");
    return false;
  }

  cloudRows = response.data || [];
  renderCloud();
  return true;
}

async function savePending() {
  if (saving) return;

  if (operationCodes.size !== 1) {
    show(operationCodes.size > 1 ? v().multipleSaveBlocked : v().emptyOperation, "bad");
    activateScanner(20);
    return;
  }

  const parts = currentParts();
  const fullEpc = partsToEpc(parts);
  renderPartState();

  if (!partsValid(parts)) {
    show(v().invalidParts, "bad");
    activateScanner(20);
    return;
  }

  saving = true;
  renderPartState();
  show(v().saving);

  try {
    const exactQuery = await client.from(TABLE)
      .select("id,scanner_code,upper_number,lower_number,photo_url,source,status,device_id,raw_data")
      .eq("raw_data", fullEpc)
      .limit(10);
    if (exactQuery.error) throw exactQuery.error;

    const pairQuery = await client.from(TABLE)
      .select("id,scanner_code,upper_number,lower_number,photo_url,source,status,device_id,raw_data")
      .eq("upper_number", parts.upperNumber)
      .eq("lower_number", parts.lowerNumber)
      .order("created_at", { ascending: false })
      .limit(20);
    if (pairQuery.error) throw pairQuery.error;

    const exactRows = exactQuery.data || [];
    const pairRows = pairQuery.data || [];
    const combinedRows = [...exactRows, ...pairRows];
    const exactRow = combinedRows.find(row => rowFullEpc(row) === fullEpc);

    if (exactRow) {
      show(v().duplicateDb, "warn");
      return;
    }

    const conflictingPair = pairRows.find(row => {
      const existing = rowFullEpc(row);
      return existing && existing !== fullEpc;
    });
    if (conflictingPair) {
      show(v().conflictDb, "bad");
      return;
    }

    const cameraRow = pairRows.find(row => !normalizeService(row.scanner_code));
    let result;

    if (cameraRow) {
      result = await client.from(TABLE).update({
        product: "bunner",
        scanner_code: parts.scannerCode,
        status: "pending",
        source: cameraRow.source || (cameraRow.photo_url ? "camera" : "nordic_id"),
        device_id: cameraRow.device_id || deviceId,
        raw_data: fullEpc
      }).eq("id", cameraRow.id).select("id").maybeSingle();
    } else {
      result = await client.from(TABLE).insert({
        product: "bunner",
        scanner_code: parts.scannerCode,
        upper_number: parts.upperNumber,
        lower_number: parts.lowerNumber,
        status: "pending",
        source: "nordic_id",
        device_id: deviceId,
        raw_data: fullEpc,
        photo_url: "",
        photo_path: ""
      }).select("id").maybeSingle();
    }

    if (result.error) throw result.error;
    if (!result.data?.id) throw new Error("Database did not confirm the write");

    await loadCloud();
    resetOperation({ focus: false, clearUserMessage: false });
    show(cameraRow ? v().linked : v().saved, "ok");
    activateScanner(80);
  } catch (error) {
    show(`${v().saveError}\n${error.message || error}`, "bad");
  } finally {
    saving = false;
    renderPartState();
    activateScanner(30);
  }
}

async function updateStatus(id, status) {
  const payload = status === "verified"
    ? { status, verified_at: new Date().toISOString() }
    : { status };
  const response = await client.from(TABLE).update(payload).eq("id", id);
  if (response.error) {
    show(`${v().updateError}\n${response.error.message}`, "bad");
    return;
  }
  await loadCloud();
  activateScanner(20);
}

function renderChoices() {
  document.querySelectorAll("[data-language]").forEach(button => {
    button.classList.toggle("active", button.dataset.language === language);
  });
}

function applyLanguage() {
  document.documentElement.lang = language;
  document.querySelectorAll("[data-t]").forEach(element => {
    const value = t()[element.dataset.t];
    if (typeof value === "string") element.textContent = value;
  });
  document.querySelectorAll("[data-v46]").forEach(element => {
    const value = v()[element.dataset.v46];
    if (typeof value === "string") element.textContent = value;
  });
  renderChoices();
  renderOperation();
  renderTechnicalLog();
  renderCloud();
  updateFocusStatus();
}

$("scanA").addEventListener("input", () => scheduleField("A"));
$("scanB").addEventListener("input", () => scheduleField("B"));

["scanA", "scanB"].forEach(id => {
  $(id).addEventListener("focus", () => {
    activeChannel = id === "scanA" ? "A" : "B";
    updateFocusStatus();
  });
  $(id).addEventListener("blur", () => setTimeout(updateFocusStatus, 0));
  $(id).addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      consumeField(id === "scanA" ? "A" : "B");
    }
  });
});

$("activateScanButton").addEventListener("click", () => {
  $("scanCard").scrollIntoView({ behavior: "smooth", block: "start" });
  activateScanner(280);
});
$("scanConsole").addEventListener("click", () => activateScanner(20));
$("restartFieldsButton").addEventListener("click", restartFields);
$("clearOperationButton").addEventListener("click", () => resetOperation());
$("saveScanButton").addEventListener("click", savePending);
$("refreshButton").addEventListener("click", async () => {
  await loadCloud();
  activateScanner(20);
});

$("languages").addEventListener("click", event => {
  const button = event.target.closest("[data-language]");
  if (!button) return;
  language = button.dataset.language;
  localStorage.setItem(LANGUAGE_KEY, language);
  applyLanguage();
  activateScanner(20);
});

["serviceCode", "upperNumber", "lowerNumber"].forEach(id => {
  $(id).addEventListener("input", () => {
    renderPartState();
    const parts = currentParts();
    if (selectedRaw && partsValid(parts) && partsToEpc(parts) !== selectedRaw) {
      show(v().manualChanged, "warn");
    }
  });
});

$("cloudBody").addEventListener("click", event => {
  const button = event.target.closest("[data-status-id]");
  if (!button) return;
  updateStatus(button.dataset.statusId, button.dataset.statusValue);
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) activateScanner(250);
});
window.addEventListener("pageshow", () => activateScanner(250));

document.addEventListener("touchstart", event => {
  pullStartY = window.scrollY === 0 && event.touches.length ? event.touches[0].clientY : null;
}, { passive: true });

document.addEventListener("touchmove", event => {
  if (pullStartY === null || !event.touches.length) return;
  if (window.scrollY === 0 && event.touches[0].clientY > pullStartY + 8) event.preventDefault();
}, { passive: false });

client.channel("mottak-nordic-cloud-v46")
  .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, loadCloud)
  .subscribe();

applyLanguage();
loadCloud();
resetOperation({ focus: false });
activateScanner(350);
