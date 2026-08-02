"use strict";

// Camera Cloud v4.1: keep the existing allowed source when attaching a photo
// to a Nordic ID pending row. Do not write the unsupported camera+nordic_id value.
(function applyCameraSourceFix() {
  const saveButton = document.getElementById("saveButton");
  const version = document.querySelector(".version");
  if (!saveButton) return;

  if (version) {
    version.innerHTML = "Kamera Cloud v4.1<br />Oppdatert 02.08.2026 kl. 22:20";
  }

  async function saveCloudWithAllowedSource() {
    if (!imageData || busy) return;

    const current = readResultInputs();
    if (!current.valid) {
      show(t().invalid, "bad");
      renderResult();
      return;
    }

    busy = true;
    renderResult();
    show(t().saving);

    const day = new Date().toISOString().slice(0, 10);
    const path = `camera/${day}/${deviceId}-${uuid()}.jpg`;
    let uploaded = false;

    try {
      const upload = await client.storage.from(BUCKET).upload(path, imageData.blob, {
        contentType: "image/jpeg",
        upsert: false
      });
      if (upload.error) throw upload.error;
      uploaded = true;

      const photoUrl = client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      const found = await client
        .from(TABLE)
        .select("id,scanner_code,status,source,device_id,raw_data,photo_path")
        .eq("upper_number", current.line1)
        .eq("lower_number", current.line2)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (found.error) throw found.error;

      let databaseResult;
      if (found.data) {
        const updatePayload = {
          product,
          photo_url: photoUrl,
          photo_path: path,
          confidence: current.confidence,
          status: found.data.status === "verified" ? "verified" : "pending",
          device_id: found.data.device_id || deviceId,
          raw_data: found.data.raw_data || "camera-photo"
        };

        // Important: source is intentionally NOT updated here.
        // The existing Nordic row keeps source=nordic_id, satisfying the DB check.
        databaseResult = await client
          .from(TABLE)
          .update(updatePayload)
          .eq("id", found.data.id)
          .select("id")
          .maybeSingle();
      } else {
        databaseResult = await client
          .from(TABLE)
          .insert({
            product,
            scanner_code: "",
            upper_number: current.line1,
            lower_number: current.line2,
            status: "pending",
            source: "camera",
            device_id: deviceId,
            raw_data: "camera-photo",
            photo_url: photoUrl,
            photo_path: path,
            confidence: current.confidence
          })
          .select("id")
          .maybeSingle();
      }

      if (databaseResult.error) throw databaseResult.error;
      if (!databaseResult.data?.id) throw new Error(t().permissionBlocked);

      if (found.data?.photo_path && found.data.photo_path !== path) {
        await client.storage.from(BUCKET).remove([found.data.photo_path]);
      }

      show(found.data?.scanner_code ? t().savedLinked : t().savedNew, "ok");
      await loadTable(false);
      resetPhoto();
    } catch (error) {
      if (uploaded) await client.storage.from(BUCKET).remove([path]);
      show(`${t().saveError}\n${error.message || error}`, "bad");
    } finally {
      busy = false;
      renderResult();
    }
  }

  saveButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    saveCloudWithAllowedSource();
  }, true);

  console.info("Camera Cloud v4.1 source constraint fix is active.");
})();
