// BaMavaremottak — central product registry
// Version 1.0.0
// Updated: 2026-08-08 08:28 Europe/Oslo
//
// IMPORTANT:
// - This file is currently standalone and is NOT connected to existing pages yet.
// - Product IDs are permanent. Names may change later; IDs should not.
// - Retired products should normally be set active:false instead of being deleted.

(function () {
  "use strict";

  const meta = {
    registry: "BaMavaremottak products",
    schemaVersion: 1,
    version: "1.0.0",
    updatedAt: "2026-08-08T08:28:00+02:00",
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
      unit: "stk",
      stackSize: null,
      notes: {
        no: "Stabelstørrelse er ikke fastsatt i registeret ennå.",
        pl: "Wielkość stosu nie jest jeszcze ustalona w rejestrze.",
        uk: "Розмір стопки в реєстрі поки не зафіксований."
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
      unit: "stk",
      stackSize: null,
      notes: {
        no: "Stabelstørrelse er ikke fastsatt i registeret ennå.",
        pl: "Wielkość stosu nie jest jeszcze ustalona w rejestrze.",
        uk: "Розмір стопки в реєстрі поки не зафіксований."
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
