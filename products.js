// BaMavaremottak — central product registry
// Version 1.1.0
// Updated: 2026-08-08 09:36 Europe/Oslo
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
    schemaVersion: 2,
    version: "1.1.0",
    updatedAt: "2026-08-08T09:36:00+02:00",
    defaultLanguage: "no",
    languages: ["no", "pl", "uk"]
  };

  const products = [
    {
      id: "bunner",
      sortOrder: 10,
      active: true,
      name: {
        no: "Bunner",
        pl: "Podstawy",
        uk: "Основи"
      },
      unit: "stk",
      stackSize: 10,
      notes: {
        no: "Én full stabel = 10 bunner.",
        pl: "Jeden pełny stos = 10 podstaw.",
        uk: "Одна повна стопка = 10 основ."
      }
    },
    {
      id: "hyller30",
      sortOrder: 20,
      active: true,
      name: {
        no: "Hyller x30",
        pl: "Półki x30",
        uk: "Полиці x30"
      },
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
      notes: {
        no: "Én vogn = 1 bunner + 30 hyller.",
        pl: "Jeden wózek = 1 podstawa + 30 półek.",
        uk: "Один візок = 1 основа + 30 полиць."
      }
    },
    {
      id: "hyller60",
      sortOrder: 30,
      active: true,
      name: {
        no: "Hyller x60",
        pl: "Półki x60",
        uk: "Полиці x60"
      },
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
      notes: {
        no: "Én vogn = 1 bunner + 60 hyller.",
        pl: "Jeden wózek = 1 podstawa + 60 półek.",
        uk: "Один візок = 1 основа + 60 полиць."
      }
    },
    {
      id: "forlengere_korte",
      sortOrder: 40,
      active: true,
      name: {
        no: "Forlengere korte",
        pl: "Przedłużki krótkie",
        uk: "Подовжувачі короткі"
      },
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
      notes: {
        no: "Én vogn har alltid 1 bunner. Antall hyller og korte forlengere registreres separat per vogn ved UT-bekreftelse.",
        pl: "Każdy wózek ma zawsze 1 podstawę. Liczbę półek i krótkich przedłużek wpisuje się osobno dla każdego wózka przy potwierdzeniu UT.",
        uk: "Кожний візок завжди має 1 основу. Кількість полиць і коротких подовжувачів вводиться окремо для кожного візка при UT-підтвердженні."
      }
    },
    {
      id: "forlengere_lange",
      sortOrder: 50,
      active: true,
      name: {
        no: "Forlengere lange",
        pl: "Przedłużki długie",
        uk: "Подовжувачі довгі"
      },
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
      notes: {
        no: "Én vogn har alltid 1 bunner. Antall hyller og lange forlengere registreres separat per vogn ved UT-bekreftelse.",
        pl: "Każdy wózek ma zawsze 1 podstawę. Liczbę półek i długich przedłużek wpisuje się osobno dla każdego wózka przy potwierdzeniu UT.",
        uk: "Кожний візок завжди має 1 основу. Кількість полиць і довгих подовжувачів вводиться окремо для кожного візка при UT-підтвердженні."
      }
    },
    {
      id: "forlengere_plast",
      sortOrder: 60,
      active: true,
      name: {
        no: "Forlengere plast",
        pl: "Przedłużki plastikowe",
        uk: "Подовжувачі пластикові"
      },
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
      notes: {
        no: "Én vogn har alltid 1 bunner. Antall hyller og plastforlengere registreres separat per vogn ved UT-bekreftelse.",
        pl: "Każdy wózek ma zawsze 1 podstawę. Liczbę półek i plastikowych przedłużek wpisuje się osobno dla każdego wózka przy potwierdzeniu UT.",
        uk: "Кожний візок завжди має 1 основу. Кількість полиць і пластикових подовжувачів вводиться окремо для кожного візка при UT-підтвердженні."
      }
    }
  ];

  function getAllProducts() {
    return [...products].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function getActiveProducts() {
    return getAllProducts().filter((product) => product.active);
  }

  function getProductById(id) {
    return products.find((product) => product.id === id) || null;
  }

  function getProductName(productOrId, language = meta.defaultLanguage) {
    const product = typeof productOrId === "string"
      ? getProductById(productOrId)
      : productOrId;

    if (!product) return "";
    return product.name?.[language]
      || product.name?.[meta.defaultLanguage]
      || product.id;
  }

  window.BAMA_PRODUCTS = {
    meta,
    products,
    getAllProducts,
    getActiveProducts,
    getProductById,
    getProductName
  };
})();
