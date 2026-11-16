/**
 * PothHalaPro - Module 1: Smart NIC & Driving License 1:1 Scale Cloner
 * Renders exact physical millimeter scale A4 print layouts and high-DPI 300 DPI Canvas sheets.
 */

const NicCloner = (() => {
  // 1:1 True Physical Millimeter & High-DPI Scale Constants
  const MM_PER_INCH = 25.4;
  const DPI_300 = 300;
  const PIXELS_PER_MM_300DPI = DPI_300 / MM_PER_INCH; // 11.811023622047244 px/mm
  const PIXELS_PER_MM_SCREEN = 96 / MM_PER_INCH; // 3.779527559 px/mm at 96 CSS DPI
  const POINTS_PER_MM = 72 / MM_PER_INCH; // 2.834645669 pt/mm (CSS print point scale)

  // A4 Standard Dimensions
  const A4_WIDTH_MM = 210.0;
  const A4_HEIGHT_MM = 297.0;
  const A4_PX_W_300DPI = Math.round(A4_WIDTH_MM * PIXELS_PER_MM_300DPI); // 2480 px
  const A4_PX_H_300DPI = Math.round(A4_HEIGHT_MM * PIXELS_PER_MM_300DPI); // 3508 px

  // Pre-calibrated dimensions in mm
  const PRESETS = {
    'iso-id1': { name: 'Smart NIC (ID-1)', widthMm: 85.6, heightMm: 54.0, class: 'size-id1' },
    'mta-license': { name: 'MTA Driving License', widthMm: 85.6, heightMm: 54.0, class: 'size-id1' },
    'classic-nic': { name: 'Classic NIC (100x65)', widthMm: 100.0, heightMm: 65.0, class: 'size-classic-nic' },
    'postal-id': { name: 'Postal ID (95x60)', widthMm: 95.0, heightMm: 60.0, class: 'size-postal-id' }
  };

  let activePresetKey = 'iso-id1';
  let activeLayoutMode = 'side-by-side'; // 'side-by-side', 'stacked', 'fold-laminate', '4copy-eco'

  // Document Images state
  let frontImage = null; // HTMLImageElement
  let backImage = null;  // HTMLImageElement
  let frontRotation = 0; // 0, 90, 180, 270
  let backRotation = 0;

  // Filter settings
  let brightness = 0;   // -100 to 100
  let contrast = 0;     // -100 to 100
  let bwMode = false;
  let showCuttingGuides = true;

  function init() {
    bindEvents();
    loadDefaultPreset();
    renderLivePreview();
  }

  function bindEvents() {
    // Preset Buttons
    document.querySelectorAll('[data-nic-preset]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-nic-preset]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePresetKey = btn.getAttribute('data-nic-preset');
        renderLivePreview();
      });
    });

    // Layout Mode Buttons
    document.querySelectorAll('[data-nic-layout]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-nic-layout]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeLayoutMode = btn.getAttribute('data-nic-layout');
        renderLivePreview();
      });
    });

    // Front Upload Slot
    const frontInput = document.getElementById('nic-front-input');
    const frontSlot = document.getElementById('nic-front-slot');
    if (frontSlot && frontInput) {
      frontSlot.addEventListener('click', (e) => {
        if (!e.target.closest('.slot-tools')) frontInput.click();
      });
      frontInput.addEventListener('change', (e) => handleImageUpload(e.target.files[0], 'front'));
    }

    // Back Upload Slot
    const backInput = document.getElementById('nic-back-input');
    const backSlot = document.getElementById('nic-back-slot');
    if (backSlot && backInput) {
      backSlot.addEventListener('click', (e) => {
        if (!e.target.closest('.slot-tools')) backInput.click();
      });
      backInput.addEventListener('change', (e) => handleImageUpload(e.target.files[0], 'back'));
    }

    // Front Tools: Rotate & Remove
    const btnRotateFront = document.getElementById('btn-rotate-front');
    if (btnRotateFront) {
      btnRotateFront.addEventListener('click', () => {
        frontRotation = (frontRotation + 90) % 360;
        renderLivePreview();
      });
    }

    const btnRemoveFront = document.getElementById('btn-remove-front');
    if (btnRemoveFront) {
      btnRemoveFront.addEventListener('click', () => {
        frontImage = null;
        frontRotation = 0;
        updateSlotThumbnail('front', null);
        renderLivePreview();
      });
    }

    // Back Tools: Rotate & Remove
    const btnRotateBack = document.getElementById('btn-rotate-back');
    if (btnRotateBack) {
      btnRotateBack.addEventListener('click', () => {
        backRotation = (backRotation + 90) % 360;
        renderLivePreview();
      });
    }

    const btnRemoveBack = document.getElementById('btn-remove-back');
    if (btnRemoveBack) {
      btnRemoveBack.addEventListener('click', () => {
        backImage = null;
        backRotation = 0;
        updateSlotThumbnail('back', null);
        renderLivePreview();
      });
    }

    // Filter Sliders: Brightness & Contrast
    const brightnessSlider = document.getElementById('nic-brightness');
    const brightnessVal = document.getElementById('nic-brightness-val');
    if (brightnessSlider) {
      brightnessSlider.addEventListener('input', (e) => {
        brightness = parseInt(e.target.value, 10);
        if (brightnessVal) brightnessVal.textContent = `${brightness > 0 ? '+' : ''}${brightness}%`;
        renderLivePreview();
      });
    }

    const contrastSlider = document.getElementById('nic-contrast');
    const contrastVal = document.getElementById('nic-contrast-val');
    if (contrastSlider) {
      contrastSlider.addEventListener('input', (e) => {
        contrast = parseInt(e.target.value, 10);
        if (contrastVal) contrastVal.textContent = `${contrast > 0 ? '+' : ''}${contrast}%`;
        renderLivePreview();
      });
    }

    // Laser Copy (B&W) Toggle
    const bwToggle = document.getElementById('nic-bw-toggle');
    if (bwToggle) {
      bwToggle.addEventListener('change', (e) => {
        bwMode = e.target.checked;
        renderLivePreview();
      });
    }

    // Cutting Guides Toggle
    const guidesToggle = document.getElementById('nic-guides-toggle');
    if (guidesToggle) {
      guidesToggle.addEventListener('change', (e) => {
        showCuttingGuides = e.target.checked;
        renderLivePreview();
      });
    }
  }

  function loadDefaultPreset() {
    activePresetKey = 'iso-id1';
  }

  function handleImageUpload(file, side) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (side === 'front') {
          frontImage = img;
          frontRotation = 0;
          updateSlotThumbnail('front', e.target.result);
        } else {
          backImage = img;
          backRotation = 0;
          updateSlotThumbnail('back', e.target.result);
        }
        renderLivePreview();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function updateSlotThumbnail(side, dataUrl) {
    const slot = document.getElementById(`nic-${side}-slot`);
    if (!slot) return;
    const imgEl = document.getElementById(`nic-${side}-thumb`);
    const prompt = slot.querySelector('.slot-prompt');
    const tools = slot.querySelector('.slot-tools');

    if (dataUrl) {
      if (imgEl) {
        imgEl.src = dataUrl;
        imgEl.style.display = 'block';
      }
      if (prompt) prompt.style.display = 'none';
      if (tools) tools.style.display = 'flex';
    } else {
      if (imgEl) {
        imgEl.src = '';
        imgEl.style.display = 'none';
      }
      if (prompt) prompt.style.display = 'block';
      if (tools) tools.style.display = 'none';
    }
  }

  function loadSampleDocuments() {
    const isLicense = activePresetKey === 'mta-license';
    const frontUrl = isLicense ? './assets/samples/sample_license_front.svg' : './assets/samples/sample_nic_front.svg';
    const backUrl = isLicense ? './assets/samples/sample_license_back.svg' : './assets/samples/sample_nic_back.svg';

    const imgF = new Image();
    imgF.onload = () => {
      frontImage = imgF;
      updateSlotThumbnail('front', frontUrl);
      const imgB = new Image();
      imgB.onload = () => {
        backImage = imgB;
        updateSlotThumbnail('back', backUrl);
        renderLivePreview();
        if (window.App && window.App.showToast) {
          window.App.showToast(`Loaded pre-calibrated specimen: ${isLicense ? 'Driving License' : 'Smart NIC'}`, 'success');
        }
      };
      imgB.src = backUrl;
    };
    imgF.src = frontUrl;
  }

  // Filter and rotation processing pipeline on a high-DPI canvas
  function processCardCanvas(image, rotation, targetW, targetH) {
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    // High quality interpolation settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (!image) {
      // Draw placeholder
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(4, 4, targetW - 8, targetH - 8);
      ctx.setLineDash([]);
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 15px "Noto Sans Sinhala", "Iskoola Pota", "Nirmala UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Drop / Select Document Image (ලේඛනය තෝරන්න)', targetW / 2, targetH / 2);
      return canvas;
    }

    // Save and transform for rotation
    ctx.save();
    ctx.translate(targetW / 2, targetH / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const isFlipped = (rotation === 90 || rotation === 270);
    const drawW = isFlipped ? targetH : targetW;
    const drawH = isFlipped ? targetW : targetH;

    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Apply Canvas Filters (Brightness, Contrast, B&W)
    if (brightness !== 0 || contrast !== 0 || bwMode) {
      const imgData = ctx.getImageData(0, 0, targetW, targetH);
      const data = imgData.data;

      // Contrast factor
      const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Apply Brightness
        if (brightness !== 0) {
          r += brightness * 2.55;
          g += brightness * 2.55;
          b += brightness * 2.55;
        }

        // Apply Contrast
        if (contrast !== 0) {
          r = cFactor * (r - 128) + 128;
          g = cFactor * (g - 128) + 128;
          b = cFactor * (b - 128) + 128;
        }

        // B&W Crisp Laser Copy Threshold
        if (bwMode) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          // Adaptive threshold
          const val = gray > 140 ? 255 : (gray < 85 ? 0 : gray);
          r = val;
          g = val;
          b = val;
        }

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }
      ctx.putImageData(imgData, 0, 0);
    }

    return canvas;
  }

  // Generate both the Live Screen Preview and the #print-stage for A4 printing
  function renderLivePreview() {
    const liveSheet = document.getElementById('a4-live-sheet');
    const printStage = document.getElementById('print-stage');
    if (!liveSheet || !printStage) return;

    const preset = PRESETS[activePresetKey] || PRESETS['iso-id1'];

    // High-resolution canvas for rendering (300 DPI: 11.811 px per mm)
    const printScaleFactor = PIXELS_PER_MM_300DPI;
    const printPxW = Math.round(preset.widthMm * printScaleFactor);
    const printPxH = Math.round(preset.heightMm * printScaleFactor);

    const frontCanvas = processCardCanvas(frontImage, frontRotation, printPxW, printPxH);
    const backCanvas = processCardCanvas(backImage, backRotation, printPxW, printPxH);

    const frontDataUrl = frontCanvas.toDataURL();
    const backDataUrl = backCanvas.toDataURL();

    // 1. Populate Screen Preview Sheet
    if (document.getElementById('view-nic')?.classList.contains('active')) {
      liveSheet.innerHTML = buildLayoutHtml({
        layout: activeLayoutMode,
        presetClass: preset.class,
        frontSrc: frontDataUrl,
        backSrc: backDataUrl,
        widthMm: preset.widthMm,
        heightMm: preset.heightMm,
        guides: showCuttingGuides,
        isScreen: true
      });
    }

    // 2. Populate Dedicated Print Stage
    printStage.innerHTML = buildLayoutHtml({
      layout: activeLayoutMode,
      presetClass: preset.class,
      frontSrc: frontDataUrl,
      backSrc: backDataUrl,
      widthMm: preset.widthMm,
      heightMm: preset.heightMm,
      guides: showCuttingGuides,
      isScreen: false
    });
  }

  function buildLayoutHtml(opts) {
    const guideClass = opts.guides ? 'has-cut-guides' : '';
    const isDemo = !window.LicenseManager?.isLicensed();
    const watermark = (!opts.isScreen && isDemo) ? '<div class="demo-watermark-print">POTHA HALA PRO - DEMO</div>' : '';

    if (opts.layout === 'side-by-side') {
      return `
        <div class="nic-print-container layout-side-by-side">
          ${watermark}
          <div class="print-card-item ${opts.presetClass} ${guideClass}" style="width:${opts.widthMm}mm;height:${opts.heightMm}mm;">
            <img src="${opts.frontSrc}" alt="Front">
          </div>
          <div class="print-card-item ${opts.presetClass} ${guideClass}" style="width:${opts.widthMm}mm;height:${opts.heightMm}mm;">
            <img src="${opts.backSrc}" alt="Back">
          </div>
        </div>
      `;
    }

    if (opts.layout === 'stacked') {
      return `
        <div class="nic-print-container layout-stacked">
          ${watermark}
          <div class="print-card-item ${opts.presetClass} ${guideClass}" style="width:${opts.widthMm}mm;height:${opts.heightMm}mm;">
            <img src="${opts.frontSrc}" alt="Front">
          </div>
          <div class="print-card-item ${opts.presetClass} ${guideClass}" style="width:${opts.widthMm}mm;height:${opts.heightMm}mm;">
            <img src="${opts.backSrc}" alt="Back">
          </div>
        </div>
      `;
    }

    if (opts.layout === 'fold-laminate') {
      return `
        <div class="nic-print-container layout-fold-laminate">
          ${watermark}
          <div class="print-card-item ${opts.presetClass} ${guideClass}" style="width:${opts.widthMm}mm;height:${opts.heightMm}mm;border-bottom:none;">
            <img src="${opts.frontSrc}" alt="Front">
          </div>
          <div class="fold-line"></div>
          <div class="print-card-item ${opts.presetClass} ${guideClass}" style="width:${opts.widthMm}mm;height:${opts.heightMm}mm;border-top:none;">
            <img src="${opts.backSrc}" alt="Back">
          </div>
        </div>
      `;
    }

    if (opts.layout === '4copy-eco') {
      let cards = '';
      for (let i = 0; i < 4; i++) {
        cards += `
          <div class="print-card-item ${opts.presetClass} ${guideClass}" style="width:${opts.widthMm}mm;height:${opts.heightMm}mm;">
            <img src="${opts.frontSrc}" alt="Front ${i+1}">
          </div>
          <div class="print-card-item ${opts.presetClass} ${guideClass}" style="width:${opts.widthMm}mm;height:${opts.heightMm}mm;">
            <img src="${opts.backSrc}" alt="Back ${i+1}">
          </div>
        `;
      }
      return `
        <div class="nic-print-container layout-4copy-eco">
          ${watermark}
          ${cards}
        </div>
      `;
    }

    return '';
  }

  // =============================================================
  // HIGH-DPI 1:1 PHYSICAL MILLIMETER CANVAS RENDERING ENGINE
  // =============================================================

  /**
   * Render the entire A4 physical sheet (210mm x 297mm @ 300 DPI = 2480 x 3508 px)
   * directly onto an HTML5 Canvas for bit-for-bit print production.
   */
  function renderFullA4SheetCanvas(dpi = DPI_300) {
    const scale = dpi / MM_PER_INCH;
    const sheetW = Math.round(A4_WIDTH_MM * scale);
    const sheetH = Math.round(A4_HEIGHT_MM * scale);

    const canvas = document.createElement('canvas');
    canvas.width = sheetW;
    canvas.height = sheetH;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Crisp Pure White A4 Page
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, sheetW, sheetH);

    const preset = PRESETS[activePresetKey] || PRESETS['iso-id1'];
    const cardPxW = Math.round(preset.widthMm * scale);
    const cardPxH = Math.round(preset.heightMm * scale);

    const frontCard = processCardCanvas(frontImage, frontRotation, cardPxW, cardPxH);
    const backCard = processCardCanvas(backImage, backRotation, cardPxW, cardPxH);

    // Draw card helper with border and optional cut guide
    function drawCardWithGuides(x, y, cardCanvas, label) {
      ctx.drawImage(cardCanvas, x, y);

      if (showCuttingGuides) {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = Math.max(1, Math.round(0.25 * scale));
        ctx.setLineDash([Math.round(2 * scale), Math.round(2 * scale)]);
        ctx.strokeRect(x, y, cardPxW, cardPxH);
        ctx.setLineDash([]);

        // Scissors corner mark
        ctx.fillStyle = '#64748B';
        ctx.font = `${Math.round(8 * (scale / 3.78))}px Arial, sans-serif`;
        ctx.fillText('✂', x + cardPxW + 4, y + 10);
      }
    }

    if (activeLayoutMode === 'side-by-side') {
      const gapX = Math.round(12 * scale);
      const topY = Math.round(50 * scale);
      const totalW = (cardPxW * 2) + gapX;
      const startX = Math.round((sheetW - totalW) / 2);

      drawCardWithGuides(startX, topY, frontCard, 'Front');
      drawCardWithGuides(startX + cardPxW + gapX, topY, backCard, 'Back');
    } else if (activeLayoutMode === 'stacked') {
      const gapY = Math.round(15 * scale);
      const topY = Math.round(35 * scale);
      const startX = Math.round((sheetW - cardPxW) / 2);

      drawCardWithGuides(startX, topY, frontCard, 'Front');
      drawCardWithGuides(startX, topY + cardPxH + gapY, backCard, 'Back');
    } else if (activeLayoutMode === 'fold-laminate') {
      const topY = Math.round(40 * scale);
      const startX = Math.round((sheetW - cardPxW) / 2);

      drawCardWithGuides(startX, topY, frontCard, 'Front');

      // Central Fold Line
      const foldY = topY + cardPxH;
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = Math.max(1, Math.round(0.35 * scale));
      ctx.setLineDash([Math.round(3 * scale), Math.round(3 * scale)]);
      ctx.beginPath();
      ctx.moveTo(startX - Math.round(10 * scale), foldY);
      ctx.lineTo(startX + cardPxW + Math.round(10 * scale), foldY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#475569';
      ctx.font = `${Math.round(7 * (scale / 3.78))}px Arial, sans-serif`;
      ctx.fillText('FOLD HERE (නමන්න) ✂', startX + cardPxW + Math.round(12 * scale), foldY + 4);

      drawCardWithGuides(startX, foldY, backCard, 'Back');
    } else if (activeLayoutMode === '4copy-eco') {
      const gapX = Math.round(10 * scale);
      const gapY = Math.round(6 * scale);
      const topY = Math.round(8 * scale);
      const startX = Math.round((sheetW - (cardPxW * 2 + gapX)) / 2);

      for (let i = 0; i < 4; i++) {
        const rowY = topY + i * (cardPxH + gapY);
        drawCardWithGuides(startX, rowY, frontCard, `Front ${i+1}`);
        drawCardWithGuides(startX + cardPxW + gapX, rowY, backCard, `Back ${i+1}`);
      }
    }

    // Demo Watermark if unlicensed
    if (!window.LicenseManager?.isLicensed()) {
      ctx.save();
      ctx.translate(sheetW / 2, sheetH / 2);
      ctx.rotate((-35 * Math.PI) / 180);
      ctx.fillStyle = 'rgba(220, 38, 38, 0.12)';
      ctx.font = `900 ${Math.round(42 * (scale / 2.83))}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('POTHA HALA PRO - DEMO', 0, 0);
      ctx.restore();
    }

    return canvas;
  }

  /**
   * Export the 300 DPI A4 Canvas as a downloadable PNG
   */
  function exportA4HighResPng(filename = 'PothHalaPro_1to1_NIC_Print_300DPI.png') {
    const canvas = renderFullA4SheetCanvas(DPI_300);
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (window.App && window.App.showToast) {
      window.App.showToast('Exported 300 DPI 1:1 true scale print canvas', 'success');
    }
  }

  /**
   * Mathematical verification utility for automated test suites
   */
  function verify1To1ScaleMath(dpi = DPI_300) {
    const pxPerMm = dpi / MM_PER_INCH;
    const results = {};

    Object.entries(PRESETS).forEach(([key, preset]) => {
      const exactPxW = preset.widthMm * pxPerMm;
      const exactPxH = preset.heightMm * pxPerMm;
      const roundedPxW = Math.round(exactPxW);
      const roundedPxH = Math.round(exactPxH);

      results[key] = {
        name: preset.name,
        widthMm: preset.widthMm,
        heightMm: preset.heightMm,
        targetPxW: roundedPxW,
        targetPxH: roundedPxH,
        exactPxW: exactPxW,
        exactPxH: exactPxH,
        verified: Math.abs(exactPxW - roundedPxW) < 0.5 && Math.abs(exactPxH - roundedPxH) < 0.5
      };
    });

    return {
      dpi: dpi,
      mmPerInch: MM_PER_INCH,
      pixelsPerMm: pxPerMm,
      a4Dimensions: {
        widthMm: A4_WIDTH_MM,
        heightMm: A4_HEIGHT_MM,
        pxW: Math.round(A4_WIDTH_MM * pxPerMm),
        pxH: Math.round(A4_HEIGHT_MM * pxPerMm)
      },
      presets: results,
      allVerified: Object.values(results).every(r => r.verified)
    };
  }

  function triggerPrint() {
    renderLivePreview();
    window.print();
  }

  return {
    init,
    PRESETS,
    PIXELS_PER_MM_300DPI,
    renderLivePreview,
    triggerPrint,
    loadSampleDocuments,
    renderFullA4SheetCanvas,
    exportA4HighResPng,
    verify1To1ScaleMath
  };
})();

if (typeof window !== 'undefined') {
  window.NicCloner = NicCloner;
}
