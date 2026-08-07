"use strict";

(() => {
  const STORAGE_KEY = "mottak_ut_language";
  const allowed = ["nb", "pl", "uk"];
  let language = localStorage.getItem(STORAGE_KEY) || "nb";
  if (!allowed.includes(language)) language = "nb";

  const T = {
    nb: {
      home: "Hovedmeny",
      title: "UT — Bekreft rampe",
      subtitle: "Kontoret sender én samlet rampe. Lageret kontrollerer varene og sender rampen videre.",
      connection: "Tilkobling",
      connecting: "Kobler til Supabase…",
      activeRamps: "Aktive ramper",
      allRamps: "Alle ramper",
      search: "Søk RAMPE eller UT-nummer",
      refresh: "Oppdater",
      stock: "Lagerbeholdning",
      physical: "FYSISK PÅ LAGER",
      available: "TILGJENGELIG",
      reserved: "RESERVERT",
      onRamp: "PÅ RAMPE",
      sent: "SENDT",
      canUse: "Kan brukes nå",
      linked: "Tilknyttet ramper",
      ready: "Klar til utsending",
      sentFromStock: "Sendt fra lageret",
      rampsFromOffice: "Ramper fra kontoret",
      activeRamp: "Aktiv rampe",
      close: "Lukk",
      receiverLater: "Mottaker — senere",
      addressLater: "Adresse — senere",
      dateLater: "Dato — senere",
      cmrLater: "CMR — senere",
      totalBunner: "Totalt Bunner",
      totalShelves: "Totalt hyller",
      openRamp: "Åpne rampen",
      startWork: "Start arbeid",
      placeOnRamp: "Plassert på rampe",
      storno: "Storner",
      scanItem: "Skann vare",
      manual: "Manuell",
      register: "Registrer",
      statusNew: "Ny",
      statusWork: "I arbeid",
      statusRamp: "På rampe",
      statusSent: "Sendt",
      statusStorno: "Stornert",
      sendButton: "Send fra rampe",
      confirmCheck: "Jeg bekrefter at alle varer er kontrollert og står på riktig rampe.",
      rampFirst: "Rampen må først være ferdig kontrollert og markert På rampe.",
      confirmFirst: "Bekreft først at alle varer står på riktig rampe.",
      sendConfirmBefore: "Send hele RAMPE",
      sendConfirmAfter: "Etter dette flyttes varene til Sendt.",
      sending: "Sender rampen…",
      sentAlertBefore: "RAMPE",
      sentAlertAfter: "er sendt.",
      unknown: "Ukjent"
    },
    pl: {
      home: "Menu główne",
      title: "UT — Potwierdzenie rampy",
      subtitle: "Biuro wysyła jedno zbiorcze zlecenie na rampę. Magazyn kontroluje towar i wysyła rampę dalej.",
      connection: "Połączenie",
      connecting: "Łączenie z Supabase…",
      activeRamps: "Aktywne rampy",
      allRamps: "Wszystkie rampy",
      search: "Szukaj RAMPY lub numeru UT",
      refresh: "Odśwież",
      stock: "Stan magazynu",
      physical: "FIZYCZNIE W MAGAZYNIE",
      available: "DOSTĘPNE",
      reserved: "ZAREZERWOWANE",
      onRamp: "NA RAMPIE",
      sent: "WYSŁANE",
      canUse: "Można użyć teraz",
      linked: "Przypisane do ramp",
      ready: "Gotowe do wysyłki",
      sentFromStock: "Wysłane z magazynu",
      rampsFromOffice: "Rampy z biura",
      activeRamp: "Aktywna rampa",
      close: "Zamknij",
      receiverLater: "Odbiorca — później",
      addressLater: "Adres — później",
      dateLater: "Data — później",
      cmrLater: "CMR — później",
      totalBunner: "Razem Bunner",
      totalShelves: "Razem półek",
      openRamp: "Otwórz rampę",
      startWork: "Rozpocznij pracę",
      placeOnRamp: "Umieszczono na rampie",
      storno: "Storno",
      scanItem: "Skanuj towar",
      manual: "Ręcznie",
      register: "Zarejestruj",
      statusNew: "Nowe",
      statusWork: "W trakcie",
      statusRamp: "Na rampie",
      statusSent: "Wysłane",
      statusStorno: "Storno",
      sendButton: "Wyślij z rampy",
      confirmCheck: "Potwierdzam, że wszystkie towary zostały sprawdzone i stoją na właściwej rampie.",
      rampFirst: "Rampa musi najpierw zostać sprawdzona i oznaczona jako Na rampie.",
      confirmFirst: "Najpierw potwierdź, że wszystkie towary stoją na właściwej rampie.",
      sendConfirmBefore: "Wysłać całą RAMPĘ",
      sendConfirmAfter: "Po tym towary otrzymają status Wysłane.",
      sending: "Wysyłanie rampy…",
      sentAlertBefore: "RAMPA",
      sentAlertAfter: "została wysłana.",
      unknown: "Nieznany"
    },
    uk: {
      home: "Головне меню",
      title: "UT — Підтвердження рампи",
      subtitle: "Офіс надсилає одне спільне завдання на рампу. Склад перевіряє товар і відправляє рампу далі.",
      connection: "Підключення",
      connecting: "Підключення до Supabase…",
      activeRamps: "Активні рампи",
      allRamps: "Усі рампи",
      search: "Пошук РАМПИ або номера UT",
      refresh: "Оновити",
      stock: "Залишок складу",
      physical: "ФІЗИЧНО НА СКЛАДІ",
      available: "ДОСТУПНО",
      reserved: "ЗАРЕЗЕРВОВАНО",
      onRamp: "НА РАМПІ",
      sent: "НАДІСЛАНО",
      canUse: "Можна використати зараз",
      linked: "Прив'язано до рамп",
      ready: "Готове до відправки",
      sentFromStock: "Відправлено зі складу",
      rampsFromOffice: "Рампи від офісу",
      activeRamp: "Активна рампа",
      close: "Закрити",
      receiverLater: "Одержувач — пізніше",
      addressLater: "Адреса — пізніше",
      dateLater: "Дата — пізніше",
      cmrLater: "CMR — пізніше",
      totalBunner: "Всього Bunner",
      totalShelves: "Всього полиць",
      openRamp: "Відкрити рампу",
      startWork: "Почати роботу",
      placeOnRamp: "Поставлено на рампу",
      storno: "Сторно",
      scanItem: "Сканувати товар",
      manual: "Вручну",
      register: "Зареєструвати",
      statusNew: "Нове",
      statusWork: "В роботі",
      statusRamp: "На рампі",
      statusSent: "Надіслано",
      statusStorno: "Сторновано",
      sendButton: "Відправити з рампи",
      confirmCheck: "Підтверджую, що всі товари перевірені та стоять на правильній рампі.",
      rampFirst: "Спочатку рампа має бути повністю перевірена та позначена як На рампі.",
      confirmFirst: "Спочатку підтвердьте, що всі товари стоять на правильній рампі.",
      sendConfirmBefore: "Відправити всю РАМПУ",
      sendConfirmAfter: "Після цього товари отримають статус Надіслано.",
      sending: "Відправляємо рампу…",
      sentAlertBefore: "РАМПА",
      sentAlertAfter: "відправлена.",
      unknown: "Невідомо"
    }
  };

  window.UT_LANG = language;
  window.utText = (key) => (T[window.UT_LANG] || T.nb)[key] || T.nb[key] || key;

  const phraseKeys = [
    "home","title","connection","connecting","activeRamps","allRamps","refresh","stock","physical","available","reserved","onRamp","sent","canUse","linked","ready","sentFromStock","rampsFromOffice","activeRamp","close","receiverLater","addressLater","dateLater","cmrLater","totalBunner","totalShelves","openRamp","startWork","placeOnRamp","storno","scanItem","manual","register","statusNew","statusWork","statusRamp","statusSent","statusStorno","sendButton","confirmCheck"
  ];

  function canonicalKey(text) {
    const value = String(text || "").trim();
    for (const key of phraseKeys) {
      if (allowed.some((lang) => T[lang][key] === value)) return key;
    }
    if (value === "MIDLERTIDIG TRUKKET") return "sent";
    if (value === "Må returneres etter test") return "sentFromStock";
    return null;
  }

  function ensureStyle() {
    if (document.getElementById("utLanguageStyle")) return;
    const style = document.createElement("style");
    style.id = "utLanguageStyle";
    style.textContent = `
      .ut-language-switch{display:flex;gap:5px;align-items:center;margin-left:auto;margin-right:6px}
      .ut-lang-btn{min-width:38px;min-height:32px;padding:5px 8px;border:1px solid var(--line);border-radius:9px;background:var(--dark);color:var(--muted);font-size:12px;font-weight:950;line-height:1}
      .ut-lang-btn.active{border-color:var(--accent);background:rgba(244,196,48,.13);color:var(--accent);box-shadow:0 0 0 2px rgba(244,196,48,.08)}
      @media(max-width:560px){.top{flex-wrap:wrap}.ut-language-switch{order:2;margin:4px 0 0}.version{order:3;margin-left:auto}.ut-lang-btn{min-width:36px;min-height:30px;padding:4px 7px}}
    `;
    document.head.appendChild(style);
  }

  function ensureButtons() {
    const top = document.querySelector(".top");
    if (!top) return;
    let box = document.getElementById("utLanguageSwitch");
    if (!box) {
      box = document.createElement("div");
      box.id = "utLanguageSwitch";
      box.className = "ut-language-switch";
      box.setAttribute("aria-label", "Language / Język / Мова");
      box.innerHTML = `
        <button type="button" class="ut-lang-btn" data-ut-lang="nb">NO</button>
        <button type="button" class="ut-lang-btn" data-ut-lang="pl">PL</button>
        <button type="button" class="ut-lang-btn" data-ut-lang="uk">UA</button>`;
      const version = top.querySelector(".version");
      if (version) top.insertBefore(box, version); else top.appendChild(box);
      box.querySelectorAll("[data-ut-lang]").forEach((button) => {
        button.addEventListener("click", () => setLanguage(button.dataset.utLang));
      });
    }
    box.querySelectorAll("[data-ut-lang]").forEach((button) => {
      button.classList.toggle("active", button.dataset.utLang === window.UT_LANG);
    });
  }

  function translateExactText() {
    const nodes = document.querySelectorAll("h1,h2,h3,button,label,option,span,strong,small,div,a");
    nodes.forEach((node) => {
      if (node.id === "utLanguageSwitch" || node.closest?.("#utLanguageSwitch")) return;
      if (node.children.length) return;
      const key = canonicalKey(node.textContent);
      if (key) {
        const next = window.utText(key);
        if (node.textContent !== next) node.textContent = next;
      }
    });

    const subtitle = document.querySelector(".subtitle");
    if (subtitle && subtitle.textContent !== window.utText("subtitle")) subtitle.textContent = window.utText("subtitle");

    document.querySelectorAll("input[placeholder]").forEach((input) => {
      const current = input.getAttribute("placeholder") || "";
      if (/RAMPE|RAMPY|РАМП/i.test(current) && /UT/i.test(current)) input.setAttribute("placeholder", window.utText("search"));
    });

    document.documentElement.lang = window.UT_LANG === "uk" ? "uk" : window.UT_LANG;
  }

  function apply() {
    ensureStyle();
    ensureButtons();
    translateExactText();
    try { window.UT_PRODUCTION_ENHANCE?.(); } catch {}
  }

  function setLanguage(next) {
    if (!allowed.includes(next)) return;
    window.UT_LANG = next;
    language = next;
    localStorage.setItem(STORAGE_KEY, next);
    try { if (typeof renderRamps === "function") renderRamps(); } catch {}
    try { if (typeof renderDetail === "function" && typeof selectedId !== "undefined" && selectedId) renderDetail(); } catch {}
    apply();
  }

  const observer = new MutationObserver(() => requestAnimationFrame(apply));
  observer.observe(document.body, { childList: true, subtree: true });
  apply();
})();
