"use strict";

(() => {
  if (window.__BAMA_NORDIC_LOWER_ONLY__) return;
  window.__BAMA_NORDIC_LOWER_ONLY__ = true;

  const lowerValid = value => /^[A-Z0-9]{6}$/.test(String(value || ""));
  const serviceValid = value => /^[A-Z0-9]{12}$/.test(String(value || ""));

  function clearUpperUi() {
    const upper = document.getElementById("upperNumber");
    if (upper) {
      upper.value = "";
      upper.defaultValue = "";
      upper.readOnly = true;
      upper.tabIndex = -1;
      upper.closest(".part")?.classList.add("bama-upper-hidden");
    }
  }

  currentParts = function currentLowerOnlyParts() {
    return {
      scannerCode: normalizeService(document.getElementById("serviceCode")?.value || ""),
      lowerNumber: normalizeLower(document.getElementById("lowerNumber")?.value || "")
    };
  };

  partsValid = function lowerOnlyPartsValid(parts) {
    return serviceValid(parts.scannerCode) && lowerValid(parts.lowerNumber);
  };

  renderPartState = function renderLowerOnlyPartState() {
    clearUpperUi();
    const parts = currentParts();
    const service = document.getElementById("serviceCode");
    const lower = document.getElementById("lowerNumber");
    if (service) service.value = parts.scannerCode;
    if (lower) lower.value = parts.lowerNumber;

    [[service, serviceValid(parts.scannerCode)], [lower, lowerValid(parts.lowerNumber)]].forEach(([field, valid]) => {
      if (!field) return;
      field.classList.toggle("valid", valid);
      field.classList.toggle("invalid", Boolean(field.value) && !valid);
    });

    const save = document.getElementById("saveScanButton");
    if (save) save.disabled = saving || !partsValid(parts);
    try { renderRaw(); } catch {}
  };

  splitStableScan = function splitLowerOnlyScan() {
    clearTimeout(scanTimer);
    const raw = compact(document.getElementById("scanInput")?.value || "");
    if (!raw) {
      show(t().noCode, "bad");
      focusScanner();
      return false;
    }
    if (raw.length < 24) {
      show(`${t().wrongLength}: ${raw.length}.`, "bad");
      focusScanner();
      return false;
    }

    const code = raw.slice(-24);
    if (!/^[A-Z0-9]{24}$/.test(code)) {
      show(t().invalid, "bad");
      focusScanner();
      return false;
    }

    parsedCode = code;
    document.getElementById("scanInput").value = code;
    document.getElementById("serviceCode").value = code.slice(0, 12);
    document.getElementById("lowerNumber").value = code.slice(18, 24);
    clearUpperUi();
    renderPartState();
    show(raw.length > 24 ? `${t().prepared}\n${scannerMessages().multiple}` : t().prepared, raw.length > 24 ? "warn" : "ok");
    focusScanner();
    return true;
  };

  clearForm = function clearLowerOnlyForm() {
    clearTimeout(scanTimer);
    parsedCode = "";
    const scan = document.getElementById("scanInput");
    const service = document.getElementById("serviceCode");
    const lower = document.getElementById("lowerNumber");
    if (scan) scan.value = "";
    if (service) service.value = "";
    if (lower) lower.value = "";
    clearUpperUi();
    renderPartState();
    show("");
    focusScanner(20);
  };

  async function saveLowerOnlyPending() {
    if (saving) return;
    const parts = currentParts();
    renderPartState();
    if (!partsValid(parts)) {
      show(t().invalid, "bad");
      focusScanner();
      return;
    }

    saving = true;
    renderPartState();
    show(t().saving);

    try {
      const query = await client.from(TABLE)
        .select("id,scanner_code,photo_url,source,status,stock_status,device_id,raw_data")
        .eq("lower_number", parts.lowerNumber)
        .order("created_at", { ascending: false })
        .limit(10);
      if (query.error) throw query.error;

      const matches = query.data || [];
      const exactRow = matches.find(row => compact(row.scanner_code) === parts.scannerCode);
      if (exactRow) {
        show(t().duplicate, "warn");
        return;
      }

      const conflicting = matches.find(row => compact(row.scanner_code) && compact(row.scanner_code) !== parts.scannerCode);
      if (conflicting) {
        show(t().pairConflict, "bad");
        return;
      }

      const cameraRow = matches.find(row => !compact(row.scanner_code));
      const rawData = parsedCode || `${parts.scannerCode}${parts.lowerNumber}`;
      let dbResult;

      if (cameraRow) {
        dbResult = await client.from(TABLE).update({
          product,
          scanner_code: parts.scannerCode,
          upper_number: "",
          status: "pending",
          source: cameraRow.source || (cameraRow.photo_url ? "camera" : "nordic_id"),
          device_id: cameraRow.device_id || deviceId,
          raw_data: rawData
        }).eq("id", cameraRow.id).select("id").maybeSingle();
      } else {
        dbResult = await client.from(TABLE).insert({
          product,
          scanner_code: parts.scannerCode,
          upper_number: "",
          lower_number: parts.lowerNumber,
          status: "pending",
          source: "nordic_id",
          device_id: deviceId,
          raw_data: rawData,
          photo_url: "",
          photo_path: ""
        }).select("id").maybeSingle();
      }

      if (dbResult.error) throw dbResult.error;
      if (!dbResult.data?.id) throw new Error("Database did not confirm the write");
      show(cameraRow ? t().linked : t().saved, "ok");
      await loadCloud();
      clearForm();
    } catch (error) {
      show(`${t().saveError}\n${error.message || error}`, "bad");
    } finally {
      saving = false;
      renderPartState();
      focusScanner(30);
    }
  }

  const saveButton = document.getElementById("saveScanButton");
  saveButton?.addEventListener("click", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    saveLowerOnlyPending();
  }, true);

  clearUpperUi();
  renderPartState();
  console.info("Nordic lower-number-only mode active: middle/upper segment is ignored and not stored.");
})();
