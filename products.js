// BaMavaremottak — central product registry
// Version 1.3.0
// Updated: 2026-08-10 21:30 Europe/Oslo
//
// IMPORTANT:
// - This registry is used by the standalone product/test pages.
// - Production work pages are NOT connected to this registry yet.
// - Product IDs are permanent. Names may change later; IDs should not.
// - Retired products should normally be set active:false instead of being deleted.

(function () {
  "use strict";

  const meta = {
    registry: "BaMavaremottak products",
    schemaVersion: 6,
    version: "1.3.0",
    updatedAt: "2026-08-10T21:30:00+02:00",
    defaultLanguage: "no",
    languages: ["no", "pl", "uk"]
  };

  const products = [
    {
      id: "bunner",
      sortOrder: 10,
      active: true,
      name: { no: "Bunner", pl: "Podstawy", uk: "Основи" },
      unit: "stk",
      stackSize: 10,
      shipment: {
        orderUnit: "stabel",
        confirmation: "bundle",
        components: {
          bunner: { quantity: 10, mode: "fixed" }
        }
      },
      displayComponents: {
        cc_post: { quantity: 40, mode: "derived", tracked: false }
      },
      notes: {
        no: "Én full stabel = 10 Bunner + 40 CC Post (4 per Bunner). CC Post vises kun som del av kompletten.",
        pl: "Jeden pełny stos = 10 podstaw + 40 CC Post (4 na podstawę). CC Post jest tylko elementem wyświetlanego kompletu.",
        uk: "Одна повна стопка = 10 Bunner + 40 CC Post (по 4 на кожний Bunner). CC Post лише відображається як частина комплекту."
      }
    },
    {
      id: "hyller30",
      sortOrder: 20,
      active: true,
      name: { no: "Hyller x30", pl: "Półki x30", uk: "Полиці x30" },
      unit: "vogn",
      stackSize: 30,
      shipment: {
        orderUnit: "vogn",
        confirmation: "per_vogn",
        components: {
          bunner: { quantity: 1, mode: "fixed" },
          hyller: { quantity: 30, mode: "fixed" }
        }
      },
      displayComponents: {
        cc_post: { quantity: 4, mode: "derived", tracked: false }
      },
      notes: {
        no: "Én vogn = 1 Bunner + 30 Hyller + 4 CC Post. CC Post vises kun som del av kompletten.",
        pl: "Jeden wózek = 1 podstawa + 30 półek + 4 CC Post. CC Post jest tylko elementem wyświetlanego kompletu.",
        uk: "Один візок = 1 Bunner + 30 полиць + 4 CC Post. CC Post лише відображається як частина комплекту."
      }
    },
    {
      id: "hyller60",
      sortOrder: 30,
      active: true,
      name: { no: "Hyller x60", pl: "Półki x60", uk: "Полиці x60" },
      unit: "vogn",
      stackSize: 60,
      shipment: {
        orderUnit: "vogn",
        confirmation: "per_vogn",
        components: {
          bunner: { quantity: 1, mode: "fixed" },
          hyller: { quantity: 60, mode: "fixed" }
        }
      },
      displayComponents: {
        cc_post: { quantity: 4, mode: "derived", tracked: false }
      },
      notes: {
        no: "Én vogn = 1 Bunner + 60 Hyller + 4 CC Post. CC Post vises kun som del av kompletten.",
        pl: "Jeden wózek = 1 podstawa + 60 półek + 4 CC Post. CC Post jest tylko elementem wyświetlanego kompletu.",
        uk: "Один візок = 1 Bunner + 60 полиць + 4 CC Post. CC Post лише відображається як частина комплекту."
      }
    },
    {
      id: "cc_post",
      sortOrder: 35,
      active: true,
      name: { no: "CC Post", pl: "CC Post (słupek)", uk: "CC Post (стійка)" },
      unit: "stk",
      stackSize: null,
      manufacturer: { name: "Container Centralen", officialName: "CC Post" },
      inventory: { tracked: false, counter: false },
      process: { inn: false, utConfirmation: false, ramp: false, dispatch: false },
      ut: { manualOrder: false, derivedOnly: true },
      notes: {
        no: "Offisiell CC-betegnelse. Ingen lagerbeholdning eller teller. Ikke INN, ikke UT-bekreftelse, ikke egen rampebevegelse og ikke egen utsending. Vises bare automatisk som del av Bunner/Hyller/Forlengere-kompletten i UT Kontor.",
        pl: "Oficjalna nazwa CC. Bez stanu magazynowego i licznika. Nie przechodzi przez INN, potwierdzenie UT, rampę ani osobną wysyłkę. Jest tylko automatycznie pokazywany jako część kompletu Bunner/Hyller/Forlengere w UT Kontor.",
        uk: "Офіційна назва CC. Без складського залишку та лічильника. Не проходить INN, UT-підтвердження, рампу чи окреме відправлення. Лише автоматично показується як частина комплекту Bunner/Hyller/Forlengere у UT Kontor."
      }
    },
    {
      id: "forlengere_korte",
      sortOrder: 40,
      active: true,
      name: { no: "Forlengere korte", pl: "Przedłużki krótkie", uk: "Подовжувачі короткі" },
      unit: "vogn",
      stackSize: null,
      shipment: {
        orderUnit: "vogn",
        confirmation: "per_vogn",
        components: {
          bunner: { quantity: 1, mode: "fixed" },
          hyller: { quantity: null, mode: "ut_confirmation" },
          forlengere: { quantity: null, mode: "ut_confirmation" }
        }
      },
      displayComponents: {
        cc_post: { quantity: 4, mode: "derived", tracked: false }
      },
      notes: {
        no: "Én vogn = 1 Bunner + 4 CC Post. Antall hyller og korte forlengere registreres separat per vogn ved UT-bekreftelse. CC Post vises kun som del av kompletten.",
        pl: "Jeden wózek = 1 podstawa + 4 CC Post. Liczbę półek i krótkich przedłużek wpisuje się osobno dla każdego wózka przy potwierdzeniu UT. CC Post jest tylko elementem wyświetlanego kompletu.",
        uk: "Один візок = 1 Bunner + 4 CC Post. Кількість полиць і коротких подовжувачів вводиться окремо для кожного візка при UT-підтвердженні. CC Post лише відображається як частина комплекту."
      }
    },
    {
      id: "forlengere_lange",
      sortOrder: 50,
      active: true,
      name: { no: "Forlengere lange", pl: "Przedłużki długie", uk: "Подовжувачі довгі" },
      unit: "vogn",
      stackSize: null,
      shipment: {
        orderUnit: "vogn",
        confirmation: "per_vogn",
        components: {
          bunner: { quantity: 1, mode: "fixed" },
          hyller: { quantity: null, mode: "ut_confirmation" },
          forlengere: { quantity: null, mode: "ut_confirmation" }
        }
      },
      displayComponents: {
        cc_post: { quantity: 4, mode: "derived", tracked: false }
      },
      notes: {
        no: "Én vogn = 1 Bunner + 4 CC Post. Antall hyller og lange forlengere registreres separat per vogn ved UT-bekreftelse. CC Post vises kun som del av kompletten.",
        pl: "Jeden wózek = 1 podstawa + 4 CC Post. Liczbę półek i długich przedłużek wpisuje się osobno dla każdego wózka przy potwierdzeniu UT. CC Post jest tylko elementem wyświetlanego kompletu.",
        uk: "Один візок = 1 Bunner + 4 CC Post. Кількість полиць і довгих подовжувачів вводиться окремо для кожного візка при UT-підтвердженні. CC Post лише відображається як частина комплекту."
      }
    },
    {
      id: "forlengere_plast",
      sortOrder: 60,
      active: true,
      name: { no: "Forlengere plast", pl: "Przedłużki plastikowe", uk: "Подовжувачі пластикові" },
      unit: "eske",
      stackSize: null,
      inventory: { tracked: true, rfid: false },
      shipment: { orderUnit: "eske", confirmation: "count_only" },
      package: { type: "box", internalQuantity: null, weightKg: null, detailsPending: true },
      notes: {
        no: "Én enhet = 1 eske. Ingen RFID. Ingen Bunner, Hyller eller CC Post inngår. Vekt og antall plastforlengere i esken er ikke fastsatt ennå.",
        pl: "Jedna jednostka = 1 pudełko. Bez RFID, podstawy, półek i CC Post. Waga i liczba plastikowych przedłużek w pudełku nie są jeszcze ustalone.",
        uk: "Одна одиниця = 1 ящик. Без RFID, Bunner, полиць і CC Post. Вага і кількість пластикових подовжувачів у ящику поки не визначені."
      }
    },
    {
      id: "vrak_bunner",
      sortOrder: 70,
      active: true,
      name: { no: "Vrak bunner", pl: "Brakowane podstawy", uk: "Браковані основи" },
      unit: "stabel",
      stackSize: 10,
      inventory: { tracked: true, rfid: true },
      shipment: {
        orderUnit: "stabel",
        confirmation: "bundle",
        components: {
          vrak_bunner: { quantity: 10, mode: "fixed" }
        }
      },
      notes: {
        no: "Én RFID-enhet = én stabel med 10 Vrak bunner. Kan registreres på lager og sendes til rampe.",
        pl: "Jedna jednostka RFID = jeden stos 10 brakowanych podstaw. Może być przyjęta na magazyn i wysłana na rampę.",
        uk: "Одна RFID-одиниця = одна стопка з 10 Vrak bunner. Може оприбутковуватися на склад і відправлятися на рампу."
      }
    },
    {
      id: "vrak_hyller",
      sortOrder: 80,
      active: true,
      name: { no: "Vrak hyller", pl: "Brakowane półki", uk: "Браковані полиці" },
      unit: "stabel",
      stackSize: 30,
      inventory: { tracked: true, rfid: true },
      shipment: {
        orderUnit: "stabel",
        confirmation: "bundle",
        components: {
          vrak_hyller: { quantity: 30, mode: "fixed" }
        }
      },
      notes: {
        no: "Én RFID-enhet = én stabel med 30 Vrak hyller. Kan registreres på lager og sendes til rampe.",
        pl: "Jedna jednostka RFID = jeden stos 30 brakowanych półek. Może być przyjęta na magazyn i wysłana na rampę.",
        uk: "Одна RFID-одиниця = одна стопка з 30 Vrak hyller. Може оприбутковуватися на склад і відправлятися на рампу."
      }
    }
  ];

  function getAllProducts() { return [...products].sort((a, b) => a.sortOrder - b.sortOrder); }
  function getActiveProducts() { return getAllProducts().filter((product) => product.active); }
  function getProductById(id) { return products.find((product) => product.id === id) || null; }
  function getProductName(productOrId, language = meta.defaultLanguage) {
    const product = typeof productOrId === "string" ? getProductById(productOrId) : productOrId;
    if (!product) return "";
    return product.name?.[language] || product.name?.[meta.defaultLanguage] || product.id;
  }

  window.BAMA_PRODUCTS = { meta, products, getAllProducts, getActiveProducts, getProductById, getProductName };
})();
