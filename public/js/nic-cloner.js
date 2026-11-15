/**
 * PothHalaPro - Module 1: Smart NIC & Driving License 1:1 Scale Cloner
 * Renders exact physical millimeter scale A4 print layouts.
 */

const NicCloner = (() => {
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

    // Quick Sample Document Loader (1-Click Test)
    const btnLoadSample = document.getElementById('btn-load-sample-nic');
    if (btnLoadSample) {
      btnLoadSample.addEventListener('click', () => {
        loadSampleDocuments();
      });
    }

    // Sliders
    const brightnessInput = document.getElementById('nic-brightness');
    const brightnessVal = document.getElementById('nic-brightness-val');
    if (brightnessInput) {
      brightnessInput.addEventListener('input', (e) => {
        brightness = parseInt(e.target.value, 10);
        if (brightnessVal) brightnessVal.textContent = `${brightness > 0 ? '+' : ''}${brightness}%`;
        renderLivePreview();
      });
    }

    const contrastInput = document.getElementById('nic-contrast');
    const contrastVal = document.getElementById('nic-contrast-val');
    if (contrastInput) {
      contrastInput.addEventListener('input', (e) => {
        contrast = parseInt(e.target.value, 10);
        if (contrastVal) contrastVal.textContent = `${contrast > 0 ? '+' : ''}${contrast}%`;
        renderLivePreview();
      });
    }

    // B&W Toggle
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
    const imgEl = document.getElementById(`nic-${side}-thumb`);
    const prompt = slot.querySelector('.slot-prompt');
    const tools = slot.querySelector('.slot-tools');

    if (dataUrl) {
      imgEl.src = dataUrl;
      imgEl.style.display = 'block';
      if (prompt) prompt.style.display = 'none';
      if (tools) tools.style.display = 'flex';
    } else {
      imgEl.src = '';
      imgEl.style.display = 'none';
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
    
    // Pixel sizing for preview (approx 2.834 px per mm at 72dpi screen scale)
    const scaleFactor = 2.8346;
    const cardPxW = Math.round(preset.widthMm * scaleFactor);
    const cardPxH = Math.round(preset.heightMm * scaleFactor);

    // High-resolution canvas for rendering (300 DPI: ~11.81 px per mm)
    const printScaleFactor = 11.81;
    const printPxW = Math.round(preset.widthMm * printScaleFactor);
    const printPxH = Math.round(preset.heightMm * printScaleFactor);

    const frontCanvas = processCardCanvas(frontImage, frontRotation, printPxW, printPxH);
    const backCanvas = processCardCanvas(backImage, backRotation, printPxW, printPxH);

    const frontDataUrl = frontCanvas.toDataURL();
    const backDataUrl = backCanvas.toDataURL();

    // 1. Populate Screen Preview Sheet
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
      // 4 pairs (8 cards total)
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

  function triggerPrint() {
    renderLivePreview();
    window.print();
  }

  return {
    init,
    renderLivePreview,
    triggerPrint,
    loadSampleDocuments
  };
})();

window.NicCloner = NicCloner;
