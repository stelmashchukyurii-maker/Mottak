// BaMavaremottak — UT TEST language helper
// Version 1.1.0
// Updated: 2026-08-08 11:29 Europe/Oslo
//
// Stability rules:
// - No MutationObserver.
// - Uses the same language key as TEST UT Kontor wrapper.
// - Can run directly inside the injected UT iframe document.
// - A few delayed passes catch normal startup rendering without watching every DOM mutation.
(function(){
  "use strict";

  const STORAGE_KEY = "mottak_ut_language";
  const currentLang = () => localStorage.getItem(STORAGE_KEY) === "uk" ? "uk" : "no";
  let translating = false;
  const originalText = new WeakMap();
  const originalPlaceholder = new WeakMap();

  const exactUk = new Map(Object.entries({
    "← Hovedmeny":"← Головне меню",
    "UT — Kontor":"UT — Офіс",
    "Én rampe = ett samlet oppdrag med alle varetyper.":"Одна рампа = одне спільне замовлення з усіма типами товарів.",
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
    "Forlengere korte":"Короткі продовжувачі",
    "Forlengere lange":"Довгі продовжувачі",
    "Forlengere plast":"Пластикові продовжувачі",
    "Kommentar til lageret":"Коментар для складу",
    "Ikke valgt":"Не вибрано",
    "Totalt":"Всього",
    "Send hele rampen":"Відправити всю рампу",
    "Nullstill":"Скинути",
    "Lageroversikt":"Огляд складу",
    "Fysisk på lager":"Фізично на складі",
    "Tilgjengelig":"Доступно",
    "TILGJENGELIG":"ДОСТУПНО",
    "Aktive ramper":"Активні рампи",
    "Oppdater":"Оновити",
    "Aktiv":"Активний",
    "Inaktiv":"Неактивний",
    "På rampe":"На рампі",
    "I arbeid":"В роботі",
    "Problem":"Проблема",
    "Ny":"Нове",
    "Sentral produktliste":"Центральний список продуктів",
    "TEST — Sentral produktliste":"TEST — Центральний список продуктів",
    "Ingen aktive ramper.":"Немає активних рамп.",
    "Lager tilkoblet":"Склад підключено",
    "Laster lagerstatus…":"Завантаження стану складу…",
    "Laster ramper…":"Завантаження рамп…",
    "Lagerstatus…":"Стан складу…",
    "UT-database…":"База UT…",
    "Laster…":"Завантаження…",
    "Koblet til eksisterende UT-felt":"Підключено до наявного поля UT",
    "Registrert · UT-felt ikke opprettet ennå":"Зареєстровано · поле UT ще не створено"
  }));

  function translateDynamic(text){
    const value = String(text || "");
    if (currentLang() !== "uk") return value;
    const trimmed = value.trim();
    if (exactUk.has(trimmed)) return value.replace(trimmed, exactUk.get(trimmed));

    return value
      .replace(/Velg rampe 28, 29, 30, 31, 32, 33 eller 34\. Det kan bare finnes ett aktivt oppdrag per rampe\./g,"Виберіть рампу 28, 29, 30, 31, 32, 33 або 34. На одній рампі може бути лише одне активне замовлення.")
      .replace(/UT tilkoblet · (\d+) aktive ramper/g,"UT підключено · $1 активних рамп")
      .replace(/UT tilkoblet/g,"UT підключено")
      .replace(/Lager tilkoblet/g,"Склад підключено")
      .replace(/Ingen aktive ramper\./g,"Немає активних рамп.")
      .replace(/På lager: laster…/g,"На складі: завантаження…")
      .replace(/På lager:/g,"На складі:")
      .replace(/Igjen på lager:/g,"Залишається на складі:")
      .replace(/Bestiller nå:/g,"Замовляємо зараз:")
      .replace(/Oppdatert /g,"Оновлено ")
      .replace(/På lager → På rampe → Sendt\./g,"На складі → На рампі → Відправлено.")
      .replace(/Alle oppdrag kan redigeres frem til Sendt\./g,"Усі замовлення можна редагувати до статусу «Відправлено».")
      .replace(/Sendte og stornert oppdrag ligger i historikken og vises ikke her\./g,"Відправлені та скасовані замовлення зберігаються в історії й тут не показуються.")
      .replace(/Isolert database:/g,"Ізольована база:")
      .replace(/er kopiert fra historiske sendte varer\./g,"скопійовано з історично відправлених товарів.")
      .replace(/Forlengere kan nå legges til TEST-bestillingen; fysisk TEST-lager for Forlengere bygges i neste steg\./g,"Продовжувачі вже можна додавати до TEST-замовлення; фізичний TEST-склад продовжувачів створимо наступним кроком.")
      .replace(/UT-bestilling aktiv i denne testen/g,"UT-замовлення активне в цьому тесті")
      .replace(/registrert · UT-felt kommer senere/g,"зареєстровано · поле UT буде пізніше")
      .replace(/Én vogn = 1 Bunner\./g,"Один візок = 1 основа.")
      .replace(/Antall Hyller og Forlengere registreres per vogn ved UT-bekreftelse\./g,"Кількість полиць і продовжувачів вводиться для кожного візка при UT-підтвердженні.")
      .replace(/Én enhet = 1 eske\. Ingen Bunner eller Hyller\./g,"Одна одиниця = 1 ящик. Без основ і полиць.")
      .replace(/ vogn\b/g," візків")
      .replace(/ esker\b/g," ящиків")
      .replace(/ eske\b/g," ящик")
      .replace(/ hyller\b/g," полиць")
      .replace(/ stabler\b/g," стопок")
      .replace(/ stabel\b/g," стопка")
      .replace(/ sett\b/g," комплектів");
  }

  function translateTextNode(node){
    if (!node || !node.nodeValue || !node.nodeValue.trim()) return;
    const parent = node.parentElement;
    if (!parent || ["SCRIPT","STYLE","CODE","INPUT","TEXTAREA"].includes(parent.tagName)) return;
    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    const source = originalText.get(node);
    node.nodeValue = currentLang() === "uk" ? translateDynamic(source) : source;
  }

  function translateTree(root){
    if (!root || translating) return;
    translating = true;
    try {
      const doc = root.ownerDocument || document;
      const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
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
        el.setAttribute("placeholder", currentLang() === "uk" ? uk : no);
      });
    } finally {
      translating = false;
    }
  }

  function apply(){
    document.documentElement.lang = currentLang() === "uk" ? "uk" : "nb";
    if (document.body) translateTree(document.body);
  }

  window.UT_TEST_LANG = {
    getLang: currentLang,
    apply
  };

  const start = () => {
    apply();
    [120, 450, 1000].forEach(delay => setTimeout(apply, delay));
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();
})();
