// BaMavaremottak — UT TEST language helper
// Version 1.0.2
// Updated: 2026-08-08 10:07 Europe/Oslo
//
// Stability fix:
// - No live MutationObserver. It could repeatedly react to page updates and freeze mobile input fields.
// - Translation now runs only on page load, explicit language change and explicit wrapper refresh.
(function(){
  "use strict";

  const STORAGE_KEY = "bama_ut_test_lang";
  let currentLang = localStorage.getItem(STORAGE_KEY) === "uk" ? "uk" : "no";
  let translating = false;
  const originalText = new WeakMap();
  const originalPlaceholder = new WeakMap();

  const exactUk = new Map(Object.entries({
    "← Hovedmeny":"← Головне меню",
    "UT — Kontor":"UT — Офіс",
    "Én rampe = ett samlet oppdrag med alle varetyper.":"Одна рампа = одне спільне завдання з усіма типами товарів.",
    "Ny rampe":"Нова рампа",
    "Rampe":"Рампа",
    "Velg rampe":"Виберіть рампу",
    "Mottaker":"Отримувач",
    "Transportør":"Перевізник",
    "Dato":"Дата",
    "legges til senere":"буде додано пізніше",
    "Varer på rampen":"Товари на рампі",
    "Bunner":"Основи",
    "Hyller x30":"Полиці x30",
    "Hyller x60":"Полиці x60",
    "Kommentar til lageret":"Коментар для складу",
    "Ikke valgt":"Не вибрано",
    "Totalt":"Всього",
    "Send hele rampen":"Відправити всю рампу",
    "Nullstill":"Скинути",
    "Lageroversikt":"Огляд складу",
    "Fysisk på lager":"Фізично на складі",
    "Tilgjengelig":"Доступно",
    "Aktive ramper":"Активні рампи",
    "Oppdater":"Оновити",
    "Aktiv":"Активний",
    "Inaktiv":"Неактивний",
    "På rampe":"На рампі",
    "I arbeid":"В роботі",
    "Problem":"Проблема",
    "Ny":"Нове",
    "Sentral produktliste":"Центральний список продуктів",
    "Koblet til eksisterende UT-felt":"Підключено до наявного поля UT",
    "Registrert · UT-felt ikke opprettet ennå":"Зареєстровано · поле UT ще не створено",
    "TEST — sending deaktivert":"TEST — відправлення вимкнено"
  }));

  function translateDynamic(text){
    const value = String(text || "");
    if (currentLang !== "uk") return value;
    if (exactUk.has(value.trim())) return value.replace(value.trim(), exactUk.get(value.trim()));
    return value
      .replace(/Velg rampe 28, 29, 30, 31, 32, 33 eller 34\. Det kan bare finnes ett aktivt oppdrag per rampe\./g,"Виберіть рампу 28, 29, 30, 31, 32, 33 або 34. На одній рампі може бути лише одне активне завдання.")
      .replace(/Produktnavn hentes fra /g,"Назви продуктів беруться з ")
      .replace(/Lesing av lagerdata er tillatt, men lagring\/endring i databasen er blokkert\./g,"Читання складських даних дозволено, але запис/зміни в базі заблоковані.")
      .replace(/Laster lagerstatus…/g,"Завантаження стану складу…")
      .replace(/Laster ramper…/g,"Завантаження рамп…")
      .replace(/Lagerstatus…/g,"Стан складу…")
      .replace(/UT-database…/g,"База UT…")
      .replace(/På lager: laster…/g,"На складі: завантаження…")
      .replace(/På lager:/g,"На складі:")
      .replace(/Laster…/g,"Завантаження…")
      .replace(/ aktive\b/g," активних")
      .replace(/Oppdatert /g,"Оновлено ")
      .replace(/På lager → På rampe → Sendt\./g,"На складі → На рампі → Відправлено.")
      .replace(/Alle oppdrag kan redigeres frem til Sendt\./g,"Усі завдання можна редагувати до статусу «Відправлено».")
      .replace(/Sendte og stornert oppdrag ligger i historikken og vises ikke her\./g,"Відправлені та скасовані завдання зберігаються в історії й тут не показуються.");
  }

  function translateTextNode(node){
    if (!node || !node.nodeValue || !node.nodeValue.trim()) return;
    const parent = node.parentElement;
    if (!parent || ["SCRIPT","STYLE","CODE","INPUT","TEXTAREA","SELECT","OPTION"].includes(parent.tagName)) return;

    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    const source = originalText.get(node);
    node.nodeValue = currentLang === "uk" ? translateDynamic(source) : source;
  }

  function translateTree(root){
    if (!root || translating) return;
    translating = true;
    try {
      const doc = root.ownerDocument;
      const walker = doc.createTreeWalker(root, 4); // NodeFilter.SHOW_TEXT
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(translateTextNode);

      root.querySelectorAll?.("input[placeholder],textarea[placeholder]").forEach((el)=>{
        if (!originalPlaceholder.has(el)) originalPlaceholder.set(el, el.getAttribute("placeholder") || "");
        const no = originalPlaceholder.get(el);
        let uk = no;
        if (no === "Skriv mottaker") uk = "Введіть отримувача";
        if (no === "Skriv transportør") uk = "Введіть перевізника";
        if (no === "Valgfri kommentar til lageret") uk = "Необов’язковий коментар для складу";
        el.setAttribute("placeholder", currentLang === "uk" ? uk : no);
      });
    } finally {
      translating = false;
    }
  }

  function translateWrapper(){
    const subtitle = document.querySelector(".testbar small");
    if (subtitle) subtitle.textContent = currentLang === "uk"
      ? "Ізольована тестова копія · центральний список продуктів · запис у базу заблоковано"
      : "Isolert testkopi · sentral produktliste · skriving til databasen er blokkert";

    const state = document.getElementById("registryState");
    if (state && window.BAMA_PRODUCTS) {
      const active = window.BAMA_PRODUCTS.getActiveProducts().length;
      state.textContent = currentLang === "uk"
        ? `products.js v${window.BAMA_PRODUCTS.meta.version} · ${active} активних`
        : `products.js v${window.BAMA_PRODUCTS.meta.version} · ${active} aktive`;
    }

    document.documentElement.lang = currentLang === "uk" ? "uk" : "nb";
    document.querySelectorAll("[data-lang-choice]").forEach((btn)=>{
      btn.classList.toggle("active",btn.dataset.langChoice === currentLang);
      btn.setAttribute("aria-pressed",btn.dataset.langChoice === currentLang ? "true" : "false");
    });
  }

  function apply(){
    translateWrapper();
    const frame = document.getElementById("appFrame");
    const doc = frame?.contentDocument;
    if (!doc?.body) return;
    doc.documentElement.lang = currentLang === "uk" ? "uk" : "nb";
    translateTree(doc.body);
  }

  function setLang(lang){
    currentLang = lang === "uk" ? "uk" : "no";
    localStorage.setItem(STORAGE_KEY,currentLang);
    apply();
    window.dispatchEvent(new CustomEvent("ut-test-language-change",{detail:{lang:currentLang}}));
  }

  window.UT_TEST_LANG = { getLang:()=>currentLang, setLang, apply };

  document.addEventListener("click",(event)=>{
    const btn = event.target.closest("[data-lang-choice]");
    if (btn) setLang(btn.dataset.langChoice);
  });

  const frame = document.getElementById("appFrame");
  if (frame) frame.addEventListener("load",()=>setTimeout(apply,0));
  translateWrapper();
})();
