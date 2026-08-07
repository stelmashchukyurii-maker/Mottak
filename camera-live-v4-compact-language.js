(() => {
  "use strict";

  const STYLE_ID = "bama-compact-language-style";
  const LANGUAGE_KEY = "camera_cloud_v3_language";
  const container = document.getElementById("languages");
  if (!container) return;

  const labels = { nb: "NO", pl: "PL", uk: "UK" };
  const names = { nb: "Norsk", pl: "Polski", uk: "Українська" };

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #languages-card-compact {
        margin: 7px 0 10px !important;
        padding: 7px 9px !important;
      }

      #languages {
        display: flex !important;
        grid-template-columns: none !important;
        justify-content: flex-end !important;
        align-items: center !important;
        gap: 6px !important;
      }

      #languages .choice {
        width: 42px !important;
        min-width: 42px !important;
        max-width: 42px !important;
        min-height: 34px !important;
        height: 34px !important;
        padding: 0 7px !important;
        border-radius: 999px !important;
        font-size: 12px !important;
        font-weight: 900 !important;
        letter-spacing: .05em !important;
        line-height: 1 !important;
      }

      #languages .choice.active {
        border-color: #f4c430 !important;
        background: #f4c430 !important;
        color: #17130a !important;
        box-shadow: 0 0 0 2px rgba(244,196,48,.16) !important;
      }
    `;
    document.head.appendChild(style);
  }

  const card = container.closest(".card");
  if (card) card.id = "languages-card-compact";

  const buttons = [...container.querySelectorAll("[data-language]")];
  buttons.forEach(button => {
    const code = labels[button.dataset.language];
    if (!code) return;
    button.textContent = code;
    button.title = names[button.dataset.language] || code;
    button.setAttribute("aria-label", names[button.dataset.language] || code);
  });

  // Norsk er standardspråk bare når brukeren ikke har valgt språk tidligere.
  if (!localStorage.getItem(LANGUAGE_KEY)) {
    const norwegian = buttons.find(button => button.dataset.language === "nb");
    if (norwegian && !norwegian.classList.contains("active")) norwegian.click();
  }
})();
