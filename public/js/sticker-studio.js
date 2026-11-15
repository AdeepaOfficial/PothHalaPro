/**
 * PothHalaPro - Module 2: Smart School Name Sticker Studio
 * Generates exact 90mm x 45mm stickers (8-up A4 sheet) with automated curriculum mapping.
 */

const StickerStudio = (() => {
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

  // Modern Template Definitions
  const TEMPLATES = {
    // Standard Templates
    'cyber-neon': {
      id: 'cyber-neon',
      name: 'Cyber Neon Kids',
      isPro: false,
      bg: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
      textColor: '#FFFFFF',
      subColor: '#38BDF8',
      accentColor: '#4ADE80',
      border: '2px solid #38BDF8',
      font: "'Segoe UI', sans-serif"
    },
    'royal-gold': {
      id: 'royal-gold',
      name: 'Royal College Gold',
      isPro: false,
      bg: 'linear-gradient(135deg, #450A0A 0%, #78350F 100%)',
      textColor: '#FEF08A',
      subColor: '#FDE047',
      accentColor: '#FACC15',
      border: '2px solid #EAB308',
      font: "'Georgia', serif"
    },
    'kawaii-pink': {
      id: 'kawaii-pink',
      name: 'Kawaii Pink & Lilac',
      isPro: false,
      bg: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
      textColor: '#831843',
      subColor: '#DB2777',
      accentColor: '#F472B6',
      border: '2px solid #F472B6',
      font: "'Segoe UI', sans-serif"
    },
    'turbo-orange': {
      id: 'turbo-orange',
      name: 'Turbo Hero Orange',
      isPro: false,
      bg: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
      textColor: '#7C2D12',
      subColor: '#C2410C',
      accentColor: '#EA580C',
      border: '2px solid #F97316',
      font: "'Segoe UI', sans-serif"
    },
    // PRO Templates (Unlocked with Lifetime License)
    'galactic-pro': {
      id: 'galactic-pro',
      name: 'Galactic Explorer (PRO)',
      isPro: true,
      bg: 'linear-gradient(135deg, #020617 0%, #1E293B 100%)',
      textColor: '#F8FAFC',
      subColor: '#818CF8',
      accentColor: '#C084FC',
      border: '2px solid #818CF8',
      font: "'Segoe UI', sans-serif"
    },
    'vintage-pro': {
      id: 'vintage-pro',
      name: 'Vintage Parchment (PRO)',
      isPro: true,
      bg: 'linear-gradient(135deg, #FEFCE8 0%, #FEF9C3 100%)',
      textColor: '#422006',
      subColor: '#713F12',
      accentColor: '#A16207',
      border: '2px dashed #CA8A04',
      font: "'Georgia', serif"
    },
    'minimalist-pro': {
      id: 'minimalist-pro',
      name: 'Minimalist Slate (PRO)',
      isPro: true,
      bg: '#FFFFFF',
      textColor: '#0F172A',
      subColor: '#475569',
      accentColor: '#2563EB',
      border: '2px solid #0F172A',
      font: "'Segoe UI', sans-serif"
    },
    'heritage-pro': {
      id: 'heritage-pro',
      name: 'Sri Lanka Heritage (PRO)',
      isPro: true,
      bg: 'linear-gradient(135deg, #881337 0%, #9F1239 100%)',
      textColor: '#FEF08A',
      subColor: '#FDE047',
      accentColor: '#FACC15',
      border: '2px solid #FACC15',
      font: "'Noto Sans Sinhala', 'Segoe UI', sans-serif"
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

  function init() {
    bindEvents();
    renderLiveStickerPreview();
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
        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; line-height: 1.25;">
          <!-- Student Name -->
          <div style="font-size: 11pt; font-weight: 800; color: ${tmpl.textColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${studentName}
          </div>

          <!-- School Name -->
          <div style="font-size: 7.5pt; font-weight: 600; color: ${tmpl.subColor}; margin-top: 1mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${schoolName}
          </div>

          <!-- Grade & Class -->
          <div style="font-size: 7.5pt; font-weight: 700; color: ${tmpl.accentColor}; margin-top: 0.8mm;">
            ${gradeLabel}${sectionLabel}
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

  function triggerPrint() {
    renderLiveStickerPreview();
    window.print();
  }

  return {
    init,
    setLanguage,
    renderLiveStickerPreview,
    triggerPrint
  };
})();

window.StickerStudio = StickerStudio;
