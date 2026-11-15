/**
 * PothHalaPro - License & Offline Activation Engine
 * Supports 100% offline cryptographic key validation, device fingerprinting,
 * demo session countdown, and local persistence.
 */

const LicenseManager = (() => {
  const STORAGE_KEY = 'pothhalapro_license_data';
  const DEMO_DURATION_SECONDS = 300; // 5 minutes demo session

  // Secret salt for offline checksum verification
  const KEY_SALT = 'POTHA_HALA_PRO_LKR_2026_OFFLINE_SECRET';

  let demoTimeRemaining = DEMO_DURATION_SECONDS;
  let demoInterval = null;
  let isLicensed = false;
  let licenseDetails = null;

  // Simple string hash function for offline checksums
  function computeHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).toUpperCase().padStart(4, '0');
  }

  // Generate Device Fingerprint
  function getDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('PothHalaPro-SL', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('PothHalaPro-SL', 4, 17);
    const canvasData = canvas.toDataURL();

    const raw = [
      navigator.userAgent,
      screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
      navigator.hardwareConcurrency || 4,
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Colombo',
      canvasData.slice(-50)
    ].join('###');

    return computeHash(raw) + '-' + computeHash(raw.split('').reverse().join(''));
  }

  // Cryptographic Key Generation (Used by Distributors / Admins)
  function generateActivationCode(year = '2027') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
    const p1 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const p2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    
    // Checksum of (year + p1 + p2 + salt)
    const checkRaw = `${year}-${p1}-${p2}-${KEY_SALT}`;
    const p3 = computeHash(checkRaw).slice(0, 4);

    return `PHP-${year}-${p1}-${p2}-${p3}`;
  }

  // Key Verification
  function verifyActivationCode(code) {
    if (!code || typeof code !== 'string') return { valid: false, reason: 'Empty code' };
    
    const clean = code.trim().toUpperCase();
    const parts = clean.split('-');

    if (parts.length !== 5 || parts[0] !== 'PHP') {
      return { valid: false, reason: 'Invalid format. Required: PHP-YYYY-XXXX-XXXX-XXXX' };
    }

    const [prefix, year, p1, p2, p3] = parts;
    const checkRaw = `${year}-${p1}-${p2}-${KEY_SALT}`;
    const expectedP3 = computeHash(checkRaw).slice(0, 4);

    if (p3 !== expectedP3) {
      return { valid: false, reason: 'Invalid activation code checksum.' };
    }

    return {
      valid: true,
      year: year,
      tier: 'LIFETIME_PRO',
      code: clean
    };
  }

  // Initialize status on startup
  function init() {
    loadLicense();
    if (!isLicensed) {
      startDemoTimer();
    } else {
      updateUIForLicensedState();
    }
  }

  function loadLicense() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const verification = verifyActivationCode(parsed.code);
        if (verification.valid) {
          isLicensed = true;
          licenseDetails = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('License parse error:', e);
    }
    isLicensed = false;
    licenseDetails = null;
  }

  function activate(shopName, ownerPhone, code) {
    const result = verifyActivationCode(code);
    if (!result.valid) {
      return { success: false, message: result.reason };
    }

    const licenseData = {
      shopName: shopName || 'Retail Bookshop & Communication',
      ownerPhone: ownerPhone || '07X XXX XXXX',
      code: result.code,
      activatedAt: new Date().toISOString(),
      deviceFingerprint: getDeviceFingerprint(),
      tier: 'LIFETIME_PRO_OFFLINE'
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(licenseData));
    isLicensed = true;
    licenseDetails = licenseData;

    if (demoInterval) {
      clearInterval(demoInterval);
      demoInterval = null;
    }

    updateUIForLicensedState();
    return { success: true, message: 'Permanent Lifetime License Activated Successfully!' };
  }

  function startDemoTimer() {
    const timerBadge = document.getElementById('demo-timer-badge');
    const timerText = document.getElementById('demo-timer-text');
    if (!timerBadge || !timerText) return;

    timerBadge.style.display = 'flex';
    demoTimeRemaining = DEMO_DURATION_SECONDS;

    demoInterval = setInterval(() => {
      demoTimeRemaining--;
      if (demoTimeRemaining <= 0) {
        clearInterval(demoInterval);
        timerText.textContent = '00:00 - Demo Expired';
        showDemoExpiredModal();
      } else {
        const mins = Math.floor(demoTimeRemaining / 60);
        const secs = demoTimeRemaining % 60;
        timerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} (Demo)`;
      }
    }, 1000);
  }

  function showDemoExpiredModal() {
    const modal = document.getElementById('activate-license-modal');
    if (modal) {
      modal.classList.add('active');
    }
    if (window.App && window.App.showToast) {
      window.App.showToast('Demo trial session ended. Activate license to continue unlimited printing.', 'warning');
    }
  }

  function updateUIForLicensedState() {
    const timerBadge = document.getElementById('demo-timer-badge');
    if (timerBadge) timerBadge.style.display = 'none';

    const statusPill = document.getElementById('sidebar-license-status');
    if (statusPill) {
      statusPill.innerHTML = `
        <div class="status-indicator">
          <span class="status-dot active"></span>
          <span style="color:#10B981;font-weight:700;">LIFETIME PRO ACTIVE</span>
        </div>
        <div style="font-size:11px;color:#94A3B8;margin-top:2px;">
          ${licenseDetails?.shopName || 'Registered Counter PC'}
        </div>
      `;
    }

    const btnTrigger = document.querySelector('.btn-activate-trigger');
    if (btnTrigger) {
      btnTrigger.textContent = '★ License Info';
      btnTrigger.style.background = '#1E293B';
    }

    // Unlock PRO badges
    document.querySelectorAll('.nav-badge-pro').forEach(el => {
      el.style.background = '#10B981';
      el.textContent = 'UNLOCKED';
    });
  }

  return {
    init,
    isLicensed: () => isLicensed,
    getLicenseDetails: () => licenseDetails,
    activate,
    generateActivationCode,
    verifyActivationCode,
    getDeviceFingerprint
  };
})();

window.LicenseManager = LicenseManager;
