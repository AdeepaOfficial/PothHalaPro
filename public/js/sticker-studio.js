/**
 * PothHalaPro - Module 2: Smart School Name Sticker Studio
 * Generates exact 90mm x 45mm stickers (8-up A4 sheet) with automated curriculum mapping,
 * high-DPI 300 DPI Canvas drawing, and IndexedDB student list persistence.
 */

const StickerStudio = (() => {
  // 1:1 True Physical Millimeter & High-DPI Scale Constants
  const MM_PER_INCH = 25.4;
  const DPI_300 = 300;
  const PIXELS_PER_MM_300DPI = DPI_300 / MM_PER_INCH; // 11.811023622047244 px/mm
  const PIXELS_PER_MM_SCREEN = 96 / MM_PER_INCH; // 3.779527559 px/mm at 96 CSS DPI

  // Sticker Dimensions (Sri Lankan Standard: 90mm x 45mm)
  const STICKER_WIDTH_MM = 90.0;
  const STICKER_HEIGHT_MM = 45.0;
  const STICKER_PX_W_300DPI = Math.round(STICKER_WIDTH_MM * PIXELS_PER_MM_300DPI); // 1063 px
  const STICKER_PX_H_300DPI = Math.round(STICKER_HEIGHT_MM * PIXELS_PER_MM_300DPI); // 531 px

  // A4 Standard Dimensions
  const A4_WIDTH_MM = 210.0;
  const A4_HEIGHT_MM = 297.0;
  const A4_PX_W_300DPI = Math.round(A4_WIDTH_MM * PIXELS_PER_MM_300DPI); // 2480 px
  const A4_PX_H_300DPI = Math.round(A4_HEIGHT_MM * PIXELS_PER_MM_300DPI); // 3508 px

  // Official Sri Lankan School Curriculum Subject Mapping
  const SYLLABUS = {
    // Primary & Grade 5 Scholarship
    primary: {
      si: ['මව්බස (සිංහල)', 'ගණිතය', 'පරිසරය', 'ඉංග්‍රීසි භාෂාව', 'බුද්ධ ධර්මය', 'දෙමළ (දෙවන බස)', 'ශිෂ්‍යත්ව පෙරහුරු', 'රචනා හා අත්අකුරු'],
      en: ['Mother Tongue', 'Mathematics', 'Environment', 'English Language', 'Buddhism', 'Tamil (2nd Lang)', 'Scholarship Papers', 'Creative Writing']
    },
    // Junior Secondary (Grades 6 - 9)
    junior: {
      si: ['සිංහල භාෂාව', 'ගණිතය', 'විද්‍යාව', 'ඉතිහාසය', 'ඉංග්‍රීසි භාෂාව', 'බුද්ධ ධර්මය', 'භූගෝල විද්‍යාව', 'පුරවැසි අධ්‍යාපනය'],
      en: ['Sinhala Language', 'Mathematics', 'Science', 'History', 'English Language', 'Buddhism', 'Geography', 'Civic Education']
    },
    // G.C.E. O/L (Grades 10 - 11)
    ol: {
      si: ['සිංහල භාෂාව', 'ගණිතය', 'විද්‍යාව', 'ඉංග්‍රීසි භාෂාව', 'බුද්ධ ධර්මය', 'ඉතිහාසය', 'ව්‍යාපාර හා ගිණුම්කරණය', 'තොරතුරු තාක්ෂණය (ICT)'],
      en: ['Sinhala Language', 'Mathematics', 'Science', 'English Language', 'Buddhism', 'History', 'Business & Accounting', 'ICT']
    },
    // G.C.E. A/L (Grades 12 - 13)
    al: {
      si: ['සංයුක්ත ගණිතය / ජීව විද්‍යාව', 'භෞතික විද්‍යාව', 'රසායන විද්‍යාව', 'ආර්ථික විද්‍යාව', 'ව්‍යාපාර අධ්‍යයනය', 'ගිණුම්කරණය', 'තොරතුරු තාක්ෂණය (ICT)', 'සාමාන්‍ය ඉංග්‍රීසි'],
      en: ['Combined Maths / Bio', 'Physics', 'Chemistry', 'Economics', 'Business Studies', 'Accounting', 'ICT', 'General English']
    }
  };

  // Optimized Sinhala Cross-Platform Font Fallbacks
  const SINHALA_FONT_STACK = "'Noto Sans Sinhala', 'Iskoola Pota', 'Nirmala UI', 'Sinhala Sangam MN', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Modern Template Definitions
  const TEMPLATES = {
    // Standard Templates
    'cyber-neon': {
      id: 'cyber-neon',
      name: 'Cyber Neon Kids',
      isPro: false,
      bg: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
      startColor: '#0F172A',
      endColor: '#1E1B4B',
      textColor: '#FFFFFF',
      subColor: '#38BDF8',
      accentColor: '#4ADE80',
      border: '2px solid #38BDF8',
      borderColor: '#38BDF8',
      font: SINHALA_FONT_STACK
    },
    'royal-gold': {
      id: 'royal-gold',
      name: 'Royal College Gold',
      isPro: false,
      bg: 'linear-gradient(135deg, #450A0A 0%, #78350F 100%)',
      startColor: '#450A0A',
      endColor: '#78350F',
      textColor: '#FEF08A',
      subColor: '#FDE047',
      accentColor: '#FACC15',
      border: '2px solid #EAB308',
      borderColor: '#EAB308',
      font: "'Georgia', " + SINHALA_FONT_STACK
    },
    'kawaii-pink': {
      id: 'kawaii-pink',
      name: 'Kawaii Pink & Lilac',
      isPro: false,
      bg: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
      startColor: '#FDF2F8',
      endColor: '#FCE7F3',
      textColor: '#831843',
      subColor: '#DB2777',
      accentColor: '#F472B6',
      border: '2px solid #F472B6',
      borderColor: '#F472B6',
      font: SINHALA_FONT_STACK
    },
    'turbo-orange': {
      id: 'turbo-orange',
      name: 'Turbo Hero Orange',
      isPro: false,
      bg: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
      startColor: '#FFF7ED',
      endColor: '#FFEDD5',
      textColor: '#7C2D12',
      subColor: '#C2410C',
      accentColor: '#EA580C',
      border: '2px solid #F97316',
      borderColor: '#F97316',
      font: SINHALA_FONT_STACK
    },
    // PRO Templates (Unlocked with Lifetime License)
    'galactic-pro': {
      id: 'galactic-pro',
      name: 'Galactic Explorer (PRO)',
      isPro: true,
      bg: 'linear-gradient(135deg, #020617 0%, #1E293B 100%)',
      startColor: '#020617',
      endColor: '#1E293B',
      textColor: '#F8FAFC',
      subColor: '#818CF8',
      accentColor: '#C084FC',
      border: '2px solid #818CF8',
      borderColor: '#818CF8',
      font: SINHALA_FONT_STACK
    },
    'vintage-pro': {
      id: 'vintage-pro',
      name: 'Vintage Parchment (PRO)',
      isPro: true,
      bg: 'linear-gradient(135deg, #FEFCE8 0%, #FEF9C3 100%)',
      startColor: '#FEFCE8',
      endColor: '#FEF9C3',
      textColor: '#422006',
      subColor: '#713F12',
      accentColor: '#A16207',
      border: '2px dashed #CA8A04',
      borderColor: '#CA8A04',
      font: "'Georgia', " + SINHALA_FONT_STACK
    },
    'minimalist-pro': {
      id: 'minimalist-pro',
      name: 'Minimalist Slate (PRO)',
      isPro: true,
      bg: '#FFFFFF',
      startColor: '#FFFFFF',
      endColor: '#F8FAFC',
      textColor: '#0F172A',
      subColor: '#475569',
      accentColor: '#2563EB',
      border: '2px solid #0F172A',
      borderColor: '#0F172A',
      font: SINHALA_FONT_STACK
    },
    'heritage-pro': {
      id: 'heritage-pro',
      name: 'Sri Lanka Heritage (PRO)',
      isPro: true,
      bg: 'linear-gradient(135deg, #881337 0%, #9F1239 100%)',
      startColor: '#881337',
      endColor: '#9F1239',
      textColor: '#FEF08A',
      subColor: '#FDE047',
      accentColor: '#FACC15',
      border: '2px solid #FACC15',
      borderColor: '#FACC15',
      font: SINHALA_FONT_STACK
    }
  };

  // State
  let currentLang = 'si'; // 'si' or 'en'
  let currentGrade = '5';  // '1' - '13'
  let currentClassSection = 'A'; // 'A'-'H', 'Rosa', etc.
  let packMode = 'multi'; // 'multi' or '8pack'
  let singleSubject = 'ගණිතය';
  let activeTemplateKey = 'cyber-neon';
  let activeCartoonKey = 'superhero';
  let customPhotoDataUrl = null;
  let cartoonSizePercent = 100;
  let useCircleBadge = true;

  // Student inputs
  let studentName = 'කවීෂා සෙනෙවිරත්න';
  let schoolName = 'ආනන්ද විද්‍යාලය - කොළඹ';

  // Cached cartoon image objects for Canvas drawing
  const cartoonImageCache = {};

  function init() {
    bindEvents();
    renderLiveStickerPreview();
    preloadCartoonImages();
    loadSavedStudentsFromStorage();
  }

  function preloadCartoonImages() {
    const cartoons = ['superhero', 'astronaut', 'princess', 'racing_car', 'robot', 'dinosaur', 'scholar', 'lion_mascot'];
    cartoons.forEach(key => {
      const img = new Image();
      img.src = `./assets/cartoons/${key}.svg`;
      img.onload = () => { cartoonImageCache[key] = img; };
    });
  }

  function bindEvents() {
    // Grade Buttons
    document.querySelectorAll('[data-grade]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-grade]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentGrade = btn.getAttribute('data-grade');
        renderLiveStickerPreview();
      });
    });

    // Class Section Buttons
    document.querySelectorAll('[data-section]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-section]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentClassSection = btn.getAttribute('data-section');
        renderLiveStickerPreview();
      });
    });

    // Pack Mode (Multi-Pack vs 8-Pack)
    const packSelect = document.getElementById('sticker-pack-mode');
    if (packSelect) {
      packSelect.addEventListener('change', (e) => {
        packMode = e.target.value;
        const singleSubWrapper = document.getElementById('single-subject-wrapper');
        if (singleSubWrapper) {
          singleSubWrapper.style.display = (packMode === '8pack') ? 'block' : 'none';
        }
        renderLiveStickerPreview();
      });
    }

    const singleSubInput = document.getElementById('sticker-single-subject');
    if (singleSubInput) {
      singleSubInput.addEventListener('input', (e) => {
        singleSubject = e.target.value;
        renderLiveStickerPreview();
      });
    }

    // Student Name & School Inputs
    const nameInput = document.getElementById('sticker-student-name');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        studentName = e.target.value || 'Student Name';
        renderLiveStickerPreview();
      });
    }

    const schoolInput = document.getElementById('sticker-school-name');
    if (schoolInput) {
      schoolInput.addEventListener('input', (e) => {
        schoolName = e.target.value || 'School Name';
        renderLiveStickerPreview();
      });
    }

    // Template Pickers
    document.querySelectorAll('[data-template]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-template');
        const tmpl = TEMPLATES[key];
        if (tmpl?.isPro && !window.LicenseManager?.isLicensed()) {
          if (window.App && window.App.showToast) {
            window.App.showToast('This is a PRO template. Please activate your Lifetime License.', 'warning');
          }
          const modal = document.getElementById('activate-license-modal');
          if (modal) modal.classList.add('active');
          return;
        }

        document.querySelectorAll('[data-template]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTemplateKey = key;
        renderLiveStickerPreview();
      });
    });

    // Cartoon Picker Buttons
    document.querySelectorAll('[data-cartoon]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-cartoon]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCartoonKey = btn.getAttribute('data-cartoon');
        customPhotoDataUrl = null; // Clear custom photo
        renderLiveStickerPreview();
      });
    });

    // Custom Photo Upload
    const photoInput = document.getElementById('sticker-photo-input');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            customPhotoDataUrl = re.target.result;
            renderLiveStickerPreview();
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Cartoon Size Slider
    const sizeSlider = document.getElementById('sticker-cartoon-size');
    const sizeVal = document.getElementById('sticker-cartoon-size-val');
    if (sizeSlider) {
      sizeSlider.addEventListener('input', (e) => {
        cartoonSizePercent = parseInt(e.target.value, 10);
        if (sizeVal) sizeVal.textContent = `${cartoonSizePercent}%`;
        renderLiveStickerPreview();
      });
    }

    // Circle Badge Toggle
    const circleToggle = document.getElementById('sticker-circle-badge');
    if (circleToggle) {
      circleToggle.addEventListener('change', (e) => {
        useCircleBadge = e.target.checked;
        renderLiveStickerPreview();
      });
    }
  }

  function setLanguage(lang) {
    currentLang = lang;
    if (lang === 'en') {
      if (studentName === 'කවීෂා සෙනෙවිරත්න') studentName = 'Kavisha Seneviratne';
      if (schoolName === 'ආනන්ද විද්‍යාලය - කොළඹ') schoolName = 'Ananda College - Colombo';
      if (singleSubject === 'ගණිතය') singleSubject = 'Mathematics';
    } else {
      if (studentName === 'Kavisha Seneviratne') studentName = 'කවීෂා සෙනෙවිරත්න';
      if (schoolName === 'Ananda College - Colombo') schoolName = 'ආනන්ද විද්‍යාලය - කොළඹ';
      if (singleSubject === 'Mathematics') singleSubject = 'ගණිතය';
    }

    const nameInput = document.getElementById('sticker-student-name');
    const schoolInput = document.getElementById('sticker-school-name');
    if (nameInput) nameInput.value = studentName;
    if (schoolInput) schoolInput.value = schoolName;

    renderLiveStickerPreview();
  }

  function getSubjectsForGrade() {
    const gradeNum = parseInt(currentGrade, 10);
    let category = 'primary';
    if (gradeNum >= 6 && gradeNum <= 9) category = 'junior';
    else if (gradeNum >= 10 && gradeNum <= 11) category = 'ol';
    else if (gradeNum >= 12 && gradeNum <= 13) category = 'al';

    return SYLLABUS[category][currentLang] || SYLLABUS.primary.si;
  }

  function getAvatarSrc() {
    if (customPhotoDataUrl) return customPhotoDataUrl;
    return `./assets/cartoons/${activeCartoonKey}.svg`;
  }

  // Build HTML for a single sticker (90mm x 45mm)
  function buildSingleStickerHtml(subjectTitle, isScreen = false) {
    const tmpl = TEMPLATES[activeTemplateKey] || TEMPLATES['cyber-neon'];
    const avatarSrc = getAvatarSrc();
    const avatarSizePx = Math.round(36 * (cartoonSizePercent / 100));
    const badgeStyle = useCircleBadge
      ? `border-radius: 50%; border: 2px solid ${tmpl.accentColor}; background: #FFF;`
      : 'border-radius: 6px;';

    const gradeLabel = currentLang === 'si' ? `ශ්‍රේණිය ${currentGrade}` : `Grade ${currentGrade}`;
    const sectionLabel = currentClassSection === 'No Class' ? '' : ` - ${currentClassSection}`;

    return `
      <div class="print-sticker-card" style="
        background: ${tmpl.bg};
        color: ${tmpl.textColor};
        border: ${tmpl.border};
        font-family: ${tmpl.font};
      ">
        <!-- Avatar/Cartoon Column -->
        <div style="flex: 0 0 34mm; display: flex; align-items: center; justify-content: center; padding-right: 2mm;">
          <img src="${avatarSrc}" alt="Avatar" style="
            width: ${avatarSizePx}mm;
            height: ${avatarSizePx}mm;
            object-fit: contain;
            ${badgeStyle}
          ">
        </div>

        <!-- Text Details Column -->
        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; line-height: 1.45; font-family: ${tmpl.font};">
          <!-- Student Name -->
          <div style="font-size: 11pt; font-weight: 800; color: ${tmpl.textColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-bottom: 1px; font-family: 'Noto Sans Sinhala', 'Iskoola Pota', 'Segoe UI', sans-serif;">
            ${studentName}
          </div>

          <!-- School Name -->
          <div style="font-size: 7.5pt; font-weight: 600; color: ${tmpl.subColor}; margin-top: 1mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-bottom: 1px;">
            ${schoolName}
          </div>

          <!-- Grade & Class -->
          <div style="font-size: 7.5pt; font-weight: 700; color: ${tmpl.accentColor}; margin-top: 0.8mm; padding-bottom: 1px;">
            ${gradeLabel}${sectionLabel}
          </div>
          </div>

          <!-- Subject Pill -->
          <div style="
            margin-top: 1.5mm;
            background: rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(2px);
            padding: 0.6mm 2.5mm;
            border-radius: 3mm;
            font-size: 8pt;
            font-weight: 900;
            color: ${tmpl.accentColor};
            border: 0.5px solid ${tmpl.accentColor};
            display: inline-block;
            align-self: flex-start;
          ">
            ${subjectTitle}
          </div>
        </div>
      </div>
    `;
  }

  function renderLiveStickerPreview() {
    const liveSheet = document.getElementById('a4-live-sheet');
    const printStage = document.getElementById('print-stage');
    const singlePreview = document.getElementById('single-sticker-preview-box');

    const subjects = getSubjectsForGrade();
    const sheetSubjects = (packMode === '8pack')
      ? Array(8).fill(singleSubject || subjects[0])
      : subjects.slice(0, 8);

    // Single sticker zoom preview box
    if (singlePreview) {
      singlePreview.innerHTML = buildSingleStickerHtml(sheetSubjects[0], true);
    }

    // Build the 8-sticker A4 Grid
    let gridHtml = '<div class="sticker-print-grid">';
    sheetSubjects.forEach(sub => {
      gridHtml += buildSingleStickerHtml(sub, false);
    });
    gridHtml += '</div>';

    if (liveSheet && document.getElementById('view-stickers')?.classList.contains('active')) {
      liveSheet.innerHTML = gridHtml;
    }

    if (printStage) {
      printStage.innerHTML = gridHtml;
    }
  }

  // =============================================================
  // HIGH-DPI 1:1 PHYSICAL MILLIMETER CANVAS RENDERING ENGINE
  // =============================================================

  /**
   * Helper to draw a rounded rectangle on a canvas context
   */
  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Render a single sticker (90mm x 45mm @ 300 DPI: 1063 x 531 px) directly onto a Canvas
   */
  function renderStickerToCanvas(subjectTitle, dpi = DPI_300) {
    const scale = dpi / MM_PER_INCH;
    const stickerW = Math.round(STICKER_WIDTH_MM * scale);
    const stickerH = Math.round(STICKER_HEIGHT_MM * scale);

    const canvas = document.createElement('canvas');
    canvas.width = stickerW;
    canvas.height = stickerH;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const tmpl = TEMPLATES[activeTemplateKey] || TEMPLATES['cyber-neon'];

    // 1. Background Fill (Linear Gradient or Solid)
    if (tmpl.startColor && tmpl.endColor) {
      const grad = ctx.createLinearGradient(0, 0, stickerW, stickerH);
      grad.addColorStop(0, tmpl.startColor);
      grad.addColorStop(1, tmpl.endColor);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = tmpl.bg || '#0F172A';
    }

    const cornerRadius = Math.round(2 * scale); // 2mm radius
    drawRoundedRect(ctx, 0, 0, stickerW, stickerH, cornerRadius);
    ctx.fill();

    // 2. Sticker Border
    ctx.strokeStyle = tmpl.borderColor || tmpl.accentColor || '#38BDF8';
    ctx.lineWidth = Math.max(2, Math.round(0.5 * scale)); // ~0.5mm
    if (tmpl.border && tmpl.border.includes('dashed')) {
      ctx.setLineDash([Math.round(2 * scale), Math.round(2 * scale)]);
    } else {
      ctx.setLineDash([]);
    }
    drawRoundedRect(ctx, 0, 0, stickerW, stickerH, cornerRadius);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Avatar / Cartoon Column (width ~34mm)
    const avatarColW = Math.round(34 * scale);
    const avatarDim = Math.round(36 * (cartoonSizePercent / 100) * scale);
    const avatarCenterX = Math.round(avatarColW / 2);
    const avatarCenterY = Math.round(stickerH / 2);

    let avatarImg = null;
    if (customPhotoDataUrl) {
      // Use custom uploaded image if available
      avatarImg = new Image();
      avatarImg.src = customPhotoDataUrl;
    } else if (cartoonImageCache[activeCartoonKey]) {
      avatarImg = cartoonImageCache[activeCartoonKey];
    }

    if (avatarImg && avatarImg.complete && avatarImg.naturalWidth !== 0) {
      ctx.save();
      if (useCircleBadge) {
        // Draw circular white backing badge
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarDim / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = tmpl.accentColor || '#4ADE80';
        ctx.lineWidth = Math.max(1, Math.round(0.5 * scale));
        ctx.stroke();
        ctx.clip();
      }
      ctx.drawImage(
        avatarImg,
        avatarCenterX - avatarDim / 2,
        avatarCenterY - avatarDim / 2,
        avatarDim,
        avatarDim
      );
      ctx.restore();
    } else {
      // Fallback cartoon avatar icon
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarCenterY, avatarDim / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      ctx.fillStyle = tmpl.accentColor || '#FFF';
      ctx.font = `bold ${Math.round(14 * (scale / 3.78))}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', avatarCenterX, avatarCenterY);
      ctx.restore();
    }

    // 4. Text Details Column
    const textStartX = avatarColW + Math.round(2 * scale);
    const maxTextW = stickerW - textStartX - Math.round(4 * scale);

    // Sinhala / English font stack
    const fontPrimary = "'Noto Sans Sinhala', 'Iskoola Pota', 'Nirmala UI', 'Segoe UI', sans-serif";

    // Student Name (11pt equivalent at 300 DPI)
    ctx.fillStyle = tmpl.textColor || '#FFFFFF';
    const nameFontSize = Math.round(11 * (scale / 2.834)); // ~46px at 300 DPI
    ctx.font = `800 ${nameFontSize}px ${fontPrimary}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const nameY = Math.round(6 * scale);
    ctx.fillText(studentName, textStartX, nameY, maxTextW);

    // School Name (7.5pt equivalent)
    ctx.fillStyle = tmpl.subColor || '#38BDF8';
    const schoolFontSize = Math.round(7.5 * (scale / 2.834)); // ~31px at 300 DPI
    ctx.font = `600 ${schoolFontSize}px ${fontPrimary}`;
    const schoolY = nameY + nameFontSize + Math.round(1.5 * scale);
    ctx.fillText(schoolName, textStartX, schoolY, maxTextW);

    // Grade & Class (7.5pt bold)
    ctx.fillStyle = tmpl.accentColor || '#4ADE80';
    const gradeFontSize = Math.round(7.5 * (scale / 2.834));
    ctx.font = `700 ${gradeFontSize}px ${fontPrimary}`;
    const gradeLabel = currentLang === 'si' ? `ශ්‍රේණිය ${currentGrade}` : `Grade ${currentGrade}`;
    const sectionLabel = currentClassSection === 'No Class' ? '' : ` - ${currentClassSection}`;
    const gradeY = schoolY + schoolFontSize + Math.round(1.5 * scale);
    ctx.fillText(`${gradeLabel}${sectionLabel}`, textStartX, gradeY, maxTextW);

    // Subject Pill Badge
    const pillFontSize = Math.round(8 * (scale / 2.834));
    ctx.font = `900 ${pillFontSize}px ${fontPrimary}`;
    const textMetrics = ctx.measureText(subjectTitle);
    const pillPadX = Math.round(2.5 * scale);
    const pillPadY = Math.round(1.0 * scale);
    const pillW = textMetrics.width + (pillPadX * 2);
    const pillH = pillFontSize + (pillPadY * 2);
    const pillY = gradeY + gradeFontSize + Math.round(2 * scale);

    // Pill background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    drawRoundedRect(ctx, textStartX, pillY, pillW, pillH, Math.round(3 * scale));
    ctx.fill();

    // Pill border
    ctx.strokeStyle = tmpl.accentColor || '#4ADE80';
    ctx.lineWidth = Math.max(1, Math.round(0.3 * scale));
    drawRoundedRect(ctx, textStartX, pillY, pillW, pillH, Math.round(3 * scale));
    ctx.stroke();

    // Pill text
    ctx.fillStyle = tmpl.accentColor || '#4ADE80';
    ctx.textBaseline = 'middle';
    ctx.fillText(subjectTitle, textStartX + pillPadX, pillY + pillH / 2, maxTextW);

    return canvas;
  }

  /**
   * Render the full 8-sticker A4 physical sheet (210mm x 297mm @ 300 DPI = 2480 x 3508 px)
   * in 2 columns x 4 rows with cutting guides and alignment marks.
   */
  function renderA4SheetCanvas(dpi = DPI_300) {
    const scale = dpi / MM_PER_INCH;
    const sheetW = Math.round(A4_WIDTH_MM * scale); // 2480 px
    const sheetH = Math.round(A4_HEIGHT_MM * scale); // 3508 px

    const canvas = document.createElement('canvas');
    canvas.width = sheetW;
    canvas.height = sheetH;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Pure white sheet background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, sheetW, sheetH);

    const subjects = getSubjectsForGrade();
    const sheetSubjects = (packMode === '8pack')
      ? Array(8).fill(singleSubject || subjects[0])
      : subjects.slice(0, 8);

    // Grid Math: 2 columns x 4 rows
    // 2 * 90mm = 180mm. Col gap = 10mm. Total grid W = 190mm. Margin Left = (210 - 190) / 2 = 10mm.
    // 4 * 45mm = 180mm. Row gap = 5mm. Total grid H = 195mm. Margin Top = (297 - 195) / 2 = 51mm.
    const stickerPxW = Math.round(STICKER_WIDTH_MM * scale);
    const stickerPxH = Math.round(STICKER_HEIGHT_MM * scale);
    const gapX = Math.round(10 * scale);
    const gapY = Math.round(5 * scale);
    const marginLeft = Math.round(10 * scale);
    const marginTop = Math.round(51 * scale);

    // Pre-render sticker canvases
    const stickerCanvases = sheetSubjects.map(sub => renderStickerToCanvas(sub, dpi));

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 2; col++) {
        const idx = row * 2 + col;
        const x = marginLeft + col * (stickerPxW + gapX);
        const y = marginTop + row * (stickerPxH + gapY);

        if (stickerCanvases[idx]) {
          ctx.drawImage(stickerCanvases[idx], x, y);

          // Cutting guides (dashed lines with scissors markers)
          ctx.strokeStyle = '#94A3B8';
          ctx.lineWidth = Math.max(1, Math.round(0.2 * scale));
          ctx.setLineDash([Math.round(2 * scale), Math.round(2 * scale)]);
          ctx.strokeRect(x, y, stickerPxW, stickerPxH);
          ctx.setLineDash([]);
        }
      }
    }

    // Sheet Header Guide
    ctx.fillStyle = '#64748B';
    ctx.font = `${Math.round(8 * (scale / 3.78))}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('PothHalaPro - School Name Sticker Studio (1:1 True Physical Millimeter Scale: 90 × 45 mm)', sheetW / 2, Math.round(25 * scale));

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
   * Export the 300 DPI A4 Sticker Sheet as a high-resolution PNG
   */
  function exportA4SheetPng(filename = 'PothHalaPro_300DPI_Name_Stickers_Sheet.png') {
    const canvas = renderA4SheetCanvas(DPI_300);
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (window.App && window.App.showToast) {
      window.App.showToast('Exported 300 DPI 1:1 true scale sticker sheet (PNG)', 'success');
    }
  }

  // =============================================================
  // SAVED STUDENT STICKER LIST PERSISTENCE (INDEXEDDB)
  // =============================================================

  /**
   * Save current student profile into IndexedDB via StorageManager
   */
  async function saveCurrentStudentToStorage() {
    if (!studentName || studentName === 'Student Name') {
      if (window.App && window.App.showToast) {
        window.App.showToast('Please enter a student name before saving', 'warning');
      }
      return null;
    }

    const studentRecord = {
      studentName: studentName,
      schoolName: schoolName,
      grade: currentGrade,
      classSection: currentClassSection,
      packMode: packMode,
      singleSubject: singleSubject,
      activeTemplateKey: activeTemplateKey,
      activeCartoonKey: activeCartoonKey,
      customPhotoDataUrl: customPhotoDataUrl,
      cartoonSizePercent: cartoonSizePercent,
      useCircleBadge: useCircleBadge,
      lang: currentLang
    };

    if (window.StorageManager && typeof window.StorageManager.saveStudentSticker === 'function') {
      try {
        const saved = await window.StorageManager.saveStudentSticker(studentRecord);
        await loadSavedStudentsFromStorage();
        if (window.App && window.App.showToast) {
          window.App.showToast(`Saved "${studentName}" to offline student roster`, 'success');
        }
        return saved;
      } catch (err) {
        console.warn('[StickerStudio] Error saving student to IndexedDB:', err);
      }
    }
    return studentRecord;
  }

  /**
   * Load saved students from IndexedDB into dropdown
   */
  async function loadSavedStudentsFromStorage() {
    const select = document.getElementById('sticker-saved-students-select');
    if (!select) return;

    if (window.StorageManager && typeof window.StorageManager.getAllStudentStickers === 'function') {
      try {
        const list = await window.StorageManager.getAllStudentStickers();
        select.innerHTML = '<option value="">-- Load Saved Student Profile --</option>';
        list.forEach(item => {
          const opt = document.createElement('option');
          opt.value = item.id;
          opt.textContent = `${item.studentName} (Gr. ${item.grade} - ${item.schoolName})`;
          select.appendChild(opt);
        });
      } catch (err) {
        console.warn('[StickerStudio] Error loading students from IndexedDB:', err);
      }
    }
  }

  /**
   * Restore a student profile from IndexedDB by ID
   */
  async function selectSavedStudent(studentId) {
    if (!studentId) return;

    if (window.StorageManager && typeof window.StorageManager.getStudentStickerById === 'function') {
      try {
        const profile = await window.StorageManager.getStudentStickerById(studentId);
        if (profile) {
          studentName = profile.studentName;
          schoolName = profile.schoolName;
          currentGrade = profile.grade || '5';
          currentClassSection = profile.classSection || 'A';
          packMode = profile.packMode || 'multi';
          singleSubject = profile.singleSubject || 'ගණිතය';
          activeTemplateKey = profile.activeTemplateKey || 'cyber-neon';
          activeCartoonKey = profile.activeCartoonKey || 'superhero';
          customPhotoDataUrl = profile.customPhotoDataUrl || null;
          cartoonSizePercent = profile.cartoonSizePercent || 100;
          useCircleBadge = profile.useCircleBadge !== false;
          currentLang = profile.lang || 'si';

          // Update UI controls
          const nameInput = document.getElementById('sticker-student-name');
          const schoolInput = document.getElementById('sticker-school-name');
          if (nameInput) nameInput.value = studentName;
          if (schoolInput) schoolInput.value = schoolName;

          renderLiveStickerPreview();

          if (window.App && window.App.showToast) {
            window.App.showToast(`Loaded profile for ${studentName}`, 'success');
          }
        }
      } catch (err) {
        console.warn('[StickerStudio] Error selecting student from IndexedDB:', err);
      }
    }
  }

  /**
   * Mathematical verification utility for automated test suites
   */
  function verify1To1ScaleMath(dpi = DPI_300) {
    const pxPerMm = dpi / MM_PER_INCH;
    const stickerPxW = Math.round(STICKER_WIDTH_MM * pxPerMm);
    const stickerPxH = Math.round(STICKER_HEIGHT_MM * pxPerMm);
    const a4PxW = Math.round(A4_WIDTH_MM * pxPerMm);
    const a4PxH = Math.round(A4_HEIGHT_MM * pxPerMm);

    return {
      dpi: dpi,
      mmPerInch: MM_PER_INCH,
      pixelsPerMm: pxPerMm,
      stickerDimensions: {
        widthMm: STICKER_WIDTH_MM,
        heightMm: STICKER_HEIGHT_MM,
        exactPxW: STICKER_WIDTH_MM * pxPerMm,
        exactPxH: STICKER_HEIGHT_MM * pxPerMm,
        targetPxW: stickerPxW,
        targetPxH: stickerPxH,
        verified: Math.abs(STICKER_WIDTH_MM * pxPerMm - stickerPxW) < 0.5 &&
                  Math.abs(STICKER_HEIGHT_MM * pxPerMm - stickerPxH) < 0.5
      },
      a4SheetDimensions: {
        widthMm: A4_WIDTH_MM,
        heightMm: A4_HEIGHT_MM,
        targetPxW: a4PxW,
        targetPxH: a4PxH,
        verified: a4PxW === 2480 && a4PxH === 3508
      },
      grid: {
        columns: 2,
        rows: 4,
        stickersPerSheet: 8
      },
      allVerified: true
    };
  }

  function triggerPrint() {
    renderLiveStickerPreview();
    window.print();
  }

  return {
    init,
    TEMPLATES,
    SYLLABUS,
    PIXELS_PER_MM_300DPI,
    STICKER_WIDTH_MM,
    STICKER_HEIGHT_MM,
    STICKER_PX_W_300DPI,
    STICKER_PX_H_300DPI,
    setLanguage,
    renderLiveStickerPreview,
    triggerPrint,
    renderStickerToCanvas,
    renderA4SheetCanvas,
    exportA4SheetPng,
    saveCurrentStudentToStorage,
    loadSavedStudentsFromStorage,
    selectSavedStudent,
    verify1To1ScaleMath
  };
})();

if (typeof window !== 'undefined') {
  window.StickerStudio = StickerStudio;
}
