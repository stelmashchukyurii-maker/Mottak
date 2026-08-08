"use strict";

// Compatibility patch for the older UT camera helper.
// lower_number is the only label ID; legacy upper_number=078500 filters are stripped.
(() => {
  if (window.__UT_CAMERA_LOWER_QUERY_COMPAT__) return;
  window.__UT_CAMERA_LOWER_QUERY_COMPAT__ = true;
  if (typeof req !== "function") return;
  const originalReq = req;
  req = function lowerOnlyReq(path, options = {}) {
    const cleanPath = String(path || "")
      .replace(/([?&])upper_number=eq\.078500&?/gi, (match, lead) => lead === "?" ? "?" : "")
      .replace(/\?&/, "?")
      .replace(/[?&]$/, "");
    return originalReq(cleanPath, options);
  };
  console.info("UT camera lower-only query compatibility active.");
})();
