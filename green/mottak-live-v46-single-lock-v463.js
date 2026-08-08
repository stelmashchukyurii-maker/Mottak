"use strict";

// v4.6.3: lock the "One Bunner" operation after the first accepted valid EPC.
// Late RFID/Wedge signals are still visible in diagnostics and technical log,
// but they cannot add another product until the user starts a new scan.

(function applySingleBunnerLockV463() {
  const version = document.querySelector(".version");
  if (version) {
    version.innerHTML = "Nordic ID Cloud v4.6.3 kandidat<br />Oppdatert 02.08.2026 kl. 21:56";
  }

  const lockText = {
    nb: "Én riktig etikett er låst. Et sent RFID-signal ble ignorert. Trykk «Ny skanning» for neste Bunner.",
    pl: "Jedna poprawna etykieta jest zablokowana. Późny sygnał RFID został pominięty. Naciśnij «Nowy skan» dla następnego Bunner.",
    uk: "Одну правильну бірку зафіксовано. Пізній RFID-сигнал проігноровано. Натисніть «Нове сканування» для наступного Bunner."
  };

  const currentLockText = () => {
    const saved = localStorage.getItem("mottak_nordic_cloud_language");
    return lockText[saved] || lockText.nb;
  };

  const originalProcessRawV463 = processRaw;

  processRaw = function processRawSingleLockedV463(raw, channel) {
    // If exactly one valid tag is already accepted, the operation is closed.
    // Keep recording late signals technically, but do not alter product data.
    if (operationCodes.size === 1) {
      lastRawLength = raw.length;
      addTechnical(
        `v4.6.3 SINGLE LOCK: late channel ${channel} signal ignored (${raw.length} characters).`,
        raw
      );
      setOperationMessage(currentLockText(), "warn");
      renderPartState();
      updateFocusStatus();
      return;
    }

    // First input is evaluated normally. A single 48-character first input can
    // still reveal two nearby valid tags and must remain blocked for safety.
    originalProcessRawV463(raw, channel);

    if (operationCodes.size === 1) {
      addTechnical("v4.6.3 SINGLE LOCK active after first valid Bunner tag.");
    }
  };

  addTechnical("v4.6.3 loaded: One Bunner locks after the first accepted valid EPC.");
})();
