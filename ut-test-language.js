// BaMavaremottak — UT TEST language helper
// Version 1.0.0
// Updated: 2026-08-08 09:49 Europe/Oslo
(function(){
  "use strict";

  const STORAGE_KEY = "bama_ut_test_lang";
  let currentLang = localStorage.getItem(STORAGE_KEY) === "uk" ? "uk" : "no";
  let observer = null;
  let translating = false;

  const exactUk = new Map(Object.entries({
    "← Hovedmeny":"← Головне меню",
    "UT — Kontor":"UT — Офіс",
    "Ny rampe":"Нова рампа",
    "Rampe":"Рампа",
    "Velg rampe":"Виберіть рампу",
    "Mottaker":"Отримувач",
    "Transportør":"Перевізник",
    "Dato":"Дата",
    "legges til senere":"буде додано пізніше",
    "Varer på rampen":"Товари на рампі",
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

  function rememberAndTranslateTextNode(node){
    if (!node || !node.nodeValue || !node.nodeValue.trim()) return;
    const parent = node.parentElement;
    if (!parent || ["SCRIPT","STYLE","CODE"].includes(parent.tagName)) return;
    if (!Object.prototype.hasOwnProperty.call(parent.dataset,"langNoText")) {
      parent.dataset.langNoText = node.nodeValue;
    }
    const source = parent.dataset.langNoText;
    node.nodeValue = currentLang === "uk" ? translateDynamic(source) : source;
  }

  function translateTree(root){
    if (!root || translating) return;
    translating = true;
    try {
      const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(rememberAndTranslateTextNode);

      root.querySelectorAll?.("input[placeholder],textarea[placeholder]").forEach((el)=>{
        if (!el.dataset.langNoPlaceholder) el.dataset.langNoPlaceholder = el.getAttribute("placeholder") || "";
        const no = el.dataset.langNoPlaceholder;
        let uk = no;
        if (no === "Skriv mottaker") uk = "Введіть отримувача";
        if (no === "Skriv transportør") uk = "Введіть перевізника";
        if (no === "Valgfri kommentar til lageret") uk = "Необов’язковий коментар для складу";
        el.setAttribute("placeholder", currentLang === "uk" ? uk : no);
      });

      const api = window.BAMA_PRODUCTS;
      if (api) {
        root.querySelectorAll?.("#centralProductTestPanel > div > div").forEach((row)=>{
          const idText = Array.from(row.querySelectorAll("div")).map(x=>x.textContent).find(t=>t?.startsWith("ID: "));
          const id = idText?.slice(4).trim();
          const product = id ? api.getProductById(id) : null;
          const strong = row.querySelector("strong");
          if (product && strong) strong.textContent = api.getProductName(product,currentLang);
        });
      }
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
    if (!doc) return;
    doc.documentElement.lang = currentLang === "uk" ? "uk" : "nb";
    translateTree(doc.body);

    if (observer) observer.disconnect();
    observer = new MutationObserver(()=>translateTree(doc.body));
    observer.observe(doc.body,{subtree:true,childList:true,characterData:true,attributes:false});
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
