"use strict";

// Camera Cloud v4.2
// 1) Keep the existing allowed source when attaching a photo to a Nordic ID row.
// 2) Show persistent product totals below the product selector.
(function applyCameraV42Enhancements() {
  const saveButton = document.getElementById("saveButton");
  const version = document.querySelector(".version");
  if (!saveButton) return;

  if (version) {
    version.innerHTML = "Kamera Cloud v4.2<br />Oppdatert 03.08.2026 kl. 12:47";
  }

  const totalsText = {
    nb: {
      title: "Produktoversikt",
      bunner: count => `${count} stabler × 10 = ${count * 10} stk.`,
      hyller30: count => `${count} Bunner × 30 = ${count * 30} hyller`,
      hyller60: count => `${count} Bunner × 60 = ${count * 60} hyller`
    },
    pl: {
      title: "Podsumowanie produktów",
      bunner: count => `${count} stosów × 10 = ${count * 10} szt.`,
      hyller30: count => `${count} Bunner × 30 = ${count * 30} półek`,
      hyller60: count => `${count} Bunner × 60 = ${count * 60} półek`
    },
    uk: {
      title: "Поточна кількість",
      bunner: count => `${count} стопок × 10 = ${count * 10} шт.`,
      hyller30: count => `${count} Bunner × 30 = ${count * 30} hyller`,
      hyller60: count => `${count} Bunner × 60 = ${count * 60} hyller`
    }
  };

  function installProductTotals() {
    if (document.getElementById("productTotalsCard")) return;

    const productSection = document.getElementById("products")?.closest(".card");
    if (!productSection) return;

    const style = document.createElement("style");
    style.textContent = `
      .product-totals { display:grid; gap:8px; }
      .product-total-row {
        display:grid;
        grid-template-columns:minmax(105px, .8fr) minmax(0, 1.7fr);
        gap:10px;
        align-items:center;
        min-height:48px;
        padding:10px 12px;
        border:2px solid var(--line);
        border-radius:12px;
        background:var(--dark);
      }
      .product-total-row.active {
        border-color:var(--accent);
        box-shadow:0 0 0 1px rgba(244,196,48,.15);
      }
      .product-total-name { font-weight:900; }
      .product-total-value {
        font-size:clamp(14px,3.8vw,18px);
        font-weight:800;
        text-align:right;
        line-height:1.25;
      }
      @media(max-width:390px) {
        .product-total-row { grid-template-columns:100px minmax(0,1fr); padding:9px 10px; gap:7px; }
        .product-total-value { font-size:13px; }
      }
    `;
    document.head.appendChild(style);

    const section = document.createElement("section");
    section.className = "card";
    section.id = "productTotalsCard";
    section.innerHTML = `
      <h2 id="productTotalsTitle"></h2>
      <div class="product-totals">
        <div class="product-total-row" data-total-product="bunner">
          <span class="product-total-name">Bunner</span>
          <span class="product-total-value" id="bunnerTotal"></span>
        </div>
        <div class="product-total-row" data-total-product="hyller30">
          <span class="product-total-name">Hyller x30</span>
          <span class="product-total-value" id="hyller30Total"></span>
        </div>
        <div class="product-total-row" data-total-product="hyller60">
          <span class="product-total-name">Hyller x60</span>
          <span class="product-total-value" id="hyller60Total"></span>
        </div>
      </div>
    `;
    productSection.insertAdjacentElement("afterend", section);
  }

  function updateProductTotals() {
    installProductTotals();

    const copy = totalsText[language] || totalsText.nb;
    const verifiedRows = Array.isArray(rows)
      ? rows.filter(row => row.status === "verified")
      : [];

    const counts = {
      bunner: verifiedRows.filter(row => row.product === "bunner").length,
      hyller30: verifiedRows.filter(row => row.product === "hyller30").length,
      hyller60: verifiedRows.filter(row => row.product === "hyller60").length
    };

    const title = document.getElementById("productTotalsTitle");
    const bunnerTotal = document.getElementById("bunnerTotal");
    const hyller30Total = document.getElementById("hyller30Total");
    const hyller60Total = document.getElementById("hyller60Total");

    if (title) title.textContent = copy.title;
    if (bunnerTotal) bunnerTotal.textContent = copy.bunner(counts.bunner);
    if (hyller30Total) hyller30Total.textContent = copy.hyller30(counts.hyller30);
    if (hyller60Total) hyller60Total.textContent = copy.hyller60(counts.hyller60);

    document.querySelectorAll("[data-total-product]").forEach(row => {
      row.classList.toggle("active", row.dataset.totalProduct === product);
    });
  }

  installProductTotals();

  const originalRenderCounts = renderCounts;
  renderCounts = function renderCountsWithProductTotals() {
    originalRenderCounts();
    updateProductTotals();
  };

  const originalRenderChoices = renderChoices;
  renderChoices = function renderChoicesWithProductTotals() {
    originalRenderChoices();
    updateProductTotals();
  };

  updateProductTotals();

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

        // Keep the existing allowed source value. Do not write camera+nordic_id.
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

  console.info("Camera Cloud v4.2 product totals and source constraint fix are active.");
})();
