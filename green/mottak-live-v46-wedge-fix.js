"use strict";

// v4.6.1 hotfix: preserve the Nordic ID Wedge session when starting a new scan.
// Important rule: focus/select a real input first; never clear both A/B fields at once.

(function applyV46WedgeFix() {
  function focusAndSelect(field) {
    try { field.focus({ preventScroll: true }); } catch { field.focus(); }
    try { field.setSelectionRange(0, field.value.length); } catch {}
  }

  focusChannel = function focusChannelSafe(name, delay = 0) {
    clearTimeout(focusChannel.timer);
    focusChannel.timer = setTimeout(() => {
      activeChannel = name;
      const field = fieldFor(name);
      focusAndSelect(field);
      updateFocusStatus();
    }, delay);
  };

  moveToOtherField = function moveToOtherFieldSafe(fromName) {
    const fromField = fieldFor(fromName);
    const nextName = otherChannel(fromName);

    // First move the Wedge session to the other real field.
    // Existing text is selected, not deleted before focus.
    focusChannel(nextName, 70);

    // Only after the focus moved successfully, clean the old inactive field.
    setTimeout(() => {
      if (document.activeElement !== fromField) fromField.value = "";
    }, 180);
  };

  restartFields = function restartFieldsSafe() {
    clearTimeout(fieldTimers.A);
    clearTimeout(fieldTimers.B);

    const fromName = activeChannel;
    const fromField = fieldFor(fromName);
    const nextName = otherChannel(fromName);

    addTechnical(v().fieldsRestarted);
    setOperationMessage(v().fieldsRestarted, "warn");

    focusChannel(nextName, 40);
    setTimeout(() => {
      if (document.activeElement !== fromField) fromField.value = "";
    }, 180);
  };

  resetOperation = function resetOperationSafe({ focus = true, clearUserMessage = true } = {}) {
    clearTimeout(fieldTimers.A);
    clearTimeout(fieldTimers.B);

    operationCodes.clear();
    selectedRaw = "";
    lastRawLength = 0;
    lastNotice = null;

    // Do not clear scanA and scanB here. Clearing both fields can break
    // the active Nordic ID Wedge session. The active field is selected,
    // so the next EPC replaces any old text automatically.
    clearParts();
    if (clearUserMessage) show("");
    renderOperation();
    setOperationMessage(v().operationCleared, "");

    if (focus) focusChannel(activeChannel, 40);
  };

  addTechnical("v4.6.1 Wedge fix: safe A/B reset is active.");
})();
