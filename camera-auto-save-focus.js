"use strict";

(() => {
  if (window.__BAMA_CAMERA_AUTO_SAVE_FOCUS__) return;
  window.__BAMA_CAMERA_AUTO_SAVE_FOCUS__ = true;

  let waitingForRecognition = false;
  let focusRun = 0;

  function validLower() {
    const value = String(document.getElementById("lowerValue")?.value || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    return /^[A-Z0-9]{6}$/.test(value);
  }

  function isBusyNow() {
    try { return Boolean(busy); }
    catch { return false; }
  }

  function moveToSaveIfReady(run) {
    if (!waitingForRecognition || run !== focusRun) return false;

    const save = document.getElementById("saveButton");
    if (!save || save.disabled || isBusyNow() || !validLower()) return false;

    waitingForRecognition = false;
    requestAnimationFrame(() => {
      save.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      save.classList.add("bama-save-focus-pulse");
      setTimeout(() => save.classList.remove("bama-save-focus-pulse"), 1400);
    });
    return true;
  }

  function watchRecognitionResult() {
    waitingForRecognition = true;
    const run = ++focusRun;
    [180, 350, 600, 900, 1300, 1800, 2500, 3400, 4500].forEach(delay => {
      setTimeout(() => moveToSaveIfReady(run), delay);
    });
    setTimeout(() => {
      if (run === focusRun) waitingForRecognition = false;
    }, 5200);
  }

  const style = document.createElement("style");
  style.textContent = `
    #saveButton.bama-save-focus-pulse {
      outline: 4px solid rgba(72,213,151,.72);
      outline-offset: 4px;
      box-shadow: 0 0 0 9px rgba(72,213,151,.16);
    }
  `;
  document.head.appendChild(style);

  document.getElementById("recognizeButton")?.addEventListener("click", watchRecognitionResult, true);
  document.getElementById("openaiBackupButton")?.addEventListener("click", watchRecognitionResult, true);
  document.getElementById("lowerValue")?.addEventListener("input", () => {
    if (waitingForRecognition) moveToSaveIfReady(focusRun);
  });

  console.info("Camera auto-save focus active: successful recognition scrolls to Save.");
})();
